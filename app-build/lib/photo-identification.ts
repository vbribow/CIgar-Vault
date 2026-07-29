export function retryableVisionFailure(status:number,message:string){
  const normalized=message.toLowerCase();
  return status>=500||normalized.includes("failed to load external module")||normalized.includes("temporarily unavailable")||normalized.includes("internal server error");
}

export function visionFailureMessage(message:string){
  if(message.toLowerCase().includes("failed to load external module"))return "Photo analysis was temporarily unavailable. Your selected photos are still safe—tap Identify again.";
  return message;
}
