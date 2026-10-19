"use client";
import { useEffect,useState } from "react";
import { formatLocalDateTime } from "@/lib/local-date-time";

export function LocalDateTime({value}:{value:string}){
  const[label,setLabel]=useState("Local time loading…");
  useEffect(()=>setLabel(formatLocalDateTime(value)),[value]);
  return <time dateTime={value} suppressHydrationWarning>{label}</time>;
}
