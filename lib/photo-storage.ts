import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "./supabase/server";

type StoredObject={body:ArrayBuffer;httpMetadata?:{contentType?:string};size?:number;writeHttpMetadata(headers:Headers):void};
type PhotoBucket={
 put(key:string,value:ArrayBuffer,options:{httpMetadata:{contentType:string};customMetadata:Record<string,string>}):Promise<void>;
 get(key:string):Promise<StoredObject|null>;
 remove(key:string):Promise<void>;
};
const bucketName="inventory-photos";

function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(!url||!key)return undefined;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
let bucketReady:Promise<void>|undefined;
async function ensureBucket(){
 const client=admin();if(!client)return;
 const{data,error}=await client.storage.getBucket(bucketName);
 if(data)return;
 if(error&&!/not found/i.test(error.message))throw error;
 const created=await client.storage.createBucket(bucketName,{public:false,fileSizeLimit:12*1024*1024,allowedMimeTypes:["image/jpeg","image/png","image/webp","application/pdf"]});
 if(created.error&&!/already exists/i.test(created.error.message))throw created.error;
}

export const photoKinds=["cigar","box","habanos-seal","box-code","provenance"] as const;
export type PhotoKind=typeof photoKinds[number];
export const photoFields:Record<PhotoKind,"photoLink"|"boxPhotoLink"|"habanosSealPhotoLink"|"boxCodePhotoLink"|"provenanceDocumentLink">={cigar:"photoLink",box:"boxPhotoLink","habanos-seal":"habanosSealPhotoLink","box-code":"boxCodePhotoLink",provenance:"provenanceDocumentLink"};

export function photoBytesMatchType(value:ArrayBuffer|Uint8Array,type:string){
 const bytes=value instanceof Uint8Array?value:new Uint8Array(value);
 if(type==="image/jpeg")return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(type==="image/png")return bytes.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((byte,index)=>bytes[index]===byte);
 if(type==="image/webp")return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 if(type==="application/pdf")return bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==="%PDF-";
 return false;
}

export function storedPhotoKey(value:string|undefined,ownerId:string){
 if(!value)return undefined;
 try{
  const url=new URL(value,"https://local.invalid"),prefix="/api/photos/";
  if(!url.pathname.startsWith(prefix))return undefined;
  const segments=url.pathname.slice(prefix.length).split("/").map(decodeURIComponent);
  if(segments.some(segment=>!segment||segment==="."||segment==="..")||segments[0]!==ownerId)return undefined;
  return segments.join("/");
 }catch{return undefined}
}

export async function photoBucket():Promise<PhotoBucket>{
 bucketReady??=ensureBucket();await bucketReady;
 return{
  async put(key,value,options){const client=admin()??await createSessionClient(),{error}=await client.storage.from(bucketName).upload(key,value,{contentType:options.httpMetadata.contentType,cacheControl:"3600",upsert:true,metadata:options.customMetadata});if(error)throw new Error(/bucket not found/i.test(error.message)?"Private photo storage has not been provisioned. Apply the latest Supabase migration.":error.message)},
  async get(key){const client=admin()??await createSessionClient(),{data,error}=await client.storage.from(bucketName).download(key);if(error){if(/not found|does not exist/i.test(error.message))return null;throw error}const contentType=data.type||"application/octet-stream",body=await data.arrayBuffer();return{body,size:body.byteLength,httpMetadata:{contentType},writeHttpMetadata(headers){headers.set("Content-Type",contentType);headers.set("Content-Length",String(body.byteLength))}}},
  async remove(key){const client=admin()??await createSessionClient(),{error}=await client.storage.from(bucketName).remove([key]);if(error&&!/not found|does not exist/i.test(error.message))throw error}
 };
}

export function safePhotoKey(inventoryId:string,kind:PhotoKind,file:File,ownerId?:string){const extension=file.name.toLowerCase().match(/\.(jpe?g|png|webp|pdf)$/)?.[1]||(file.type==="application/pdf"?"pdf":"jpg"),owner=(ownerId||"founder").replace(/[^a-zA-Z0-9_-]/g,"-");return`${owner}/${inventoryId.replace(/[^a-zA-Z0-9_-]/g,"-")}/${kind}/${crypto.randomUUID()}.${extension}`}
