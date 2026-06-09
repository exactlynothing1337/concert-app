import { Suspense } from "react";
import TicketsContent from "./TicketsContent";

export default function TicketsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text-muted)" }}>Loading...</div>}>
      <TicketsContent />
    </Suspense>
  );
}
