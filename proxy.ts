import { NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Private Sites deployments already enforce owner authentication.
  if (process.env.SITES_DEPLOYMENT === "true") return NextResponse.next();
  const publicPath = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/recover" || request.nextUrl.pathname === "/reset-password" || request.nextUrl.pathname.startsWith("/auth/");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return updateSupabaseSession(request);

  // Keep account recovery reachable during a configuration or provider outage.
  if (publicPath) return NextResponse.next();

  const password = process.env.APP_ACCESS_PASSWORD;
  if (!password) return process.env.NODE_ENV === "production" ? new NextResponse("Authentication is not configured", { status: 503 }) : NextResponse.next();
  const expectedUser = process.env.APP_ACCESS_USER || "founder";
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try { const [user, supplied] = atob(authorization.slice(6)).split(":"); if (user === expectedUser && supplied === password) return NextResponse.next(); }
    catch { /* malformed credentials */ }
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Cigar Vault", charset="UTF-8"' } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"] };
