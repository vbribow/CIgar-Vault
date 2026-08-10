"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createDeviceDraft, deviceDraftStorageKey, parseDeviceDraft, rememberCurrentDraftOwner } from "@/lib/device-drafts";

type StoredFields = Record<string, string[]>;

function resolveDraftOwner() {
  return fetch("/api/account/device-draft-owner", { cache: "no-store" })
    .then(async (response) => {
      const value = await response.json();
      return response.ok ? value.data?.ownerKey as string | undefined : undefined;
    })
    .catch(() => undefined);
}

const notifyDraftChange = () => window.dispatchEvent(new Event("hojavia:device-drafts-changed"));
const isPrivateField = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) =>
  field instanceof HTMLInputElement && ["password", "file"].includes(field.type);

function readFields(form: HTMLFormElement): StoredFields {
  const values: StoredFields = {};
  for (const field of [...form.elements]) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) || !field.name || isPrivateField(field)) continue;
    if (field instanceof HTMLInputElement && ["submit", "button", "reset"].includes(field.type)) continue;
    if (field instanceof HTMLInputElement && field.type === "hidden" && field.dataset.draftSafe !== "true") continue;
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

export function useDeviceFormDraft(formKey: string) {
  const formRef = useRef<HTMLFormElement>(null);
  const pendingFields = useRef<StoredFields | undefined>(undefined);
  const [ownerKey, setOwnerKey] = useState<string>();
  const [restoredFields, setRestoredFields] = useState<StoredFields>();

  useEffect(() => {
    let cancelled = false;
    setRestoredFields(undefined);
    setOwnerKey(undefined);
    resolveDraftOwner().then((owner) => {
      if (cancelled || !owner) return;
      setOwnerKey(owner);
      try {
        rememberCurrentDraftOwner(owner);
        const storageKey = deviceDraftStorageKey(owner, formKey);
        const raw = window.localStorage.getItem(storageKey);
        const saved = parseDeviceDraft(raw, owner);
        if (raw && !saved) window.localStorage.removeItem(storageKey);
        if (saved && formRef.current) {
          setRestoredFields(saved.fields);
          window.setTimeout(() => { if (!cancelled && formRef.current) restoreFields(formRef.current, saved.fields); }, 0);
        }
        if (pendingFields.current) {
          window.localStorage.setItem(storageKey, JSON.stringify(createDeviceDraft(owner, formKey, pendingFields.current)));
          pendingFields.current = undefined;
          notifyDraftChange();
        }
      } catch { /* A damaged or blocked cache must never block the form. */ }
    });
    return () => { cancelled = true; };
  }, [formKey]);

  const capture = useCallback((event: FormEvent<HTMLFormElement>) => {
    const fields = readFields(event.currentTarget);
    if (!ownerKey) { pendingFields.current = fields; return; }
    try {
      window.localStorage.setItem(deviceDraftStorageKey(ownerKey, formKey), JSON.stringify(createDeviceDraft(ownerKey, formKey, fields)));
      notifyDraftChange();
    } catch { /* The form remains usable without browser storage. */ }
  }, [formKey, ownerKey]);

  const clear = useCallback(() => {
    pendingFields.current = undefined;
    try {
      if (ownerKey) window.localStorage.removeItem(deviceDraftStorageKey(ownerKey, formKey));
      notifyDraftChange();
    } catch { /* Already cleared for this session. */ }
    setRestoredFields(undefined);
  }, [formKey, ownerKey]);

  return { formRef, capture, clear, restoredFields };
}
