"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <div className="bo-eyebrow">— Something went wrong</div>
      <h1 className="bo-title">This page could not load.</h1>
      <p className="bo-sub">{error.message || "An unexpected error occurred."}</p>
      <button type="button" className="bo-btn primary" style={{ marginTop: 18 }} onClick={reset}>
        Try again
      </button>
    </div>
  );
}
