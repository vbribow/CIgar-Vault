import { WorkspaceLoading } from "@/components/workspace-loading";

export default function LoadingVerification() {
  return <WorkspaceLoading label="Preparing verification records" message="Preparing saved evidence without inferring an authenticity result…" cards={3}/>;
}
