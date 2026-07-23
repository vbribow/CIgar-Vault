"use client";
import { useEffect } from "react";
export function ProductEvent({eventType,properties}:{eventType:string;properties?:Record<string,string>}){const serialized=JSON.stringify(properties||{});useEffect(()=>{void fetch("/api/product-events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventType,properties:JSON.parse(serialized)})})},[eventType,serialized]);return null}
