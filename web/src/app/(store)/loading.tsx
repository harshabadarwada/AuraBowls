export default function Loading() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-4" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-full bg-[#EAF6DC]" />
        <div className="h-12 w-56 max-w-full rounded-2xl bg-[#EAF6DC]" />
        <div className="h-4 w-full max-w-md rounded-full bg-[#F6F2EC]" />
      </div>
      <div className="aspect-square rounded-full bg-[#EAF6DC]" />
    </div>
  );
}
