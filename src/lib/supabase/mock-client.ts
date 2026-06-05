import { getTable, setTable } from "./shared-store";

type Row = Record<string, unknown>;

function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function seed() {
  if (typeof window !== "undefined" && localStorage.getItem("plsfix_demo_seeded")) return;

  const DEMO_USER_ID = "demo-user-1";
  const DEMO_EMAIL = "demo@plsfix.io";
  const wsId = uuidv4();
  const company1 = uuidv4();
  const company2 = uuidv4();
  const cat1 = uuidv4();
  const cat2 = uuidv4();
  const cat3 = uuidv4();
  const comp1 = uuidv4();
  const comp2 = uuidv4();
  const status1 = uuidv4();
  const status2 = uuidv4();
  const status3 = uuidv4();
  const status4 = uuidv4();
  const status5 = uuidv4();
  const status6 = uuidv4();
  const status7 = uuidv4();
  const item1 = uuidv4();
  const item2 = uuidv4();

  setTable("workspaces", [
    {
      id: wsId,
      name: "Acme Corp",
      created_at: new Date().toISOString(),
      created_by: DEMO_USER_ID,
      default_owner_company_id: company1,
    },
  ]);

  setTable("workspace_members", [
    {
      workspace_id: wsId,
      user_id: DEMO_USER_ID,
      role: "admin",
      company_id: company1,
      created_at: new Date().toISOString(),
    },
  ]);

  setTable("companies", [
    { id: company1, workspace_id: wsId, name: "Acme Team", created_at: new Date().toISOString() },
    { id: company2, workspace_id: wsId, name: "Client Co", created_at: new Date().toISOString() },
  ]);

  setTable("components", [
    { id: comp1, workspace_id: wsId, name: "Frontend", created_at: new Date().toISOString() },
    { id: comp2, workspace_id: wsId, name: "API", created_at: new Date().toISOString() },
  ]);

  setTable("statuses", [
    { id: status1, workspace_id: wsId, name: "New", sort_order: 1, created_at: new Date().toISOString() },
    { id: status2, workspace_id: wsId, name: "Acknowledged", sort_order: 2, created_at: new Date().toISOString() },
    { id: status3, workspace_id: wsId, name: "In progress", sort_order: 3, created_at: new Date().toISOString() },
    { id: status4, workspace_id: wsId, name: "Blocked", sort_order: 4, created_at: new Date().toISOString() },
    { id: status5, workspace_id: wsId, name: "Fixed", sort_order: 5, created_at: new Date().toISOString() },
    { id: status6, workspace_id: wsId, name: "Verified", sort_order: 6, created_at: new Date().toISOString() },
    { id: status7, workspace_id: wsId, name: "Closed", sort_order: 7, created_at: new Date().toISOString() },
  ]);

  setTable("profiles", [
    { id: DEMO_USER_ID, email: DEMO_EMAIL, full_name: "Demo User", avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);

  setTable("categories", [
    { id: cat1, workspace_id: wsId, name: "Bugs", color: "#ef4444", created_at: new Date().toISOString() },
    { id: cat2, workspace_id: wsId, name: "Feedback", color: "#3b82f6", created_at: new Date().toISOString() },
    { id: cat3, workspace_id: wsId, name: "Features", color: "#10b981", created_at: new Date().toISOString() },
  ]);

  setTable("items", [
    {
      id: item1,
      workspace_id: wsId,
      title: "Login page crashes on mobile",
      description: "When opening the login page on iOS Safari, the app throws a runtime error.",
      category_id: cat1,
      component_id: comp1,
      owner_company_id: company1,
      reporter_name: "John from Client Co",
      reporter_email: "john@client.co",
      reporter_source: "Client",
      status: "In progress",
      assignee_id: DEMO_USER_ID,
      created_by: DEMO_USER_ID,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      item_number: 1,
      sort_order: 1,
    },
    {
      id: item2,
      workspace_id: wsId,
      title: "Dark mode support",
      description: "Would be great to have a dark mode toggle in settings.",
      category_id: cat3,
      component_id: comp2,
      owner_company_id: company2,
      reporter_name: "Support Inbox",
      reporter_email: "support@acme.co",
      reporter_source: "Support",
      status: "New",
      assignee_id: null,
      created_by: DEMO_USER_ID,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      item_number: 2,
      sort_order: 2,
    },
  ]);

  setTable("comments", []);
  setTable("activity_log", []);
  setTable("workspace_invites", []);
  setTable("company_domains", []);
  setTable("item_component_links", [
    { item_id: item1, workspace_id: wsId, component_id: comp1, created_at: new Date().toISOString() },
    { item_id: item2, workspace_id: wsId, component_id: comp2, created_at: new Date().toISOString() },
  ]);
  setTable("item_owner_company_links", [
    { item_id: item1, workspace_id: wsId, company_id: company1, created_at: new Date().toISOString() },
    { item_id: item2, workspace_id: wsId, company_id: company2, created_at: new Date().toISOString() },
  ]);

  if (typeof window !== "undefined") {
    localStorage.setItem("plsfix_demo_seeded", "true");
  }
}

class MockQueryBuilder {
  private filters: ((r: Row) => boolean)[] = [];
  private orderCol?: string;
  private orderAsc = true;
  private limitVal?: number;
  private selectFields?: string;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private insertValues?: Row | Row[];
  private updateValues?: Row;
  private upsertConflictCols: string[] = [];

  constructor(private tableName: string) {}

  private get rows(): Row[] {
    return getTable(this.tableName);
  }

  private set rows(value: Row[]) {
    setTable(this.tableName, value);
  }

  eq(col: string, val: unknown) {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitVal = n;
    return this;
  }

  single() {
    this.limitVal = 1;
    return this;
  }

  match(q: Record<string, unknown>) {
    this.filters.push((r) => Object.entries(q).every(([k, v]) => r[k] === v));
    return this;
  }

  select(fields?: string) {
    this.mode = "select";
    this.selectFields = fields;
    return this;
  }

  insert(values: Row | Row[]) {
    this.mode = "insert";
    this.insertValues = values;
    return this;
  }

  upsert(values: Row | Row[], opts?: { onConflict?: string }) {
    this.mode = "insert";
    this.insertValues = values;
    this.upsertConflictCols = (opts?.onConflict ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    return this;
  }

  update(values: Row) {
    this.mode = "update";
    this.updateValues = values;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  private executeSelect(): { data: any; error: null } {
    let out = this.rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.orderCol) {
      out = out.sort((a, b) => {
        const av = a[this.orderCol!] as string | number;
        const bv = b[this.orderCol!] as string | number;
        if (av < bv) return this.orderAsc ? -1 : 1;
        if (av > bv) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }
    if (this.limitVal !== undefined) {
      out = out.slice(0, this.limitVal);
    }

    const fields = this.selectFields;
    const expanded = out.map((row) => {
      const copy = { ...row };
      if (
        fields?.includes("category:category_id") ||
        fields?.includes("category:categories!items_category_id_fkey")
      ) {
        const cats = getTable("categories");
        copy.category = cats.find((c) => c.id === row.category_id) ?? null;
      }
      if (fields?.includes("assignee:assignee_id")) {
        const profs = getTable("profiles");
        copy.assignee = profs.find((p) => p.id === row.assignee_id) ?? null;
      }
      if (
        fields?.includes("component:component_id") ||
        fields?.includes("component:components!items_component_id_fkey")
      ) {
        const comps = getTable("components");
        copy.component = comps.find((cp) => cp.id === row.component_id) ?? null;
      }
      if (
        fields?.includes("owner_company:owner_company_id") ||
        fields?.includes("owner_company:companies!items_owner_company_id_fkey")
      ) {
        const companies = getTable("companies");
        copy.owner_company = companies.find((c) => c.id === row.owner_company_id) ?? null;
      }
      if (fields?.includes("creator:created_by")) {
        const profs = getTable("profiles");
        copy.creator = profs.find((p) => p.id === row.created_by) ?? null;
      }
      if (fields?.includes("profile:user_id")) {
        const profs = getTable("profiles");
        copy.profile = profs.find((p) => p.id === row.user_id) ?? null;
      }
      if (fields?.includes("workspaces:workspace_id")) {
        const wss = getTable("workspaces");
        copy.workspaces = wss.find((w) => w.id === row.workspace_id) ?? null;
      }
      if (fields?.includes("author:user_id")) {
        const profs = getTable("profiles");
        copy.author = profs.find((p) => p.id === row.user_id) ?? null;
      }
      return copy;
    });

    return { data: expanded.length ? expanded : null, error: null };
  }

  private executeInsert(): { data: any; error: null } {
    const arr = Array.isArray(this.insertValues!) ? this.insertValues! : [this.insertValues!];
    const current = this.rows;
    const inserted = arr.map((v) => {
      if (this.upsertConflictCols.length > 0) {
        const existingIdx = current.findIndex((row) =>
          this.upsertConflictCols.every((col) => row[col] === v[col])
        );
        if (existingIdx >= 0) {
          current[existingIdx] = {
            ...current[existingIdx],
            ...v,
            updated_at: new Date().toISOString(),
          };
          return current[existingIdx];
        }
      }
      const row = { id: uuidv4(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...v };
      current.push(row);
      return row;
    });
    this.rows = current;
    return { data: Array.isArray(this.insertValues!) ? inserted : inserted[0], error: null };
  }

  private executeUpdate(): { data: any; error: null } {
    const current = this.rows;
    const target = current.filter((r) => this.filters.every((f) => f(r)));
    target.forEach((r) => {
      Object.assign(r, { ...this.updateValues, updated_at: new Date().toISOString() });
    });
    this.rows = current;
    return { data: target.length ? target : null, error: null };
  }

  private executeDelete(): { data: any; error: null } {
    const current = this.rows;
    const toDelete = current.filter((r) => this.filters.every((f) => f(r)));
    const remaining = current.filter((r) => !toDelete.includes(r));
    this.rows = remaining;
    return { data: toDelete.length ? toDelete : null, error: null };
  }

  private execute(): { data: any; error: null } {
    switch (this.mode) {
      case "insert":
        return this.executeInsert();
      case "update":
        return this.executeUpdate();
      case "delete":
        return this.executeDelete();
      default:
        return this.executeSelect();
    }
  }

  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

class MockChannel {
  on() {
    return this;
  }
  subscribe() {
    return this;
  }
}

const DEMO_USER = { id: "demo-user-1", email: "demo@plsfix.io" };

class MockClient {
  private user: { id: string; email: string } | null = null;

  constructor() {
    seed();
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plsfix_demo_user");
      if (saved) this.user = JSON.parse(saved);
    }
  }

  private get currentUser() {
    return this.user ?? DEMO_USER;
  }

  auth = {
    getUser: async () => {
      return { data: { user: this.currentUser }, error: null as Error | null };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      const id = uuidv4();
      this.user = { id, email };
      this._save();
      const profs = getTable("profiles");
      if (!profs.find((p) => p.id === id)) {
        profs.push({ id, email, full_name: null, avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        setTable("profiles", profs);
      }
      return { data: { user: this.user }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const profs = getTable("profiles");
      let existing = profs.find((p) => p.email === email);
      if (!existing) {
        existing = { id: uuidv4(), email, full_name: null, avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        profs.push(existing);
        setTable("profiles", profs);
      }
      this.user = { id: existing.id as string, email: existing.email as string };
      this._save();
      return { data: { user: this.user }, error: null };
    },
    signOut: async () => {
      this.user = null;
      this._save();
      return { error: null };
    },
    exchangeCodeForSession: async () => {
      return { error: null };
    },
  };

  private _save() {
    if (typeof window !== "undefined") {
      if (this.user) localStorage.setItem("plsfix_demo_user", JSON.stringify(this.user));
      else localStorage.removeItem("plsfix_demo_user");
    }
  }

  from(table: string) {
    return new MockQueryBuilder(table);
  }

  channel(_name: string) {
    return new MockChannel();
  }

  removeChannel() {}

  rpc(fn: string, params?: Record<string, unknown>) {
    if (fn === "resolve_company_for_email") {
      const workspaceId = params?.p_workspace_id as string | undefined;
      const email = (params?.p_email as string | undefined)?.toLowerCase() ?? "";
      const domain = email.includes("@") ? email.split("@")[1] : "";
      const domains = getTable("company_domains");
      const match = domains.find(
        (row) =>
          row.workspace_id === workspaceId &&
          String(row.domain ?? "").toLowerCase() === domain
      );
      return Promise.resolve({
        data: (match?.company_id as string | null) ?? null,
        error: null,
      });
    }

    return Promise.resolve({
      data: null,
      error: null,
    });
  }
}

let mockInstance: MockClient | null = null;

export function getMockClient() {
  if (!mockInstance) mockInstance = new MockClient();
  return mockInstance;
}
