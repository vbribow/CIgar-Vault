const exactPublicPaths=new Set([
  "/login","/recover","/reset-password","/offline","/install","/privacy","/terms",
  "/beta-agreement","/constitution","/manifesto","/data-model","/industry","/learn",
  "/partners/join",
]);

export function isPublicAppPath(pathname:string){
  return exactPublicPaths.has(pathname)
    ||pathname.startsWith("/industry/")
    ||pathname.startsWith("/learn/")
    ||pathname.startsWith("/auth/")
    ||pathname.startsWith("/r/")
    ||pathname.startsWith("/partners/invite/");
}
