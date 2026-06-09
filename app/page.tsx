"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ShowCard from "@/components/ShowCard";
import { useConcertStore } from "@/store";
import { api } from "@/lib/api";

export default function HomePage() {
  const {
    loaded, filters, setFilter, clearFilters, hasActiveFilters,
    getFilteredShows, getUniqueLocations, getUniqueArtists, setConcerts,
  } = useConcertStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;
    setLoading(true);
    api.getConcerts()
      .then((data) => setConcerts(data.concerts))
      .catch(() => setError("Could not load concerts. Check your connection."))
      .finally(() => setLoading(false));
  }, [loaded, setConcerts]);

  const filteredShows = getFilteredShows();
  const locations = getUniqueLocations();
  const artists = getUniqueArtists();
  const active = hasActiveFilters();

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 80px" }}>
        <section style={{ padding: "64px 0 40px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-purple)", textTransform: "uppercase" as const, letterSpacing: "2px", marginBottom: 16 }}>
            Discover
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1px", color: "var(--text-primary)", maxWidth: 700 }}>
            Checkout these amazing{" "}
            <span className="gradient-text">concerts in Graz.</span>
          </h1>
        </section>

        <section className="card" style={{ padding: "20px 24px", marginBottom: 40, display: "flex", flexWrap: "wrap" as const, gap: 16, alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px", minWidth: 160 }}>
            <label className="form-label" htmlFor="filter-location">📍 Location</label>
            <select id="filter-location" className="input-field" value={filters.location} onChange={(e) => setFilter("location", e.target.value)}>
              <option value="">All locations</option>
              {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 160 }}>
            <label className="form-label" htmlFor="filter-artist">🎤 Artist</label>
            <select id="filter-artist" className="input-field" value={filters.artist} onChange={(e) => setFilter("artist", e.target.value)}>
              <option value="">All Artists</option>
              {artists.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 160 }}>
            <label className="form-label" htmlFor="filter-date">📆 Date</label>
            <input id="filter-date" type="date" className="input-field" value={filters.date} onChange={(e) => setFilter("date", e.target.value)} style={{ colorScheme: "dark" }} />
          </div>
          {active && (
            <div style={{ flex: "0 0 auto" }}>
              <button className="btn-secondary" onClick={clearFilters} style={{ height: 42, marginTop: 19 }}>✕ Clear</button>
            </div>
          )}
        </section>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />
            ))}
          </div>
        )}

        {error && <div className="alert alert-error" style={{ maxWidth: 500 }}>⚠️ {error}</div>}

        {!loading && !error && filteredShows.length === 0 && loaded && (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
            <p style={{ fontSize: 16 }}>No shows are matching the current filter criteria.</p>
            {active && <button className="btn-secondary" onClick={clearFilters} style={{ marginTop: 20 }}>Clear filters</button>}
          </div>
        )}

        {!loading && filteredShows.length > 0 && (
          <>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
              {filteredShows.length} show{filteredShows.length !== 1 ? "s" : ""} available
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {filteredShows.map(({ concert, show }) => (
                <ShowCard key={`${concert.id}-${show.id}`} concert={concert} show={show} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
