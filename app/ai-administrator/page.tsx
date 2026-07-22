import { AiAdministrator } from "@/components/ai-administrator";
import "./ai-administrator.css";
export const dynamic="force-dynamic";
export default function AiAdministratorPage(){return <main className="shell wideShell aiAdminPage"><section className="aiAdminHero"><div><div className="eyebrow">Cigar Vault operations</div><h1>AI Administrator.</h1><p className="lede">A founder-controlled operations layer for community safety, collector activity, and exceptions that deserve human judgment.</p><a className="button" href="/sommelier-library">Open Master Somm Library</a></div><aside><span>Operating principle</span><strong>AI screens. Founder decides.</strong><small>No automated account bans or irreversible actions.</small></aside></section><AiAdministrator/></main>}
