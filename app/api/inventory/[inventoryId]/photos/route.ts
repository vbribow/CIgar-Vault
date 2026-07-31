import{NextResponse}from"next/server";
import{authorizeWrite,dataMode}from"@/lib/config";
import{loadInventory}from"@/lib/inventory";
import{photoBucket,photoBytesMatchType,photoFields,photoKinds,safePhotoKey,storedPhotoKey,type PhotoKind}from"@/lib/photo-storage";
import{recordRevision}from"@/lib/record-revision";
import{updateInventoryRow}from"@/lib/smartsheet";
import{createClient,supabaseConfigured}from"@/lib/supabase/server";
import{saveOwnedRecordIfUnchanged}from"@/lib/user-data";
const MAX_BYTES=12*1024*1024,allowedTypes=new Set(["image/jpeg","image/png","image/webp","application/pdf"]);
export async function POST(request:Request,{params}:{params:Promise<{inventoryId:string}>}){
 const user=supabaseConfigured()?(await(await createClient()).auth.getUser()).data.user:null,founder=authorizeWrite(request);
 if(!user&&!founder)return NextResponse.json({error:"Sign in before attaching photos"},{status:401});
 if(!user&&dataMode()==="mock")return NextResponse.json({error:"Uploads are disabled in preview mode"},{status:409});
 const{inventoryId}=await params;
 try{
  const form=await request.formData(),file=form.get("file"),kind=String(form.get("kind")||"")as PhotoKind;
  if(!(file instanceof File)||!photoKinds.includes(kind))return NextResponse.json({error:"Choose a file and photo type"},{status:422});
  if(!allowedTypes.has(file.type))return NextResponse.json({error:"Use a JPG, PNG, WebP, or PDF file. Export iPhone HEIC photos as JPG first."},{status:415});
  if(file.size<=0||file.size>MAX_BYTES)return NextResponse.json({error:"Files must be smaller than 12 MB"},{status:413});
  const item=(await loadInventory()).find(candidate=>candidate.inventoryId===inventoryId);
  if(!item)return NextResponse.json({error:"Inventory lot not found"},{status:404});
  const expectedRevision=recordRevision(item);
  const bytes=await file.arrayBuffer();
  if(!photoBytesMatchType(bytes,file.type))return NextResponse.json({error:"The file contents do not match the selected photo type. Export a fresh JPG, PNG, WebP, or PDF and try again."},{status:415});
  const ownerId=user?.id||"founder",previousKey=storedPhotoKey(item[photoFields[kind]],ownerId);
  const key=safePhotoKey(inventoryId,kind,file,user?.id),bucket=await photoBucket();
  await bucket.put(key,bytes,{httpMetadata:{contentType:file.type},customMetadata:{inventoryId,kind,originalName:file.name.slice(0,200),ownerId}});
  try{
   const url=new URL(`/api/photos/${key.split("/").map(encodeURIComponent).join("/")}`,request.url).toString(),updated={...item,[photoFields[kind]]:url};
   if(user){
    const saveResult=await saveOwnedRecordIfUnchanged("inventory",inventoryId,updated,expectedRevision);
    if(saveResult==="conflict")throw new Error("This record changed on another device during the upload. The newer record was preserved; refresh and attach the photo again.");
    if(saveResult!=="saved")throw new Error("The photo could not be linked to your inventory record");
   }else await updateInventoryRow(inventoryId,updated);
   if(previousKey&&previousKey!==key)await bucket.remove(previousKey).catch(()=>undefined);
   return NextResponse.json({data:updated,url,kind,replaced:Boolean(previousKey)});
  }catch(error){
   await bucket.remove(key).catch(()=>undefined);
   throw error;
  }
 }catch(error){const message=error instanceof Error?error.message:"Upload failed";return NextResponse.json({error:message},{status:message.includes("changed on another device")?409:502})}
}
