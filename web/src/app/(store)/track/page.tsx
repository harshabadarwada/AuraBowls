import type { Metadata } from "next";
import { PhoneTrack } from "@/components/phone-track";

export const metadata: Metadata = { title: "Track order", robots: { index: false, follow: false } };

export default function TrackLookupPage() {
  return <PhoneTrack />;
}
