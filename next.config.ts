import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Private development previews are opened through both loopback and the
  // workstation's LAN address. Permit those hosts so Next can complete its
  // development client connection and hydrate interactive controls.
  allowedDevOrigins: ["127.0.0.1", "192.168.1.104", "192.168.1.236"],
};

export default nextConfig;
