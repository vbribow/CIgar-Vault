import type { Metadata } from "next";
import { AppNavigation } from "@/components/app-navigation";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "Cigar Vault — Private Collection Intelligence", template: "%s · Cigar Vault" },
  description: "Inventory, value, provenance, climate protection, collectible sets, and acquisition intelligence for serious cigar collectors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppNavigation />{children}</body>
    </html>
  );
}
