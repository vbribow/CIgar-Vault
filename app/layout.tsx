import type { Metadata,Viewport } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { AppNavigation } from "@/components/app-navigation";
import { PwaManager } from "@/components/pwa-manager";
import { JourneyArrival } from "@/components/journey-arrival";
import { cedrivaDescription } from "@/lib/seo";
import "./styles.css";

export async function generateMetadata():Promise<Metadata>{
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")||requestHeaders.get("host")||"cedriva.com";
  const protocol=requestHeaders.get("x-forwarded-proto")||(host.includes("localhost")?"http":"https");
  const origin=new URL(`${protocol}://${host}`);
  const title="Cedriva — The Home of Premium Cigar Collecting";
  const description=cedrivaDescription;
  return{
    metadataBase:origin,
    applicationName:"Cedriva",
    title:{default:title,template:"%s · Cedriva"},
    description,
    authors:[{name:"Cedriva"}],
    creator:"Cedriva",
    publisher:"Cedriva",
    category:"Premium cigar education and collection stewardship",
    robots:{index:false,follow:false},
    verification:process.env.GOOGLE_SITE_VERIFICATION?{google:process.env.GOOGLE_SITE_VERIFICATION}:undefined,
    manifest:"/manifest.webmanifest",
    appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Cedriva"},
    icons:{icon:[{url:"/cedriva-mark.svg",type:"image/svg+xml"},{url:"/icons/cedriva-app-192-v4.png",sizes:"192x192",type:"image/png"}],apple:[{url:"/icons/cedriva-apple-180-v4.png",sizes:"180x180",type:"image/png"}]},
    other:{"mobile-web-app-capable":"yes","apple-mobile-web-app-title":"Cedriva"},
    openGraph:{type:"website",url:origin,title,description,siteName:"Cedriva",images:[{url:new URL("/og.png",origin),width:1659,height:948,alt:"Cedriva — preserve, honor, and grow premium cigar culture"}]},
    twitter:{card:"summary_large_image",title,description,images:[new URL("/og.png",origin)]},
  };
}
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#0f0d0b"};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppNavigation /><Suspense fallback={null}><JourneyArrival/></Suspense>{children}<PwaManager/></body>
    </html>
  );
}
