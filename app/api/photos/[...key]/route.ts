import { photoBucket } from "@/lib/photo-storage";
import { createClient,supabaseConfigured } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const user=supabaseConfigured()?(await(await createClient()).auth.getUser()).data.user:null;
  if(!user)return new Response("Unauthorized",{status:401});
  if(key[0]!==user.id)return new Response("Forbidden",{status:403});
  const object = await (await photoBucket()).get(key.join("/"));
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
