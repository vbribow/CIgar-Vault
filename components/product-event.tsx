"use client";
import { useEffect } from "react";
export function ProductEvent({eventType}:{eventType:string}){useEffect(()=>{void fetch("/api/product-events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventType})})},[eventType]);return null}
