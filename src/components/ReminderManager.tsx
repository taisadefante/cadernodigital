"use client";
import { useEffect } from "react";
import type { Note } from "@/types/note";
export default function ReminderManager({notes}:{notes:Note[]}){
 useEffect(()=>{
  const check=()=>{
   if(typeof Notification==="undefined"||Notification.permission!=="granted") return;
   const now=Date.now();
   notes.filter(n=>!n.deletedAt&&!n.archived&&!n.completed&&n.date&&n.reminderMinutes!==null).forEach(n=>{
    const when=new Date(`${n.date}T${n.time||"09:00"}:00`).getTime(); const reminder=when-(n.reminderMinutes||0)*60000;
    if(now>=reminder && now<reminder+65000){ const key=`notified:${n.id}:${n.date}:${n.time||"09:00"}:${n.reminderMinutes}`; if(localStorage.getItem(key)) return; new Notification(n.title||"Lembrete",{body:n.content.slice(0,140)||"Você tem um compromisso."}); localStorage.setItem(key,"1"); }
   })
  }; check(); const id=window.setInterval(check,30000); return()=>window.clearInterval(id);
 },[notes]); return null;
}
