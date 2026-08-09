import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({
    error: "Retailer purchase links are web-only. The mobile collector application provides research observations without opening tobacco sales pages or using affiliate tracking.",
  }, { status: 410 });
}
