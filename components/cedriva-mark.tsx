type CedrivaMarkProps = {
  className?: string;
  label?: string;
};

export function CedrivaMark({ className = "cedrivaMark", label }: CedrivaMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <path className="cedrivaMarkFrame" d="M14 7h36l7 7v36l-7 7H14l-7-7V14l7-7Z" />
      <path className="cedrivaMarkC" d="M42 21a15 15 0 1 0 0 22" />
      <path className="cedrivaMarkJoinery" d="M46 17v30M46 24h6M46 40h6" />
    </svg>
  );
}
