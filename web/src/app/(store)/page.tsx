import Link from "next/link";
import { MealCard } from "@/components/meal-card";
import { listMeals } from "@/server/catalog";
import { publishedPlans } from "@/server/published-plans";
import { db } from "@/lib/db";
import type { CSSProperties } from "react";

const bits = [
  { src: "/scene/basil.webp", alt: "", className: "left-0 top-[6%] w-16 sm:w-28", delay: "620ms", x: "-16px", y: "-18px" },
  { src: "/scene/tomato.webp", alt: "", className: "right-0 top-[2%] w-20 sm:w-32", delay: "760ms", x: "18px", y: "-14px" },
  { src: "/scene/lemon.webp", alt: "", className: "-bottom-2 -left-2 hidden w-20 sm:block", delay: "900ms", x: "-14px", y: "16px" },
  { src: "/scene/lettuce.webp", alt: "", className: "bottom-[4%] right-0 hidden w-28 sm:block", delay: "1040ms", x: "16px", y: "18px" },
] as const;

export default async function HomePage() {
  const [meals, plans, goals] = await Promise.all([
    listMeals().catch(() => []),
    db().planTemplate.findMany({ where: { active: true }, orderBy: { fixedDeliveryCount: "asc" } }).catch(() => []),
    db().goal.findMany({ where: { active: true } }).catch(() => []),
  ]).catch(() => [[], [], []] as [Awaited<ReturnType<typeof listMeals>>, never[], never[]]);
  const popular = meals.filter((meal) => meal.isPopular).slice(0, 3);
  const spotlight = popular.length > 0 ? popular : meals.slice(0, 3);
  const menuBowl = meals.find((meal) => meal.mealType === "breakfast") || meals[0];
  const planBowl = meals.find((meal) => meal.mealType === "lunch") || meals[1];
  const listed = plans.length > 0 ? plans : publishedPlans();
  const featured = listed.find((plan) => plan.slug === "weekday-breakfast") || listed.find((plan) => plan.mealType === "breakfast" && plan.cadence === "weekly") || listed[0];
  const days = featured ? Math.min(featured.fixedDeliveryCount, 7) : 0;

  return (
    <div className="space-y-20 sm:space-y-28">
      <link rel="preload" as="image" href="/scene/bowl.webp" type="image/webp" />
      <section className="relative grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
        <div className="hero-light pointer-events-none absolute -left-10 top-0 -z-10 h-72 w-72 rounded-full bg-[#EAF6DC]/80 blur-3xl" />
        <div className="hero-light pointer-events-none absolute right-0 top-10 -z-10 hidden h-80 w-80 rounded-full bg-[#F15C00]/10 blur-3xl lg:block" style={{ animationDelay: "120ms" }} />
        <div className="min-w-0 max-w-[calc(100vw-2.5rem)] lg:max-w-none">
          <p className="hero-line text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]" style={{ "--d": "160ms" } as CSSProperties}>AuraBowls</p>
          <h1 className="display mt-3 max-w-xl text-[2.6rem] leading-[1.02] text-[#1A4A16] sm:text-6xl lg:text-7xl">
            <span className="hero-line block" style={{ "--d": "280ms" } as CSSProperties}>Fresh Food.</span>
            <span className="hero-line block" style={{ "--d": "400ms" } as CSSProperties}>Full of Life.</span>
          </h1>
          <p className="hero-line mt-5 max-w-[18rem] text-[15px] leading-7 text-[#6A5A4E] sm:max-w-md sm:text-base" style={{ "--d": "520ms" } as CSSProperties}>
            Colorful, balanced bowls made fresh for your everyday. Pick your favorites, customize your plan, and enjoy delicious convenience.
          </p>
          <div className="hero-line mt-7 flex max-w-[18rem] flex-col gap-3 sm:max-w-none sm:flex-row" style={{ "--d": "680ms" } as CSSProperties}>
            <Link href="/menu" className="btn btn-accent">Explore Bowls</Link>
            <Link href="/plans" className="btn btn-forest">Build Your Plan</Link>
          </div>
        </div>
        <div className="hero-bowl relative mx-auto w-full max-w-[38rem]" style={{ "--d": "360ms" } as CSSProperties}>
          <div className="pointer-events-none absolute bottom-[6%] left-1/2 -z-10 h-10 w-[68%] -translate-x-[42%] rounded-[100%] bg-[#1A4A16]/20 blur-md" />
          {bits.map((bit) => (
            <img
              key={bit.src}
              src={bit.src}
              alt={bit.alt}
              className={`float-bit pointer-events-none absolute z-20 ${bit.className}`}
              style={{ "--d": bit.delay, "--x": bit.x, "--y": bit.y } as CSSProperties}
            />
          ))}
          <img src="/scene/bowl.webp" alt="A grain bowl with tomatoes, avocado, and herbs" width={800} height={620} fetchPriority="high" className="bowl-rest relative z-10 mx-auto w-[86%] drop-shadow-[0_22px_24px_rgba(26,74,22,0.16)]" />
          <p className="glass hero-line absolute left-1 top-[34%] z-20 rounded-full px-3 py-2 text-xs font-semibold text-[#1A4A16] sm:left-2 sm:px-4" style={{ "--d": "980ms" } as CSSProperties}>
            Made fresh · breakfast and lunch
          </p>
        </div>
      </section>

      <section className="story">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Explore</p>
          <h2 className="display mt-2 text-3xl text-[#1A4A16] sm:text-5xl">Two ways in.</h2>
        </div>
        <div className="mt-8 flex items-end justify-center gap-6 sm:gap-16">
          {([
            ["/menu", "Menu", menuBowl],
            ["/plans", "Meal Plans", planBowl],
          ] as const).map(([href, name, meal]) => (
            <Link key={href} href={href} className="nav-bowl group relative block w-40 sm:w-64">
              <span className="block aspect-square overflow-hidden rounded-full border border-white/80 bg-[#F6F2EC] shadow-[0_18px_36px_rgba(26,74,22,0.12)]">
                {meal?.imageUrl ? <img src={meal.imageUrl} alt="" className="h-full w-full object-cover transition duration-200 group-hover:scale-105 motion-reduce:transition-none" /> : null}
              </span>
              <span className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full bg-white/88 px-3 py-2 text-center text-sm font-bold text-[#1A4A16] shadow-[inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-md md:opacity-0 md:transition md:duration-200 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 motion-reduce:transition-none">
                {name}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="story">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-3xl text-[#1A4A16] sm:text-4xl">{popular.length > 0 ? "Popular bowls" : "From the menu"}</h2>
          <Link href="/menu" className="text-sm font-semibold text-[#1A4A16]">Full menu</Link>
        </div>
        {spotlight.length === 0 ? <p className="mt-4 text-[#6A5A4E]">The menu has not been published yet.</p> : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spotlight.map((meal, index) => (
              <div key={meal.id} className="story" style={{ animationDelay: `${index * 90}ms` }}>
                <MealCard meal={meal} />
              </div>
            ))}
          </div>
        )}
      </section>

      {goals.length > 0 ? (
        <section className="story">
          <h2 className="display text-3xl text-[#1A4A16] sm:text-4xl">Shop by goal</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {goals.map((goal) => (
              <Link key={goal.id} href={`/menu?goal=${goal.slug}`} className="rounded-[20px] border border-[#EAF6DC] bg-[#EAF6DC]/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
                <h3 className="text-xl text-[#1A4A16]">{goal.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6A5A4E]">{goal.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="story grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1A4A16]">Meal plans</p>
          <h2 className="display mt-2 max-w-lg text-3xl text-[#1A4A16] sm:text-5xl">A week of bowls, chosen one day at a time.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#6A5A4E]">Pick a length, then walk the days. Swaps and extras are priced again on the server. Nothing renews or charges on its own.</p>
          {featured ? (
            <div className="mt-6">
              <Link href={`/plans/${featured.slug}`} className="text-sm font-semibold text-[#1A4A16]">{featured.name}</Link>
              <ol className="mt-3 flex gap-2" aria-label={`${featured.fixedDeliveryCount} deliveries`}>
                {Array.from({ length: days }, (_, index) => (
                  <li key={index} className="grid h-14 w-12 place-items-center rounded-2xl border border-[#EAE4DD] bg-white text-sm font-semibold text-[#1A4A16] shadow-[0_8px_16px_rgba(34,37,31,0.04)]">
                    <span className="sr-only">Delivery {index + 1}</span>
                    {index + 1}
                  </li>
                ))}
              </ol>
              {featured.fixedDeliveryCount > days ? <p className="mt-2 text-xs text-[#6A5A4E]">Showing the first {days} of {featured.fixedDeliveryCount} deliveries.</p> : null}
            </div>
          ) : null}
          <Link href="/plans" className="btn btn-forest mt-6">See the plans</Link>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="pointer-events-none absolute bottom-[8%] left-1/2 h-8 w-2/3 -translate-x-1/2 rounded-[100%] bg-[#1A4A16]/15 blur-md" />
          {planBowl?.imageUrl ? (
            <img src={planBowl.imageUrl} alt="" className="aspect-square w-full rounded-full object-cover shadow-[0_24px_40px_rgba(26,74,22,0.14)]" />
          ) : (
            <img src="/scene/bowl.webp" alt="" className="w-full" />
          )}
        </div>
      </section>

      <section className="story">
        <h2 className="display text-3xl text-[#1A4A16] sm:text-4xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Choose", "Start with a bowl or a plan. You can browse before sharing a phone number."],
            ["02", "Customize", "Set the start date, swap a day, and add extras. The price updates on the server."],
            ["03", "Receive", "We check the PIN, hold portions, and wait for payment before the kitchen accepts the order."],
          ].map(([step, title, copy]) => (
            <li key={step} className="glass rounded-[20px] p-5">
              <p className="text-sm font-semibold text-[#1A4A16]">{step}</p>
              <h3 className="mt-2 text-xl text-[#1A4A16]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6A5A4E]">{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="story relative overflow-hidden rounded-[28px] bg-[#1A4A16] px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full bg-[#F15C00]/25 blur-3xl" />
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="relative">
            <h2 className="display max-w-lg text-3xl sm:text-5xl">Order the bowl in front of you.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#d5e4d8]">Look through the menu first. Delivery eligibility is checked when you start an order, and the total is calculated again before payment.</p>
            <Link href="/menu" className="btn btn-accent mt-6">Explore Bowls</Link>
          </div>
          <img src="/scene/bowl.webp" alt="" className="relative mx-auto w-56 sm:w-64" />
        </div>
      </section>
    </div>
  );
}
