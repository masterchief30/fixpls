"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { Company, CompanyDomain } from "@/lib/types";

interface InviteMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  companies: Company[];
  companyDomains: CompanyDomain[];
  onInvited: () => void;
}

export function InviteMembersDialog({
  open,
  onOpenChange,
  workspaceId,
  companies,
  companyDomains,
  onInvited,
}: InviteMembersDialogProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [companyId, setCompanyId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailDomain = useMemo(() => {
    const raw = email.trim().toLowerCase();
    if (!raw.includes("@")) return "";
    return raw.split("@")[1] ?? "";
  }, [email]);

  useEffect(() => {
    if (!emailDomain || companyId !== "none") return;
    const matched = companyDomains.find(
      (d) => d.domain.toLowerCase() === emailDomain
    );
    if (matched?.company_id) {
      setCompanyId(matched.company_id);
    }
  }, [emailDomain, companyDomains, companyId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const inviteEmail = email.trim().toLowerCase();
    const invitePayload = {
      workspace_id: workspaceId,
      email: inviteEmail,
      invited_name: name.trim() || null,
      role,
      company_id: companyId === "none" ? null : companyId,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      accepted_at: null,
      accepted_by: null,
    };

    const { data: existingInvite, error: existingInviteError } = await supabase
      .from("workspace_invites")
      .select("id")
      .eq("workspace_id", workspaceId)
      .ilike("email", inviteEmail)
      .is("accepted_at", null)
      .maybeSingle();

    if (existingInviteError) {
      setError(existingInviteError.message);
      setLoading(false);
      return;
    }

    if (existingInvite?.id) {
      const { error: updateInviteError } = await supabase
        .from("workspace_invites")
        .update(invitePayload)
        .eq("id", existingInvite.id);
      if (updateInviteError) {
        setError(updateInviteError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: insertInviteError } = await supabase
        .from("workspace_invites")
        .insert(invitePayload);
      if (insertInviteError) {
        setError(insertInviteError.message);
        setLoading(false);
        return;
      }
    }

    if (companyId !== "none" && emailDomain) {
      await supabase.from("company_domains").upsert(
        {
          workspace_id: workspaceId,
          company_id: companyId,
          domain: emailDomain,
        },
        {
          onConflict: "workspace_id,domain",
        }
      );
    }

    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: getAuthCallbackUrl(),
        data: {
          full_name: name.trim() || undefined,
        },
      },
    });

    if (emailError) {
      setError(
        `Invite saved, but email could not be sent: ${emailError.message}. Check Supabase Auth email settings.`
      );
      setLoading(false);
      onInvited();
      return;
    }

    setName("");
    setEmail("");
    setRole("member");
    setCompanyId("none");
    setNotice(`Invite email sent to ${inviteEmail}.`);
    setLoading(false);
    onOpenChange(false);
    onInvited();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleInvite}>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Send an invite to join this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="Person name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole((v as "admin" | "member") ?? "member")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-44">
                    <SelectItem value="member">Coworker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Coworker can work on items but cannot delete the workspace.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "none")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Auto/none" />
                  </SelectTrigger>
                  <SelectContent className="min-w-44">
                    <SelectItem value="none">Auto/none</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {notice && <p className="text-sm text-emerald-400">{notice}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
