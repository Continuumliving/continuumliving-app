"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { getBrowserClient } from "@/lib/supabase/client";
import { bookClass, cancelBooking, findBookingForClass } from "@/lib/bookings";
import { cancelRsvp, rsvpEvent } from "@/lib/events";
import { useDataMutations } from "@/lib/data-context";

export function useActions() {
  const toast = useToast();
  const m = useDataMutations();
  const [busy, setBusy] = useState<string | null>(null);

  async function book(classId: string, sessionDate: string) {
    setBusy(classId + sessionDate);
    try {
      const row = await bookClass(getBrowserClient(), { classId, sessionDate });
      m.addBooking(row);
      toast("Booked");
    } catch (err) {
      const msg = (err as Error).message || "";
      if (/capacity/i.test(msg)) {
        toast("This session is full");
        m.revalidate("classCounts");
      } else if (/duplicate|unique/i.test(msg)) {
        const existing = await findBookingForClass(getBrowserClient(), classId, sessionDate);
        if (existing) m.addBooking(existing);
        toast("You are already booked");
      } else toast("Could not book just now");
    } finally {
      setBusy(null);
    }
  }

  async function unbook(bookingId: string) {
    setBusy(bookingId);
    try {
      await cancelBooking(getBrowserClient(), bookingId);
      m.removeBooking(bookingId);
      toast("Booking cancelled");
    } catch {
      toast("Could not cancel just now");
    } finally {
      setBusy(null);
    }
  }

  async function reserve(eventId: string) {
    setBusy(eventId);
    try {
      const row = await rsvpEvent(getBrowserClient(), eventId);
      m.addRsvp(row);
      toast("Seat reserved");
    } catch (err) {
      toast(/capacity/i.test((err as Error).message || "") ? "This event is full" : "Could not reserve just now");
    } finally {
      setBusy(null);
    }
  }

  async function unreserve(rsvpId: string) {
    setBusy(rsvpId);
    try {
      await cancelRsvp(getBrowserClient(), rsvpId);
      m.removeRsvp(rsvpId);
      toast("Reservation cancelled");
    } catch {
      toast("Could not cancel just now");
    } finally {
      setBusy(null);
    }
  }

  return { book, unbook, reserve, unreserve, busy };
}
