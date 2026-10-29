"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { StoryBackdrop, StoryIngredients } from "@/components/story-atmosphere";

const vegBowl = "/cutouts/paneer-power-bowl.webp";
const nonVegBowl = "/cutouts/fiery-peri-chicken-bowl.webp";

type Source = { name: string; note: string };

const vegSources: Source[] = [
  { name: "Paneer", note: "Paneer Power Bowl, Paneer Biryani" },
  { name: "Soya chunks", note: "Soya Crunch Bowl, Soya Biryani" },
  { name: "Tofu", note: "Tofu Power Bowl" },
];

const nonVegSources: Source[] = [
  { name: "Grilled chicken", note: "Peri, Mediterranean, Tandoori Biryani" },
  { name: "Crispy chicken", note: "Seoul Crunch, Korean Fried Biryani" },
  { name: "Eggs", note: "Protein Punch, Masala Egg, Egg Biryani" },
];

const rowTops = ["2%", "38%", "74%"];
const arrowStarts = [36, 20, 4];

function useBand(progress: MotionValue<number>, showAt: number, hideAt: number) {
  return useTransform(progress, [showAt, showAt + 0.06, hideAt, hideAt + 0.06], [0, 1, 1, 0]);
}

export function HomeStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.4, restDelta: 0.001 });

  const headlineOpacity = useTransform(progress, [0, 0.24, 0.34], [1, 1, 0]);
  const headlineY = useTransform(progress, [0, 0.34], ["0vh", "-4vh"]);
  const hintOpacity = useTransform(progress, [0, 0.08, 0.18], [1, 1, 0]);
  const stageTwoOpacity = useTransform(progress, [0.38, 0.46, 0.64, 0.7], [0, 1, 1, 0]);
  const stageThreeOpacity = useTransform(progress, [0.72, 0.84, 1], [0, 1, 1]);
  const stageThreeY = useTransform(progress, [0.72, 0.86], ["4vh", "0vh"]);
  const floorOpacity = useTransform(progress, [0.7, 0.84, 1], [0, 1, 1]);

  const vegFades = [useBand(progress, 0.42, 0.64), useBand(progress, 0.46, 0.64), useBand(progress, 0.5, 0.64)];
  const nonVegFades = [useBand(progress, 0.44, 0.64), useBand(progress, 0.48, 0.64), useBand(progress, 0.52, 0.64)];

  const frames = [0, 0.3, 0.44, 0.66, 0.82, 1];
  const leftX = useTransform(progress, frames, ["0%", "0%", "-8%", "-8%", "2%", "2%"]);
  const rightX = useTransform(progress, frames, ["0%", "0%", "8%", "8%", "-2%", "-2%"]);
  const bowlY = useTransform(progress, frames, ["0vh", "0vh", "-2vh", "-2vh", "14vh", "15vh"]);
  const bowlScale = useTransform(progress, frames, [1, 1, 0.88, 0.88, 0.8, 0.78]);
  const leftTilt = useTransform(progress, frames, [0, 0, -6, -6, -9, -9]);
  const rightTilt = useTransform(progress, frames, [0, 0, 6, 6, 9, 9]);

  const [choicesReady, setChoicesReady] = useState(false);
  useMotionValueEvent(progress, "change", (value) => setChoicesReady(value > 0.8));

  return (
    <div data-full-bleed className="-mt-8 ml-[calc(50%-50vw)] w-screen">
      <div className="hidden motion-reduce:block">
        <CalmStory />
      </div>
      <section ref={sectionRef} className="relative h-[340vh] motion-reduce:hidden" aria-label="AuraBowls story">
        <div className="sticky top-16 h-[calc(100svh-4rem-4.5rem)] overflow-hidden bg-[#101411] md:top-[4.5rem] md:h-[calc(100svh-4.5rem)] md:rounded-b-[32px]">
          <StoryBackdrop progress={progress} />
          <motion.div
            style={{ opacity: floorOpacity }}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[-10%] top-[30%] h-[46%] bg-[radial-gradient(closest-side,rgba(241,92,0,0.13),rgba(241,92,0,0.04)_55%,rgba(241,92,0,0))] wide:top-[40%]"
          />
          <StoryIngredients progress={progress} />
          <Bowl
            src={vegBowl}
            alt="Vegetarian paneer bowl"
            side="left"
            shiftX={leftX}
            shiftY={bowlY}
            scale={bowlScale}
            tilt={leftTilt}
            enterFrom="-62vw"
            enterRotate={-14}
          >
            <Callouts side="left" title="Veg bowl" sources={vegSources} fades={vegFades} groupOpacity={stageTwoOpacity} />
          </Bowl>
          <Bowl
            src={nonVegBowl}
            alt="Non-vegetarian chicken bowl"
            side="right"
            shiftX={rightX}
            shiftY={bowlY}
            scale={bowlScale}
            tilt={rightTilt}
            enterFrom="62vw"
            enterRotate={14}
          >
            <Callouts side="right" title="Non-veg bowl" sources={nonVegSources} fades={nonVegFades} groupOpacity={stageTwoOpacity} />
          </Bowl>

          <motion.div style={{ opacity: headlineOpacity, y: headlineY }} className="pointer-events-none absolute left-1/2 top-[46%] z-20 w-[78vw] -translate-x-1/2 px-2 text-center wide:top-[calc(50%-min(7vw,100px))] wide:w-[min(30vw,26rem)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F15C00]">AuraBowls</p>
            <h1 className="display mt-3 text-[2.1rem] leading-[1.02] text-[#FFF8F2] sm:text-5xl wide:text-[3.4rem]">
              Good food. Your kind of bowl.
            </h1>
          </motion.div>

          <motion.p style={{ opacity: stageTwoOpacity }} className="pointer-events-none absolute inset-x-0 bottom-[4%] z-20 px-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFF8F2]/60">
            Protein sources from bowls on our menu
          </motion.p>

          <motion.div
            style={{ opacity: stageThreeOpacity, y: stageThreeY }}
            className={`absolute inset-x-0 bottom-[5%] z-30 px-4 wide:bottom-auto wide:left-1/2 wide:right-auto wide:top-[calc(50%-min(14vw,200px))] wide:w-[min(36vw,27rem)] wide:-translate-x-1/2 wide:px-0 ${choicesReady ? "" : "pointer-events-none"}`}
            aria-hidden={choicesReady ? undefined : true}
          >
            <div className="mx-auto max-w-md text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F15C00]">Your next step</p>
              <h2 className="display mt-2 text-3xl leading-[1.05] text-[#FFF8F2] wide:text-[2.6rem]">How would you like to eat?</h2>
            </div>
            <div className="mx-auto mt-5 grid max-w-md gap-3">
              <StoryCard href="/menu" tone="light" inert={!choicesReady} title="Explore the Menu" note="Single bowls, oats, salads and juices." />
              <StoryCard href="/plans" tone="forest" inert={!choicesReady} title="Explore Meal Plans" note="Breakfast or lunch, on a schedule you pick." />
            </div>
          </motion.div>

          <motion.div style={{ opacity: hintOpacity }} className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-[#FFF8F2]/65" aria-hidden="true">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Scroll</span>
            <motion.span className="block h-6 w-px bg-[#FFF8F2]/40" animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} style={{ originY: 0 }} />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function Bowl({
  src,
  alt,
  side,
  shiftX,
  shiftY,
  scale,
  tilt,
  enterFrom,
  enterRotate,
  children,
}: {
  src: string;
  alt: string;
  side: "left" | "right";
  shiftX: MotionValue<string>;
  shiftY: MotionValue<string>;
  scale: MotionValue<number>;
  tilt: MotionValue<number>;
  enterFrom: string;
  enterRotate: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={`absolute top-[8%] z-10 w-[44vw] max-w-[230px] sm:max-w-[340px] wide:top-[calc(50%-min(17vw,240px))] wide:w-[30vw] wide:max-w-[420px] ${side === "left" ? "left-[2%] wide:left-[3%]" : "right-[2%] wide:right-[3%]"}`}
      initial={{ x: enterFrom, rotate: enterRotate }}
      animate={{ x: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 54, damping: 16, mass: 0.9, delay: side === "left" ? 0.05 : 0.12 }}
    >
      <motion.div style={{ x: shiftX, y: shiftY, scale }} className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[28%] bg-[radial-gradient(closest-side,rgba(255,236,214,0.16),rgba(241,92,0,0.10)_45%,rgba(241,92,0,0)_75%)]"
        />
        <motion.div style={{ rotate: tilt }} className="relative">
          <span aria-hidden="true" className="absolute inset-x-[12%] -bottom-[6%] h-[14%] rounded-[50%] bg-black/60 blur-xl" />
          <motion.img
            src={src}
            alt={alt}
            width={900}
            height={620}
            draggable={false}
            className="relative w-full select-none drop-shadow-[0_26px_24px_rgba(0,0,0,0.5)]"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: side === "left" ? 0 : 1.4 }}
          />
        </motion.div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function DietMark({ veg }: { veg: boolean }) {
  const color = veg ? "#2E7D32" : "#A0391E";
  return (
    <span aria-hidden="true" className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px]" style={{ borderColor: color }}>
      {veg ? (
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      ) : (
        <span className="h-0 w-0 border-x-[3.5px] border-b-[6px] border-x-transparent" style={{ borderBottomColor: color }} />
      )}
    </span>
  );
}

