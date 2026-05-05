"use client";

// Catches errors thrown inside the root layout itself. Must include
// its own <html>/<body> because no parent layout has rendered.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "'Cormorant Garamond', Georgia, serif",
          background: "#f5f1ea",
          color: "#1a1817",
          margin: 0,
          padding: "60px 28px",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 440,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 11,
              letterSpacing: "0.3em",
              textAlign: "center",
              marginBottom: 56,
            }}
          >
            CONTINUUM
            <span style={{ color: "#c97b5a", fontStyle: "italic" }}>
              {" · "}
            </span>
            LIVING
          </div>
          <h1
            style={{
              fontWeight: 300,
              fontSize: 38,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              margin: 0,
            }}
          >
            The connection
            <br />
            <em style={{ color: "#c97b5a", fontWeight: 400 }}>
              is, for a moment, elsewhere.
            </em>
          </h1>
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.7,
              color: "#3a3632",
              marginTop: 24,
            }}
          >
            Please try again shortly.
          </p>
          {error?.digest ? (
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 12,
                color: "#6b5d4d",
                marginTop: 12,
              }}
            >
              Reference {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              width: "100%",
              padding: 16,
              background: "#c97b5a",
              color: "#fff",
              border: "none",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 10,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
