import type { CSSProperties, ReactNode } from "react";

export function Stage({
  eyebrow,
  title,
  copy,
  children,
  className = "mb-8",
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`relative grid grid-cols-[minmax(0,1fr)_6.25rem] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_13rem] sm:gap-8 ${className}`}>
      <div className="hero-light pointer-events-none absolute -left-6 -top-10 -z-10 h-44 w-44 rounded-full bg-[#EAF6DC] blur-3xl" />
      <div className="min-w-0">
        {eyebrow ? <p className="hero-line text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]" style={{ "--d": "80ms" } as CSSProperties}>{eyebrow}</p> : null}
        <h1 className="display hero-line mt-2 text-[2rem] leading-[1.05] text-[#1A4A16] sm:text-5xl" style={{ "--d": "180ms" } as CSSProperties}>{title}</h1>
        {copy ? <p className="hero-line mt-3 max-w-2xl text-sm leading-7 text-[#6A5A4E] sm:text-base" style={{ "--d": "300ms" } as CSSProperties}>{copy}</p> : null}
        {children ? <div className="hero-line mt-5" style={{ "--d": "420ms" } as CSSProperties}>{children}</div> : null}
      </div>
      <div className="hero-bowl relative" style={{ "--d": "260ms" } as CSSProperties} aria-hidden="true">
        <img src="/scene/basil.webp" alt="" className="float-bit absolute -left-3 -top-2 hidden w-12 sm:block" style={{ "--d": "520ms", "--x": "-8px", "--y": "-10px" } as CSSProperties} />
        <img src="/scene/tomato.webp" alt="" className="float-bit absolute -right-2 -top-3 hidden w-14 sm:block" style={{ "--d": "640ms", "--x": "10px", "--y": "-8px" } as CSSProperties} />
        <img src="/scene/bowl.webp" alt="" width={800} height={620} className="bowl-rest relative w-full drop-shadow-[0_14px_16px_rgba(26,74,22,0.14)]" />
      </div>
    </header>
  );
}
