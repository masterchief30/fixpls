import { redirect } from "next/navigation";

export default function LegacyOrgRoutePage() {
  // Some clients/extensions still navigate to /admin/org/*.
  // Keep the app usable by routing users to the workspace list.
  redirect("/workspaces");
}
