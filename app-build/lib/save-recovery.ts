const networkFailure = /failed to fetch|networkerror|network request failed|load failed|connection|offline/i;
const timeoutFailure = /timeout|timed out|aborted/i;

export function saveRecoveryMessage(error: unknown, subject: string) {
  const detail = error instanceof Error ? error.message.trim() : "";
  const guidance = "Your entries are still on this screen. Review them and try again; retrying will not create a duplicate.";

  if (networkFailure.test(detail)) return `Hojavía could not reach your private Vault. ${guidance}`;
  if (timeoutFailure.test(detail)) return `Hojavía could not confirm whether the save completed. Use “Check save status”; retrying will not create a duplicate because Hojavía checks the same secure submission. Your entries are still on this screen.`;
  if (detail && !/^save failed$|^reading failed$/i.test(detail)) return `Nothing was saved. ${detail} ${guidance}`;
  return `Hojavía could not save ${subject}. ${guidance}`;
}

export async function readSaveResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("The Vault returned a response that could not be confirmed.");
  }
}
