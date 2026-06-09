import type {
  ConcertsResponse,
  SeatingResponse,
  ReservationRequest,
  ReservationResponse,
  BookingRequest,
  TicketsResponse,
} from "@/types";

const BASE_URL = "http://apic.polytech.edu.kz/api/v1";

export const api = {
  getConcerts: async (): Promise<ConcertsResponse> => {
    const res = await fetch(`${BASE_URL}/concerts`);
    if (!res.ok) throw new Error("Failed to fetch concerts");
    return res.json();
  },

  getSeating: async (concertId: number, showId: number): Promise<SeatingResponse> => {
    const res = await fetch(`${BASE_URL}/concerts/${concertId}/shows/${showId}/seating`);
    if (!res.ok) throw new Error("Failed to fetch seating");
    return res.json();
  },

  makeReservation: async (
    concertId: number,
    showId: number,
    body: ReservationRequest
  ): Promise<ReservationResponse> => {
    const res = await fetch(
      `${BASE_URL}/concerts/${concertId}/shows/${showId}/reservation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) throw new Error("Reservation failed");
    return res.json();
  },

  bookTickets: async (
    concertId: number,
    showId: number,
    body: BookingRequest
  ): Promise<TicketsResponse> => {
    const res = await fetch(
      `${BASE_URL}/concerts/${concertId}/shows/${showId}/booking`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error("Booking failed"), { status: res.status, data: err });
    }
    return res.json();
  },

  getTickets: async (code: string, name: string): Promise<TicketsResponse> => {
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error("Unauthorized"), { status: res.status, data: err });
    }
    return res.json();
  },

  cancelTicket: async (ticketId: number, code: string, name: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    if (res.status !== 204 && !res.ok) throw new Error("Cancel failed");
  },
};
