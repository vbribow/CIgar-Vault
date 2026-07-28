import type { Metadata,Viewport } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { AppNavigation } from "@/components/app-navigation";
import { PwaManager } from "@/components/pwa-manager";
import { JourneyArrival } from "@/components/journey-arrival";
import { brand } from "@/lib/brand";
import "./styles.css";

export async function generateMetadata():Promise<Metadata>{
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")||requestHeaders.get("host")||"hojavia.com";
  const protocol=requestHeaders.get("x-forwarded-proto")||(host.includes("localhost")?"http":"https");
  const origin=new URL(`${protocol}://${host}`);
  const title=`${brand.name} — The Home of Premium Cigar Collecting`;
  const description=brand.description;
  return{
    metadataBase:origin,
    applicationName:brand.name,
    title:{default:title,template:`%s · ${brand.name}`},
    description,
    authors:[{name:brand.name}],
    creator:brand.name,
    publisher:brand.name,
    category:"Premium cigar education and collection stewardship",
    robots:{index:false,follow:false},
    verification:process.env.GOOGLE_SITE_VERIFICATION?{google:process.env.GOOGLE_SITE_VERIFICATION}:undefined,
    manifest:"/manifest.webmanifest",
    appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:brand.name},
    icons:{
      icon:[
        {url:"/icons/hojavia-app-192.png",sizes:"192x192",type:"image/png"},
        {url:"/icons/hojavia-app-512.png",sizes:"512x512",type:"image/png"},
        {url:"/hojavia-mark.svg",type:"image/svg+xml"},
      ],
      apple:[{url:"/icons/hojavia-apple-touch.png",sizes:"180x180",type:"image/png"}],
    },
    other:{"mobile-web-app-capable":"yes","apple-mobile-web-app-title":brand.name},
    openGraph:{type:"website",url:origin,title,description,siteName:brand.name,images:[{url:new URL("/og.png",origin),width:1659,height:948,alt:`${brand.name} — premium cigar knowledge carried forward`}]},
    twitter:{card:"summary_large_image",title,description,images:[new URL("/og.png",origin)]},
  };
}
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#173A37"};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand={brand.key}>
      <body><AppNavigation /><Suspense fallback={null}><JourneyArrival/></Suspense>{children}<PwaManager/></body>
    </html>
  );
}
