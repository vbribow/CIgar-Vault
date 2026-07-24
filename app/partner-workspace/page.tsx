import { PartnerWorkspace } from "@/components/partner-workspace";
import "./partner-workspace.css";

export const dynamic="force-dynamic";
export default function PartnerWorkspacePage(){
  return <main className="shell wideShell workspacePage"><section className="workspaceHero"><div><div className="eyebrow">Cedriva Industry Collaboration</div><h1>A private workspace built around trust.</h1><p className="lede">Prepare accurate campaigns, understand aggregate performance, and collaborate with your organization—without access to private collector information.</p></div><div className="workspacePromise"><strong>Organization-scoped</strong><span>Role-controlled · Audited · Founder-governed</span></div></section><PartnerWorkspace/></main>;
}
