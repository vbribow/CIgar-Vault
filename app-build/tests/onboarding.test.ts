import assert from "node:assert/strict";
import test from "node:test";
import { buildOnboardingSteps, onboardingSummary } from "../lib/onboarding";

const inventory = [{ inventoryId:"I1", brand:"Cohiba", line:"Siglo", vitola:"IV", currentQty:20, retailValue:50, packaging:"Box", boxCode:"ABC", habanosSealPhotoLink:"https://example.com/seal.jpg", habanosVerified:true }];

test("onboarding completion is derived from collector records",()=>{
  const steps=buildOnboardingSteps({inventory,collections:[{collectionId:"C1",name:"Set"}],humidors:[{humidorId:"H1",name:"Vault",targetTempF:68,minTempF:65,maxTempF:72,targetHumidity:67,minHumidity:63,maxHumidity:70}],sensors:[{sensorId:"S1",humidorId:"H1",provider:"Tempi",name:"Tempi",syncMethod:"CSV import",connectionStatus:"Connected"}],valuations:[],integrityAudits:[{action:"inventory-backup"}]});
  assert.equal(steps.every(step=>step.complete),true);
  assert.deepEqual(onboardingSummary(steps),{completed:8,total:8,percent:100,next:undefined});
});

test("onboarding recommends the highest-priority incomplete action",()=>{
  const steps=buildOnboardingSteps({inventory:[],collections:[],humidors:[],sensors:[],valuations:[]});
  const summary=onboardingSummary(steps);
  assert.equal(summary.next?.id,"inventory");
  assert.equal(summary.percent,13);
});
