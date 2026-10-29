"use client";

import { useRef } from "react";
import { Great_Vibes } from "next/font/google";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";

const script = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const ease = [0.65, 0, 0.35, 1] as const;

export function Signature() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const shown = useInView(ref, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [12, -12]);
  const instant = { duration: 0 };

  return (
    <motion.div ref={ref} style={{ y: drift }} className="motion-reduce:!transform-none">
      <motion.p
        className="group flex cursor-default flex-col items-center leading-none sm:items-end"
        initial={{ opacity: 0, y: 12 }}
        animate={shown ? { opacity: 1, y: 0 } : undefined}
        transition={reduce ? instant : { duration: 0.7, ease: [0.16, 0.84, 0.32, 1] }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#EAF6DC]/75">Built by</span>
        <span className="relative mt-1 inline-block px-1 pb-2">
          <motion.span
            className={`${script.className} inline-block text-[2.6rem] leading-[1.15] text-[#FFF8F2] transition-colors duration-300 group-hover:text-white motion-reduce:transition-none`}
            initial={{ clipPath: "inset(-20% 100% -20% 0)" }}
            animate={shown ? { clipPath: "inset(-20% -6% -20% 0)" } : undefined}
            transition={reduce ? instant : { duration: 1.6, delay: 0.25, ease }}
          >
            Harsha
          </motion.span>
          <span
            aria-hidden="true"
            className="absolute inset-x-2 bottom-1 h-px origin-left scale-x-0 rounded-full bg-[#F15C00] transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
          />
        </span>
      </motion.p>
    </motion.div>
  );
}
