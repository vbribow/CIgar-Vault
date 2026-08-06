import type { AccountChecklistItem } from "@/lib/account-checklist";

export function AccountChecklistPanel({ items }: { items: AccountChecklistItem[] }) {
  const completed = items.filter(item => item.complete).length;
  const percent = items.length ? Math.round(completed / items.length * 100) : 0;
  return <aside className="card onboardingCard" aria-labelledby="account-checklist-title">
    <div className="eyebrow">Getting started</div>
    <h2 id="account-checklist-title">Your vault checklist</h2>
    <p>{completed} of {items.length} complete · {percent}%</p>
    <div className="checklistProgress" role="progressbar" aria-label="Vault setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
    {items.map(item => <a href={item.href} key={item.label}><span className={item.complete ? "done" : ""}>{item.complete ? "✓" : ""}</span><strong>{item.label}</strong><small>{item.complete ? "Done" : item.description}</small></a>)}
  </aside>;
}
