export function formatLocalDateTime(
  value:string,
  locales?:Intl.LocalesArgument,
  timeZone?:string,
){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return "Time unavailable";
  return new Intl.DateTimeFormat(locales,{
    timeZone,
    month:"short",
    day:"numeric",
    year:"numeric",
    hour:"numeric",
    minute:"2-digit",
  }).format(date);
}
