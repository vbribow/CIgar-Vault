import { CollectorPassportEditor } from "@/components/collector-passport-editor";
import { collectorPassportSuggestions } from "@/lib/collector-passport";
import { loadSmokingLogs } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import "./passport.css";
export const dynamic="force-dynamic";
export default async function CollectorPassportPage(){const[inventory,smokes]=await Promise.all([loadInventory(),loadSmokingLogs()]);return <main className="shell passportPage"><section className="passportHero"><div><div className="eyebrow">Collector Passport</div><h1>Share your point of view. Keep your Vault private.</h1><p className="lede">Create a curated collector identity for conversation, education, and cultural connection—without publishing wealth, inventory, or security-sensitive evidence.</p></div><a className="button secondary" href="/collectors">Explore Collector Passports</a></section><CollectorPassportEditor suggestions={collectorPassportSuggestions(inventory,smokes)}/></main>}
