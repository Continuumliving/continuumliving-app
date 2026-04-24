import type { CSSProperties } from "react";

export function SkeletonHero({ tone = "warm" }: { tone?: "warm" | "ink" }) {
  const style: CSSProperties =
    tone === "ink"
      ? {
          padding: "32px 24px",
          margin: "16px 0 28px",
          background: "var(--ink)",
        }
      : {
          padding: "28px 24px",
          margin: "16px 0 28px",
          borderLeft: "2px solid var(--terracotta)",
        };
  return (
    <div className="skeleton" style={style}>
      <div className="skeleton-line" style={{ width: "45%", height: 10 }} />
      <div
        className="skeleton-line"
        style={{ width: "75%", height: 28, marginTop: 16 }}
      />
      <div
        className="skeleton-line"
        style={{ width: "55%", height: 28, marginTop: 8 }}
      />
    </div>
  );
}

export function SkeletonQuote() {
  return (
    <div
      className="skeleton"
      style={{
        padding: "32px 24px",
        margin: "28px 0",
        background: "var(--sand)",
      }}
    >
      <div
        className="skeleton-line"
        style={{ margin: "0 auto", width: "70%", height: 14 }}
      />
      <div
        className="skeleton-line"
        style={{ margin: "8px auto 0", width: "50%", height: 14 }}
      />
    </div>
  );
}

export function SkeletonStatGrid() {
  const cell: CSSProperties = { padding: 22 };
  return (
    <div className="stat-grid">
      <div className="skeleton" style={cell}>
        <div className="skeleton-line" style={{ height: 36, width: "30%" }} />
        <div
          className="skeleton-line"
          style={{ height: 10, marginTop: 12, width: "65%" }}
        />
      </div>
      <div className="skeleton" style={cell}>
        <div className="skeleton-line" style={{ height: 36, width: "30%" }} />
        <div
          className="skeleton-line"
          style={{ height: 10, marginTop: 12, width: "65%" }}
        />
      </div>
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div style={{ marginTop: 10 }}>
      <div
        className="skeleton"
        style={{ padding: "18px 20px", display: "flex", alignItems: "center" }}
      >
        <div style={{ flex: 1 }}>
          <div className="skeleton-line" style={{ height: 10, width: "45%" }} />
          <div
            className="skeleton-line"
            style={{ height: 10, width: "30%", marginTop: 8 }}
          />
        </div>
        <div
          className="skeleton-line"
          style={{ height: 30, width: 60, marginBottom: 0 }}
        />
      </div>
    </div>
  );
}

export function SkeletonSessionCard({
  intensity = "low",
}: {
  intensity?: "high" | "low";
}) {
  return (
    <div className={`skeleton`} style={{ padding: 20, marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <div
          className="skeleton-line"
          style={{ width: 70, height: 22, marginBottom: 0 }}
        />
        <div
          className="skeleton-line"
          style={{
            width: 50,
            height: 14,
            marginBottom: 0,
            background:
              intensity === "high" ? "var(--terracotta-soft)" : "var(--olive-tint)",
          }}
        />
      </div>
      <div className="skeleton-line" style={{ height: 18, width: "60%" }} />
      <div className="skeleton-line" style={{ height: 10, width: "40%" }} />
    </div>
  );
}

export function SkeletonEventCard() {
  return (
    <div
      className="skeleton"
      style={{ padding: 22, marginBottom: 12, background: "var(--cream)" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div
            className="skeleton-line"
            style={{ width: 46, height: 36, marginBottom: 0 }}
          />
          <div>
            <div
              className="skeleton-line"
              style={{ width: 40, height: 10, marginBottom: 4 }}
            />
            <div
              className="skeleton-line"
              style={{ width: 80, height: 14, marginBottom: 0 }}
            />
          </div>
        </div>
        <div
          className="skeleton-line"
          style={{ width: 60, height: 14, marginBottom: 0 }}
        />
      </div>
      <div className="skeleton-line" style={{ height: 18, width: "70%" }} />
      <div className="skeleton-line" style={{ height: 10, width: "50%" }} />
    </div>
  );
}

export function SkeletonSection({
  eyebrow,
  rows = 2,
  variant = "session",
}: {
  eyebrow?: string;
  rows?: number;
  variant?: "session" | "event";
}) {
  return (
    <div style={{ marginTop: 40 }}>
      {eyebrow ? (
        <div className="eyebrow stone" style={{ marginBottom: 14 }}>
          {eyebrow}
        </div>
      ) : null}
      {Array.from({ length: rows }).map((_, i) =>
        variant === "event" ? (
          <SkeletonEventCard key={i} />
        ) : (
          <SkeletonSessionCard key={i} intensity={i % 2 === 0 ? "high" : "low"} />
        ),
      )}
    </div>
  );
}
