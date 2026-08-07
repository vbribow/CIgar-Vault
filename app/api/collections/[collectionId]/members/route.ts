import{NextResponse}from"next/server";
import{z}from"zod";
import{authorizeWrite,dataMode}from"@/lib/config";
import{loadInventory}from"@/lib/inventory";
import{updateInventoryRow}from"@/lib/smartsheet";
import{saveOwnedRecordIfUnchanged}from"@/lib/user-data";
import{recordRevision}from"@/lib/record-revision";
const Body=z.object({inventoryId:z.string().trim().min(1).max(100)}).strict();
export async function DELETE(request:Request,{params}:{params:Promise<{collectionId:string}>}){
 try{const{collectionId}=await params,{inventoryId}=Body.parse(await request.json()),item=(await loadInventory()).find(value=>value.inventoryId===inventoryId);
  if(!item)return NextResponse.json({error:"Inventory lot not found"},{status:404});
  if(item.collectionId!==collectionId)return NextResponse.json({error:"This cigar is not assigned to that collection"},{status:409});
  const expectedRevision=request.headers.get("if-match");
  if(!expectedRevision)return NextResponse.json({error:"Refresh this collection before changing its membership."},{status:428});
  if(expectedRevision!==recordRevision(item))return NextResponse.json({error:"This cigar changed on another device. Refresh the collection and review the newer record before removing its link."},{status:409});
  const corrected={...item,collectionId:undefined};
  const saveResult=await saveOwnedRecordIfUnchanged("inventory",inventoryId,corrected,expectedRevision);
  if(saveResult==="saved")return NextResponse.json({data:corrected,revision:recordRevision(corrected)});
  if(saveResult==="conflict")return NextResponse.json({error:"This cigar changed while the collection link was being removed. The newer record was preserved."},{status:409});
  if(!authorizeWrite(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  if(dataMode()==="mock")return NextResponse.json({error:"Writes are disabled in preview mode"},{status:409});
  await updateInventoryRow(inventoryId,corrected);return NextResponse.json({data:corrected});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Assignment correction failed"},{status:422})}
}
