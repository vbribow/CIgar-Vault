import { brand } from "@/lib/brand";

export default function LoadingVerification() {
  return <main className="shell" aria-busy="true" aria-label="Preparing verification records">
    <div className="loadingBrand">{brand.name}</div>
    <div className="skeleton titleSkeleton" />
    <div className="grid">{[1,2,3].map(item=><div className="skeleton cardSkeleton" key={item}/>)}</div>
    <div className="skeleton tableSkeleton" />
    <p className="small" role="status">Preparing saved evidence without inferring an authenticity result…</p>
  </main>;
}
