import { WorkspaceLoading } from "@/components/workspace-loading";

export default function LoadingCollections() {
  return <WorkspaceLoading label="Preparing collections" message="Preparing collections, component matches, and their latest confirmed evidence…" cards={3}/>;
}
