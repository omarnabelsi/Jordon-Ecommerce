"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { api } from "@/lib/api";
import { ContactValues, contactSchema } from "@/lib/validators/contact";

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 3-5 business days. Express options are available at checkout."
  },
  {
    q: "Can I return worn shoes?",
    a: "Returns are accepted for unworn items within 30 days in original packaging."
  },
  {
    q: "Do you restock sold-out sizes?",
    a: "High-demand sizes are replenished in limited drops. Enable email alerts in your account."
  }
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema)
  });

  const contactMutation = useMutation({
    mutationFn: async (values: ContactValues) => {
      const response = await api.post("/contact/", values);
      return response.data;
    },
    onSuccess: () => reset()
  });

  return (
    <section className="container-shell py-12">
      <h1 className="mb-8 font-display text-5xl uppercase">Contact & Support</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <article className="card-surface p-6">
          <h2 className="mb-4 font-display text-3xl uppercase">Send a Message</h2>

          <form onSubmit={handleSubmit((values) => contactMutation.mutate(values))} className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span>Name</span>
              <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("name")} />
              {errors.name ? <span className="text-xs text-red-400">{errors.name.message}</span> : null}
            </label>

            <label className="block space-y-1 text-sm">
              <span>Email</span>
              <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("email")} />
              {errors.email ? <span className="text-xs text-red-400">{errors.email.message}</span> : null}
            </label>

            <label className="block space-y-1 text-sm">
              <span>Subject</span>
              <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("subject")} />
              {errors.subject ? <span className="text-xs text-red-400">{errors.subject.message}</span> : null}
            </label>

            <label className="block space-y-1 text-sm">
              <span>Message</span>
              <textarea className="focus-ring min-h-32 w-full rounded-lg border border-white/20 bg-black px-3 py-3" {...register("message")} />
              {errors.message ? <span className="text-xs text-red-400">{errors.message.message}</span> : null}
            </label>

            <button type="submit" className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white">
              {contactMutation.isPending ? "Sending..." : "Send"}
            </button>
            {contactMutation.isSuccess ? <p className="text-sm text-emerald-400">Message sent successfully.</p> : null}
          </form>
        </article>

        <div className="space-y-6">
          <article className="card-surface p-6">
            <h2 className="mb-4 font-display text-3xl uppercase">FAQ</h2>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div key={faq.q} className="rounded-lg border border-white/15 p-3">
                  <button
                    className="w-full text-left text-sm font-semibold text-white"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    {faq.q}
                  </button>
                  {openFaq === index ? <p className="pt-2 text-sm text-white/70">{faq.a}</p> : null}
                </div>
              ))}
            </div>
          </article>

          <article className="card-surface p-6">
            <h2 className="mb-3 font-display text-3xl uppercase">Live Chat</h2>
            <p className="text-sm text-white/70">Live chat widget placeholder. Integrate Intercom/Crisp here.</p>
          </article>

          <article className="card-surface p-6">
            <h2 className="mb-3 font-display text-3xl uppercase">Store Locator</h2>
            <div className="h-48 rounded-lg border border-white/20 bg-gradient-to-br from-zinc-900 to-zinc-800 p-4 text-sm text-white/70">
              Map integration placeholder. Connect Google Maps or Mapbox SDK.
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
