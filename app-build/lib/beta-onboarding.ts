import {z} from "zod";
import {betaSeatsRemaining} from "./beta-cohort";
export const BetaStage=z.enum(["Prospect","Invited","Signed up","Imported","Activated"]);export type BetaStage=z.infer<typeof BetaStage>;
export const BetaCollectorInput=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(100),email:z.string().email(),stage:BetaStage.default("Prospect"),notes:z.string().trim().max(1000).optional(),invitedAt:z.string().optional(),lastContactAt:z.string().optional()});
export type BetaProgress={accountCreated:boolean;consentRecorded:boolean;inventoryLots:number;backupRecorded:boolean;smokeLogged:boolean;insuranceViewed:boolean};
export type BetaProgressStep={key:string;label:string;complete:boolean;href:string;detail:string};
export type BetaCollector=z.infer<typeof BetaCollectorInput>&{id:string;createdAt:string;updatedAt:string;progress?:BetaProgress};
const stageOrder:BetaStage[]=["Prospect","Invited","Signed up","Imported","Activated"];
export const betaSignupUrl="https://hojavia.com/login?mode=signup";
export const betaConfirmationRecoveryUrl="https://hojavia.com/login?mode=signin&link=invalid";
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
  "If the confirmation link reports an error, return to Hojavía, try signing in once, then use “Didn’t receive the confirmation email?” to request a fresh link. Only the newest link should be used.",
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
export const betaDeviceAcceptanceSteps=[
 {key:"open",label:"Open the permanent address",detail:"Open hojavia.com directly in Safari on iPhone or Chrome on Android; do not reuse an older beta host."},
 {key:"confirm",label:"Confirm the account",detail:"Use the newest confirmation email. If it has expired, request a fresh link from the sign-in page and discard older links."},
 {key:"signin",label:"Sign in and reopen",detail:"Sign in, close the browser or installed app, reopen it, and confirm the session returns safely."},
 {key:"install",label:"Install the phone app",detail:"Use Add to Home Screen on iPhone or Install app on Android, then confirm the Hojavía icon opens the permanent address."},
 {key:"navigate",label:"Check essential navigation",detail:"Open Vault, Log a Smoke, Cigar Somm, Collections, Lounge, Account, and Sign out without hidden or covered controls."},
 {key:"save",label:"Complete one controlled save",detail:"Add or edit one agreed test record, confirm one success message and no duplicate, then verify it on a second page."},
 {key:"recover",label:"Verify recovery",detail:"Download a private backup and confirm the recovery preview can read it. Do not replace live data during this check."},
] as const;
export function betaInvitationWebmailLinks(collector:Pick<BetaCollector,"name"|"email">){
 const{recipient,subject,body}=betaInvitationEmail(collector);
 const to=encodeURIComponent(recipient);const encodedSubject=encodeURIComponent(subject);const encodedBody=encodeURIComponent(body);
 return{
  gmail:`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`,
  outlook:`https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
  yahoo:`https://compose.mail.yahoo.com/?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
 };
}
export function betaReinstallEmail(collector:Pick<BetaCollector,"name"|"email">,previousOrigin:string){
 const replacementUrl=betaAppUrl;
 const subject="One-time Hojavía phone-app reinstall required";
 const body=[
  `Hi ${collector.name},`,
  "",
  `The private Hojavía phone app installed from ${previousOrigin} can no longer receive updates because the beta host address changed.`,
  "",
  "Please complete this one-time update:",
  "",
  "1. Delete the existing Hojavía home-screen app.",
  `2. Open ${replacementUrl} directly in Safari. No special Wi-Fi connection is required.`,
  "3. Select Share, then Add to Home Screen.",
  "4. Open the newly installed Hojavía app and confirm the front page loads.",
  "",
  "Deleting the obsolete home-screen installation will not delete collection records stored by Hojavía. Sign in again after opening the replacement app.",
  "",
  `This notice applies only to installations created from ${previousOrigin}. No action is required if you already installed the app from the replacement address.`,
  "",
  "Hojavía Beta Operations",
 ].join("\n");
 return{recipient:collector.email,subject,body,replacementUrl};
}
export function betaReinstallWebmailLinks(collector:Pick<BetaCollector,"name"|"email">,previousOrigin:string){
 const{recipient,subject,body}=betaReinstallEmail(collector,previousOrigin);
 const to=encodeURIComponent(recipient);const encodedSubject=encodeURIComponent(subject);const encodedBody=encodeURIComponent(body);
 return{
  gmail:`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`,
  outlook:`https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
  yahoo:`https://compose.mail.yahoo.com/?to=${to}&subject=${encodedSubject}&body=${encodedBody}`,
 };
}
export function advancedBetaStage(current:BetaStage,signals:{signedUp:boolean;inventoryLots:number;activated:boolean}){const detected:BetaStage=signals.activated?"Activated":signals.inventoryLots>0?"Imported":signals.signedUp?"Signed up":current;return stageOrder.indexOf(detected)>stageOrder.indexOf(current)?detected:current}
export function betaSummary(collectors:BetaCollector[]){const count=(stage:BetaStage)=>collectors.filter(item=>item.stage===stage).length;const activated=count("Activated");return{total:collectors.length,prospects:count("Prospect"),invited:count("Invited"),signedUp:count("Signed up"),imported:count("Imported"),activated,founderSeatsRemaining:betaSeatsRemaining(collectors)}}
export function betaStageLabel(stage:BetaStage){return stage==="Activated"?"Product milestone reached":stage}
export function betaProgressSteps(progress?:BetaProgress):BetaProgressStep[]{
 const value=progress||{accountCreated:false,consentRecorded:false,inventoryLots:0,backupRecorded:false,smokeLogged:false,insuranceViewed:false};
 return[
  {key:"account",label:"Account created",complete:value.accountCreated,href:betaSignupUrl,detail:value.accountCreated?"Confirmed":"Create and confirm the beta account"},
  {key:"consent",label:"Beta consent recorded",complete:value.consentRecorded,href:"/account",detail:value.consentRecorded?"Confirmed":"Complete the Account consent form"},
  {key:"inventory",label:"First cigar saved",complete:value.inventoryLots>0,href:"/inventory#mobile-intake",detail:value.inventoryLots>0?`${value.inventoryLots} inventory lot${value.inventoryLots===1?"":"s"}`:"Add the first inventory lot"},
  {key:"backup",label:"Inventory backup downloaded",complete:value.backupRecorded,href:"/account",detail:value.backupRecorded?"Recovery point recorded":"Use Download inventory backup"},
  {key:"inventory-depth",label:"20 inventory lots",complete:value.inventoryLots>=20,href:"/inventory#mobile-intake",detail:`${Math.min(value.inventoryLots,20)} of 20 lots`},
  {key:"smoke",label:"Smoke logged",complete:value.smokeLogged,href:"/records",detail:value.smokeLogged?"Confirmed":"One engagement option"},
  {key:"insurance",label:"Insurance report viewed",complete:value.insuranceViewed,href:"/reports",detail:value.insuranceViewed?"Confirmed":"Alternative engagement option"},
 ];
}
export function betaNextAction(progress?:BetaProgress){
 const steps=betaProgressSteps(progress);
 const required=steps.find(step=>["account","consent","inventory","backup","inventory-depth"].includes(step.key)&&!step.complete);
 if(required)return required;
 const engagement=steps.find(step=>(step.key==="smoke"||step.key==="insurance")&&!step.complete);
 return engagement||{key:"complete",label:"Product milestone reached",complete:true,href:"/",detail:"Core beta journey complete"};
}
