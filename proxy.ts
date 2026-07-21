import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Private Sites deployments already enforce owner authentication.
  if (process.env.SITES_DEPLOYMENT === "true") return NextResponse.next();
  const password = process.env.APP_ACCESS_PASSWORD;
  if (!password) return process.env.NODE_ENV === "production" ? new NextResponse("APP_ACCESS_PASSWORD is required", { status: 503 }) : NextResponse.next();
  const expectedUser = process.env.APP_ACCESS_USER || "founder";
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const [user, supplied] = atob(authorization.slice(6)).split(":");
      if (user === expectedUser && supplied === password) return NextResponse.next();
    } catch { /* malformed credentials */ }
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Cigar Vault", charset="UTF-8"' } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
