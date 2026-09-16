"use client";
import type { Note } from "@/types/note";
function download(content:BlobPart,type:string,name:string){ const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url); }
export function exportJson(notes:Note[]){
  const clean=notes.map(({id,createdAt,updatedAt,deletedAt,...n})=>({id,...n,createdAt:createdAt?.toDate?.().toISOString()||null,updatedAt:updatedAt?.toDate?.().toISOString()||null,deletedAt:deletedAt?.toDate?.().toISOString()||null}));
  download(JSON.stringify(clean,null,2),"application/json;charset=utf-8",`backup-caderno-${new Date().toISOString().slice(0,10)}.json`);
}
export function exportCsv(notes:Note[]){
  const esc=(v:unknown)=>`"${String(v??"").replace(/"/g,'""')}"`;
  const rows=[["Título","Conteúdo","Categoria","Prioridade","Data","Hora","Tags","Concluída"],...notes.map(n=>[n.title,n.content,n.category,n.priority,n.date||"",n.time||"",n.tags.join("; "),n.completed?"Sim":"Não"])];
  download("\ufeff"+rows.map(r=>r.map(esc).join(";")).join("\n"),"text/csv;charset=utf-8",`caderno-${new Date().toISOString().slice(0,10)}.csv`);
}
