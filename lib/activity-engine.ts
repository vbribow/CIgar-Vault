import type { ActivityInput } from "./activity-model";
import { normalizeInventory } from "./inventory-model";
import type { InventoryActivity,InventoryItem } from "./types";

function removeSticks(item:InventoryItem,quantity:number){if(quantity>(item.currentQty??0))throw new Error(`Only ${item.currentQty??0} cigars remain`);let boxes=item.fullBoxQty??0;let loose=item.looseStickQty??(item.fullBoxQty===undefined?item.currentQty??0:0);while(quantity>loose&&boxes>0&&item.sticksPerBox){boxes-=1;loose+=item.sticksPerBox}if(quantity>loose)throw new Error("Count the box and loose-stick breakdown before removing this quantity");return normalizeInventory({...item,fullBoxQty:boxes,looseStickQty:loose-quantity})}

export function applyActivity(item:InventoryItem,input:ActivityInput,now=new Date()){
  let after=item;const beforeBoxes=item.fullBoxQty??0;const beforeLoose=item.looseStickQty??(item.fullBoxQty===undefined?item.currentQty??0:0);const boxSticks=input.boxes*(item.sticksPerBox??0);
  if((input.boxes>0||input.eventType==="Open box")&&!item.sticksPerBox)throw new Error("Set cigars per box on this lot first");
  if(["Purchase","Add sticks","Correction"].includes(input.eventType))after=normalizeInventory({...item,fullBoxQty:beforeBoxes+input.boxes,looseStickQty:beforeLoose+input.quantity});
  if(input.eventType==="Add box")after=normalizeInventory({...item,fullBoxQty:beforeBoxes+input.boxes,looseStickQty:beforeLoose});
  if(input.eventType==="Open box"){if(beforeBoxes<1)throw new Error("No full box is available to open");after=normalizeInventory({...item,fullBoxQty:beforeBoxes-1,looseStickQty:beforeLoose+(item.sticksPerBox??0)})}
  if(["Smoke","Gift","Sale","Damaged / discarded"].includes(input.eventType))after=removeSticks(item,input.eventType==="Smoke"?Math.max(1,input.quantity):input.quantity+boxSticks);
  if(input.eventType==="Storage move")after=normalizeInventory({...item,storageLocationId:input.toStorage});
  const activity:InventoryActivity={activityId:`ACT-${crypto.randomUUID()}`,inventoryId:item.inventoryId,eventDate:input.eventDate,eventType:input.eventType,quantityChange:(after.currentQty??0)-(item.currentQty??0),boxesChange:(after.fullBoxQty??0)-beforeBoxes,looseSticksChange:(after.looseStickQty??0)-beforeLoose,totalAmount:input.totalAmount,fromStorage:input.eventType==="Storage move"?item.storageLocationId:undefined,toStorage:input.toStorage,resultingQuantity:after.currentQty,resultingFullBoxes:after.fullBoxQty,resultingLooseSticks:after.looseStickQty,notes:input.notes,createdAt:now.toISOString()};
  return{inventory:after,activity};
}
