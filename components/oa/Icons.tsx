export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M71.86 23.95 A34 34 0 1 0 71.86 76.05" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M64.78 32.38 A23 23 0 1 0 64.78 67.62" fill="none" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" />
      <path d="M57.71 40.81 A12 12 0 1 0 57.71 59.19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.6 } as const;

export const TabIcons = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" {...S} strokeLinejoin="round" />,
  classes: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" {...S} />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" {...S} strokeLinecap="round" />
    </>
  ),
  brief: <path d="M3 12h4l2-4 3 8 2-5 1.5 1H21" {...S} strokeLinecap="round" strokeLinejoin="round" />,
  events: <path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8L8 13.5l-4.3-4 5.8-.7z" {...S} strokeLinejoin="round" />,
  coach: (
    <>
      <circle cx="12" cy="8.5" r="4" {...S} />
      <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" {...S} strokeLinecap="round" />
    </>
  ),
};
