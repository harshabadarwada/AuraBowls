"use client";

import type { CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

type Shape = "cucumber" | "pepper" | "grain";

export type Ingredient = {
  id: string;
  src?: string;
  shape?: Shape;
  className: string;
  toward: [number, number];
  away: [number, number];
  depth: number;
  spin: number;
  dur: number;
  delay: number;
  enter: number;
  dim?: boolean;
};

const ingredients: Ingredient[] = [
  { id: "basil", src: "/scene/basil.webp", className: "left-[-5%] top-[33%] w-[19vw] max-w-[120px] wide:left-[12%] wide:top-[calc(50%-min(27vw,390px))] wide:w-[7vw] wide:max-w-[124px]", toward: [2, 7], away: [-10, -12], depth: 1.2, spin: -9, dur: 9, delay: 0, enter: 0.35 },
  { id: "tomato", src: "/scene/tomato.webp", className: "right-[-4%] top-[35%] w-[17vw] max-w-[110px] wide:right-[11%] wide:top-[calc(50%-min(26vw,375px))] wide:w-[6.4vw] wide:max-w-[112px]", toward: [-2, 7], away: [10, -12], depth: 1.1, spin: 7, dur: 10, delay: 1.2, enter: 0.45 },
  { id: "lemon", src: "/scene/lemon.webp", className: "bottom-[13%] left-[5%] w-[13vw] max-w-[84px] wide:bottom-auto wide:left-[31%] wide:top-[calc(50%-min(24vw,345px))] wide:w-[4.2vw] wide:max-w-[72px]", toward: [-7, 8], away: [-6, -14], depth: 0.7, spin: 12, dur: 11, delay: 0.6, enter: 0.6, dim: true },
  { id: "lettuce", src: "/scene/lettuce.webp", className: "hidden wide:block wide:right-[31%] wide:top-[calc(50%-min(25vw,360px))] wide:w-[5vw] wide:max-w-[88px]", toward: [7, 8], away: [6, -14], depth: 0.8, spin: -10, dur: 12, delay: 2, enter: 0.7, dim: true },
  { id: "pepper", shape: "pepper", className: "hidden wide:block wide:left-[47%] wide:top-[calc(50%-min(23vw,330px))] wide:w-[3vw] wide:max-w-[52px]", toward: [-1, 4], away: [0, -14], depth: 0.5, spin: 20, dur: 13, delay: 0.8, enter: 1 },
  { id: "grain-left", shape: "grain", className: "hidden wide:block wide:left-[23%] wide:top-[calc(50%-min(20vw,288px))] wide:w-[2.6vw] wide:max-w-[44px]", toward: [-4, 6], away: [-8, -10], depth: 0.6, spin: -14, dur: 12, delay: 0.2, enter: 1.05, dim: true },
  { id: "grain-right", shape: "grain", className: "hidden wide:block wide:right-[22%] wide:top-[calc(50%-min(19vw,274px))] wide:w-[2.4vw] wide:max-w-[40px]", toward: [4, 6], away: [8, -10], depth: 0.6, spin: 14, dur: 11, delay: 1.4, enter: 1.1, dim: true },
  { id: "cucumber-left", shape: "cucumber", className: "hidden wide:block wide:left-[2%] wide:top-[calc(50%+min(10vw,144px))] wide:w-[3.8vw] wide:max-w-[64px]", toward: [3, -5], away: [-8, 8], depth: 0.9, spin: 18, dur: 10, delay: 0.4, enter: 0.8 },
  { id: "cucumber-right", shape: "cucumber", className: "bottom-[15%] right-[6%] w-[11vw] max-w-[68px] wide:bottom-auto wide:right-[2.5%] wide:top-[calc(50%+min(12vw,172px))] wide:w-[3.2vw] wide:max-w-[56px]", toward: [-3, -5], away: [8, 8], depth: 0.9, spin: -16, dur: 9.5, delay: 1.6, enter: 0.9 },
  { id: "lemon-low", src: "/scene/lemon.webp", className: "hidden wide:block wide:left-[24%] wide:top-[calc(50%+min(16vw,230px))] wide:w-[3.6vw] wide:max-w-[60px]", toward: [-4, -6], away: [-8, 10], depth: 0.6, spin: -12, dur: 12, delay: 2.4, enter: 1.15, dim: true },
  { id: "basil-low", src: "/scene/basil.webp", className: "hidden wide:block wide:right-[21%] wide:top-[calc(50%+min(15vw,216px))] wide:w-[4.4vw] wide:max-w-[76px]", toward: [4, -6], away: [8, 10], depth: 0.7, spin: 10, dur: 11, delay: 0.9, enter: 1.2, dim: true },
];

const frames = [0, 0.3, 0.46, 0.64, 0.74, 0.88];

export function StoryBackdrop({ progress }: { progress: MotionValue<number> }) {
  const leftWord = useTransform(progress, [0, 1], ["0vw", "-7vw"]);
  const rightWord = useTransform(progress, [0, 1], ["0vw", "7vw"]);
  const midWord = useTransform(progress, [0, 1], ["5vw", "-5vw"]);
  const midOpacity = useTransform(progress, [0, 0.3, 0.46, 0.66, 0.76], [0.5, 0.5, 1, 1, 0.4]);
  const endOpacity = useTransform(progress, [0.6, 0.82], [0.35, 1]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(110% 70% at 50% -12%, rgba(16,41,29,0.95) 0%, rgba(16,41,29,0) 62%), radial-gradient(70% 55% at 50% 112%, rgba(16,41,29,0.9) 0%, rgba(16,41,29,0) 70%), radial-gradient(140% 100% at 50% 50%, rgba(16,20,17,0) 55%, rgba(5,7,6,0.55) 100%)",
        }}
      />
      <motion.p style={{ x: leftWord }} className="display outline-word absolute left-[-3vw] top-[1%] whitespace-nowrap text-[24vw] leading-none wide:top-[calc(50%-min(31vw,446px))] wide:text-[15vw]">
        FRESH
      </motion.p>
      <motion.p style={{ x: rightWord }} className="display outline-word absolute right-[-2vw] top-[calc(50%-min(31vw,446px))] hidden whitespace-nowrap text-[15vw] leading-none wide:block">
        REAL
      </motion.p>
      <motion.p
        style={{ x: midWord, opacity: midOpacity }}
        className="display absolute inset-x-0 top-[50%] whitespace-nowrap text-center text-[17vw] leading-none text-[#FFF8F2]/[0.035] wide:top-[calc(50%-min(3vw,44px))] wide:text-[13vw]"
      >
        GOOD FOOD
      </motion.p>
      <motion.p style={{ opacity: endOpacity }} className="display outline-word absolute inset-x-0 bottom-[1%] whitespace-nowrap text-center text-[12vw] leading-none wide:text-[8.5vw]">
        MADE FOR YOU
      </motion.p>
      <div className="film-grain absolute inset-0 opacity-[0.06]" />
    </div>
  );
}

