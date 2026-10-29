export function DishArt({ meal, className = "", eager = false }: { meal: { imageUrl: string }; className?: string; eager?: boolean }) {
  return (
    <span className={`relative block overflow-hidden bg-[#EAF6DC] ${className}`}>
      {meal.imageUrl ? (
        <img
          src={meal.imageUrl}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 !h-full w-full !max-w-none object-cover object-center transition duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
        />
      ) : null}
    </span>
  );
}
