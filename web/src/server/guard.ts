import { redirect } from "next/navigation";
import { currentAdmin } from "./auth";

export async function guard() {
  const session = await currentAdmin();
  if (!session) redirect("/admin/login");
  return session;
}
