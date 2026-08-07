import { HojaviaMark } from "@/components/hojavia-mark";
import { brand } from "@/lib/brand";

type WorkspaceLoadingProps = {
  label: string;
  message: string;
  layout?: "cards" | "table" | "split";
  cards?: number;
};

export function WorkspaceLoading({ label, message, layout = "cards", cards = 4 }: WorkspaceLoadingProps) {
  return <main className="shell workspaceLoading" aria-busy="true" aria-label={label}>
    <header className="loadingStateHeader">
      <HojaviaMark label={`${brand.name} archival leaf mark`} />
      <div><strong>{brand.name}</strong><small>{brand.brandLine}</small></div>
    </header>
    <div className="skeleton titleSkeleton" aria-hidden="true" />
    {layout === "cards" && <div className="grid" aria-hidden="true">{Array.from({length:cards},(_,index)=><div className="skeleton cardSkeleton" key={index}/>)}</div>}
    {layout === "table" && <div className="skeleton tableSkeleton" aria-hidden="true" />}
    {layout === "split" && <div className="recordsGrid" aria-hidden="true"><div className="skeleton tableSkeleton"/><div className="skeleton tableSkeleton"/></div>}
    <p className="loadingStateMessage" role="status">{message}</p>
    <small className="loadingStateTrust">Private records remain hidden until the complete view is ready.</small>
  </main>;
}
