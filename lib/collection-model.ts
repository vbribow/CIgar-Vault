import { z } from "zod";

const optionalText=z.string().trim().max(2000).optional();
export const CollectionInputSchema=z.object({
  collectionId:z.string().trim().min(1).max(100),name:z.string().trim().min(1).max(250),maker:optionalText,releaseYear:z.coerce.number().int().min(1800).max(2200),edition:optionalText,expectedComponents:z.coerce.number().int().positive().optional(),expectedCigars:z.coerce.number().int().positive().optional(),wholeMarketValue:z.coerce.number().finite().nonnegative().optional(),acquisitionCost:z.coerce.number().finite().nonnegative().optional(),valuationDate:z.iso.date().optional(),valuationSource:optionalText,valuationSourceUrl:z.string().trim().url().optional(),status:z.enum(["Complete","Incomplete","Opened"]).optional(),photoLink:z.string().trim().url().optional(),notes:optionalText,memberIds:z.array(z.string().trim().min(1).max(100)).default([]),
}).strict();
