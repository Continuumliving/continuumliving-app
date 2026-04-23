import type { ReactNode } from "react";

type Tone = "error" | "info";

export function InlineNotice({
  children,
  tone = "error",
  eyebrow,
}: {
  children: ReactNode;
  tone?: Tone;
  eyebrow?: string;
}) {
  const label = eyebrow ?? (tone === "error" ? "Notice" : "Note");
  return (
    <div
      className="notice"
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <span className="notice-eyebrow">{label}</span>
      {children}
    </div>
  );
}
