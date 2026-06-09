"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useTicketsStore } from "@/store";
import { api } from "@/lib/api";
import type { Ticket } from "@/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function TicketCard({ ticket, onCancel }: { ticket: Ticket; onCancel: (id: number) => void }) {
  return (
    <div className="ticket-card fade-in" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{ticket.show.concert.artist}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>📍 {ticket.show.concert.location.name}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 6 }}>
          <span className="badge badge-green">✓ Confirmed</span>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--accent-purple)", fontWeight: 700, letterSpacing: "1px" }}>{ticket.code}</span>
        </div>
      </div>
      <hr className="divider" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
        {[
          { label: "Row", value: ticket.row.name },
          { label: "Seat", value: String(ticket.seat) },
          { label: "Starts", value: formatTime(ticket.show.start) },
          { label: "Ends", value: formatTime(ticket.show.end) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-danger" onClick={() => onCancel(ticket.id)}>Cancel Ticket</button>
      </div>
    </div>
  );
}

function RetrieveForm({ onSuccess }: { onSuccess: (tickets: Ticket[]) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({ code: false, name: false });
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const e = { code: !code, name: !name };
    if (e.code || e.name) { setErrors(e); return; }
    setNotFound(false);
    setLoading(true);
    try {
      const data = await api.getTickets(code, name);
      onSuccess(data.tickets);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 36, maxWidth: 480 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🎫</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Retrieve your tickets.</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>Enter your name and one of your ticket codes</p>
      {notFound && <div className="alert alert-error" style={{ marginBottom: 20 }}>Could not find tickets with these details.</div>}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <div>
          <label className="form-label" htmlFor="ticket-name">Full Name</label>
          <input id="ticket-name" className={`input-field${errors.name ? " error" : ""}`} placeholder="John Doe" value={name}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: false })); }} />
        </div>
        <div>
          <label className="form-label" htmlFor="ticket-code">Ticket Code</label>
          <input id="ticket-code" className={`input-field${errors.code ? " error" : ""}`} placeholder="QVLJTWK4Y7" value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); if (errors.code) setErrors((p) => ({ ...p, code: false })); }}
            style={{ fontFamily: "monospace", letterSpacing: "1px" }} />
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Searching..." : "Find Tickets →"}
        </button>
      </div>
    </div>
  );
}

export default function TicketsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isBooked = params.get("view") === "booked";
  const { tickets, setTickets, removeTicket } = useTicketsStore();
  const [showRetrieve, setShowRetrieve] = useState(!isBooked && tickets.length === 0);

  const handleCancel = async (id: number) => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;
    if (!confirm(`Are you sure you want to cancel ticket ${ticket.code}?`)) return;
    try {
      await api.cancelTicket(id, ticket.code, ticket.name);
      removeTicket(id);
      if (tickets.length <= 1) router.push("/");
    } catch {
      alert("Failed to cancel ticket. Please try again.");
    }
  };

  if (showRetrieve) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: "64px 24px" }}>
          <RetrieveForm onSuccess={(t) => { setTickets(t); setShowRetrieve(false); }} />
        </main>
      </>
    );
  }

  const firstTicket = tickets[0];

  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <section style={{ padding: "56px 0 36px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 12 }}>
            Your Tickets are <span className="gradient-text">ready!</span>
          </h1>
          {firstTicket && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>👤 {firstTicket.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Booked On</span>
                <span className="badge badge-cyan">{formatDate(firstTicket.created_at)}</span>
              </div>
            </div>
          )}
        </section>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onCancel={handleCancel} />
          ))}
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <button className="btn-secondary" onClick={() => router.push("/")}>← Back to concerts</button>
          <button className="btn-secondary" onClick={() => setShowRetrieve(true)}>Retrieve other tickets</button>
        </div>
      </main>
    </>
  );
}
