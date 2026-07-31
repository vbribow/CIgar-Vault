export async function inLocationRefreshBatches<T,R>(
  rows:T[],
  worker:(row:T)=>Promise<R>,
  concurrency=5,
):Promise<R[]>{
  const bounded=Math.max(1,Math.min(10,Math.floor(concurrency)||1));
  const outcomes:R[]=[];
  for(let index=0;index<rows.length;index+=bounded){
    outcomes.push(...await Promise.all(rows.slice(index,index+bounded).map(worker)));
  }
  return outcomes;
}
