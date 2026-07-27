import type { InsuranceScheduleRow } from "./insurance-report";
import type { Valuation } from "./types";
import {
  claimsUnverifiedCompletedSale,
  completedSaleLabel,
  isVerifiedCompletedSale,
  marketAskingPriceLabel,
  marketRangeText,
} from "./valuation-evidence";

const ascii=(value:unknown)=>String(value??"").replace(/[–—]/g,"-").normalize("NFKD").replace(/[^\x20-\x7E]/g," ");
const pdfText=(value:unknown)=>ascii(value).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
const fit=(value:unknown,length:number)=>{const text=ascii(value).replace(/\s+/g," ").trim();return text.length>length?`${text.slice(0,Math.max(0,length-1))}~`:text.padEnd(length)};
const dollars=(value:number|undefined)=>value===undefined?"—":`$${value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export type InsurancePdfDocument = {
  rows: InsuranceScheduleRow[];
  valuations?: Valuation[];
  generatedAt: string;
  totals?: {
    lots: number;
    knownQuantity: number;
    scheduledReplacementValue: number;
  };
};

function evidenceLines(inventoryId:string,valuations:Valuation[]){
  const records=valuations
    .filter(value=>value.inventoryId===inventoryId&&!value.invalidatedAt)
    .sort((a,b)=>b.valuationDate.localeCompare(a.valuationDate));
  const retail=records.find(value=>value.replacementValue!==undefined);
  const asking=records.find(value=>value.askingPrice!==undefined&&Boolean(value.askingPriceSourceUrl));
  const range=records.find(value=>value.marketRangeLow!==undefined&&value.marketRangeHigh!==undefined);
  const sale=records.find(isVerifiedCompletedSale);
  const legacy=records.find(claimsUnverifiedCompletedSale);
  return [
    retail?.replacementValue===undefined?undefined:`Retail replacement: ${dollars(retail.replacementValue)} per cigar`,
    asking?.askingPrice===undefined?undefined:`${marketAskingPriceLabel}: ${dollars(asking.askingPrice)} per cigar`,
    range?`Estimated market range: ${marketRangeText(range)} per cigar`:undefined,
    sale?.lastSaleValue===undefined?undefined:`${completedSaleLabel(sale)}: ${dollars(sale.lastSaleValue)} per cigar · ${sale.lastSaleDate}`,
    legacy&&!sale?`${completedSaleLabel(legacy)}${legacy.lastSaleValue!==undefined||legacy.marketValue!==undefined?`: ${dollars(legacy.lastSaleValue??legacy.marketValue)} per cigar`:""}`:undefined,
  ].filter((line):line is string=>Boolean(line));
}

function pageLines(rows:InsuranceScheduleRow[],valuations:Valuation[],generatedAt:string,page:number,pages:number,totals:InsurancePdfDocument["totals"]){
  const lines=[
    "CEDRIVA — PRIVATE INSURANCE SCHEDULE",
    `Generated ${generatedAt.replace("T"," ").slice(0,19)} UTC · Page ${page} of ${pages}`,
    page===1&&totals?`Active lots: ${totals.lots} · Known cigars: ${totals.knownQuantity} · Scheduled retail replacement: ${dollars(totals.scheduledReplacementValue)}`:"",
    "",
    `${fit("Inventory ID",14)} ${fit("Cigar",42)} ${fit("Year",6)} ${fit("Qty",6)} ${fit("Unit",12)} ${fit("Scheduled",12)} ${fit("Storage",18)}`,
    "-".repeat(116),
  ];
  for(const row of rows){
    lines.push(`${fit(row.inventoryId,14)} ${fit(row.cigar,42)} ${fit(row.vintage,6)} ${fit(row.quantity,6)} ${fit(dollars(row.unitReplacement),12)} ${fit(dollars(row.scheduledValue),12)} ${fit(row.storage,18)}`);
    const evidence=evidenceLines(row.inventoryId,valuations);
    if(evidence.length)for(const line of evidence)lines.push(`  Evidence · ${line}`);
    else lines.push("  Evidence · No documented market evidence");
  }
  lines.push("","Owner-maintained collection record; not an appraisal, insurance binder, proof of ownership, or authenticity guarantee.");
  return lines;
}

export function buildInsurancePdf(rows:InsuranceScheduleRow[],generatedAt:string,valuations:Valuation[]=[]){
  const totals={
    lots:rows.length,
    knownQuantity:rows.reduce((sum,row)=>sum+(row.quantity??0),0),
    scheduledReplacementValue:rows.reduce((sum,row)=>sum+(row.scheduledValue??0),0),
  };
  return buildInsurancePdfDocument({rows,valuations,generatedAt,totals});
}

export function buildInsurancePdfDocument({rows,valuations=[],generatedAt,totals}:InsurancePdfDocument){
  // Six records per landscape page leaves room for the maximum five distinct
  // evidence lines without clipping or font/asset loading.
  const perPage=6,pages=Math.max(1,Math.ceil(rows.length/perPage));
  const objects:string[]=[];
  const pageIds=Array.from({length:pages},(_,index)=>4+index*2);
  objects[0]="<< /Type /Catalog /Pages 2 0 R >>";
  objects[1]=`<< /Type /Pages /Count ${pages} /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] >>`;
  objects[2]="<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";
  for(let index=0;index<pages;index++){
    const pageId=pageIds[index],contentId=pageId+1;
    const lines=pageLines(rows.slice(index*perPage,(index+1)*perPage),valuations,generatedAt,index+1,pages,totals);
    const commands=lines.map((line,lineIndex)=>`1 0 0 1 30 ${570-lineIndex*13} Tm (${pdfText(line)}) Tj`).join("\n");
    const stream=`BT\n/F1 8 Tf\n${commands}\nET`;
    objects[pageId-1]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId-1]=`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;
  }
  let pdf="%PDF-1.4\n",byteLength=new TextEncoder().encode(pdf).length,offsets=[0];
  objects.forEach((object,index)=>{
    offsets[index+1]=byteLength;
    const serialized=`${index+1} 0 obj\n${object}\nendobj\n`;
    pdf+=serialized;
    byteLength+=new TextEncoder().encode(serialized).length;
  });
  const xref=byteLength;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,"0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
