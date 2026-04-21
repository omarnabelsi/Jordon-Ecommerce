"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { AccountSidebar } from "@/components/account/account-sidebar";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AccountSettingsPage() {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState<string | null>(null);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const response = await api.patch("/auth/profile/", {
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data);
      setMessage("Profile updated successfully.");
    },
    onError: () => {
      setMessage("Could not update profile. Please try again.");
    },
  });

  if (!user) {
    return null;
  }

  return (
    <section className="container-shell py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <AccountSidebar activeTab="settings" />

        <div className="space-y-8 lg:col-span-2">
          <div className="card-surface p-6">
            <h1 className="mb-6 font-display text-4xl uppercase">Edit Profile</h1>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                updateProfile.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-white">First Name</span>
                  <input
                    className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-white">Last Name</span>
                  <input
                    className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm block">
                <span className="font-semibold text-white">Phone</span>
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="space-y-2 text-sm block">
                <span className="font-semibold text-white">Email</span>
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-white/60"
                  value={user.email}
                  disabled
                />
              </label>

              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </button>

              {message ? (
                <p className={`text-sm ${updateProfile.isError ? "text-red-300" : "text-emerald-400"}`}>{message}</p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
