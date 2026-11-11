"use client";

import { bowlStyles } from "@/lib/power-bowls";

export function BowlStage({
  styleId,
  protein,
  name,
}: {
  styleId: "balanced" | "protein" | "carb";
  protein: string;
  name: string;
}) {
  const style = bowlStyles.find((item) => item.id === styleId) || bowlStyles[0];
  const fill = protein.toLowerCase().includes("chicken") ? "#C45C32" : protein.toLowerCase().includes("mushroom") ? "#8A6A4A" : protein.toLowerCase().includes("chickpea") || protein.toLowerCase().includes("kidney") ? "#C9842A" : "#E8C36A";

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#101411] px-5 pb-6 pt-8 text-[#FFF8F2]">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F15C00]">{style.name}</p>
      <p className="display mx-auto mt-2 max-w-xs text-center text-2xl leading-tight">{name}</p>
      <div className="relative mx-auto mt-6 h-48 w-56">
        <span className="absolute inset-x-6 bottom-2 h-6 rounded-[50%] bg-black/50 blur-md" />
        <svg viewBox="0 0 220 180" className="relative h-full w-full" aria-hidden="true">
          <ellipse cx="110" cy="148" rx="78" ry="14" fill="#1A4A16" />
          <path d="M42 88 C48 148, 172 148, 178 88 L168 78 Q110 92 52 78 Z" fill="#2A231C" />
          <path d="M50 80 C56 132, 164 132, 170 80 Q110 96 50 80 Z" fill="#3A2F26" />
          <g className="bowl-layer" style={{ animationDelay: "0.15s" }}>
            <ellipse cx="110" cy={118 - style.base * 18} rx={58 + style.base * 10} ry={10 + style.base * 8} fill="#E6D2A3" />
          </g>
          <g className="bowl-layer" style={{ animationDelay: "0.45s" }}>
            {Array.from({ length: styleId === "protein" ? 7 : 5 }).map((_, index) => (
              <circle
                key={index}
                cx={78 + index * 12}
                cy={96 - style.protein * 22 + (index % 2) * 6}
                r={styleId === "protein" ? 8 : 6}
                fill={fill}
              />
            ))}
          </g>
          <g className="bowl-layer" style={{ animationDelay: "0.75s" }}>
            <ellipse cx="88" cy={84 + (1 - style.veg) * 10} rx={style.veg * 28 + 10} ry="6" fill="#7CB342" />
            <ellipse cx="128" cy={80 + (1 - style.veg) * 8} rx={style.veg * 22 + 8} ry="5" fill="#9CCC65" />
          </g>
          <ellipse cx="110" cy="74" rx="72" ry="16" fill="none" stroke="#C4B49A" strokeWidth="6" />
        </svg>
      </div>
      <ul className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] uppercase tracking-[0.12em] text-white/70">
        <li>Protein {Math.round(style.protein * 100)}%</li>
        <li>Base {Math.round(style.base * 100)}%</li>
        <li>Veg {Math.round(style.veg * 100)}%</li>
      </ul>
      <p className="mt-3 text-center text-xs leading-5 text-white/65">{style.copy}</p>
    </div>
  );
}
