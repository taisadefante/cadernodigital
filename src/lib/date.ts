import type { Recurrence } from "@/types/note";
export function todayIso(){const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
export function addRecurrence(date:string, recurrence:Recurrence):string{
  const [y,m,d]=date.split("-").map(Number); const x=new Date(y,m-1,d);
  if(recurrence==="daily") x.setDate(x.getDate()+1);
  if(recurrence==="weekly") x.setDate(x.getDate()+7);
  if(recurrence==="monthly") x.setMonth(x.getMonth()+1);
  if(recurrence==="yearly") x.setFullYear(x.getFullYear()+1);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
}
