import { brand } from "@/lib/brand";

export default function LoadingRecords() {
  return <main className="shell" aria-busy="true" aria-label="Preparing your private journal">
    <div className="loadingBrand">{brand.name}</div>
    <div className="skeleton titleSkeleton" />
    <div className="recordsGrid"><div className="skeleton tableSkeleton"/><div className="skeleton tableSkeleton"/></div>
    <p className="small" role="status">Preparing journal entries and value evidence…</p>
  </main>;
}
