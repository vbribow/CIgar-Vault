import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";
import hostingConfig from "./.openai/hosting.json";
export default defineConfig(async()=>{const{cloudflare}=await import("@cloudflare/vite-plugin");return{plugins:[vinext(),sites(),cloudflare({viteEnvironment:{name:"rsc",childEnvironments:["ssr"]},config:{main:"./worker/index.ts",compatibility_flags:["nodejs_compat"],r2_buckets:hostingConfig.r2?[{binding:hostingConfig.r2,bucket_name:"cigar-vault-photos"}]:[]}})]}});
