import { create } from "zustand";
import type { Concert, Ticket, SelectedSeat, SeatingRow } from "@/types";

interface ConcertFilters {
  location: string;
  artist: string;
  date: string;
}

interface ConcertStore {
  concerts: Concert[];
  loaded: boolean;
  filters: ConcertFilters;
  setConcerts: (concerts: Concert[]) => void;
  setFilter: (key: keyof ConcertFilters, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
  getFilteredShows: () => { concert: Concert; show: Concert["shows"][0] }[];
  getUniqueLocations: () => string[];
  getUniqueArtists: () => string[];
}

export const useConcertStore = create<ConcertStore>((set, get) => ({
  concerts: [],
  loaded: false,
  filters: { location: "", artist: "", date: "" },

  setConcerts: (concerts) => set({ concerts, loaded: true }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  clearFilters: () => set({ filters: { location: "", artist: "", date: "" } }),

  hasActiveFilters: () => {
    const { location, artist, date } = get().filters;
    return !!(location || artist || date);
  },

  getFilteredShows: () => {
    const { concerts, filters } = get();
    const result: { concert: Concert; show: Concert["shows"][0] }[] = [];
    for (const concert of concerts) {
      if (filters.artist && concert.artist !== filters.artist) continue;
      if (filters.location && concert.location.name !== filters.location) continue;
      for (const show of concert.shows) {
        if (filters.date) {
          const showDate = new Date(show.start).toISOString().split("T")[0];
          if (showDate !== filters.date) continue;
        }
        result.push({ concert, show });
      }
    }
    return result;
  },

  getUniqueLocations: () => {
    const concerts = get().concerts;
    return [...new Set(concerts.map((c) => c.location.name))].sort();
  },

  getUniqueArtists: () => {
    const concerts = get().concerts;
    const artistsWithShows = concerts
      .filter((c) => c.shows.length > 0)
      .map((c) => c.artist);
    return [...new Set(artistsWithShows)].sort();
  },
}));

// Booking store
interface BookingStore {
  concertId: number | null;
  showId: number | null;
  rows: SeatingRow[];
  selectedSeats: SelectedSeat[];
  reservationToken: string | null;
  reservedUntil: string | null;
  setConcertShow: (concertId: number, showId: number) => void;
  setRows: (rows: SeatingRow[]) => void;
  setSelectedSeats: (seats: SelectedSeat[]) => void;
  setReservation: (token: string, until: string) => void;
  clearReservation: () => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  concertId: null,
  showId: null,
  rows: [],
  selectedSeats: [],
  reservationToken: null,
  reservedUntil: null,

  setConcertShow: (concertId, showId) => set({ concertId, showId }),
  setRows: (rows) => set({ rows }),
  setSelectedSeats: (selectedSeats) => set({ selectedSeats }),
  setReservation: (reservationToken, reservedUntil) =>
    set({ reservationToken, reservedUntil }),
  clearReservation: () =>
    set({ selectedSeats: [], reservationToken: null, reservedUntil: null }),
  resetBooking: () =>
    set({
      rows: [],
      selectedSeats: [],
      reservationToken: null,
      reservedUntil: null,
    }),
}));

// Tickets store
interface TicketsStore {
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  removeTicket: (id: number) => void;
  clearTickets: () => void;
}

export const useTicketsStore = create<TicketsStore>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets }),
  removeTicket: (id) =>
    set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) })),
  clearTickets: () => set({ tickets: [] }),
}));
