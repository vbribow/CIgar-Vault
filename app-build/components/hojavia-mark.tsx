type HojaviaMarkProps = {
  className?: string;
  label?: string;
};

export function HojaviaMark({ className = "hojaviaMark", label }: HojaviaMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <rect className="hojaviaMarkFrame" width="64" height="64" rx="12" />
      <path className="hojaviaMarkLeaf" d="M14 48c11-3 20-10 25-21 3-7 7-11 12-13 0 11-4 21-12 29-7 6-15 10-25 10Z" />
      <path className="hojaviaMarkVein" d="M15 48c9-6 17-13 24-20 5-5 9-10 12-15M29 37c-1-4-1-8 0-12M37 29c4 0 7 0 11-2" />
    </svg>
  );
}
