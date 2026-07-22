export type SignalTone = "positive" | "caution" | "critical" | "neutral" | "info";

export function MarketSignal({ label, tone = "neutral", detail }: { label: string; tone?: SignalTone; detail?: string }) {
  return <span className={`marketSignal signal-${tone}`} title={detail}><i />{label}</span>;
}

export function freshnessTone(value: string): SignalTone {
  if (value === "Current") return "positive";
  if (value === "Due soon") return "caution";
  if (value === "Stale" || value === "Never valued") return "critical";
  return "neutral";
}

export function confidenceTone(value?: string): SignalTone {
  if (value?.toLowerCase() === "high") return "positive";
  if (value?.toLowerCase() === "medium") return "caution";
  if (value?.toLowerCase() === "low") return "critical";
  return "neutral";
}

export function SignalLegend() {
  return <div className="signalLegend" aria-label="Market signal legend"><span>Signal standard</span><MarketSignal label="Current / high confidence" tone="positive"/><MarketSignal label="Review soon" tone="caution"/><MarketSignal label="Action required" tone="critical"/><MarketSignal label="Evidence developing" tone="neutral"/></div>;
}
