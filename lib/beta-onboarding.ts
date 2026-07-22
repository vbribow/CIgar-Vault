import {z} from "zod";
export const BetaStage=z.enum(["Prospect","Invited","Signed up","Imported","Activated"]);export type BetaStage=z.infer<typeof BetaStage>;
export const BetaCollectorInput=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(100),email:z.string().email(),stage:BetaStage.default("Prospect"),notes:z.string().trim().max(1000).optional(),invitedAt:z.string().optional(),lastContactAt:z.string().optional()});
export type BetaCollector=z.infer<typeof BetaCollectorInput>&{id:string;createdAt:string;updatedAt:string};
const stageOrder:BetaStage[]=["Prospect","Invited","Signed up","Imported","Activated"];
export function advancedBetaStage(current:BetaStage,signals:{signedUp:boolean;inventoryLots:number;activated:boolean}){const detected:BetaStage=signals.activated||signals.inventoryLots>=20?"Activated":signals.inventoryLots>0?"Imported":signals.signedUp?"Signed up":current;return stageOrder.indexOf(detected)>stageOrder.indexOf(current)?detected:current}
export function betaSummary(collectors:BetaCollector[]){const count=(stage:BetaStage)=>collectors.filter(item=>item.stage===stage).length;const activated=count("Activated");return{total:collectors.length,prospects:count("Prospect"),invited:count("Invited"),signedUp:count("Signed up"),imported:count("Imported"),activated,founderSeatsRemaining:Math.max(0,25-activated)}}
