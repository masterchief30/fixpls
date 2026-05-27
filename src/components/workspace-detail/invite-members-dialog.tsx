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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [companyId, setCompanyId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const { error: inviteError } = await supabase.from("workspace_invites").insert({
      workspace_id: workspaceId,
      email: email.trim().toLowerCase(),
      role,
      company_id: companyId === "none" ? null : companyId,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    });

    if (inviteError) {
      setError(inviteError.message);
      setLoading(false);
      return;
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

    setEmail("");
    setRole("member");
    setCompanyId("none");
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole((v as "admin" | "member") ?? "member")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "none")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto/none" />
                  </SelectTrigger>
                  <SelectContent>
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
