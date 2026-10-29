import Link from "next/link";
import { HomeStory } from "@/components/home-story";
import { listMeals, grams, type PublicMeal } from "@/server/catalog";
import { publishedPlans } from "@/server/published-plans";
import { db } from "@/lib/db";
import { dietLabel, formatInr } from "@/lib/format";

const showcaseOrder = [
  "paneer-power-bowl",
  "fiery-peri-chicken-bowl",
  "tofu-power-bowl",
  "tandoori-chicken-biryani-bowl",
  "mango-coconut-overnight-oats",
  "egg-avocado-breakfast-salad",
];

const goalLooks: Record<string, { image: string; copy: string }> = {
  "high-protein": { image: "/backdrop/mediterranean-chicken-bowl.jpg", copy: "Protein-forward bowls. Protein figures appear only where the kitchen has recorded them." },
  balanced: { image: "/backdrop/sweet-potato-power-bowl.jpg", copy: "Everyday bowls with grains, greens and a protein." },
  everyday: { image: "/backdrop/mango-coconut-overnight-oats.jpg", copy: "Meals you can put on a scheduled delivery." },
};
const goalFallbacks = ["/backdrop/tofu-power-bowl.jpg", "/backdrop/smoky-bbq-chicken-bowl.jpg", "/backdrop/mediterranean-breakfast-salad.jpg"];

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const steps = [
  { title: "Choose", copy: "Pick single bowls from the menu, or a plan for the week. You can browse before sharing any details.", icon: "M4 7h16M4 12h10M4 17h7" },
  { title: "Customise", copy: "Set the start date and pick each day's bowl yourself, or take our recommendation.", icon: "M12 4v16M4 12h16" },
  { title: "Send on WhatsApp", copy: "We check your PIN, confirm the delivery charge for your location, and schedule the kitchen.", icon: "M5 12l4 4L19 6" },
];

function hasPhoto(meal: PublicMeal) {
  return meal.imageUrl.startsWith("/bowls/");
}

function pickShowcase(meals: PublicMeal[]) {
  const bySlug = new Map(meals.map((meal) => [meal.slug, meal]));
  const chosen = showcaseOrder.map((slug) => bySlug.get(slug)).filter((meal): meal is PublicMeal => Boolean(meal && hasPhoto(meal)));
  const extras = [...meals.filter((meal) => meal.isPopular && hasPhoto(meal)), ...meals.filter(hasPhoto)];
  for (const meal of extras) {
    if (chosen.length >= 6) break;
    if (!chosen.includes(meal)) chosen.push(meal);
  }
  return chosen.length > 0 ? chosen : meals.slice(0, 6);
}

