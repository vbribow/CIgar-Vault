import { z } from "zod";
import type { InventoryItem, Valuation } from "./types";

export type AuctionConnectorStatus = "Research link" | "Partner feed required" | "Connected";
export type AuctionHouse = {
  id: string;
  name: string;
  specialty: string;
  homeUrl: string;
  resultsUrl?: string;
  status: AuctionConnectorStatus;
  currency: string;
  evidenceNote: string;
};

export const auctionHouses: AuctionHouse[] = [
  { id:"bond-roberts", name:"Bond Roberts", specialty:"Rare, aged, and vintage Cuban cigars", homeUrl:"https://www.bondroberts.com/", status:"Partner feed required", currency:"USD", evidenceNote:"Use only closed lots with a documented result, exact packaging, and sale date." },
  { id:"online-cigar-auctions", name:"Online Cigar Auctions · C.Gars", specialty:"Vintage cigars, limited editions, and collectible presentations", homeUrl:"https://www.onlinecigarauctions.com/", resultsUrl:"https://www.onlinecigarauctions.com/sold_lots.php?display=all", status:"Research link", currency:"GBP", evidenceNote:"Sold-lot archive is available for manual research; conversion and buyer premium must be documented." },
  { id:"cigarbid", name:"CigarBid", specialty:"Current-production cigars, samplers, and accessories", homeUrl:"https://www.cigarbid.com/", status:"Partner feed required", currency:"USD", evidenceNote:"Active bids are not completed sales. A licensed result feed is required before automatic ingestion." },
];

export const AuctionSaleSchema = z.object({
  sourceId:z.string().trim().min(1).max(100), externalLotId:z.string().trim().min(1).max(200), title:z.string().trim().min(1).max(500),
  brand:z.string().trim().min(1).max(150), line:z.string().trim().min(1).max(250), vitola:z.string().trim().min(1).max(250), vintage:z.union([z.string(),z.number()]).optional(),
  soldAt:z.iso.date(), lotPrice:z.number().nonnegative(), currency:z.string().trim().length(3), quantity:z.number().int().positive(), buyerPremiumIncluded:z.boolean(),
  condition:z.string().trim().max(1000).optional(), sourceUrl:z.string().url(), status:z.literal("Sold"),
}).strict();
export type AuctionSale = z.infer<typeof AuctionSaleSchema> & { unitPrice:number };

const normalize=(value:unknown)=>String(value??"").trim().toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function normalizeAuctionSale(input:z.input<typeof AuctionSaleSchema>):AuctionSale{
  const sale=AuctionSaleSchema.parse(input);
  return {...sale,unitPrice:Math.round(sale.lotPrice/sale.quantity*100)/100};
}
export function matchAuctionSale(sale:AuctionSale,item:InventoryItem){
  const fields:[[unknown,unknown],number][]=[[[sale.brand,item.brand],45],[[sale.line,item.line],30],[[sale.vitola,item.vitola],20],[[sale.vintage,item.vintage],5]];
  const score=fields.reduce((sum,[[left,right],weight])=>sum+(normalize(left)&&normalize(left)===normalize(right)?weight:0),0);
  return {score,decision:score===100?"Exact":score>=75?"Review":"Reject" as "Exact"|"Review"|"Reject"};
}
export function auctionCoverage(inventory:InventoryItem[],valuations:Valuation[]){
  const withSale=new Set(valuations.filter(value=>value.lastSaleValue!==undefined&&value.lastSaleDate&&value.lastSaleSourceUrl).map(value=>value.inventoryId));
  return {lots:inventory.length,withVerifiedSale:inventory.filter(item=>withSale.has(item.inventoryId)).length,missingSale:inventory.filter(item=>!withSale.has(item.inventoryId)).length};
}
