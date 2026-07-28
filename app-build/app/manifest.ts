import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
export default function manifest():MetadataRoute.Manifest{
  const icons:MetadataRoute.Manifest["icons"]=[
    {src:"/icons/hojavia-app-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
    {src:"/icons/hojavia-app-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
    {src:"/icons/hojavia-app-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"},
    {src:"/hojavia-mark.svg",sizes:"any",type:"image/svg+xml",purpose:"any"},
  ];
  return{id:"/hojavia-app",name:brand.name,short_name:brand.asciiName,description:brand.description,start_url:"/?source=hojavia-app",scope:"/",display:"standalone",background_color:"#173A37",theme_color:"#173A37",orientation:"portrait-primary",categories:["lifestyle","utilities"],icons};
}
