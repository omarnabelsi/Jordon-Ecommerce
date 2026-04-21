"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Mail } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const timeoutId = window.setTimeout(() => setSubmitted(false), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [submitted]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="container-shell pb-16 lg:pb-24">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/70 px-6 py-10 md:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(220,38,38,0.24),transparent_38%),radial-gradient(circle_at_88%_18%,rgba(153,27,27,0.22),transparent_40%)]" />

        <div className="relative grid items-center gap-7 md:grid-cols-[1.3fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-red-300">Members Offer</p>
            <h3 className="font-display text-4xl uppercase tracking-wide text-white md:text-5xl">
              Get 10% OFF your first order
            </h3>
            <p className="max-w-xl text-sm text-white/65 md:text-base">
              Unlock early-drop access, pricing perks, and curated style alerts when you join the list.
            </p>
          </motion.div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div
              className={`flex h-14 items-center gap-3 rounded-full border bg-black/65 px-4 transition-all duration-300 ${
                isFocused
                  ? "border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                  : "border-white/20"
              }`}
            >
              <Mail size={17} className="text-white/55" />
              <input
                className="h-full w-full bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
                placeholder="Enter your email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary focus-ring h-12 w-full rounded-full px-6 text-xs font-bold uppercase tracking-[0.24em] text-white"
            >
              Claim My 10% OFF
            </button>

            {submitted ? (
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                <CheckCircle2 size={15} />
                Success! Your discount is on the way.
              </p>
            ) : (
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">No spam. Just drops and exclusive offers.</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  return <CTASection />;
}
