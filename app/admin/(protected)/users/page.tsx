"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CLINICIAN">("CLINICIAN");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load users.");
        return;
      }

      setUsers(data);
    } catch (error) {
      console.error(error);
      setError("Something went wrong while loading users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
          is_active: isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create user.");
        setSubmitting(false);
        return;
      }

      setUsers((prev) => [data, ...prev]);

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("CLINICIAN");
      setIsActive(true);
      setShowCreateForm(false);
      setSuccessMessage("User created successfully.");
    } catch (error) {
      console.error(error);
      setError("Something went wrong while creating the user.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredUsers = useMemo(() => {
    if (roleFilter === "ALL") return users;
    return users.filter((user) => user.role === roleFilter);
  }, [users, roleFilter]);

  function getRoleBadgeClass(role: AdminUser["role"]) {
    if (role === "ADMIN") {
      return "bg-purple-100 text-purple-700 border border-purple-200";
    }

    return "bg-blue-100 text-blue-700 border border-blue-200";
  }

  function getStatusBadgeClass(isActive: boolean) {
    return isActive
      ? "bg-green-100 text-green-700 border border-green-200"
      : "bg-slate-100 text-slate-700 border border-slate-200";
  }

  function getFilterButtonClass(value: RoleFilter) {
    const active = roleFilter === value;

    return active
      ? "rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
      : "rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
  }

  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const clinicianCount = users.filter((user) => user.role === "CLINICIAN").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage admin and clinician users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((prev) => !prev);
            setError("");
            setSuccessMessage("");
          }}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {showCreateForm ? "Close" : "Create User"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {showCreateForm ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create User</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a new admin or clinician account.
          </p>

          <form onSubmit={handleCreateUser} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "ADMIN" | "CLINICIAN")
                }
              >
                <option value="CLINICIAN">Clinician</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active user
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError("");
                  setSuccessMessage("");
                }}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRoleFilter("ALL")}
            className={getFilterButtonClass("ALL")}
          >
            All ({users.length})
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter("ADMIN")}
            className={getFilterButtonClass("ADMIN")}
          >
            Admin ({adminCount})
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter("CLINICIAN")}
            className={getFilterButtonClass("CLINICIAN")}
          >
            Clinician ({clinicianCount})
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-5 text-sm text-slate-600">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">
            No users found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="p-3 font-medium text-slate-700">Name</th>
                  <th className="p-3 font-medium text-slate-700">Email</th>
                  <th className="p-3 font-medium text-slate-700">Role</th>
                  <th className="p-3 font-medium text-slate-700">Status</th>
                  <th className="p-3 font-medium text-slate-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3 text-slate-900">{user.full_name}</td>
                    <td className="p-3 text-slate-700">{user.email}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                          user.is_active
                        )}`}
                      >
                        {user.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}