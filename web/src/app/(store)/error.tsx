"use client";

import { Stage } from "@/components/stage";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Stage eyebrow="AuraBowls" title="This page could not be loaded" copy="Refresh and try again. If the menu is empty, the database may still need to be set up.">
      <button className="btn btn-accent" type="button" onClick={reset}>Try again</button>
    </Stage>
  );
}
