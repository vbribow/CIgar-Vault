import type { Metadata,Viewport } from "next";
import { AppNavigation } from "@/components/app-navigation";
import { PwaManager } from "@/components/pwa-manager";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "Cedriva — Private Collection Intelligence", template: "%s · Cedriva" },
  description: "Preserve your collection, deepen your knowledge, and help grow the culture of premium cigars.",
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Cedriva"},
  icons:{icon:[{url:"/icons/cigar-vault-192.png",sizes:"192x192",type:"image/png"}],apple:[{url:"/icons/cigar-vault-192.png",sizes:"192x192",type:"image/png"}]},
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#100d0b"};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppNavigation />{children}<PwaManager/></body>
    </html>
  );
}
