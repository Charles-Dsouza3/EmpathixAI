export default function EcgTrace({ active = false }) {
  const trace = (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className="h-8 w-[300px] sm:w-[400px] shrink-0"
    >
      <path
        d="M0,30 L50,30 L58,30 L64,10 L70,50 L76,20 L82,30 L90,30 L200,30 L208,30 L214,10 L220,50 L226,20 L232,30 L240,30 L400,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div
      className={`relative flex overflow-hidden ${active ? "text-pulse" : "text-sage/40"}`}
      aria-hidden="true"
    >
      <div className={`flex ${active ? "animate-ecg-pulse" : ""}`}>
        {trace}
        {trace}
      </div>
    </div>
  );
}