function Callouts({
  side,
  title,
  sources,
  fades,
  groupOpacity,
}: {
  side: "left" | "right";
  title: string;
  sources: Source[];
  fades: MotionValue<number>[];
  groupOpacity: MotionValue<number>;
}) {
  const veg = side === "left";
  return (
    <>
      <motion.div style={{ opacity: groupOpacity }} className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 wide:-top-12">
        <span className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A4A16] shadow-[0_8px_20px_rgba(0,0,0,0.3)] ring-1 ring-[#1A4A16]/10 wide:text-[11px]">
          <DietMark veg={veg} />
          {title}
        </span>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-20 hidden wide:block">
        {sources.map((source, index) => (
          <motion.div
            key={source.name}
            style={{ opacity: fades[index], top: rowTops[index] }}
            className={`absolute flex items-start ${veg ? "left-[78%]" : "right-[78%] flex-row-reverse"}`}
          >
            <Arrow start={arrowStarts[index]} draw={fades[index]} flip={!veg} />
            <SourceCard source={source} veg={veg} align={veg ? "left" : "right"} />
          </motion.div>
        ))}
      </div>

      <div className="pointer-events-none absolute left-0 top-full z-20 w-full wide:hidden">
        <svg viewBox="0 0 24 34" className="mx-auto -mt-2 block h-8 w-5 overflow-visible text-[#FFF8F2]/75" aria-hidden="true">
          <motion.circle cx="12" cy="3" r="3" className="fill-white stroke-current" strokeWidth="1.5" style={{ opacity: fades[0] }} />
          <motion.path d="M12 6 C 12 16, 12 20, 12 30" fill="none" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" style={{ pathLength: fades[0] }} />
          <motion.path d="M7 25 L12 31 L17 25" fill="none" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: fades[0] }} />
        </svg>
        <ul className="mt-1 space-y-1.5">
          {sources.map((source, index) => (
            <motion.li
              key={source.name}
              style={{ opacity: fades[index] }}
              className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-[0_6px_16px_rgba(59,42,26,0.10)] ring-1 ring-[#1A4A16]/10"
            >
              <DietMark veg={veg} />
              <span className="display truncate text-[15px] leading-tight text-[#1A4A16]">{source.name}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Arrow({ start, draw, flip }: { start: number; draw: MotionValue<number>; flip: boolean }) {
  return (
    <svg viewBox="0 0 80 40" className={`mt-2 h-8 w-16 shrink-0 overflow-visible text-[#FFF8F2]/75 lg:h-10 lg:w-20 ${flip ? "-scale-x-100" : ""}`} aria-hidden="true">
      <circle cx="3" cy={start} r="3.2" className="fill-white stroke-current" strokeWidth="1.5" />
      <motion.path
        d={`M6 ${start} C 30 ${start}, 44 18, 72 18`}
        fill="none"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ pathLength: draw }}
      />
      <motion.path d="M66 12.5 L73 18 L66 23.5" fill="none" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: draw }} />
    </svg>
  );
}

