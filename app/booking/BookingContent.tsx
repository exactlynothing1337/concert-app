"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useConcertStore, useBookingStore, useTicketsStore } from "@/store";
import { api } from "@/lib/api";
import type { SelectedSeat } from "@/types";
import { COUNTRIES } from "@/data/countries";

function useTimer(reservedUntil: string | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!reservedUntil) { setRemaining(null); return; }
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(reservedUntil).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0) { onExpire(); if (intervalRef.current) clearInterval(intervalRef.current); }
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [reservedUntil, onExpire]);

  if (remaining === null) return null;
  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}

type Step = "seats" | "form";
interface FormData { name: string; address: string; city: string; zip: string; country: string; }
interface FormErrors { name?: boolean; address?: boolean; city?: boolean; zip?: boolean; country?: boolean; }

export default function BookingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const concertId = Number(params.get("concertId"));
  const showId = Number(params.get("showId"));

  const { concerts } = useConcertStore();
  const { rows, selectedSeats, reservationToken, reservedUntil, setRows, setSelectedSeats, setReservation, clearReservation } = useBookingStore();
  const { setTickets } = useTicketsStore();

  const [step, setStep] = useState<Step>("seats");
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: "", address: "", city: "", zip: "", country: "" });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const concert = concerts.find((c) => c.id === concertId);

  useEffect(() => {
    if (!concertId || !showId || rows.length > 0) return;
    setLoadingSeats(true);
    api.getSeating(concertId, showId)
      .then((data) => setRows(data.rows))
      .catch(() => alert("Failed to load seating info"))
      .finally(() => setLoadingSeats(false));
  }, [concertId, showId, rows.length, setRows]);

  const handleExpire = useCallback(() => {
    alert("Your seat reservation expired. The reservation has been cancelled.");
    clearReservation();
  }, [clearReservation]);

  const timerDisplay = useTimer(reservedUntil, handleExpire);

  const handleSeatClick = async (rowId: number, rowName: string, seat: number, unavailable: boolean) => {
    if (unavailable) return;
    const isSelected = selectedSeats.some((s) => s.rowId === rowId && s.seat === seat);
    const newSeats: SelectedSeat[] = isSelected
      ? selectedSeats.filter((s) => !(s.rowId === rowId && s.seat === seat))
      : [...selectedSeats, { rowId, rowName, seat }];

    setSelectedSeats(newSeats);
    try {
      const res = await api.makeReservation(concertId, showId, {
        reservation_token: reservationToken || undefined,
        reservations: newSeats.map((s) => ({ row: s.rowId, seat: s.seat })),
        duration: 300,
      });
      setReservation(res.reservation_token, res.reserved_until);
    } catch {
      setSelectedSeats(selectedSeats);
    }
  };

  const handleBooking = async () => {
    const errors: FormErrors = {};
    if (!formData.name) errors.name = true;
    if (!formData.address) errors.address = true;
    if (!formData.city) errors.city = true;
    if (!formData.zip) errors.zip = true;
    if (!formData.country) errors.country = true;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    if (!reservationToken) return;

    setBookingLoading(true);
    try {
      const data = await api.bookTickets(concertId, showId, { reservation_token: reservationToken, ...formData });
      setTickets(data.tickets);
      router.push("/tickets?view=booked");
    } catch {
      alert("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const updateForm = (key: keyof FormData, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
    if (formErrors[key]) setFormErrors((p) => ({ ...p, [key]: undefined }));
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <section style={{ padding: "48px 0 32px" }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to concerts
          </button>
          {concert && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                {concert.artist}
              </h1>
              <span className="badge badge-purple">{concert.location.name}</span>
            </div>
          )}
          <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
            {step === "seats" ? "Select your seats" : "Complete your booking"}
          </p>
        </section>

        {/* Steps indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 36, alignItems: "center" }}>
          {(["seats", "form"] as Step[]).map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step === s ? "var(--accent-gradient)" : (i === 1 && step === "form") ? "var(--accent-gradient)" : "var(--bg-card)",
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, color: "white",
              }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: step === s ? "var(--text-primary)" : "var(--text-muted)", fontWeight: step === s ? 600 : 400 }}>
                {s === "seats" ? "Select Seats" : "Booking Info"}
              </span>
              {i === 0 && <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>→</span>}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
          {/* Left */}
          <div>
            {step === "seats" && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "var(--text-primary)" }}>🎟 Choose Your Seats</h2>
                <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" as const }}>
                  {[{ cls: "seat-available", label: "Available" }, { cls: "seat-selected", label: "Selected" }, { cls: "seat-unavailable", label: "Taken" }].map(({ cls, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div className={`seat ${cls}`} style={{ width: 20, height: 20, cursor: "default" }} />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ display: "inline-block", padding: "8px 48px", background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)", letterSpacing: "3px" }}>STAGE</div>
                </div>
                {loadingSeats && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 12 }} />)}
                {rows.map((row) => {
                  const unavailableSet = new Set(row.seats.unavailable);
                  const selectedSet = new Set(selectedSeats.filter((s) => s.rowId === row.id).map((s) => s.seat));
                  return (
                    <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", width: 64, textAlign: "right" as const, flexShrink: 0 }}>{row.name}</span>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" as const, flex: 1 }}>
                        {Array.from({ length: row.seats.total }, (_, i) => i + 1).map((seatNum) => {
                          const unavail = unavailableSet.has(seatNum);
                          const selected = selectedSet.has(seatNum);
                          return (
                            <div key={seatNum} className={`seat ${unavail ? "seat-unavailable" : selected ? "seat-selected" : "seat-available"}`} title={`${row.name}, Seat ${seatNum}`} onClick={() => handleSeatClick(row.id, row.name, seatNum, unavail)}>
                              {seatNum}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {step === "form" && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>📋 Your Details</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>This info will appear on your tickets</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { key: "name" as const, label: "Full Name", placeholder: "John Doe", span: true },
                    { key: "address" as const, label: "Address", placeholder: "Bahnhofstrasse 15", span: true },
                    { key: "city" as const, label: "City", placeholder: "Graz", span: false },
                    { key: "zip" as const, label: "ZIP Code", placeholder: "8010", span: false },
                  ].map(({ key, label, placeholder, span }) => (
                    <div key={key} style={span ? { gridColumn: "1 / -1" } : {}}>
                      <label className="form-label" htmlFor={`f-${key}`}>{label}</label>
                      <input id={`f-${key}`} className={`input-field${formErrors[key] ? " error" : ""}`} placeholder={placeholder} value={formData[key]} onChange={(e) => updateForm(key, e.target.value)} />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label" htmlFor="f-country">Country</label>
                    <select id="f-country" className={`input-field${formErrors.country ? " error" : ""}`} value={formData.country} onChange={(e) => updateForm("country", e.target.value)}>
                      <option value="">Select country...</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  <button className="btn-secondary" onClick={() => setStep("seats")}>← Back</button>
                  <button className="btn-primary" onClick={handleBooking} disabled={bookingLoading} style={{ flex: 1 }}>
                    {bookingLoading ? "Booking..." : "🎟 Book Tickets"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div>
            {timerDisplay && (
              <div className="card" style={{ padding: 20, marginBottom: 16, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>Reservation expires in</p>
                <div className="timer">{timerDisplay}</div>
              </div>
            )}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>Selected Seats</h3>
              {selectedSeats.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>No seats selected. Click on a seat to make a reservation.</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {selectedSeats.map((s) => (
                      <div key={`${s.rowId}-${s.seat}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10 }}>
                        <span style={{ fontSize: 13, color: "#a78bfa" }}>Row: {s.rowName}</span>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Seat: {s.seat}</span>
                      </div>
                    ))}
                  </div>
                  {step === "seats" && (
                    <button className="btn-primary" style={{ width: "100%" }} onClick={() => setStep("form")}>Continue →</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
