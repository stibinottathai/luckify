"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface AeoFaqSectionProps {
  title?: string;
  items: FaqItem[];
}

export default function AeoFaqSection({
  title = "Frequently Asked Questions 🔮",
  items,
}: AeoFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mt-16 mb-8 select-none z-10">
      <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
        <HelpCircle className="w-5.5 h-5.5 text-primary-gold" />
        <h2 className="text-xl font-extrabold font-fredoka text-deep-violet dark:text-soft-cream uppercase tracking-wider">
          {title}
        </h2>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white dark:bg-card border-2 border-deep-violet/5 dark:border-white/5 rounded-2xl overflow-hidden hover:border-primary-gold/40 dark:hover:border-primary-gold/40 transition-colors duration-200"
            >
              {/* Question Trigger */}
              <button
                type="button"
                onClick={() => toggleIndex(index)}
                className="w-full py-4.5 px-6 flex items-center justify-between gap-4 text-left font-fredoka font-black text-sm sm:text-base text-deep-violet dark:text-soft-cream cursor-pointer hover:bg-deep-violet/[0.02] dark:hover:bg-white/[0.01] transition-colors"
              >
                <span>{item.question}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-primary-gold shrink-0"
                >
                  <ChevronDown className="w-4 h-4 sm:w-5 h-5" />
                </motion.span>
              </button>

              {/* Answer Content */}
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="border-t border-deep-violet/5 dark:border-white/5 py-4 px-6 text-xs sm:text-sm font-semibold text-deep-violet/70 dark:text-soft-cream/75 leading-relaxed bg-deep-violet/[0.01] dark:bg-black/10">
                  {item.answer}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
