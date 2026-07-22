import {z} from "zod";
export const BetaStage=z.enum(["Prospect","Invited","Signed up","Imported","Activated"]);export type BetaStage=z.infer<typeof BetaStage>;
export const BetaCollectorInput=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(100),email:z.string().email(),stage:BetaStage.default("Prospect"),notes:z.string().trim().max(1000).optional(),invitedAt:z.string().optional(),lastContactAt:z.string().optional()});
export type BetaCollector=z.infer<typeof BetaCollectorInput>&{id:string;createdAt:string;updatedAt:string};
export function betaSummary(collectors:BetaCollector[]){const count=(stage:BetaStage)=>collectors.filter(item=>item.stage===stage).length;const activated=count("Activated");return{total:collectors.length,prospects:count("Prospect"),invited:count("Invited"),signedUp:count("Signed up"),imported:count("Imported"),activated,founderSeatsRemaining:Math.max(0,25-activated)}}
