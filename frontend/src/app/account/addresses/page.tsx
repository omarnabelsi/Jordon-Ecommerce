"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AccountSidebar } from "@/components/account/account-sidebar";
import { api } from "@/lib/api";

interface Address {
  id: number;
  type: "shipping" | "billing";
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface AddressPayload {
  type: "shipping" | "billing";
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

const initialForm: AddressPayload = {
  type: "shipping",
  first_name: "",
  last_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  phone: "",
  is_default: false,
};

export default function AccountAddressesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddressPayload>(initialForm);

  const addressesQuery = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await api.get("/addresses/");
      return response.data as Address[];
    },
  });

  const createAddress = useMutation({
    mutationFn: async (payload: AddressPayload) => {
      const response = await api.post("/addresses/", payload);
      return response.data;
    },
    onSuccess: () => {
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (addressId: number) => {
      await api.delete(`/addresses/${addressId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const addresses = addressesQuery.data || [];

  return (
    <section className="container-shell py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <AccountSidebar activeTab="addresses" />

        <div className="space-y-8 lg:col-span-2">
          <div className="card-surface p-6">
            <h1 className="mb-6 font-display text-4xl uppercase">Saved Addresses</h1>

            {addressesQuery.isLoading ? (
              <p className="text-white/60">Loading addresses...</p>
            ) : addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <article key={address.id} className="rounded-lg border border-white/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-red-400">{address.type}</p>
                        <p className="font-semibold text-white">
                          {address.first_name} {address.last_name}
                        </p>
                        <p className="text-sm text-white/70">
                          {address.address_line1}
                          {address.address_line2 ? `, ${address.address_line2}` : ""}
                        </p>
                        <p className="text-sm text-white/70">
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p className="text-sm text-white/70">{address.country}</p>
                        <p className="text-sm text-white/70">{address.phone}</p>
                        {address.is_default ? <p className="mt-1 text-xs text-emerald-400">Default</p> : null}
                      </div>

                      <button
                        onClick={() => deleteAddress.mutate(address.id)}
                        disabled={deleteAddress.isPending}
                        className="text-xs uppercase tracking-[0.2em] text-white/55 transition hover:text-white disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-white/60">No addresses saved yet.</p>
            )}
          </div>

          <div className="card-surface p-6">
            <h2 className="mb-4 font-display text-3xl uppercase">Add Address</h2>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createAddress.mutate(form);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                  required
                />
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                  required
                />
              </div>

              <input
                className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                placeholder="Address Line 1"
                value={form.address_line1}
                onChange={(event) => setForm((prev) => ({ ...prev, address_line1: event.target.value }))}
                required
              />

              <input
                className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                placeholder="Address Line 2 (optional)"
                value={form.address_line2}
                onChange={(event) => setForm((prev) => ({ ...prev, address_line2: event.target.value }))}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                  placeholder="City"
                  value={form.city}
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  required
                />
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                  placeholder="State"
                  value={form.state}
                  onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                  required
                />
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                  placeholder="Postal Code"
                  value={form.postal_code}
                  onChange={(event) => setForm((prev) => ({ ...prev, postal_code: event.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                  placeholder="Country"
                  value={form.country}
                  onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                  required
                />
                <input
                  className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 text-sm"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center gap-3 text-sm text-white/80">
                <select
                  className="focus-ring h-11 rounded-lg border border-white/20 bg-black px-3"
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as "shipping" | "billing" }))}
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                </select>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(event) => setForm((prev) => ({ ...prev, is_default: event.target.checked }))}
                  />
                  Default
                </label>
              </div>

              <button
                type="submit"
                disabled={createAddress.isPending}
                className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {createAddress.isPending ? "Saving..." : "Save Address"}
              </button>

              {createAddress.isError ? <p className="text-sm text-red-300">Could not save address. Please verify your input.</p> : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
