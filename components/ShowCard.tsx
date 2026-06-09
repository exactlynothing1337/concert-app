"use client";

import { useRouter } from "next/navigation";
import type { Concert } from "@/types";
import { useBookingStore } from "@/store";

interface ShowCardProps {
  concert: Concert;
  show: Concert["shows"][0];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

export default function ShowCard({ concert, show }: ShowCardProps) {
  const router = useRouter();
  const { setConcertShow, resetBooking } = useBookingStore();

  const handleClick = () => {
    resetBooking();
    setConcertShow(concert.id, show.id);
    router.push(`/booking?concertId=${concert.id}&showId=${show.id}`);
  };

  return (
    <div
      className="card card-clickable fade-in"
      onClick={handleClick}
      style={{ padding: 24, position: "relative", overflow: "hidden" }}
    >
      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Date */}
      <div style={{ marginBottom: 16 }}>
        <span className="badge badge-purple">
          📅 {formatDate(show.start)}
        </span>
      </div>

      {/* Artist */}
      <h3
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 8,
          letterSpacing: "-0.3px",
        }}
      >
        {concert.artist}
      </h3>

      {/* Location */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        <span>📍</span>
        <span>{concert.location.name}</span>
      </div>

      <hr className="divider" style={{ margin: "0 0 16px 0" }} />

      {/* Time */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span className="badge badge-cyan">
          🕐 {formatTime(show.start)}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>→</span>
        <span className="badge badge-pink">
          🕑 {formatTime(show.end)}
        </span>
      </div>

      {/* CTA arrow */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--accent-gradient)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        →
      </div>
    </div>
  );
}
