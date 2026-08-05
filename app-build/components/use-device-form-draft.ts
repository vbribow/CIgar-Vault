"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type StoredFields = Record<string, string[]>;

const isPrivateField = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) =>
  field instanceof HTMLInputElement && ["password", "file"].includes(field.type);

function readFields(form: HTMLFormElement): StoredFields {
  const values: StoredFields = {};
  for (const field of [...form.elements]) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) || !field.name || isPrivateField(field)) continue;
    if (field instanceof HTMLInputElement && ["submit", "button", "reset", "hidden"].includes(field.type)) continue;
    if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type) && !field.checked) continue;
    const selected = field instanceof HTMLSelectElement && field.multiple ? [...field.selectedOptions].map((option) => option.value) : [field.value];
    values[field.name] = [...(values[field.name] ?? []), ...selected];
  }
  return values;
}

function restoreFields(form: HTMLFormElement, values: StoredFields) {
  for (const field of [...form.elements]) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) || !field.name || isPrivateField(field)) continue;
    const saved = values[field.name];
    if (field instanceof HTMLInputElement && field.type === "checkbox") { field.checked = saved?.includes(field.value) ?? false; continue; }
    if (field instanceof HTMLInputElement && field.type === "radio") { field.checked = saved?.includes(field.value) ?? false; continue; }
    if (!saved?.length) continue;
    if (field instanceof HTMLSelectElement && field.multiple) for (const option of field.options) option.selected = saved.includes(option.value);
    else field.value = saved[0];
  }
  form.dispatchEvent(new Event("input", { bubbles: true }));
}

export function useDeviceFormDraft(storageKey: string) {
  const formRef = useRef<HTMLFormElement>(null);
  const [restoredFields, setRestoredFields] = useState<StoredFields>();

  useEffect(() => {
    setRestoredFields(undefined);
    let saved: StoredFields | undefined;
    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (value && typeof value === "object") saved = value as StoredFields;
    } catch { /* A damaged or blocked cache must never block the form. */ }
    if (!saved || !formRef.current) return;
    setRestoredFields(saved);
    const timer = window.setTimeout(() => { if (formRef.current) restoreFields(formRef.current, saved!); }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const capture = useCallback((event: FormEvent<HTMLFormElement>) => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(readFields(event.currentTarget))); }
    catch { /* The form remains usable without browser storage. */ }
  }, [storageKey]);

  const clear = useCallback(() => {
    try { window.localStorage.removeItem(storageKey); } catch { /* Already cleared for this session. */ }
    setRestoredFields(undefined);
  }, [storageKey]);

  return { formRef, capture, clear, restoredFields };
}
