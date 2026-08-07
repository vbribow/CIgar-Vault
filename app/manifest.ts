import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
export default function manifest():MetadataRoute.Manifest{
  const icons:MetadataRoute.Manifest["icons"]=[
    {src:"/icons/hojavia-app-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
    {src:"/icons/hojavia-app-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
    {src:"/icons/hojavia-app-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"},
    {src:"/hojavia-mark.svg",sizes:"any",type:"image/svg+xml",purpose:"any"},
  ];
  return{id:"/hojavia-app",name:brand.name,short_name:brand.asciiName,description:brand.description,start_url:"/?source=hojavia-app",scope:"/",display:"standalone",background_color:"#173A37",theme_color:"#173A37",orientation:"portrait-primary",categories:["lifestyle","utilities"],icons,shortcuts:[
    {name:"My collection",short_name:"Vault",description:"Open your private cigar collection.",url:"/inventory",icons:[{src:"/icons/hojavia-app-192.png",sizes:"192x192",type:"image/png"}]},
    {name:"Discover cigars",short_name:"Discover",description:"Explore cigar stories, knowledge, and culture.",url:"/discover",icons:[{src:"/icons/hojavia-app-192.png",sizes:"192x192",type:"image/png"}]},
    {name:"Learn",short_name:"Learn",description:"Continue a premium cigar learning pathway.",url:"/learn",icons:[{src:"/icons/hojavia-app-192.png",sizes:"192x192",type:"image/png"}]},
  ]};
}
