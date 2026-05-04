"use client";

import { useEffect } from "react";

export default function AppGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console for local debugging and in
    // Vercel logs via the framework's error reporting.
    console.error("(app) group error:", error);
  }, [error]);

  return (
    <div className="screen">
      <div className="hero-name-card" style={{ marginTop: 24 }}>
        <div className="eyebrow">— Notice</div>
        <h1 className="h1">
          The connection
          <br />
          <em>is, for a moment, elsewhere.</em>
        </h1>
        <p className="body-md" style={{ marginTop: 16 }}>
          Something went wrong on our side. Please try again — your
          bookings and reservations are safely held.
        </p>
        {error?.digest ? (
          <p
            className="body-sm"
            style={{ marginTop: 12, opacity: 0.6 }}
          >
            Reference {error.digest}
          </p>
        ) : null}
      </div>

      <button type="button" className="btn btn-terracotta" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
