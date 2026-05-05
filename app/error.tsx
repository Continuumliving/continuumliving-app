"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root] error:", error);
  }, [error]);

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        CONTINUUM<em> · </em>LIVING
      </div>
      <h1 className="h1">
        The connection
        <br />
        <em>is, for a moment, elsewhere.</em>
      </h1>
      <p className="intro">
        Something went wrong on our side. Your bookings and reservations
        are safely held — please try again in a moment.
      </p>
      {error?.digest ? (
        <p
          className="body-sm"
          style={{ marginBottom: 16, opacity: 0.55 }}
        >
          Reference {error.digest}
        </p>
      ) : null}
      <button type="button" className="btn btn-terracotta" onClick={reset}>
        Try again
      </button>
      <div className="auth-footer">
        Or go to
        <Link href="/signin">sign in</Link>
      </div>
    </div>
  );
}
