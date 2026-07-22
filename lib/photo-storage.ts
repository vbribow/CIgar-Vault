import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "./supabase/server";

type StoredObject={body:ArrayBuffer;httpMetadata?:{contentType?:string};size?:number;writeHttpMetadata(headers:Headers):void};
type PhotoBucket={put(key:string,value:ArrayBuffer,options:{httpMetadata:{contentType:string};customMetadata:Record<string,string>}):Promise<void>;get(key:string):Promise<StoredObject|null>};
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
 const created=await client.storage.createBucket(bucketName,{public:false,fileSizeLimit:12*1024*1024,allowedMimeTypes:["image/jpeg","image/png","image/webp","image/heic","image/heif","application/pdf"]});
 if(created.error&&!/already exists/i.test(created.error.message))throw created.error;
}

export const photoKinds=["cigar","box","habanos-seal","box-code","provenance"] as const;
export type PhotoKind=typeof photoKinds[number];
export const photoFields:Record<PhotoKind,"photoLink"|"boxPhotoLink"|"habanosSealPhotoLink"|"boxCodePhotoLink"|"provenanceDocumentLink">={cigar:"photoLink",box:"boxPhotoLink","habanos-seal":"habanosSealPhotoLink","box-code":"boxCodePhotoLink",provenance:"provenanceDocumentLink"};

export async function photoBucket():Promise<PhotoBucket>{
 bucketReady??=ensureBucket();await bucketReady;
 return{
  async put(key,value,options){const client=admin()??await createSessionClient(),{error}=await client.storage.from(bucketName).upload(key,value,{contentType:options.httpMetadata.contentType,cacheControl:"3600",upsert:true,metadata:options.customMetadata});if(error)throw new Error(/bucket not found/i.test(error.message)?"Private photo storage has not been provisioned. Apply the latest Supabase migration.":error.message)},
  async get(key){const client=admin()??await createSessionClient(),{data,error}=await client.storage.from(bucketName).download(key);if(error){if(/not found|does not exist/i.test(error.message))return null;throw error}const contentType=data.type||"application/octet-stream",body=await data.arrayBuffer();return{body,size:body.byteLength,httpMetadata:{contentType},writeHttpMetadata(headers){headers.set("Content-Type",contentType);headers.set("Content-Length",String(body.byteLength))}}}
 };
}

export function safePhotoKey(inventoryId:string,kind:PhotoKind,file:File,ownerId?:string){const extension=file.name.toLowerCase().match(/\.(jpe?g|png|webp|heic|heif|pdf)$/)?.[1]||(file.type==="application/pdf"?"pdf":"jpg"),owner=(ownerId||"founder").replace(/[^a-zA-Z0-9_-]/g,"-");return`${owner}/${inventoryId.replace(/[^a-zA-Z0-9_-]/g,"-")}/${kind}/${crypto.randomUUID()}.${extension}`}
