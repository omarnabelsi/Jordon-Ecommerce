"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Avery Collins",
    role: "Verified Buyer",
    rating: 5,
    review: "Shipping was fast, sizing was perfect, and the finish quality felt premium right out of the box.",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=240"
  },
  {
    name: "Nadia Bell",
    role: "Member",
    rating: 5,
    review: "The limited drop alerts are real. I grabbed my size before sellout and checkout took less than a minute.",
    avatar: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=240"
  },
  {
    name: "Marcus Reed",
    role: "Athlete",
    rating: 5,
    review: "Court grip and comfort are elite. The product page details matched exactly what arrived at my door.",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=240"
  }
];

export function SocialProofSection() {
  return (
    <section className="container-shell py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-red-400">Social Proof</p>
          <h3 className="font-display text-5xl uppercase tracking-wide text-white">Loved By Sneakerheads</h3>
        </div>
        <div className="rounded-full border border-amber-300/35 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200">
          4.9/5 average from 3,400+ reviews
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.article
            key={item.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className="card-surface rounded-2xl border border-white/10 p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20">
                <Image src={item.avatar} alt={item.name} fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">{item.role}</p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-1 text-amber-300">
              {Array.from({ length: item.rating }).map((_, ratingIndex) => (
                <Star key={`${item.name}-${ratingIndex}`} size={14} className="fill-current" />
              ))}
            </div>

            <p className="text-sm leading-relaxed text-white/70">&ldquo;{item.review}&rdquo;</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
