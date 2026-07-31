import { cubanVerificationStatus, isCubanInventory } from "./cuban-verification";
import type { CigarCollection, EnvironmentalSensor, Humidor, InventoryItem, Valuation } from "./types";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  complete: boolean;
  progress: number;
  detail: string;
  priority: number;
};

export type IntegrityAudit = { action?: string; createdAt?: string };

const percent = (done: number, total: number) => total ? Math.round(done / total * 100) : 0;

export function buildOnboardingSteps(input: {
  inventory: InventoryItem[];
  collections: CigarCollection[];
  humidors: Humidor[];
  sensors: EnvironmentalSensor[];
  valuations: Valuation[];
  integrityAudits?: IntegrityAudit[];
}): OnboardingStep[] {
  const { inventory, collections, humidors, sensors, valuations, integrityAudits = [] } = input;
  const counted = inventory.filter(item => item.currentQty !== undefined).length;
  const valuedIds = new Set(valuations.filter(value => value.replacementValue !== undefined || value.marketValue !== undefined).map(value => value.inventoryId));
  const valued = inventory.filter(item => item.retailValue !== undefined || valuedIds.has(item.inventoryId)).length;
  const boxedCuban = inventory.filter(item => isCubanInventory(item) && cubanVerificationStatus(item) !== "Loose sticks");
  const verifiedCuban = boxedCuban.filter(item => cubanVerificationStatus(item) === "Verified").length;
  const connectedSensors = sensors.filter(sensor => ["Connected", "Ready"].includes(sensor.connectionStatus)).length;
  const backup = integrityAudits.some(audit => audit.action === "inventory-backup");
  const steps: OnboardingStep[] = [
    { id:"inventory", title:"Build the inventory", description:"Import the founder collection or add the first owned lot.", href:"/inventory", action:"Add inventory", complete:inventory.length>0, progress:inventory.length?100:0, detail:inventory.length?`${inventory.length} lots recorded`:"No inventory yet", priority:100 },
    { id:"count", title:"Confirm physical quantities", description:"Record current quantities, full boxes, and loose cigars.", href:"/inventory-count", action:"Count collection", complete:inventory.length>0&&counted===inventory.length, progress:percent(counted,inventory.length), detail:inventory.length?`${counted} of ${inventory.length} lots counted`:"Add inventory first", priority:90 },
    { id:"humidor", title:"Create a humidor", description:"Set the temperature and humidity range you want to maintain.", href:"/humidors", action:"Set up humidor", complete:humidors.length>0, progress:humidors.length?100:0, detail:humidors.length?`${humidors.length} storage environment${humidors.length===1?"":"s"}`:"No humidor configured", priority:80 },
    { id:"sensor", title:"Connect climate data", description:"Register a sensor and connect it to a humidor.", href:"/sensors", action:"Connect sensor", complete:connectedSensors>0, progress:sensors.length?percent(connectedSensors,sensors.length):0, detail:sensors.length?`${connectedSensors} of ${sensors.length} sensors ready`:"No sensor registered", priority:70 },
    { id:"valuation", title:"Document replacement value", description:"Add source-backed per-cigar values to protect the collection.", href:"/valuations", action:"Review valuations", complete:inventory.length>0&&valued===inventory.length, progress:percent(valued,inventory.length), detail:inventory.length?`${valued} of ${inventory.length} lots valued`:"Add inventory first", priority:60 },
    { id:"verification", title:"Verify boxed Cuban cigars", description:"Preserve box codes and Habanos seal evidence.", href:"/verification", action:"Review verification", complete:boxedCuban.length===0||verifiedCuban===boxedCuban.length, progress:boxedCuban.length?percent(verifiedCuban,boxedCuban.length):100, detail:boxedCuban.length?`${verifiedCuban} of ${boxedCuban.length} boxed Cuban lots verified`:"No boxed Cuban lots in scope", priority:50 },
    { id:"collection", title:"Create a collectible set", description:"Group special releases and value the complete presentation.", href:"/collections", action:"Create collection", complete:collections.length>0, progress:collections.length?100:0, detail:collections.length?`${collections.length} collection${collections.length===1?"":"s"} created`:"No collections created", priority:40 },
    { id:"backup", title:"Download a recovery backup", description:"Preserve a point-in-time copy of the inventory outside the app.", href:"/inventory-integrity", action:"Open integrity center", complete:backup, progress:backup?100:0, detail:backup?"Inventory backup recorded":"No completed backup recorded", priority:30 },
  ];
  return steps;
}

export function onboardingSummary(steps: OnboardingStep[]) {
  const completed = steps.filter(step => step.complete).length;
  const next = [...steps].filter(step => !step.complete).sort((a,b) => b.priority-a.priority)[0];
  return { completed, total: steps.length, percent: percent(completed, steps.length), next };
}
