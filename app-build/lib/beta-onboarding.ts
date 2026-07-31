import {z} from "zod";
import {betaSeatsRemaining} from "./beta-cohort";
export const BetaStage=z.enum(["Prospect","Invited","Signed up","Imported","Activated"]);export type BetaStage=z.infer<typeof BetaStage>;
export const BetaCollectorInput=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(100),email:z.string().email(),stage:BetaStage.default("Prospect"),notes:z.string().trim().max(1000).optional(),invitedAt:z.string().optional(),lastContactAt:z.string().optional()});
export type BetaCollector=z.infer<typeof BetaCollectorInput>&{id:string;createdAt:string;updatedAt:string};
const stageOrder:BetaStage[]=["Prospect","Invited","Signed up","Imported","Activated"];
export const betaSignupUrl="https://hojavia.com/login?mode=signup";
export const betaAppUrl="https://hojavia.com/?source=hojavia-app";
export const legacyBetaAppOrigin="http://192.168.1.104:3102";
export function betaInvitationEmail(collector:Pick<BetaCollector,"name"|"email">){
 const subject="Your Hojavía private beta invitation";
 const body=[
  `Hi ${collector.name},`,
  "",
  "You’re invited to join the Hojavía private beta.",
  "",
  `Create your account: ${betaSignupUrl}`,
  `Use this exact invited email address: ${collector.email}`,
  "After creating your account, open the confirmation email and follow its link before signing in.",
  "",
  "Before beginning, please review:",
  "Beta Agreement: https://hojavia.com/beta-agreement",
  "Terms of Use: https://hojavia.com/terms",
  "Privacy Notice: https://hojavia.com/privacy",
  "",
  "This invitation is personal and may not be transferred.",
 ].join("\n");
 return{recipient:collector.email,subject,body};
}
export function betaInvitationMailto(collector:Pick<BetaCollector,"name"|"email">){
 const{recipient,subject,body}=betaInvitationEmail(collector);
 return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
export function betaInvitationWebmailLinks(collector:Pick<BetaCollector,"name"|"email">){
 const{recipient,subject,body}=betaInvitationEmail(collector);
 const to=encodeURIComponent(recipient);const encodedSubject=encodeURIComponent(subject);const encodedBody=encodeURIComponent(body);
 return{
  gmail:`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`,
  outlook:`https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
  yahoo:`https://compose.mail.yahoo.com/?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
 };
}
export function betaReinstallEmail(collector:Pick<BetaCollector,"name"|"email">,previousOrigin:string=legacyBetaAppOrigin){
 const subject="One-time Hojavía phone-app reinstall required";
 const body=[
  `Hi ${collector.name},`,
  "",
  `The Hojavía phone app installed from ${previousOrigin} uses a retired beta address and may show “server unavailable.”`,
  "",
  "Please complete this one-time update:",
  "",
  "1. Delete the existing Hojavía home-screen app.",
  `2. Open ${betaAppUrl} directly in Safari. No special Wi-Fi connection is required.`,
  "3. Select Share, then Add to Home Screen.",
  "4. Open the newly installed Hojavía app and sign in.",
  "",
  "Deleting the obsolete home-screen installation will not delete collection records stored by Hojavía.",
  "",
  "Hojavía Beta Operations",
 ].join("\n");
 return{recipient:collector.email,subject,body,replacementUrl:betaAppUrl};
}
export function betaReinstallWebmailLinks(collector:Pick<BetaCollector,"name"|"email">,previousOrigin:string=legacyBetaAppOrigin){
 const{recipient,subject,body}=betaReinstallEmail(collector,previousOrigin);
 const to=encodeURIComponent(recipient);const encodedSubject=encodeURIComponent(subject);const encodedBody=encodeURIComponent(body);
 return{
  gmail:`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`,
  outlook:`https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
  yahoo:`https://compose.mail.yahoo.com/?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
 };
}
export function advancedBetaStage(current:BetaStage,signals:{signedUp:boolean;inventoryLots:number;activated:boolean}){const detected:BetaStage=signals.activated||signals.inventoryLots>=20?"Activated":signals.inventoryLots>0?"Imported":signals.signedUp?"Signed up":current;return stageOrder.indexOf(detected)>stageOrder.indexOf(current)?detected:current}
export function betaSummary(collectors:BetaCollector[]){const count=(stage:BetaStage)=>collectors.filter(item=>item.stage===stage).length;const activated=count("Activated");return{total:collectors.length,prospects:count("Prospect"),invited:count("Invited"),signedUp:count("Signed up"),imported:count("Imported"),activated,founderSeatsRemaining:betaSeatsRemaining(collectors)}}
