export type MutationStatus = "idle" | "pending" | "success" | "error";

export function mutationButtonText(status: MutationStatus, labels: { idle: string; pending: string; success: string }) {
  if (status === "pending") return labels.pending;
  if (status === "success") return labels.success;
  return labels.idle;
}
