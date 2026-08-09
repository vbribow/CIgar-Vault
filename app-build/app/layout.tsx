import type { Metadata,Viewport } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { AppNavigation } from "@/components/app-navigation";
import { PwaManager } from "@/components/pwa-manager";
import { JourneyArrival } from "@/components/journey-arrival";
import { NavigationBack } from "@/components/navigation-back";
import { brand } from "@/lib/brand";
import { isPrivatePreviewHostname } from "@/lib/preview-host";
import "./styles.css";
import "./navigation-back.css";

export async function generateMetadata():Promise<Metadata>{
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")||requestHeaders.get("host")||"hojavia.com";
  const hostname=host.replace(/^\[/,"").replace(/\](:\d+)?$/,"").replace(/:\d+$/,"");
  const protocol=requestHeaders.get("x-forwarded-proto")||(isPrivatePreviewHostname(hostname)?"http":"https");
  const origin=new URL(`${protocol}://${host}`);
  const title=`${brand.name} — ${brand.brandLine}`;
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
    openGraph:{type:"website",url:origin,title,description,siteName:brand.name,images:[{url:new URL("/og.png",origin),width:1200,height:630,alt:`${brand.spokenName} — ${brand.brandLine} Premium cigar knowledge and collection stewardship.`}]},
    twitter:{card:"summary_large_image",title,description,images:[new URL("/og.png",origin)]},
  };
}
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#173A37"};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand={brand.key}>
      <body><a className="skipLink" href="#main-content">Skip to main content</a><AppNavigation /><NavigationBack/><Suspense fallback={null}><JourneyArrival/></Suspense><div id="main-content" tabIndex={-1}>{children}</div><PwaManager/></body>
    </html>
  );
}
