import { brand } from "@/lib/brand";

export default function LoadingHumidors() {
  return <main className="shell" aria-busy="true" aria-label="Preparing climate stewardship">
    <div className="loadingBrand">{brand.name}</div>
    <div className="skeleton titleSkeleton" />
    <div className="grid">{[1,2,3,4].map(item=><div className="skeleton cardSkeleton" key={item}/>)}</div>
    <div className="skeleton tableSkeleton" />
    <p className="small" role="status">Preparing humidors and their latest confirmed readings…</p>
  </main>;
}