export function StoryIngredients({ progress }: { progress: MotionValue<number> }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
      {ingredients.map((item) => (
        <FloatingIngredient key={item.id} item={item} progress={progress} />
      ))}
    </div>
  );
}

export function FloatingIngredient({ item, progress }: { item: Ingredient; progress: MotionValue<number> }) {
  const [tx, ty] = item.toward;
  const [ax, ay] = item.away;
  const x = useTransform(progress, frames, [0, 0, tx, tx, ax * 0.45, ax].map((value) => `${value}vw`));
  const y = useTransform(progress, frames, [0, -4 * item.depth, ty, ty, ay * 0.45, ay].map((value) => `${value}vh`));
  const opacity = useTransform(progress, frames, [1, 1, 1, 1, 0.55, 0]);
  const scale = useTransform(progress, frames, [1, 1, 0.92, 0.92, 1.04, 1.1]);
  const rotate = useTransform(progress, frames, [0, item.spin * 0.6, item.spin, item.spin, item.spin * 2, item.spin * 2.6]);

  return (
    <motion.div
      className={`absolute ${item.className}`}
      initial={{ opacity: 0, scale: 0.6, y: 28 }}
      animate={{ opacity: item.dim ? 0.72 : 1, scale: 1, y: 0 }}
      transition={{ duration: 1.4, delay: item.enter, ease: [0.16, 0.84, 0.32, 1] }}
    >
      <motion.div style={{ x, y, opacity, scale, rotate }}>
        <div
          className="ingredient-drift"
          style={{ "--dur": `${item.dur}s`, "--delay": `${item.delay}s`, "--spin": `${item.spin}deg`, "--lift": `${-8 - item.depth * 6}px` } as CSSProperties}
        >
          {item.src ? (
            <img src={item.src} alt="" draggable={false} className="w-full select-none drop-shadow-[0_14px_18px_rgba(0,0,0,0.45)]" />
          ) : (
            <IngredientShape shape={item.shape ?? "grain"} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function IngredientShape({ shape }: { shape: Shape }) {
  if (shape === "cucumber") {
    return (
      <svg viewBox="0 0 100 100" className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.45)]">
        <circle cx="50" cy="50" r="48" fill="#2F5E22" />
        <circle cx="50" cy="50" r="42" fill="#A9CF7C" />
        <circle cx="50" cy="50" r="36" fill="#DDEFB8" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse key={angle} cx="50" cy="31" rx="3.2" ry="6" fill="#F4F8E4" stroke="#B9D58E" strokeWidth="1" transform={`rotate(${angle} 50 50)`} />
        ))}
      </svg>
    );
  }
  if (shape === "pepper") {
    return (
      <svg viewBox="0 0 60 40" className="w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]">
        <defs>
          <radialGradient id="peppercorn" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#6B5444" />
            <stop offset="1" stopColor="#1E1611" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="22" r="9" fill="url(#peppercorn)" />
        <circle cx="34" cy="14" r="8" fill="url(#peppercorn)" />
        <circle cx="46" cy="28" r="7" fill="url(#peppercorn)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 40" className="w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.45)]">
      <ellipse cx="16" cy="20" rx="11" ry="5" fill="#F3E6C8" transform="rotate(-24 16 20)" />
      <ellipse cx="38" cy="13" rx="10" ry="4.5" fill="#EADBB8" transform="rotate(18 38 13)" />
      <ellipse cx="42" cy="30" rx="9" ry="4.2" fill="#F6ECD4" transform="rotate(-8 42 30)" />
    </svg>
  );
}
