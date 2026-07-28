import { brand } from "@/lib/brand";

export default function Loading(){return <main className="shell"><div className="loadingBrand">{brand.name}</div><div className="skeleton heroSkeleton"/><div className="grid">{[1,2,3,4].map(i=><div className="skeleton cardSkeleton" key={i}/>)}</div></main>}
