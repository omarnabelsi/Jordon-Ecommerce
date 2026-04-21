"use client";

import { motion } from "framer-motion";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

const trustItems = [
  {
    title: "Free Shipping",
    description: "Fast delivery on eligible orders with live tracking from checkout.",
    icon: Truck
  },
  {
    title: "30-Day Returns",
    description: "Try your fit at home with easy returns and stress-free exchanges.",
    icon: RotateCcw
  },
  {
    title: "100% Authentic",
    description: "Every pair is verified so you can buy with complete confidence.",
    icon: ShieldCheck
  }
];

export function TrustSection() {
  return (
    <section className="container-shell py-14 lg:py-18">
      <div className="grid gap-4 md:grid-cols-3">
        {trustItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.38, delay: index * 0.06 }}
              className="card-surface rounded-2xl border border-white/10 p-5"
            >
              <div className="inline-flex rounded-xl border border-red-400/25 bg-red-600/12 p-3 text-red-300">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
