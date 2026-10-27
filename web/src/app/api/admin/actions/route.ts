import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentAdmin } from "@/server/auth";
import { AdminError, acceptOrder, addInventoryItem, adjustInventory, anonymizeCustomer, assignDelivery, changeAddress, createClosure, createRefund, decideRefund, failDelivery, logChangeRequest, rejectOrder, replaceMeal, rescheduleDelivery, resolveChangeRequest, rotateTracking, saveArea, saveBowlComponent, saveCoupon, saveMeal, savePromotion, saveSettings, saveSlot, setDeliveryStatus } from "@/server/admin";
import { runMealChecks } from "@/server/meal-check";

function fields(form: FormData) {
  return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
}

export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  const form = await request.formData();
  if (String(form.get("csrf") || "") !== admin.csrf) {
    return NextResponse.json({ message: "This form expired. Refresh the page and try again." }, { status: 403 });
  }
  const type = String(form.get("type") || "");
  const actor = admin.admin.email;
  const input = fields(form);
  const returnTo = String(form.get("returnTo") || "/admin");
  const safeReturn = returnTo.startsWith("/admin") ? returnTo : "/admin";
  try {
    if (type === "accept_order") await acceptOrder(actor, input.orderId);
    else if (type === "reject_order") await rejectOrder(actor, input.orderId, input.reason || "");
    else if (type === "delivery_status") await setDeliveryStatus(actor, input.deliveryId, input.status);
    else if (type === "assign_delivery") await assignDelivery(actor, input.deliveryId, input.assignee || "");
    else if (type === "fail_delivery") {
      await failDelivery(actor, input.deliveryId, {
        reason: input.reason || "",
        attemptedAt: input.attemptedAt || "",
        contactOutcome: input.contactOutcome || "",
        resolution: input.resolution || "",
      });
    } else if (type === "reschedule_delivery") await rescheduleDelivery(actor, input.deliveryId, input.date);
    else if (type === "replace_meal") await replaceMeal(actor, input.deliveryId, input.mealId, input.customerAgreed === "on");
    else if (type === "address_change") {
      await changeAddress(actor, input.orderId, {
        line1: input.line1 || "",
        pinCode: input.pinCode || "",
        city: input.city || "Hyderabad",
        instructions: input.instructions || "",
        customerAgreed: input.customerAgreed === "on",
      });
    } else if (type === "create_refund") await createRefund(actor, input.orderId, input.amount || "0", input.reason || "");
    else if (type === "approve_refund") await decideRefund(actor, input.refundId, true);
    else if (type === "reject_refund") await decideRefund(actor, input.refundId, false);
    else if (type === "save_meal") await saveMeal(actor, input);
    else if (type === "save_bowl_component") await saveBowlComponent(actor, input);
    else if (type === "save_plan") {
      await db().planTemplate.update({
        where: { id: input.id },
        data: {
          description: input.description,
          active: input.active === "on",
          discountBps: Math.round(Number(input.discount || 0) * 100),
          fixedDeliveryCount: Number(input.count || 1),
        },
      });
    }
    else if (type === "save_settings") await saveSettings(actor, input);
    else if (type === "save_area") await saveArea(actor, input);
    else if (type === "save_slot") await saveSlot(actor, input);
    else if (type === "create_closure") await createClosure(actor, input.date, input.reason || "", input.mealType || "all");
    else if (type === "save_coupon") await saveCoupon(actor, input);
    else if (type === "save_promotion") await savePromotion(actor, input);
    else if (type === "inventory_adjust") await adjustInventory(actor, input.itemId, input.delta || "0", input.reason || "");
    else if (type === "add_inventory") await addInventoryItem(actor, input.name || "", input.unit || "unit", input.quantity || "0");
    else if (type === "anonymize_customer") await anonymizeCustomer(actor, input.customerId);
    else if (type === "log_change") await logChangeRequest(actor, input.orderId, input.changeType || "general", input.message || "");
    else if (type === "resolve_change") await resolveChangeRequest(actor, input.id);
    else if (type === "run_meal_check") {
      const counts = await runMealChecks();
      const url = new URL(safeReturn, request.url);
      url.searchParams.set("notice", `Asked ${counts.asked}. Locked ${counts.locked}. Not sent ${counts.failed}.`);
      return NextResponse.redirect(url, 303);
    } else if (type === "rotate_tracking") {
      const token = await rotateTracking(actor, input.orderId);
      const url = new URL("/track/" + token, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      return new NextResponse(
        `<!doctype html><html><body style="font-family:sans-serif;background:#F8F7F1;color:#292D29;padding:40px"><h1>New tracking link</h1><p>The previous link no longer works. Send this one only after you have confirmed the customer.</p><p><a href="${url.href}">${url.href}</a></p><p><a href="${safeReturn}">Back to admin</a></p></body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    } else throw new AdminError("Unknown action.");
    return NextResponse.redirect(new URL(safeReturn, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The action failed.";
    const url = new URL(safeReturn, request.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, 303);
  }
}
