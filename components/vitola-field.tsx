"use client";

import { useEffect, useMemo, useState } from "react";
import { vitolaOptions } from "@/lib/vitolas";

export function VitolaField({ value, onChange, catalogVitolas = [], help }: { value: string; onChange: (value: string) => void; catalogVitolas?: string[]; help?: string }) {
  const options = useMemo(() => vitolaOptions(catalogVitolas), [catalogVitolas]);
  const listed = options.some((option) => option.toLocaleLowerCase() === value.trim().toLocaleLowerCase());
  const [custom, setCustom] = useState(Boolean(value && !listed));

  useEffect(() => {
    if (value && !options.some((option) => option.toLocaleLowerCase() === value.trim().toLocaleLowerCase())) setCustom(true);
  }, [options, value]);

  return <label><span>Vitola *</span>
    <select value={custom ? "__custom__" : value} required={!custom} onChange={(event) => {
      if (event.target.value === "__custom__") { setCustom(true); onChange(""); }
      else { setCustom(false); onChange(event.target.value); }
    }}>
      <option value="">Choose a vitola</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
      <option value="__custom__">Other / custom vitola…</option>
    </select>
    {custom && <input name="vitola" required value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type the exact vitola or named size" autoFocus />}
    {!custom && <input name="vitola" type="hidden" value={value} />}
    <small>{help || `${options.length} standard and catalog vitolas available; custom entries allowed.`}</small>
  </label>;
}
