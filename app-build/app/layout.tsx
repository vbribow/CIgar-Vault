import type { Metadata,Viewport } from "next";
import { headers } from "next/headers";
import { AppNavigation } from "@/components/app-navigation";
import { PwaManager } from "@/components/pwa-manager";
import "./styles.css";

export async function generateMetadata():Promise<Metadata>{
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")||requestHeaders.get("host")||"cedriva.com";
  const protocol=requestHeaders.get("x-forwarded-proto")||(host.includes("localhost")?"http":"https");
  const origin=new URL(`${protocol}://${host}`);
  const title="Cedriva — The Home of Premium Cigar Collecting";
  const description="Learn with confidence, document with purpose, and preserve the people, stories, and traditions behind every premium cigar.";
  return{
    metadataBase:origin,
    title:{default:title,template:"%s · Cedriva"},
    description,
    manifest:"/manifest.webmanifest",
    appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Cedriva"},
    icons:{icon:[{url:"/cedriva-mark.svg",type:"image/svg+xml"},{url:"/icons/cedriva-192.png",sizes:"192x192",type:"image/png"}],apple:[{url:"/icons/cedriva-192.png",sizes:"192x192",type:"image/png"}]},
    openGraph:{type:"website",url:origin,title,description,siteName:"Cedriva",images:[{url:new URL("/og.png",origin),width:1659,height:948,alt:"Cedriva — preserve, honor, and grow premium cigar culture"}]},
    twitter:{card:"summary_large_image",title,description,images:[new URL("/og.png",origin)]},
  };
}
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#0f0d0b"};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppNavigation />{children}<PwaManager/></body>
    </html>
  );
}
