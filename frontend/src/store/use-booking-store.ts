import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/services/api-client";

type TicketType = {
  id: number;
  type: string;
  name: string;
  duration_days: number;
  price: string;
  description?: string;
};

interface BookingState {
  fromStationId: number | null;
  toStationId: number | null;
  ticketTypeId: number | null;
  isRoundTrip: boolean;

  ticketTypes: TicketType[];

  calculation: {
    base_price: string;
    discount_rate: string;
    total_price: string;
    passenger_group?: string;
    age?: number | null;
    loading: boolean;
  } | null;

  setFromStation: (id: number | null) => void;
  setToStation: (id: number | null) => void;
  setTicketType: (id: number | null) => void;
  setIsRoundTrip: (value: boolean) => void;

  fetchInitialData: () => Promise<void>;
  calculatePrice: () => Promise<void>;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      fromStationId: null,
      toStationId: null,
      ticketTypeId: 1,
      isRoundTrip: false,

      ticketTypes: [],
      calculation: null,

      setFromStation: (id) => {
        set({ fromStationId: id });
        get().calculatePrice();
      },
      setToStation: (id) => {
        set({ toStationId: id });
        get().calculatePrice();
      },
      setTicketType: (id) => {
        const selectedType = get().ticketTypes.find((t) => t.id === id);
        const shouldKeepRoundTrip = selectedType?.type === "single";
        set({ ticketTypeId: id, isRoundTrip: shouldKeepRoundTrip ? get().isRoundTrip : false });
        get().calculatePrice();
      },
      setIsRoundTrip: (value) => {
        set({ isRoundTrip: value });
        get().calculatePrice();
      },

      fetchInitialData: async () => {
        try {
          const typesRes = await api.get(`/ticketing/types/`);
          set({ ticketTypes: typesRes.data.results || typesRes.data });
        } catch (err) {
          console.error("Failed to fetch booking data", err);
        }
      },

      calculatePrice: async () => {
        const { fromStationId, toStationId, ticketTypeId, ticketTypes, isRoundTrip } = get();
        if (!ticketTypeId) return;

        const selectedType = ticketTypes.find((t) => t.id === ticketTypeId);
        const isSingleTicket = selectedType?.type === "single";

        if (isSingleTicket && (!fromStationId || !toStationId || fromStationId === toStationId)) {
          set((state) => ({
            calculation: state.calculation
              ? { ...state.calculation, loading: false }
              : { base_price: "0", discount_rate: "0", total_price: "0", loading: false },
          }));
          return;
        }

        set((state) => ({
          calculation: state.calculation
            ? { ...state.calculation, loading: true }
            : { base_price: "0", discount_rate: "0", total_price: "0", loading: true },
        }));

        try {
          const res = await api.post(`/ticketing/booking/calculate/`, {
            ticket_type_id: ticketTypeId,
            from_station_id: fromStationId,
            to_station_id: toStationId,
            is_round_trip: isSingleTicket ? isRoundTrip : false,
          });
          set({ calculation: { ...res.data, loading: false } });
        } catch (err) {
          console.error("Price calculation failed", err);
          set((state) => ({ calculation: state.calculation ? { ...state.calculation, loading: false } : null }));
        }
      },

      resetBooking: () =>
        set({
          fromStationId: null,
          toStationId: null,
          ticketTypeId: 1,
          isRoundTrip: false,
          calculation: null,
        }),
    }),
    {
      name: "metro.booking",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fromStationId: state.fromStationId,
        toStationId: state.toStationId,
        ticketTypeId: state.ticketTypeId,
        isRoundTrip: state.isRoundTrip,
      }),
    }
  )
);
