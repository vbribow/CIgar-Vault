import { brand } from "@/lib/brand";

export default function LoadingInventory(){return <main className="shell"><div className="loadingBrand">{brand.name}</div><div className="skeleton titleSkeleton"/><div className="skeleton tableSkeleton"/></main>}
