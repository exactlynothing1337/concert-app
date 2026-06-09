import { Suspense } from "react";
import BookingContent from "./BookingContent";

export default function BookingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text-muted)" }}>Loading...</div>}>
      <BookingContent />
    </Suspense>
  );
}
