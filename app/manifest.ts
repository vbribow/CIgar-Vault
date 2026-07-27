import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
export default function manifest():MetadataRoute.Manifest{
  const icons:MetadataRoute.Manifest["icons"]=brand.key==="hojavia"
    ? [{src:"/hojavia-mark.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]
    : [{src:"/icons/cedriva-app-192-v4.png",sizes:"192x192",type:"image/png",purpose:"any"},{src:"/icons/cedriva-app-192-v4.png",sizes:"192x192",type:"image/png",purpose:"maskable"},{src:"/icons/cedriva-app-512-v4.png",sizes:"512x512",type:"image/png",purpose:"any"},{src:"/icons/cedriva-app-512-v4.png",sizes:"512x512",type:"image/png",purpose:"maskable"}];
  return{id:brand.key==="hojavia"?"/hojavia-app":"/cedriva-app",name:brand.name,short_name:brand.asciiName,description:brand.description,start_url:`/?source=${brand.key}-app`,scope:"/",display:"standalone",background_color:brand.isPreview?"#173A37":"#0f0d0b",theme_color:brand.isPreview?"#173A37":"#0f0d0b",orientation:"portrait-primary",categories:["lifestyle","utilities"],icons};
}
