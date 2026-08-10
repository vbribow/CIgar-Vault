const normalizedHeader = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function csvRows(text:string) {
  const rows:string[][]=[];
  let row:string[]=[], cell="", quoted=false;
  for(let index=0;index<text.length;index++){
    const character=text[index];
    if(character==='"'&&text[index+1]==='"'){cell+='"';index++;}
    else if(character==='"')quoted=!quoted;
    else if(character===","&&!quoted){row.push(cell.trim());cell="";}
    else if((character==="\n"||character==="\r")&&!quoted){
      if(character==="\r"&&text[index+1]==="\n")index++;
      row.push(cell.trim());
      if(row.some(Boolean))rows.push(row);
      row=[];cell="";
    } else cell+=character;
  }
  row.push(cell.trim());
  if(row.some(Boolean))rows.push(row);
  return rows;
}

function timestamp(value:string) {
  const match=value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if(match){
    const [,month,day,yearValue,hourValue,minute,second="0",meridiem]=match;
    const year=Number(yearValue)<100?2000+Number(yearValue):Number(yearValue);
    let hour=Number(hourValue);
    if(meridiem){hour%=12;if(meridiem.toUpperCase()==="PM")hour+=12;}
    const result=new Date(year,Number(month)-1,Number(day),hour,Number(minute),Number(second));
    return Number.isFinite(result.getTime())?result.toISOString():undefined;
  }
  const result=new Date(value);
  return Number.isFinite(result.getTime())?result.toISOString():undefined;
}

export type TempiCsvReading={recordedAt:string;temperatureF:number;humidity:number;batteryPercent?:number};

export function parseTempiCsv(text:string,maxReadings=5000){
  const rows=csvRows(text);
  const headerIndex=rows.findIndex(row=>{
    const headers=row.map(normalizedHeader);
    return headers.some(value=>value.includes("time")||value.includes("date"))&&headers.some(value=>value.includes("temp"))&&headers.some(value=>value.includes("humidity")||value==="rh");
  });
  if(headerIndex<0)throw new Error("Could not identify the Tempi date, temperature, and humidity columns");
  const headers=rows[headerIndex].map(normalizedHeader);
  const find=(patterns:string[])=>headers.findIndex(header=>patterns.some(pattern=>header.includes(pattern)));
  const time=find(["timestamp","datetime","recordedat","time","date"]);
  const humidity=find(["relativehumidity","humidity","rh"]);
  const fahrenheit=headers.findIndex(header=>header.includes("temp")&&(header.includes("fahrenheit")||header.endsWith("f")));
  const celsius=headers.findIndex(header=>header.includes("temp")&&(header.includes("celsius")||header.endsWith("c")));
  const temperature=fahrenheit>=0?fahrenheit:celsius>=0?celsius:find(["temperature","temp"]);
  const battery=find(["battery"]);
  if(time<0||temperature<0||humidity<0)throw new Error("Could not identify the Tempi date, temperature, and humidity columns");
  const parsed=rows.slice(headerIndex+1).flatMap(row=>{
    const recordedAt=timestamp(row[time]||"");
    const rawTemperature=Number(row[temperature]);
    const rh=Number(row[humidity]);
    if(!recordedAt||!Number.isFinite(rawTemperature)||!Number.isFinite(rh))return[];
    const temperatureF=fahrenheit>=0?rawTemperature:rawTemperature*9/5+32;
    const batteryPercent=battery>=0&&row[battery]!==""?Number(row[battery]):undefined;
    return [{recordedAt,temperatureF,humidity:rh,batteryPercent:Number.isFinite(batteryPercent)?batteryPercent:undefined}];
  });
  if(!parsed.length)throw new Error("No valid Tempi readings were found");
  const sampleEvery=Math.max(1,Math.ceil(parsed.length/maxReadings));
  return {readings:parsed.filter((_,index)=>index%sampleEvery===0),totalReadings:parsed.length,sampleEvery};
}
