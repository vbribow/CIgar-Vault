import { z } from "zod";

const optionalText=z.string().trim().max(2000).optional();
const humidorFields={humidorId:z.string().trim().min(1).max(100),name:z.string().trim().min(1).max(200),type:optionalText,climateProfile:z.enum(["new-world","habanos","mixed","aging-cellar","custom"]).optional(),capacity:z.coerce.number().int().positive().optional(),location:optionalText,targetTempF:z.coerce.number().min(40).max(90),minTempF:z.coerce.number().min(40).max(90),maxTempF:z.coerce.number().min(40).max(90),targetHumidity:z.coerce.number().min(30).max(90),minHumidity:z.coerce.number().min(30).max(90),maxHumidity:z.coerce.number().min(30).max(90),humidificationDevice:optionalText,sensorName:optionalText,photoLink:z.string().trim().url().optional(),notes:optionalText,memberIds:z.array(z.string()).default([])};
const validateRanges=(v:{minTempF:number;targetTempF:number;maxTempF:number;minHumidity:number;targetHumidity:number;maxHumidity:number},c:z.RefinementCtx)=>{if(v.minTempF>v.targetTempF||v.targetTempF>v.maxTempF)c.addIssue({code:"custom",path:["targetTempF"],message:"Target temperature must be inside the selected range"});if(v.minHumidity>v.targetHumidity||v.targetHumidity>v.maxHumidity)c.addIssue({code:"custom",path:["targetHumidity"],message:"Target humidity must be inside the selected range"});};

export const HumidorSchema=z.object(humidorFields).strict().superRefine(validateRanges);
const {humidorId:_humidorId,...humidorCreateFields}=humidorFields;
export const HumidorCreateSchema=z.object({...humidorCreateFields,submissionId:z.string().uuid().optional()}).strict().superRefine(validateRanges);
export const HumidorUpdateSchema=z.object({...humidorFields,action:z.literal("update")}).strict().superRefine(validateRanges);
export const HumidorReadingSchema=z.object({humidorId:z.string().trim().min(1),recordedAt:z.string().trim().min(1),temperatureF:z.coerce.number().min(20).max(120),humidity:z.coerce.number().min(0).max(100),source:z.string().trim().max(100).optional(),notes:optionalText}).strict();
export const HumidorReadingCreateSchema=HumidorReadingSchema.extend({submissionId:z.string().uuid().optional()}).strict();
