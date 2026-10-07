import { readFileSync } from "node:fs";

const checks=[
  ["Account and recovery","app/account/page.tsx",["recover","export"]],
  ["Vault search and editing","components/inventory-manager.tsx",["vaultSearch","Edit"]],
  ["Smoke logging","components/records-manager.tsx",["Save smoke","smokeSource"]],
  ["Personal and community rankings","components/community-hub.tsx",["my-top-10","communityRanking"]],
  ["Humidor monitoring","app/sensors/page.tsx",["SensorDashboard","SensorSyncPanel"]],
  ["Lounge discovery","app/places/page.tsx",["PlaceDirectory"]],
  ["Logout","components/app-navigation.tsx",["DeviceAwareSignOut"]],
];
const failures=[];
for(const[name,file,markers]of checks){
  let source="";
  try{source=readFileSync(new URL(`../${file}`,import.meta.url),"utf8")}catch{failures.push(`${name}: ${file} is missing`);continue}
  for(const marker of markers)if(!source.includes(marker))failures.push(`${name}: ${file} is missing ${JSON.stringify(marker)}`);
}
if(failures.length){console.error(`Launch journey audit failed:\n${failures.map(value=>`- ${value}`).join("\n")}`);process.exit(1)}
console.log(`Launch journey audit passed: ${checks.length} critical journeys have their required entry points.`);