export default async function HomePage() {
  const [meals, plans, goals] = await Promise.all([
    listMeals().catch(() => []),
    db().planTemplate.findMany({ where: { active: true }, orderBy: { fixedDeliveryCount: "asc" } }).catch(() => []),
    db().goal.findMany({ where: { active: true } }).catch(() => []),
  ]).catch(() => [[], [], []] as [Awaited<ReturnType<typeof listMeals>>, never[], never[]]);
  const showcase = pickShowcase(meals);
  const listed = plans.length > 0 ? plans : publishedPlans();
  const featured = listed.find((plan) => plan.slug === "weekday-breakfast") || listed.find((plan) => plan.mealType === "breakfast" && plan.cadence === "weekly") || listed[0];
  const weekBowls = meals.filter((meal) => meal.mealType === "breakfast" && hasPhoto(meal)).slice(0, 5);

  return (
    <div className="space-y-20 sm:space-y-28">
      <HomeStory />

      <section className="story">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F15C00]">From the kitchen</p>
            <h2 className="display mt-2 text-4xl leading-[1.02] text-[#1A4A16] sm:text-5xl">Signature bowls</h2>
          </div>
          <Link href="/menu" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#1A4A16]">
            See the full menu
            <Arrow className="transition duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
          </Link>
        </div>
        {showcase.length === 0 ? (
          <p className="mt-4 text-[#6A5A4E]">The menu has not been published yet.</p>
        ) : (
          <ul className="-mx-5 mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {showcase.map((meal) => (
              <li key={meal.id} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-auto sm:max-w-none">
                <ShowcaseCard meal={meal} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {goals.length > 0 ? (
        <section className="story">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F15C00]">Shop by goal</p>
          <h2 className="display mt-2 max-w-xl text-4xl leading-[1.02] text-[#1A4A16] sm:text-5xl">Start with what you want from a meal.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {goals.map((goal, index) => {
              const look = goalLooks[goal.slug];
              return (
                <Link
                  key={goal.id}
                  href={`/menu?goal=${goal.slug}`}
                  className="group relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-[28px] bg-[#10291D] p-6 text-white shadow-[0_24px_48px_rgba(16,41,29,0.18)] sm:min-h-[19rem]"
                >
                  <img
                    src={look?.image || goalFallbacks[index % goalFallbacks.length]}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 !h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,20,17,0)_20%,rgba(16,20,17,0.88)_100%)]" />
                  <span className="relative flex items-end justify-between gap-4">
                    <span>
                      <span className="display block text-3xl leading-tight">{goal.name}</span>
                      <span className="mt-2 block max-w-xs text-sm leading-6 text-white/80">{look?.copy || goal.description}</span>
                    </span>
                    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#1A4A16] transition duration-300 group-hover:bg-[#F15C00] group-hover:text-white motion-reduce:transition-none">
                      <Arrow />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="story relative overflow-hidden rounded-[32px] bg-[#10291D] px-6 py-10 text-white sm:px-10 sm:py-14">
        <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(241,92,0,0.28),rgba(241,92,0,0))]" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(234,246,220,0.10),rgba(234,246,220,0))]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F15C00]">Meal plans</p>
            <h2 className="display mt-2 max-w-lg text-4xl leading-[1.02] sm:text-5xl">A week of bowls, chosen one day at a time.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
              Pick a length, then choose each day&apos;s bowl or take our recommendation. Nothing renews or charges on its own.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/plans" className="btn btn-accent">See the plans</Link>
              {featured ? (
                <Link href={`/plans/${featured.slug}`} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10 motion-reduce:transition-none">
                  {featured.name}
                </Link>
              ) : null}
            </div>
          </div>
          <ol className="grid grid-cols-5 gap-2 sm:gap-3" aria-label="Example week of breakfast bowls">
            {weekdays.map((day, index) => {
              const meal = weekBowls[index];
              return (
                <li key={day} className={`flex flex-col items-center gap-3 rounded-[22px] bg-white/[0.06] px-1.5 pb-4 pt-3 ring-1 ring-white/10 sm:px-2 ${index % 2 === 1 ? "lg:translate-y-6" : ""}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{day}</span>
                  {meal ? (
                    <img src={meal.imageUrl} alt={meal.name} loading="lazy" className="aspect-square w-full rounded-full object-cover ring-2 ring-white/15" />
                  ) : (
                    <span className="aspect-square w-full rounded-full bg-white/10" />
                  )}
                  <span className="hidden min-h-8 text-center text-[11px] leading-4 text-white/75 sm:line-clamp-2">{meal?.name || "Your pick"}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="story">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F15C00]">How it works</p>
        <h2 className="display mt-2 text-4xl leading-[1.02] text-[#1A4A16] sm:text-5xl">Three steps to your bowl.</h2>
        <ol className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          <span aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-[linear-gradient(90deg,#F15C00,#1A4A16)] opacity-30 md:block" />
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#10291D] text-white shadow-[0_14px_30px_rgba(16,41,29,0.25)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={step.icon} />
                </svg>
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#F15C00] text-[11px] font-semibold">{index + 1}</span>
              </span>
              <span>
                <span className="display block text-2xl text-[#1A4A16]">{step.title}</span>
                <span className="mt-2 block max-w-xs text-sm leading-6 text-[#6A5A4E]">{step.copy}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="story relative overflow-hidden rounded-[32px] bg-[#101411] px-6 pb-0 pt-12 text-white sm:px-10 sm:pt-16">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(60%_70%_at_50%_100%,rgba(241,92,0,0.22),rgba(241,92,0,0))]" />
        <span aria-hidden="true" className="film-grain pointer-events-none absolute inset-0 opacity-[0.05]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F15C00]">Ready when you are</p>
          <h2 className="display mt-3 text-4xl leading-[1.02] sm:text-6xl">Order the bowl in front of you.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/75">
            Add bowls from the menu and send the order on WhatsApp. Delivery charges vary by location and the kitchen confirms them.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className="btn btn-accent">Explore the Menu</Link>
            <Link href="/plans" className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10 motion-reduce:transition-none">
              Explore Meal Plans
            </Link>
          </div>
        </div>
        <div aria-hidden="true" className="relative mx-auto mt-10 flex max-w-3xl items-end justify-center gap-2 sm:gap-6">
          <img src="/cutouts/paneer-power-bowl.webp" alt="" loading="lazy" className="w-[46%] max-w-[300px] translate-y-[18%] -rotate-6 drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)]" />
          <img src="/cutouts/fiery-peri-chicken-bowl.webp" alt="" loading="lazy" className="w-[46%] max-w-[300px] translate-y-[22%] rotate-6 drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)]" />
        </div>
      </section>
    </div>
  );
}

function ShowcaseCard({ meal }: { meal: PublicMeal }) {
  const nonVeg = meal.dietTags.includes("non_veg");
  const protein = meal.nutritionStatus !== "missing" ? grams(meal.proteinTenths) : null;
  return (
    <Link
      href={`/meals/${meal.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[28px] bg-[#10291D] text-white shadow-[0_22px_44px_rgba(16,41,29,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F15C00]"
    >
      <img src={meal.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 !h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none" />
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,20,17,0.05)_35%,rgba(16,20,17,0.9)_100%)]" />
      <span className="absolute left-4 top-4 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1A4A16]">{meal.mealType}</span>
        {meal.dietTags.slice(0, 1).map((tag) => (
          <span key={tag} className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1A4A16]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: nonVeg ? "#A0391E" : "#2E7D32" }} />
            {dietLabel(tag)}
          </span>
        ))}
      </span>
      <span className="absolute inset-x-0 bottom-0 p-5">
        <span className="display block text-2xl leading-tight">{meal.name}</span>
        <span className="mt-1 line-clamp-1 block text-sm text-white/75">{meal.ingredients || meal.description}</span>
        <span className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{formatInr(meal.pricePaise)}</span>
            {meal.compareAtPaise > meal.pricePaise ? <span className="text-sm text-white/60 line-through">{formatInr(meal.compareAtPaise)}</span> : null}
            {protein ? <span className="text-xs text-white/70">{meal.nutritionStatus === "estimated" ? "Est. " : ""}{protein} g protein</span> : null}
          </span>
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-[#F15C00] transition duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
            <Arrow />
          </span>
        </span>
      </span>
    </Link>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}
