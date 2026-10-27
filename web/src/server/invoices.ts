import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/money";

export async function ensureInvoice(orderId: string) {
  return db().$transaction(async (tx) => {
    const existing = await tx.invoice.findFirst({ where: { orderId } });
    if (existing) return existing;
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { deliveries: { include: { items: true }, orderBy: { date: "asc" } }, payments: true },
    });
    if (!order) return null;
    const paid = order.payments.some((payment) => ["paid", "partially_refunded", "refunded"].includes(payment.status));
    if (!paid) return null;
    const settings = await tx.businessSettings.update({
      where: { id: "default" },
      data: { nextInvoiceNumber: { increment: 1 } },
    });
    const sequence = settings.nextInvoiceNumber - 1;
    const number = `${settings.invoicePrefix}-${String(sequence).padStart(4, "0")}`;
    const payment = order.payments.find((item) => item.gatewayPaymentId) || order.payments[0];
    const snapshot = {
      number,
      legalName: settings.legalName,
      address: settings.address,
      gstin: settings.gstin,
      taxMode: order.taxMode,
      taxLabel: order.taxLabel,
      taxRateBps: order.taxRateBps,
      taxPaise: order.taxPaise,
      totalPaise: order.totalPaise,
      customerName: order.customerName,
      reference: order.reference,
      paymentReference: payment?.gatewayPaymentId || "",
      planName: order.planName,
      lines: order.deliveries.map((delivery) => ({
        date: delivery.date,
        slot: delivery.slotLabel,
        items: delivery.items.map((item) => item.nameSnapshot),
        totalPaise: delivery.totalPaise,
      })),
      notice: "This receipt records the amount paid. It is not a tax-registration certificate.",
    };
    return tx.invoice.create({
      data: { number, orderId, totalPaise: order.totalPaise, snapshotJson: JSON.stringify(snapshot) },
    });
  });
}

export async function ensureCreditNote(refundId: string) {
  return db().$transaction(async (tx) => {
    const existing = await tx.creditNote.findFirst({ where: { refundId } });
    if (existing) return existing;
    const refund = await tx.refund.findUnique({ where: { id: refundId }, include: { order: { include: { invoices: true } } } });
    if (!refund || refund.status !== "refunded" || refund.order.invoices.length === 0) return null;
    const settings = await tx.businessSettings.update({
      where: { id: "default" },
      data: { nextCreditNumber: { increment: 1 } },
    });
    const number = `${settings.creditNotePrefix}-${String(settings.nextCreditNumber - 1).padStart(4, "0")}`;
    const invoice = refund.order.invoices[0];
    return tx.creditNote.create({
      data: {
        number,
        invoiceId: invoice.id,
        refundId,
        amountPaise: refund.amountPaise,
        reason: refund.reason,
        snapshotJson: JSON.stringify({
          number,
          invoiceNumber: invoice.number,
          orderReference: refund.order.reference,
          amountPaise: refund.amountPaise,
          reason: refund.reason,
          gatewayRefundId: refund.gatewayRefundId,
        }),
      },
    });
  });
}

export async function invoicePdf(invoiceId: string) {
  const invoice = await db().invoice.findUnique({ where: { id: invoiceId }, include: { creditNotes: true, order: true } });
  if (!invoice) return null;
  const snapshot = JSON.parse(invoice.snapshotJson) as {
    legalName: string;
    address: string;
    gstin: string;
    taxLabel: string;
    taxPaise: number;
    totalPaise: number;
    customerName: string;
    reference: string;
    paymentReference: string;
    planName: string;
    lines: { date: string; slot: string; items: string[]; totalPaise: number }[];
    notice: string;
  };
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 800;
  const draw = (text: string, size = 11, heavy = false) => {
    page.drawText(text.slice(0, 110), { x: 48, y, size, font: heavy ? bold : font, color: rgb(0.09, 0.3, 0.2) });
    y -= size + 8;
  };
  draw(snapshot.legalName || "AuraBowls", 20, true);
  draw("Payment receipt", 14, true);
  if (snapshot.address) draw(snapshot.address, 10);
  if (snapshot.taxPaise > 0 && snapshot.gstin) draw(`GSTIN ${snapshot.gstin}`, 10);
  y -= 8;
  draw(`Invoice ${invoice.number}`, 12, true);
  draw(`Order ${snapshot.reference}`);
  draw(`Customer ${snapshot.customerName}`);
  draw(`Plan ${snapshot.planName}`);
  draw(`Payment reference ${snapshot.paymentReference || "Pending gateway reference"}`);
  y -= 8;
  for (const line of snapshot.lines) {
    draw(`${line.date} · ${line.slot} · ${line.items.join(", ")} · ${formatInr(line.totalPaise)}`, 10);
  }
  y -= 8;
  if (snapshot.taxPaise > 0) draw(`Tax recorded on this order ${formatInr(snapshot.taxPaise)}`, 11, true);
  draw(`Total ${formatInr(snapshot.totalPaise)}`, 14, true);
  if (snapshot.notice) draw(snapshot.notice, 9);
  for (const note of invoice.creditNotes) draw(`Credit note ${note.number} · ${formatInr(note.amountPaise)}`, 10);
  return Buffer.from(await pdf.save());
}
