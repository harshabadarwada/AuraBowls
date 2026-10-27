import { NextResponse } from "next/server";
import { currentAdmin } from "@/server/auth";
import { invoicePdf } from "@/server/invoices";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const pdf = await invoicePdf(id);
  if (!pdf) return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="aurabowls-invoice.pdf"`,
    },
  });
}
