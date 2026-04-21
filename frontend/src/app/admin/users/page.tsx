"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Shield } from "lucide-react";

import { api } from "@/lib/api";
import { AdminPaginatedUsers, AdminUserRow } from "@/types/admin";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "customer">("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (roleFilter !== "all") {
        params.role = roleFilter;
      }
      const response = await api.get<AdminPaginatedUsers>("/admin/users/", { params });
      return response.data;
    }
  });

  const selectedUserQuery = useQuery({
    queryKey: ["admin-user-detail", selectedUserId],
    queryFn: async () => {
      const response = await api.get<AdminUserRow>(`/admin/users/${selectedUserId}/`);
      return response.data;
    },
    enabled: selectedUserId !== null
  });

  useEffect(() => {
    if (!selectedUserQuery.data) {
      return;
    }

    const user = selectedUserQuery.data;
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setPhone(user.phone || "");
    setIsActive(user.is_active);
    setIsStaff(user.is_staff);
  }, [selectedUserQuery.data]);

  const updateUserMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!selectedUserId) {
        return;
      }
      await api.patch(`/admin/users/${selectedUserId}/`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    }
  });

  const pageCount = useMemo(() => {
    if (!usersQuery.data) {
      return 1;
    }
    return Math.max(1, Math.ceil(usersQuery.data.count / 12));
  }, [usersQuery.data]);

  const exportUrl = useMemo(() => `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/users/export/`, []);

  const selectedUser = selectedUserQuery.data;

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateUserMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      phone,
      is_active: isActive,
      is_staff: isStaff
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <section className="admin-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-red-200/70">Identity and Access</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Users</h1>
          </div>

          <a
            href={exportUrl}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200"
          >
            Export CSV
          </a>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by email or name"
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm text-white"
          />

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as "all" | "admin" | "customer");
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="customer">Customers</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Orders</th>
                <th className="px-3 py-2">LTV</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data?.results.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`cursor-pointer rounded-xl ${
                    selectedUserId === user.id
                      ? "bg-red-500/10 ring-1 ring-red-400/40"
                      : "bg-slate-900/65 hover:bg-slate-900"
                  }`}
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold text-white">{user.email}</p>
                    <p className="text-xs text-slate-400">{user.first_name} {user.last_name}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-200">{user.order_count}</td>
                  <td className="px-3 py-3 text-slate-200">${Number(user.lifetime_value).toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${user.is_staff ? "bg-red-500/15 text-red-200" : "bg-slate-500/20 text-slate-300"}`}>
                      {user.is_staff ? "admin" : "customer"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${user.is_active ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"}`}>
                      {user.is_active ? "active" : "blocked"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{new Date(user.date_joined).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {usersQuery.isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <Loader2 className="animate-spin" size={16} /> Loading users...
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">{usersQuery.data?.count || 0} users</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-slate-400">Page {page} of {pageCount}</span>
            <button
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <aside className="admin-card p-5">
        {!selectedUser ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
            Select a user to update profile details, account status, and admin role access.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-200/75">User Detail</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{selectedUser.email}</h2>
              <p className="mt-1 text-xs text-slate-400">Joined {new Date(selectedUser.date_joined).toLocaleString()}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                First name
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                />
              </label>
              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Last name
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                />
              </label>
            </div>

            <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
              />
            </label>

            <div className="rounded-xl border border-slate-700 bg-slate-950/65 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Permissions</p>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                Account active
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={isStaff} onChange={(event) => setIsStaff(event.target.checked)} />
                Staff (admin panel access)
              </label>
            </div>

            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              <Save size={14} /> Save user changes
            </button>

            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-100">
              <p className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.18em]"><Shield size={14} /> Access Snapshot</p>
              <p className="mt-2 text-slate-200">Orders: {selectedUser.order_count}</p>
              <p className="text-slate-200">Lifetime value: ${Number(selectedUser.lifetime_value).toFixed(2)}</p>
              <p className="text-slate-200">Last login: {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "Never"}</p>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
