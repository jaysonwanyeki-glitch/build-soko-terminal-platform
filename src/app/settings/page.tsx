import { getSession } from "@/lib/auth";
import { SettingsForm } from "@/components/settings-form";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <SettingsForm name={session.name} email={session.email} />;
}
