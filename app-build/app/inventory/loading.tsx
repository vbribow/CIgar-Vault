import { brand } from "@/lib/brand";

export default function LoadingInventory(){return <main className="shell" aria-busy="true" aria-label="Preparing your private Vault"><div className="loadingBrand">{brand.name}</div><div className="skeleton titleSkeleton"/><div className="skeleton tableSkeleton"/><p className="small" role="status">Preparing your private Vault without showing incomplete records…</p></main>}
