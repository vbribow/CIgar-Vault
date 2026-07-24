import{NextResponse}from"next/server";
import{z}from"zod";
import{authorizeWrite,dataMode}from"@/lib/config";
import{loadInventory}from"@/lib/inventory";
import{updateInventoryRow}from"@/lib/smartsheet";
import{saveOwnedRecord}from"@/lib/user-data";
const Body=z.object({inventoryId:z.string().trim().min(1).max(100)}).strict();
export async function DELETE(request:Request,{params}:{params:Promise<{collectionId:string}>}){
 try{const{collectionId}=await params,{inventoryId}=Body.parse(await request.json()),item=(await loadInventory()).find(value=>value.inventoryId===inventoryId);
  if(!item)return NextResponse.json({error:"Inventory lot not found"},{status:404});
  if(item.collectionId!==collectionId)return NextResponse.json({error:"This cigar is not assigned to that collection"},{status:409});
  const corrected={...item,collectionId:undefined};
  if(await saveOwnedRecord("inventory",inventoryId,corrected))return NextResponse.json({data:corrected});
  if(!authorizeWrite(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  if(dataMode()==="mock")return NextResponse.json({error:"Writes are disabled in preview mode"},{status:409});
  await updateInventoryRow(inventoryId,corrected);return NextResponse.json({data:corrected});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Assignment correction failed"},{status:422})}
}
