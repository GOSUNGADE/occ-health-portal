"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type EmployerRole = "ADMIN" | "HR_MANAGER" | "HR_STAFF" | "READ_ONLY";

type CompanyUser = {
  id: number;
  full_name: string;
  email: string;
  employer_role: EmployerRole;
  is_active: boolean;
  is_owner: boolean;
  created_at: string;
};

const ROLE_LABELS: Record<EmployerRole, string> = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  HR_STAFF: "HR Staff",
  READ_ONLY: "Read Only",
};

const ROLE_DESCRIPTIONS: Record<EmployerRole, string> = {
  ADMIN: "Full access — manage users, candidates, bookings and settings",
  HR_MANAGER: "Can manage candidates and bookings, no user or settings access",
  HR_STAFF: "Can manage candidates and bookings, no user or settings access",
  READ_ONLY: "View-only access to candidates and bookings",
};

const ROLE_COLORS: Record<EmployerRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  HR_MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  HR_STAFF: "bg-cyan-100 text-cyan-700 border-cyan-200",
  READ_ONLY: "bg-slate-100 text-slate-600 border-slate-200",
};

type MenuPos = { top: number; right: number };

function ActionMenu({
  user,
  position,
  onChangeRole,
  onToggle,
  onDelete,
  onClose,
}: {
  user: CompanyUser;
  position: MenuPos;
  onChangeRole: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const item: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8, width: "100%",
    border: "none", background: "#fff", padding: "11px 16px",
    fontSize: 14, textAlign: "left", cursor: "pointer", color: "#0f172a",
  };

  return createPortal(
    <div ref={ref} style={{
      position: "fixed", top: position.top, right: position.right,
      zIndex: 9999, minWidth: 160, background: "#fff",
      border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 10px 40px rgba(15,23,42,0.15)", overflow: "hidden",
    }}>
      <button type="button" style={item}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        onClick={onChangeRole}>
        🔑 Change Role
      </button>
      <button type="button" style={item}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        onClick={onToggle}>
        {user.is_active ? "🚫 Disable" : "✅ Enable"}
      </button>
      <div style={{ borderTop: "1px solid #f1f5f9" }} />
      <button type="button" style={{ ...item, color: "#dc2626" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        onClick={onDelete}>
        🗑️ Remove
      </button>
    </div>,
    document.body
  );
}

export default function EmployerUsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EmployerRole>("HR_STAFF");
  const [creating, setCreating] = useState(false);

  // Change role modal
  const [roleUser, setRoleUser] = useState<CompanyUser | null>(null);
  const [newRole, setNewRole] = useState<EmployerRole>("HR_STAFF");
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Delete modal
  const [deleteUser, setDeleteUser] = useState<CompanyUser | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPos>({ top: 0, right: 0 });

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/employer/users");
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load users."); return; }
      setUsers(data.users);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setCreating(true);
    try {
      const res = await fetch("/api/employer/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password, employer_role: role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create user."); return; }
      setUsers((prev) => [...prev, data.user]);
      setFullName(""); setEmail(""); setPassword(""); setRole("HR_STAFF");
      setShowCreate(false);
      setSuccess("User created and credentials sent by email.");
    } catch { setError("Something went wrong."); }
    finally { setCreating(false); }
  }

  async function handleToggle(user: CompanyUser) {
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/employer/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed."); return; }
      setUsers((prev) => prev.map((u) => u.id === data.user.id ? data.user : u));
      setSuccess(`User ${data.user.is_active ? "enabled" : "disabled"}.`);
    } catch { setError("Something went wrong."); }
  }

  async function handleChangeRole() {
    if (!roleUser) return;
    setRoleSubmitting(true);
    try {
      const res = await fetch(`/api/employer/users/${roleUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employer_role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed."); return; }
      setUsers((prev) => prev.map((u) => u.id === data.user.id ? data.user : u));
      setRoleUser(null);
      setSuccess("Role updated successfully.");
    } catch { setError("Something went wrong."); }
    finally { setRoleSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/employer/users/${deleteUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed."); setDeleteUser(null); return; }
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
      setSuccess("User removed.");
    } catch { setError("Something went wrong."); }
    finally { setDeleteSubmitting(false); }
  }

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, userId: number) {
    e.stopPropagation();
    if (openMenuId === userId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setOpenMenuId(userId);
  }

  const openUser = openMenuId !== null ? users.find((u) => u.id === openMenuId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage who has access to your company portal and what they can do.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowCreate((p) => !p); setError(""); setSuccess(""); }}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          {showCreate ? "Cancel" : "Add User"}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✓ {success}</div>}

      {/* Roles reference */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(ROLE_LABELS) as EmployerRole[]).map((r) => (
          <div key={r} className="rounded-xl border bg-white p-4 shadow-sm">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${ROLE_COLORS[r]}`}>
              {ROLE_LABELS[r]}
            </span>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Add Team User</h2>
          <p className="mt-1 text-sm text-slate-500">
            They&apos;ll receive an email with their login credentials.
          </p>
          <form onSubmit={handleCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</label>
              <input type="text" className="w-full rounded-xl border px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-slate-900"
                value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
              <input type="email" className="w-full rounded-xl border px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-slate-900"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Initial Password</label>
              <input type="password" className="w-full rounded-xl border px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-slate-900"
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Role</label>
              <select className="w-full rounded-xl border px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-slate-900"
                value={role} onChange={(e) => setRole(e.target.value as EmployerRole)}>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="HR_STAFF">HR Staff</option>
                <option value="READ_ONLY">Read Only</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-400">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={creating}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                {creating ? "Creating..." : "Create & Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-5 text-sm text-slate-500">Loading team users...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-3xl">👥</p>
            <p className="mt-3 font-semibold text-slate-900">No team users yet</p>
            <p className="mt-1 text-sm text-slate-500">Add users to give your HR team access to the portal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="p-3 font-semibold text-slate-600">Name</th>
                  <th className="p-3 font-semibold text-slate-600">Email</th>
                  <th className="p-3 font-semibold text-slate-600">Role</th>
                  <th className="p-3 font-semibold text-slate-600">Status</th>
                  <th className="p-3 font-semibold text-slate-600">Added</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3 font-medium text-slate-900">
                      {user.full_name}
                      {user.is_owner && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                          Owner
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{user.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${ROLE_COLORS[user.employer_role]}`}>
                        {ROLE_LABELS[user.employer_role]}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${user.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {user.is_owner ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <button type="button"
                          onClick={(e) => openMenu(e, user.id)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50">
                          ···
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portal action menu */}
      {openUser && !openUser.is_owner && (
        <ActionMenu
          user={openUser}
          position={menuPos}
          onChangeRole={() => { setRoleUser(openUser); setNewRole(openUser.employer_role); setOpenMenuId(null); }}
          onToggle={() => handleToggle(openUser)}
          onDelete={() => { setDeleteUser(openUser); setOpenMenuId(null); }}
          onClose={() => setOpenMenuId(null)}
        />
      )}

      {/* Change role modal */}
      {roleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Change Role</h2>
                <p className="mt-1 text-sm text-slate-500">{roleUser.full_name}</p>
              </div>
              <button type="button" onClick={() => setRoleUser(null)}
                className="rounded-lg border px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">✕</button>
            </div>
            <div className="space-y-2">
              {(Object.keys(ROLE_LABELS) as EmployerRole[]).map((r) => (
                <button key={r} type="button"
                  onClick={() => setNewRole(r)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${newRole === r ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${newRole === r ? "border-slate-900 bg-slate-900" : "border-slate-300"}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{ROLE_LABELS[r]}</p>
                      <p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[r]}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={handleChangeRole} disabled={roleSubmitting}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                {roleSubmitting ? "Saving..." : "Save Role"}
              </button>
              <button type="button" onClick={() => setRoleUser(null)}
                className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">🗑️</div>
            <h2 className="text-xl font-bold text-slate-900">Remove User</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove <strong>{deleteUser.full_name}</strong> from your company portal?
              They will lose access immediately.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleDelete} disabled={deleteSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {deleteSubmitting ? "Removing..." : "Yes, remove"}
              </button>
              <button type="button" onClick={() => setDeleteUser(null)}
                className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}