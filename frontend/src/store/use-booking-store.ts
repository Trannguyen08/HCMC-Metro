import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/lib/api";

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
          const types = typesRes.data.results || typesRes.data;
          set({ ticketTypes: types });
          // After loading types, recalculate with the current ticketTypeId
          // This ensures prices show for non-single tickets on page load
          get().calculatePrice();
        } catch (err) {
          console.error("Failed to fetch booking data", err);
        }
      },

      calculatePrice: async () => {
        const { fromStationId, toStationId, ticketTypeId, ticketTypes, isRoundTrip } = get();
        if (!ticketTypeId) return;

        const selectedType = ticketTypes.find((t) => t.id === ticketTypeId);
        if (!selectedType) return;

        const isSingleTicket = selectedType.type === "single";

        // For single tickets, stations are required before we can calculate
        if (isSingleTicket && (!fromStationId || !toStationId || fromStationId === toStationId)) {
          set({
            calculation: { base_price: "0", discount_rate: "0", total_price: "0", loading: false },
          });
          return;
        }

        set((state) => ({
          calculation: state.calculation
            ? { ...state.calculation, loading: true }
            : { base_price: "0", discount_rate: "0", total_price: "0", loading: true },
        }));

        try {
          // For non-single tickets, don't send station IDs (flat price, no distance calculation)
          const res = await api.post(`/ticketing/booking/calculate/`, {
            ticket_type_id: ticketTypeId,
            from_station_id: isSingleTicket ? fromStationId : null,
            to_station_id: isSingleTicket ? toStationId : null,
            is_round_trip: isSingleTicket ? isRoundTrip : false,
          });
          set({ calculation: { ...res.data, loading: false } });
        } catch (err) {
          console.error("Price calculation failed", err);
          // On error, show the flat price from ticket type data as fallback
          const flatPrice = selectedType.price || "0";
          set({
            calculation: {
              base_price: flatPrice,
              discount_rate: "0",
              total_price: flatPrice,
              loading: false,
            },
          });
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
