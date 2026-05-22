"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AdminUser = {
  id: number;
  full_name: string;
  company_name: string | null;
  email: string;
  role: "ADMIN" | "CLINICIAN";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RoleFilter = "ALL" | "ADMIN" | "CLINICIAN";

type MenuPosition = { top: number; right: number };

// Renders the dropdown via a portal so overflow:hidden on the table never clips it
function ActionMenu({
  user,
  position,
  onEdit,
  onToggle,
  onDelete,
  onClose,
}: {
  user: AdminUser;
  position: MenuPosition;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: position.top,
        right: position.right,
        zIndex: 9999,
        minWidth: "160px",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(15,23,42,0.15)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onEdit}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
      >
        ✏️ Edit
      </button>
      <button
        type="button"
        onClick={onToggle}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
      >
        {user.is_active ? "🚫 Disable" : "✅ Enable"}
      </button>
      <div style={{ borderTop: "1px solid #f1f5f9" }} />
      <button
        type="button"
        onClick={onDelete}
        style={{ ...menuItemStyle, color: "#dc2626" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
      >
        🗑️ Delete
      </button>
    </div>,
    document.body
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "100%",
  border: "none",
  background: "#fff",
  padding: "11px 16px",
  fontSize: "14px",
  textAlign: "left",
  cursor: "pointer",
  color: "#0f172a",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  // Create form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CLINICIAN">("CLINICIAN");
  const [isActive, setIsActive] = useState(true);

  // Edit modal
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "CLINICIAN">("CLINICIAN");
  const [editPassword, setEditPassword] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete confirmation
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Dropdown menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 0 });

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load users."); return; }
      setUsers(data);
    } catch {
      setError("Something went wrong while loading users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccessMessage(""); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password, role, is_active: isActive }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create user."); return; }
      setUsers((prev) => [data, ...prev]);
      setFullName(""); setEmail(""); setPassword(""); setRole("CLINICIAN"); setIsActive(true);
      setShowCreateForm(false);
      setSuccessMessage("User created successfully.");
    } catch {
      setError("Something went wrong while creating the user.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(user: AdminUser) {
    setEditUser(user);
    setEditFullName(user.full_name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
    setEditError("");
    setOpenMenuId(null);
  }

  async function handleEditUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    setEditError(""); setEditSubmitting(true);
    try {
      const body: Record<string, unknown> = { full_name: editFullName, email: editEmail, role: editRole };
      if (editPassword) body.password = editPassword;
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Failed to update user."); return; }
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      setEditUser(null);
      setSuccessMessage("User updated successfully.");
    } catch {
      setEditError("Something went wrong.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update user."); return; }
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      setSuccessMessage(`User ${data.is_active ? "enabled" : "disabled"} successfully.`);
    } catch {
      setError("Something went wrong.");
    }
  }

  async function handleDeleteUser() {
    if (!deleteUser) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to delete user."); setDeleteUser(null); return; }
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
      setSuccessMessage("User deleted successfully.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, userId: number) {
    e.stopPropagation();
    if (openMenuId === userId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
    setOpenMenuId(userId);
  }

  const filteredUsers = useMemo(() => {
    if (roleFilter === "ALL") return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const clinicianCount = users.filter((u) => u.role === "CLINICIAN").length;

  function getRoleBadgeClass(r: AdminUser["role"]) {
    return r === "ADMIN"
      ? "bg-purple-100 text-purple-700 border border-purple-200"
      : "bg-blue-100 text-blue-700 border border-blue-200";
  }

  function getStatusBadgeClass(active: boolean) {
    return active
      ? "bg-green-100 text-green-700 border border-green-200"
      : "bg-slate-100 text-slate-500 border border-slate-200";
  }

  function getFilterButtonClass(value: RoleFilter) {
    return roleFilter === value
      ? "rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
      : "rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
  }

  const openUser = openMenuId !== null ? users.find((u) => u.id === openMenuId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-600">Manage admin and clinician users.</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowCreateForm((p) => !p); setError(""); setSuccessMessage(""); }}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {showCreateForm ? "Close" : "Create User"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create User</h2>
          <p className="mt-1 text-sm text-slate-600">Add a new admin or clinician account.</p>
          <form onSubmit={handleCreateUser} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
              <input type="text" className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required minLength={6} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "CLINICIAN")}>
                <option value="CLINICIAN">Clinician</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active user
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {submitting ? "Creating..." : "Create User"}
              </button>
              <button type="button" onClick={() => { setShowCreateForm(false); setError(""); setSuccessMessage(""); }} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setRoleFilter("ALL")} className={getFilterButtonClass("ALL")}>All ({users.length})</button>
          <button type="button" onClick={() => setRoleFilter("ADMIN")} className={getFilterButtonClass("ADMIN")}>Admin ({adminCount})</button>
          <button type="button" onClick={() => setRoleFilter("CLINICIAN")} className={getFilterButtonClass("CLINICIAN")}>Clinician ({clinicianCount})</button>
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-5 text-sm text-slate-600">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">No users found for the selected filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="p-3 font-medium text-slate-700">Name</th>
                  <th className="p-3 font-medium text-slate-700">Email</th>
                  <th className="p-3 font-medium text-slate-700">Role</th>
                  <th className="p-3 font-medium text-slate-700">Status</th>
                  <th className="p-3 font-medium text-slate-700">Created</th>
                  <th className="p-3 font-medium text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3 font-medium text-slate-900">{user.full_name}</td>
                    <td className="p-3 text-slate-700">{user.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(user.is_active)}`}>
                        {user.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, user.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        ···
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portal dropdown menu */}
      {openUser && (
        <ActionMenu
          user={openUser}
          position={menuPosition}
          onEdit={() => openEditModal(openUser)}
          onToggle={() => handleToggleActive(openUser)}
          onDelete={() => { setDeleteUser(openUser); setOpenMenuId(null); }}
          onClose={() => setOpenMenuId(null)}
        />
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
                <p className="mt-1 text-sm text-slate-500">Update details for {editUser.full_name}</p>
              </div>
              <button type="button" onClick={() => setEditUser(null)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-500 hover:bg-slate-50">✕</button>
            </div>
            {editError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div>
            )}
            <form onSubmit={handleEditUser} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                <input type="text" className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={editRole} onChange={(e) => setEditRole(e.target.value as "ADMIN" | "CLINICIAN")}>
                  <option value="CLINICIAN">Clinician</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  New Password <span className="font-normal text-slate-400">(leave blank to keep current)</span>
                </label>
                <input type="password" className="w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Enter new password" minLength={6} />
              </div>
              <div className="md:col-span-2 flex gap-3 pt-1">
                <button type="submit" disabled={editSubmitting} className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditUser(null)} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">🗑️</div>
            <h2 className="text-xl font-bold text-slate-900">Delete User</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-slate-900">{deleteUser.full_name}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleDeleteUser} disabled={deleteSubmitting} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {deleteSubmitting ? "Deleting..." : "Yes, delete"}
              </button>
              <button type="button" onClick={() => setDeleteUser(null)} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}