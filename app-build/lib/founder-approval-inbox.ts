type ApprovalRecord = { status?: string | null };

export type FounderApprovalSummary = {
  submittedProfiles: number;
  submittedPublications: number;
  submittedRegistryRecords: number;
  publishReady: number;
  totalNeedsApproval: number;
};

export function summarizeFounderApprovals(input: {
  profiles: ApprovalRecord[];
  publications: ApprovalRecord[];
  registryRecords: ApprovalRecord[];
}): FounderApprovalSummary {
  const submittedProfiles = input.profiles.filter(item => item.status === "submitted").length;
  const submittedPublications = input.publications.filter(item => item.status === "submitted").length;
  const submittedRegistryRecords = input.registryRecords.filter(item => item.status === "submitted").length;
  const publishReady = [...input.profiles, ...input.publications, ...input.registryRecords].filter(item => item.status === "approved").length;
  return { submittedProfiles, submittedPublications, submittedRegistryRecords, publishReady, totalNeedsApproval: submittedProfiles + submittedPublications + submittedRegistryRecords };
}