function SourceCard({ source, veg, align }: { source: Source; veg: boolean; align: "left" | "right" }) {
  return (
    <div className={`w-max min-w-[clamp(9.5rem,14vw,13.5rem)] max-w-[15rem] rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.32)] ring-1 ring-[#1A4A16]/10 ${align === "right" ? "text-right" : ""}`}>
      <p className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <DietMark veg={veg} />
        <span className="display whitespace-nowrap text-lg leading-tight text-[#1A4A16] xl:text-xl">{source.name}</span>
      </p>
      <p className="mt-1 hidden text-xs leading-4 text-[#6A5A4E] xl:block">{source.note}</p>
    </div>
  );
}

function StoryCard({ href, tone, title, note, inert = false }: { href: string; tone: "light" | "forest"; title: string; note: string; inert?: boolean }) {
  const light = tone === "light";
  return (
    <Link
      href={href}
      tabIndex={inert ? -1 : undefined}
      className={`group flex items-center gap-4 rounded-[1.6rem] px-5 py-4 transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F15C00] motion-reduce:transition-none ${
        light
          ? "bg-white/95 text-[#1A4A16] shadow-[0_18px_40px_rgba(59,42,26,0.14)] ring-1 ring-[#1A4A16]/10 hover:shadow-[0_22px_48px_rgba(59,42,26,0.18)]"
          : "bg-[#1A4A16] text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/15 hover:bg-[#1f5719]"
      }`}
    >
      <span className="min-w-0 flex-1 text-left">
        <span className="display block text-2xl leading-tight sm:text-[1.75rem]">{title}</span>
        <span className={`mt-1 block text-xs leading-5 sm:text-sm ${light ? "text-[#6A5A4E]" : "text-white/75"}`}>{note}</span>
      </span>
      <span
        aria-hidden="true"
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition duration-300 group-hover:translate-x-1 motion-reduce:transition-none ${light ? "bg-[#F15C00] text-white" : "bg-white text-[#1A4A16]"}`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      </span>
    </Link>
  );
}

function CalmStory() {
  return (
    <div className="space-y-14 bg-[radial-gradient(110%_60%_at_50%_0%,#10291D_0%,#101411_70%)] px-5 py-12 sm:px-8 md:rounded-b-[32px]">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_minmax(0,18rem)_1fr]">
        <img src={vegBowl} alt="Vegetarian paneer bowl" className="mx-auto w-56 -rotate-6 drop-shadow-[0_22px_20px_rgba(0,0,0,0.5)] sm:w-72" />
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F15C00]">AuraBowls</p>
          <h1 className="display mt-3 text-4xl leading-[1.05] text-[#FFF8F2] sm:text-6xl">Good food. Your kind of bowl.</h1>
        </div>
        <img src={nonVegBowl} alt="Non-vegetarian chicken bowl" className="mx-auto w-56 rotate-6 drop-shadow-[0_22px_20px_rgba(0,0,0,0.5)] sm:w-72" />
      </div>
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        {[
          { title: "Veg bowl", veg: true, sources: vegSources },
          { title: "Non-veg bowl", veg: false, sources: nonVegSources },
        ].map((group) => (
          <article key={group.title}>
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#FFF8F2]">
              <DietMark veg={group.veg} />
              {group.title}
            </h2>
            <div className="mt-3 grid gap-2">
              {group.sources.map((source) => (
                <SourceCard key={source.name} source={source} veg={group.veg} align="left" />
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFF8F2]/60">Protein sources from bowls on our menu</p>
      <div className="mx-auto grid max-w-md gap-3">
        <StoryCard href="/menu" tone="light" title="Explore the Menu" note="Single bowls, oats, salads and juices." />
        <StoryCard href="/plans" tone="forest" title="Explore Meal Plans" note="Breakfast or lunch, on a schedule you pick." />
      </div>
    </div>
  );
}
