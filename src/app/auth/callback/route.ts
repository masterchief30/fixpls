import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/workspaces";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: invites } = await supabase
          .from("workspace_invites")
          .select("id, workspace_id, role, company_id, invited_name, expires_at")
          .ilike("email", user.email)
          .is("accepted_at", null);

        for (const invite of invites ?? []) {
          if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            continue;
          }

          let resolvedCompanyId = invite.company_id;
          if (!resolvedCompanyId) {
            const { data: companyIdByDomain } = await supabase.rpc(
              "resolve_company_for_email",
              {
                p_workspace_id: invite.workspace_id,
                p_email: user.email,
              }
            );
            resolvedCompanyId =
              typeof companyIdByDomain === "string" ? companyIdByDomain : null;
          }

          const { error: memberError } = await supabase
            .from("workspace_members")
            .insert({
              workspace_id: invite.workspace_id,
              user_id: user.id,
              role: invite.role,
              company_id: resolvedCompanyId,
            });

          if (memberError && memberError.code !== "23505") {
            continue;
          }

          await supabase
            .from("workspace_invites")
            .update({
              accepted_at: new Date().toISOString(),
              accepted_by: user.id,
              company_id: resolvedCompanyId,
            })
            .eq("id", invite.id);

          if (invite.invited_name?.trim()) {
            await supabase
              .from("profiles")
              .update({ full_name: invite.invited_name.trim() })
              .eq("id", user.id)
              .is("full_name", null);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
