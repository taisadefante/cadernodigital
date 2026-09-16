"use client";
import { useEffect,useMemo,useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc,collection,deleteDoc,doc,getDocs,onSnapshot,orderBy,query,serverTimestamp,updateDoc,writeBatch } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { filterNotes } from "@/lib/search";
import { exportNotesToPdf } from "@/lib/pdf";
import { exportCsv,exportJson } from "@/lib/backup";
import { addRecurrence,todayIso } from "@/lib/date";
import type { Category,Tag,Note,NoteFilters,NoteFormData } from "@/types/note";
import NoteCard from "@/components/NoteCard";import NoteModal from "@/components/NoteModal";import ConfirmModal from "@/components/ConfirmModal";import FiltersPanel from "@/components/FiltersPanel";import CalendarView from "@/components/CalendarView";import ProfileModal from "@/components/ProfileModal";import HistoryModal from "@/components/HistoryModal";import ReminderManager from "@/components/ReminderManager";
type Section="notes"|"appointments"|"favorites"|"calendar";
const defaults:NoteFilters={search:"",priority:"all",category:"all",dateFrom:"",dateTo:"",appointment:"all",status:"all",favoritesOnly:false,sort:"updatedDesc"};
function message(e:unknown){if(e instanceof FirebaseError&&e.code==="permission-denied")return"Sem permissão. Confira as regras do Firebase.";return"Ocorreu um erro. Tente novamente."}
async function deleteNoteSubcollection(
 userId:string,
 noteId:string,
 subcollectionName:"history"|"versions"
){
 const snapshot=await getDocs(
  collection(
   db,
   "users",
   userId,
   "notes",
   noteId,
   subcollectionName
  )
 );

 const refs=snapshot.docs.map(item=>item.ref);

 for(let index=0;index<refs.length;index+=400){
  const batch=writeBatch(db);

  refs
   .slice(index,index+400)
   .forEach(ref=>batch.delete(ref));

  await batch.commit();
 }
}

async function deleteNoteTree(
 userId:string,
 noteId:string
){
 await deleteNoteSubcollection(
  userId,
  noteId,
  "history"
 );

 await deleteNoteSubcollection(
  userId,
  noteId,
  "versions"
 );

 await deleteDoc(
  doc(
   db,
   "users",
   userId,
   "notes",
   noteId
  )
 );
}
export default function NotebookApp(){
 const router=useRouter(),{user,loading:authLoading,logout}=useAuth(); const [notes,setNotes]=useState<Note[]>([]),[customCats,setCustomCats]=useState<Category[]>([]),[customTags,setCustomTags]=useState<Tag[]>([]),[loading,setLoading]=useState(true),[filters,setFilters]=useState(defaults),[section,setSection]=useState<Section>("notes"),[filtersOpen,setFiltersOpen]=useState(false),[sidebar,setSidebar]=useState(false),[sidebarHover,setSidebarHover]=useState(false),[modal,setModal]=useState(false),[editing,setEditing]=useState<Note|null>(null),[saving,setSaving]=useState(false),[deleteTarget,setDeleteTarget]=useState<Note|null>(null),[busyDelete,setBusyDelete]=useState(false),[toast,setToast]=useState<{type:"success"|"danger"|"warning";text:string}|null>(null),[profile,setProfile]=useState(false),[history,setHistory]=useState<Note|null>(null),[dark,setDarkState]=useState(false);
 const legacyCleanupRef=useRef<Set<string>>(new Set());
 useEffect(()=>{const v=localStorage.getItem("caderno-theme")==="dark";setDarkState(v)},[]); useEffect(()=>{document.documentElement.setAttribute("data-bs-theme",dark?"dark":"light");document.body.style.background=dark?"#0b1220":"#f6f8fb"},[dark]); const setDark=(v:boolean)=>{setDarkState(v);localStorage.setItem("caderno-theme",v?"dark":"light")};
 useEffect(()=>{if(!authLoading&&!user)router.replace("/login")},[authLoading,user,router]);
 useEffect(()=>{if(!user)return;setLoading(true);const unsub=onSnapshot(query(collection(db,"users",user.uid,"notes"),orderBy("updatedAt","desc")),s=>{setNotes(s.docs.map(d=>({id:d.id,...d.data(),tags:d.data().tags||[],checklist:d.data().checklist||[],recurrence:d.data().recurrence||"none",reminderMinutes:d.data().reminderMinutes??null,archived:false,deletedAt:d.data().deletedAt||null}) as Note));setLoading(false)},e=>{setToast({type:"danger",text:message(e)});setLoading(false)});const uc=onSnapshot(
 collection(db,"users",user.uid,"categories"),
 s=>setCustomCats(
  s.docs.map(d=>({id:d.id,...d.data()}) as Category)
 ),
 e=>setToast({type:"danger",text:message(e)})
);
const ut=onSnapshot(
 collection(db,"users",user.uid,"tags"),
 s=>setCustomTags(
  s.docs.map(d=>({id:d.id,...d.data()}) as Tag)
 ),
 e=>setToast({type:"danger",text:message(e)})
);
return()=>{unsub();uc();ut()}},[user]);
 useEffect(()=>{if(!user)return;notes.filter(note=>Boolean(note.deletedAt)).forEach(note=>{if(legacyCleanupRef.current.has(note.id))return;legacyCleanupRef.current.add(note.id);void deleteNoteTree(user.uid,note.id).catch(()=>legacyCleanupRef.current.delete(note.id))})},[notes,user]);
 useEffect(()=>{if(!user||loading)return;const existing=new Set(customCats.map(category=>category.name.trim().toLowerCase()));const names=Array.from(new Set(notes.map(note=>(note.category||"").trim()).filter(Boolean))).filter(name=>!existing.has(name.toLowerCase()));if(!names.length)return;void Promise.all(names.map(name=>addDoc(collection(db,"users",user.uid,"categories"),{name,createdAt:serverTimestamp()})))},[user,loading,notes,customCats]);
 useEffect(()=>{if(!user||loading)return;const existing=new Set(customTags.map(tag=>tag.name.trim().toLowerCase()));const names=Array.from(new Set(notes.flatMap(note=>note.tags||[]).map(name=>name.trim()).filter(Boolean))).filter(name=>!existing.has(name.toLowerCase()));if(!names.length)return;void Promise.all(names.map(name=>addDoc(collection(db,"users",user.uid,"tags"),{name,createdAt:serverTimestamp()})))},[user,loading,notes,customTags]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(null),3500);return()=>clearTimeout(id)},[toast]);
 const cats=useMemo(()=>customCats.map(x=>x.name).filter(Boolean).sort((a,b)=>a.localeCompare(b,"pt-BR")),[customCats]);
 const categoryCounts=useMemo(()=>notes.reduce<Record<string,number>>((acc,note)=>{const name=(note.category||"").trim();if(name)acc[name]=(acc[name]||0)+1;return acc},{}),[notes]);
 const tagCounts=useMemo(()=>notes.reduce<Record<string,number>>((acc,note)=>{(note.tags||[]).forEach(name=>{const clean=name.trim();if(clean)acc[clean]=(acc[clean]||0)+1});return acc},{}),[notes]);
 const visible=useMemo(()=>filterNotes(notes,filters,section),[notes,filters,section]); const today=todayIso(); const active=notes.filter(n=>!n.deletedAt); const stats={total:active.length,appointments:active.filter(n=>n.appointment).length,today:active.filter(n=>n.date===today&&!n.completed).length,urgent:active.filter(n=>n.priority==="urgent"&&!n.completed).length};
 async function historySnapshot(note:Note){if(!user)return;await addDoc(collection(db,"users",user.uid,"notes",note.id,"history"),{title:note.title,content:note.content,category:note.category,priority:note.priority,tags:note.tags||[],date:note.date||null,time:note.time||null,checklist:note.checklist||[],savedAt:serverTimestamp()})}
 async function save(data:NoteFormData){if(!user)return;setSaving(true);try{
  const payload={title:data.title.trim(),content:data.content.trim(),category:data.category.trim(),priority:data.priority,tags:Array.from(new Set(data.tags.map(x=>x.trim()).filter(Boolean))),checklist:data.checklist,appointment:data.appointment||Boolean(data.date),date:data.date||null,time:data.date&&data.time?data.time:null,recurrence:data.date?data.recurrence:"none",reminderMinutes:data.date?data.reminderMinutes:null,favorite:data.favorite,pinned:data.pinned,completed:data.completed,updatedAt:serverTimestamp()};
  if(editing){await historySnapshot(editing);await updateDoc(doc(db,"users",user.uid,"notes",editing.id),payload);setToast({type:"success",text:"Anotação atualizada."})}
  else{await addDoc(collection(db,"users",user.uid,"notes"),{...payload,createdAt:serverTimestamp()});setToast({type:"success",text:"Anotação criada."})}
  setModal(false);setEditing(null)
 }catch(e){setToast({type:"danger",text:message(e)})}finally{setSaving(false)}}
 async function patch(note:Note,data:Partial<Note>){if(!user)return;try{if(data.completed===true&&note.recurrence!=="none"&&note.date){await historySnapshot(note);await updateDoc(doc(db,"users",user.uid,"notes",note.id),{completed:false,date:addRecurrence(note.date,note.recurrence),updatedAt:serverTimestamp()});setToast({type:"success",text:"Compromisso concluído e próxima ocorrência criada."});return}await updateDoc(doc(db,"users",user.uid,"notes",note.id),{...data,updatedAt:serverTimestamp()})}catch(e){setToast({type:"danger",text:message(e)})}}
 async function removeNote(){if(!user||!deleteTarget)return;setBusyDelete(true);try{await deleteNoteTree(user.uid,deleteTarget.id);setDeleteTarget(null);setToast({type:"success",text:"Anotação excluída definitivamente."})}catch(e){setToast({type:"danger",text:message(e)})}finally{setBusyDelete(false)}}
 async function createCat(name:string){if(!user)return;const clean=name.trim();if(!clean)throw new Error("Informe o nome da categoria.");if(customCats.some(category=>category.name.trim().toLowerCase()===clean.toLowerCase()))throw new Error("Já existe uma categoria com esse nome.");await addDoc(collection(db,"users",user.uid,"categories"),{name:clean,createdAt:serverTimestamp()})}
 async function updateCategoryNotes(oldName:string,newName:string){if(!user)return;const affected=notes.filter(note=>note.category===oldName);for(let index=0;index<affected.length;index+=400){const batch=writeBatch(db);affected.slice(index,index+400).forEach(note=>batch.update(doc(db,"users",user.uid,"notes",note.id),{category:newName,updatedAt:serverTimestamp()}));await batch.commit()}}
 async function renameCategory(category:Category,newName:string){if(!user)return;const clean=newName.trim();if(!clean)throw new Error("Informe o nome da categoria.");if(clean===category.name)return;if(customCats.some(item=>item.id!==category.id&&item.name.trim().toLowerCase()===clean.toLowerCase()))throw new Error("Já existe uma categoria com esse nome.");await updateCategoryNotes(category.name,clean);await updateDoc(doc(db,"users",user.uid,"categories",category.id),{name:clean,updatedAt:serverTimestamp()});setFilters(current=>current.category===category.name?{...current,category:clean}:current)}
 async function deleteCategory(category:Category){if(!user)return;await updateCategoryNotes(category.name,"");await deleteDoc(doc(db,"users",user.uid,"categories",category.id));setFilters(current=>current.category===category.name?{...current,category:"all"}:current)}
 async function createTag(name:string){if(!user)return;const clean=name.trim();if(!clean)throw new Error("Informe o nome da tag.");if(customTags.some(tag=>tag.name.trim().toLowerCase()===clean.toLowerCase()))throw new Error("Já existe uma tag com esse nome.");await addDoc(collection(db,"users",user.uid,"tags"),{name:clean,createdAt:serverTimestamp()})}
 async function updateTagNotes(oldName:string,newName:string|null){if(!user)return;const affected=notes.filter(note=>(note.tags||[]).includes(oldName));for(let index=0;index<affected.length;index+=400){const batch=writeBatch(db);affected.slice(index,index+400).forEach(note=>{const next=(note.tags||[]).flatMap(tag=>tag===oldName?(newName?[newName]:[]):[tag]);batch.update(doc(db,"users",user.uid,"notes",note.id),{tags:Array.from(new Set(next)),updatedAt:serverTimestamp()})});await batch.commit()}}
 async function renameTag(tag:Tag,newName:string){if(!user)return;const clean=newName.trim();if(!clean)throw new Error("Informe o nome da tag.");if(clean===tag.name)return;if(customTags.some(item=>item.id!==tag.id&&item.name.trim().toLowerCase()===clean.toLowerCase()))throw new Error("Já existe uma tag com esse nome.");await updateTagNotes(tag.name,clean);await updateDoc(doc(db,"users",user.uid,"tags",tag.id),{name:clean,updatedAt:serverTimestamp()})}
 async function deleteTag(tag:Tag){if(!user)return;await updateTagNotes(tag.name,null);await deleteDoc(doc(db,"users",user.uid,"tags",tag.id))}
 async function notifications(){if(typeof Notification==="undefined"){setToast({type:"warning",text:"Seu navegador não suporta notificações."});return}const p=await Notification.requestPermission();setToast({type:p==="granted"?"success":"warning",text:p==="granted"?"Lembretes ativados neste navegador.":"Permissão de notificações não concedida."})}

 if(authLoading||!user){
  return (
   <main
    className="d-flex align-items-center justify-content-center"
    style={{minHeight:"100vh"}}
   >
    <div className="spinner-border text-primary"/>
   </main>
  );
 }

 const menu:Array<[Section,string,string]>=[
  ["notes","Anotações","bi-journal-text"],
  ["calendar","Calendário","bi-calendar3"],
  ["appointments","Compromissos","bi-calendar-check"],
  ["favorites","Favoritos","bi-star"],
 ];

 const displayName=
  user.displayName?.trim()
  || user.email?.split("@")[0]
  || "Usuário";

 const now=new Date();

 const todayLabel=new Intl.DateTimeFormat(
  "pt-BR",
  {
   weekday:"long",
   day:"2-digit",
   month:"long",
   year:"numeric",
  }
 ).format(now);

 function formatDatePtBr(value:string){
  const [year,month,day]=value
   .split("-")
   .map(Number);

  return new Intl.DateTimeFormat(
   "pt-BR",
   {
    day:"2-digit",
    month:"2-digit",
    year:"numeric",
   }
  ).format(
   new Date(
    year,
    month-1,
    day
   )
  );
 }

 const nextAppointment=active
  .filter(note=>{
   if(
    !note.appointment
    || !note.date
    || note.completed
   ){
    return false;
   }

   if(note.date>today){
    return true;
   }

   if(note.date<today){
    return false;
   }

   if(!note.time){
    return true;
   }

   const appointmentDate=new Date(
    `${note.date}T${note.time}:00`
   );

   return appointmentDate.getTime()>=now.getTime();
  })
  .sort((a,b)=>{
   const aTime=new Date(
    `${a.date}T${a.time||"23:59"}:00`
   ).getTime();

   const bTime=new Date(
    `${b.date}T${b.time||"23:59"}:00`
   ).getTime();

   return aTime-bTime;
  })[0]||null;

 const sectionTitle={
  notes:"Minhas anotações",
  calendar:"Calendário",
  appointments:"Compromissos",
  favorites:"Favoritos",
 }[section];

 return (
  <div
   className="d-flex"
   style={{minHeight:"100vh"}}
  >
   <ReminderManager notes={active}/>

   {sidebar&&(
    <>
     <div
      className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
      onClick={()=>setSidebar(false)}
      style={{
       zIndex:1090,
       background:"rgba(15,23,42,.42)",
      }}
     />

     <aside
      className="d-flex d-lg-none flex-column position-fixed top-0 start-0"
      style={{
       width:270,
       height:"100vh",
       background:"#0f172a",
       color:"white",
       zIndex:1100,
      }}
     >
      <div className="p-4 border-bottom border-secondary-subtle">
       <div className="d-flex gap-3 align-items-center">
        <span
         className="d-flex align-items-center justify-content-center"
         style={{
          width:45,
          height:45,
          borderRadius:13,
          background:"#2563eb",
          flexShrink:0,
         }}
        >
         <i className="bi bi-journal-richtext fs-5"/>
        </span>

        <div>
         <strong>Meu Caderno</strong>
         <small className="d-block text-secondary">
          Digital & organizado
         </small>
        </div>
       </div>
      </div>

      <nav className="p-3 flex-grow-1">
       <small className="text-uppercase text-secondary fw-semibold px-3">
        Organização
       </small>

       <div className="d-grid gap-1 mt-2">
        {menu.map(([key,label,icon])=>(
         <button
          key={key}
          className="btn text-start px-3 py-2"
          onClick={()=>{
           setSection(key);
           setSidebar(false);
          }}
          style={{
           color:section===key?"#fff":"#cbd5e1",
           background:section===key?"#1e40af":"transparent",
           border:0,
           borderRadius:11,
           whiteSpace:"nowrap",
          }}
         >
          <i className={`bi ${icon} me-3`}/>
          {label}
         </button>
        ))}
       </div>
      </nav>

      <div className="p-3 border-top border-secondary-subtle">
       <button
        className="btn btn-outline-light btn-sm w-100 mb-2"
        onClick={()=>{
         setProfile(true);
         setSidebar(false);
        }}
       >
        <i className="bi bi-person-gear me-2"/>
        Perfil e aparência
       </button>

       <button
        className="btn btn-outline-light btn-sm w-100"
        onClick={async()=>{
         await logout();
         router.replace("/login");
        }}
       >
        <i className="bi bi-box-arrow-left me-2"/>
        Sair
       </button>
      </div>
     </aside>
    </>
   )}

   <aside
    className="d-none d-lg-flex flex-column sticky-top"
    onMouseEnter={()=>setSidebarHover(true)}
    onMouseLeave={()=>setSidebarHover(false)}
    style={{
     width:sidebarHover?270:76,
     height:"100vh",
     background:"#0f172a",
     color:"white",
     zIndex:1020,
     flexShrink:0,
     overflow:"hidden",
     transition:"width .22s ease",
     boxShadow:sidebarHover
      ?"8px 0 24px rgba(15,23,42,.10)"
      :"none",
    }}
   >
    <div
     className="border-bottom border-secondary-subtle d-flex align-items-center"
     style={{
      height:84,
      padding:sidebarHover
       ?"0 18px"
       :"0 15px",
      transition:"padding .22s ease",
     }}
    >
     <span
      className="d-flex align-items-center justify-content-center"
      style={{
       width:45,
       height:45,
       borderRadius:13,
       background:"#2563eb",
       flexShrink:0,
      }}
     >
      <i className="bi bi-journal-richtext fs-5"/>
     </span>

     {sidebarHover&&(
      <div
       className="ms-3"
       style={{whiteSpace:"nowrap"}}
      >
       <strong>Meu Caderno</strong>
       <small className="d-block text-secondary">
        Digital & organizado
       </small>
      </div>
     )}
    </div>

    <nav
     className="py-3 flex-grow-1"
     style={{
      paddingLeft:sidebarHover?12:10,
      paddingRight:sidebarHover?12:10,
      transition:"padding .22s ease",
     }}
    >
     {sidebarHover&&(
      <small
       className="text-uppercase text-secondary fw-semibold d-block px-3 mb-2"
       style={{whiteSpace:"nowrap"}}
      >
       Organização
      </small>
     )}

     <div className="d-grid gap-1">
      {menu.map(([key,label,icon])=>(
       <button
        key={key}
        className="btn py-2 d-flex align-items-center"
        title={!sidebarHover?label:undefined}
        onClick={()=>{
         setSection(key);
         setSidebarHover(false);
        }}
        style={{
         color:section===key?"#fff":"#cbd5e1",
         background:section===key?"#1e40af":"transparent",
         border:0,
         borderRadius:11,
         whiteSpace:"nowrap",
         justifyContent:sidebarHover
          ?"flex-start"
          :"center",
         paddingLeft:sidebarHover?14:0,
         paddingRight:sidebarHover?14:0,
         minHeight:40,
        }}
       >
        <i
         className={`bi ${icon}`}
         style={{
          fontSize:16,
          flexShrink:0,
         }}
        />

        {sidebarHover&&(
         <span className="ms-3">
          {label}
         </span>
        )}
       </button>
      ))}
     </div>
    </nav>

    <div
     className="border-top border-secondary-subtle"
     style={{
      padding:sidebarHover?12:10,
     }}
    >
     <button
      className="btn btn-outline-light btn-sm w-100 mb-2 d-flex align-items-center"
      title={!sidebarHover?"Perfil e aparência":undefined}
      onClick={()=>{
       setProfile(true);
       setSidebarHover(false);
      }}
      style={{
       justifyContent:sidebarHover
        ?"flex-start"
        :"center",
       whiteSpace:"nowrap",
      }}
     >
      <i className="bi bi-person-gear"/>
      {sidebarHover&&(
       <span className="ms-2">
        Perfil e aparência
       </span>
      )}
     </button>

     <button
      className="btn btn-outline-light btn-sm w-100 d-flex align-items-center"
      title={!sidebarHover?"Sair":undefined}
      onClick={async()=>{
       await logout();
       router.replace("/login");
      }}
      style={{
       justifyContent:sidebarHover
        ?"flex-start"
        :"center",
       whiteSpace:"nowrap",
      }}
     >
      <i className="bi bi-box-arrow-left"/>
      {sidebarHover&&(
       <span className="ms-2">
        Sair
       </span>
      )}
     </button>
    </div>
   </aside>

   <main
    className="flex-grow-1"
    style={{minWidth:0}}
   >
    {/* HEADER NOVO */}
    <header
     className="bg-body border-bottom sticky-top"
     style={{
      zIndex:1000,
      boxShadow:"0 3px 14px rgba(15,23,42,.04)",
     }}
    >
     {/* PRIMEIRA LINHA: SISTEMA + USUÁRIO */}
     <div className="container-fluid px-3 px-lg-4 pt-3 pb-2">
      <div
       className="mx-auto d-flex align-items-center justify-content-between gap-3"
       style={{width:"100%"}}
      >
       <div className="d-flex align-items-center gap-3">
        <button
         className="btn btn-light d-lg-none"
         onClick={()=>setSidebar(true)}
         title="Abrir menu"
        >
         <i className="bi bi-list fs-5"/>
        </button>

        <div
         className="d-none d-sm-flex align-items-center justify-content-center"
         style={{
          width:42,
          height:42,
          borderRadius:13,
          background:"#2563eb",
          color:"#fff",
         }}
        >
         <i className="bi bi-journal-richtext"/>
        </div>

        <div>
         <div className="fw-bold">
          Meu Caderno Digital
         </div>
         <small className="text-secondary">
          {sectionTitle}
         </small>
        </div>
       </div>

       <div className="d-flex align-items-center gap-3">
        <div className="d-none d-md-block text-end">
         <div
          className="fw-semibold"
          style={{lineHeight:1.15}}
         >
          {displayName}
         </div>
         <small className="text-secondary">
          {user.email}
         </small>
        </div>

        <button
         type="button"
         className="btn btn-outline-danger d-flex align-items-center justify-content-center"
         onClick={async()=>{
          await logout();
          router.replace("/login");
         }}
         title="Sair"
         aria-label="Sair"
         style={{
          width:42,
          height:42,
          borderRadius:12,
         }}
        >
         <i className="bi bi-box-arrow-right"/>
        </button>
       </div>
      </div>
     </div>

    </header>

    {/* DATA DE HOJE + PRÓXIMO COMPROMISSO */}
    <div className="container-fluid px-3 px-lg-4 pt-3">
     <div
      className="mx-auto"
      style={{width:"100%"}}
     >
      <div
       className="d-flex flex-column flex-lg-row align-items-stretch gap-2 p-2"
       style={{
        border:`1px solid ${
         dark?"#334155":"#dbeafe"
        }`,
        borderRadius:16,
        background:dark
         ?"linear-gradient(135deg,#111827,#172554)"
         :"linear-gradient(135deg,#eff6ff,#f8fafc)",
       }}
      >
       <div
        className="d-flex align-items-center gap-3 px-3 py-2"
        style={{
         minWidth:300,
        }}
       >
        <span
         className="d-flex align-items-center justify-content-center flex-shrink-0"
         style={{
          width:46,
          height:46,
          borderRadius:13,
          background:dark?"#1e3a8a":"#fff",
          color:dark?"#bfdbfe":"#2563eb",
          boxShadow:dark
           ?"none"
           :"0 4px 16px rgba(37,99,235,.08)",
         }}
        >
         <i className="bi bi-calendar3 fs-5"/>
        </span>

        <div>
         <small
          className="text-secondary d-block"
          style={{fontSize:11}}
         >
          HOJE
         </small>

         <div className="fw-semibold text-capitalize">
          {todayLabel}
         </div>
        </div>
       </div>

       <div
        className="d-none d-lg-block"
        style={{
         width:1,
         background:dark?"#334155":"#dbeafe",
        }}
       />

       <div
        className="d-flex align-items-center gap-3 px-3 py-2 flex-grow-1"
        style={{minWidth:0}}
       >
        <span
         className="d-flex align-items-center justify-content-center flex-shrink-0"
         style={{
          width:46,
          height:46,
          borderRadius:13,
          background:nextAppointment
           ?dark?"#78350f":"#fffbeb"
           :dark?"#1e293b":"#fff",
          color:nextAppointment
           ?"#d97706"
           :"#64748b",
         }}
        >
         <i
          className={`bi ${
           nextAppointment
            ?"bi-alarm"
            :"bi-calendar-check"
          } fs-5`}
         />
        </span>

        <div
         className="flex-grow-1"
         style={{minWidth:0}}
        >
         <small
          className="text-secondary d-block"
          style={{fontSize:11}}
         >
          PRÓXIMO COMPROMISSO
         </small>

         {nextAppointment?(
          <>
           <div className="fw-bold text-truncate">
            {nextAppointment.title||"Sem título"}
           </div>

           <small className="text-secondary">
            {formatDatePtBr(nextAppointment.date!)}
            {nextAppointment.time
             ?` às ${nextAppointment.time}`
             :""}
            {nextAppointment.category
             ?` • ${nextAppointment.category}`
             :""}
           </small>
          </>
         ):(
          <div className="text-secondary">
           Nenhum compromisso futuro cadastrado.
          </div>
         )}
        </div>

        {nextAppointment&&(
         <button
          type="button"
          className="btn btn-sm btn-primary flex-shrink-0"
          onClick={()=>{
           setEditing(nextAppointment);
           setModal(true);
          }}
         >
          <i className="bi bi-box-arrow-up-right me-2"/>
          <span className="d-none d-sm-inline">
           Abrir
          </span>
         </button>
        )}
       </div>
      </div>
     </div>
    </div>

    <div className="container-fluid px-3 px-lg-4 py-4">
     <div
      className="mx-auto"
      style={{width:"100%"}}
     >
      <div className="mb-3">
       <h2 className="fw-bold mb-1">
        {sectionTitle}
       </h2>

       <p className="text-secondary mb-0">
        Encontre, organize e acompanhe tudo o que precisa lembrar.
       </p>
      </div>

      {/* LINHA COMPLETA DE AÇÕES DENTRO DO CONTEÚDO */}
      <div className="d-flex justify-content-center mb-3">
       <div
        className="d-flex flex-wrap align-items-center justify-content-center gap-2 w-100"
       >
        <div
         className="position-relative flex-grow-1"
         style={{
          minWidth:260,
          flex:"1 1 520px",
         }}
        >
         <i
          className="bi bi-search position-absolute text-secondary"
          style={{
           left:15,
           top:"50%",
           transform:"translateY(-50%)",
          }}
         />

         <input
          className="form-control ps-5"
          placeholder="Pesquisar dentro das anotações..."
          value={filters.search}
          onChange={event=>
           setFilters(current=>({
            ...current,
            search:event.target.value,
           }))
          }
          style={{
           minHeight:44,
           borderRadius:13,
          }}
         />
        </div>

        {section!=="calendar"&&(
         <button
          type="button"
          className={`btn ${
           filtersOpen
            ?"btn-primary"
            :"btn-outline-secondary"
          }`}
          onClick={()=>setFiltersOpen(current=>!current)}
          title="Filtros"
          style={{
           minHeight:44,
           borderRadius:12,
          }}
         >
          <i className="bi bi-sliders me-2"/>
          Filtros
         </button>
        )}

        <div className="dropdown">
         <button
          className="btn btn-outline-secondary dropdown-toggle"
          data-bs-toggle="dropdown"
          title="Exportar"
          style={{
           minHeight:44,
           borderRadius:12,
          }}
         >
          <i className="bi bi-download me-md-2"/>
          <span className="d-none d-md-inline">
           Exportar
          </span>
         </button>

         <ul className="dropdown-menu dropdown-menu-end">
          <li>
           <button
            className="dropdown-item"
            onClick={()=>
             void exportNotesToPdf(
              visible,
              "Meu Caderno Digital"
             )
            }
           >
            <i className="bi bi-file-earmark-pdf me-2"/>
            PDF para imprimir
           </button>
          </li>

          <li>
           <button
            className="dropdown-item"
            onClick={()=>exportCsv(visible)}
           >
            <i className="bi bi-filetype-csv me-2"/>
            CSV
           </button>
          </li>

          <li>
           <button
            className="dropdown-item"
            onClick={()=>exportJson(active)}
           >
            <i className="bi bi-database-down me-2"/>
            Backup JSON
           </button>
          </li>
         </ul>
        </div>

        <button
         className="btn btn-outline-secondary"
         onClick={()=>void notifications()}
         title="Ativar lembretes"
         style={{
          width:44,
          minHeight:44,
          borderRadius:12,
         }}
        >
         <i className="bi bi-bell"/>
        </button>

        <button
         className="btn btn-primary px-3"
         onClick={()=>{
          setEditing(null);
          setModal(true);
         }}
         style={{
          minHeight:44,
          borderRadius:12,
         }}
        >
         <i className="bi bi-plus-lg me-2"/>
         Nova
        </button>
       </div>
      </div>

      {section!=="calendar"&&(
       <div
        className="w-100 mb-4"
       >
        <FiltersPanel
         open={filtersOpen}
         filters={filters}
         categories={cats}
         onChange={setFilters}
         onClear={()=>setFilters(defaults)}
        />
       </div>
      )}

      <div className="row g-3 mb-4">
       {[
        [
         "Anotações",
         stats.total,
         "bi-journal-text",
         "#eff6ff",
         "#2563eb",
        ],
        [
         "Compromissos",
         stats.appointments,
         "bi-calendar-check",
         "#f5f3ff",
         "#7c3aed",
        ],
        [
         "Para hoje",
         stats.today,
         "bi-sun",
         "#fffbeb",
         "#ca8a04",
        ],
        [
         "Urgentes",
         stats.urgent,
         "bi-exclamation-circle",
         "#fef2f2",
         "#dc2626",
        ],
       ].map(([label,value,icon,bg,fg])=>(
        <div
         className="col-6 col-lg-3"
         key={String(label)}
        >
         <div
          className="bg-body d-flex gap-3 align-items-center px-3 py-3 h-100"
          style={{
           border:"1px solid var(--bs-border-color)",
           borderRadius:15,
           boxShadow:"0 3px 10px rgba(15,23,42,.025)",
          }}
         >
          <span
           className="d-flex justify-content-center align-items-center"
           style={{
            width:42,
            height:42,
            borderRadius:12,
            background:String(bg),
            color:String(fg),
            flexShrink:0,
           }}
          >
           <i className={`bi ${icon}`}/>
          </span>

          <div>
           <div className="fs-4 fw-bold lh-1">
            {String(value)}
           </div>

           <small className="text-secondary">
            {String(label)}
           </small>
          </div>
         </div>
        </div>
       ))}
      </div>

      {section==="calendar"?(
       <CalendarView
        notes={active}
        onEdit={note=>{
         setEditing(note);
         setModal(true);
        }}
       />
      ):(
       <>
        <div className="d-flex justify-content-between align-items-center small text-secondary mb-3">
         <span>
          {visible.length} resultado(s)
          {filters.search&&(
           <>
            {" "}para{" "}
            <strong>
             &quot;{filters.search}&quot;
            </strong>
           </>
          )}
         </span>

         {visible.length>0&&(
          <button
           className="btn btn-sm btn-outline-danger"
           onClick={()=>
            void exportNotesToPdf(
             visible,
             "Meu Caderno Digital"
            )
           }
          >
           <i className="bi bi-file-earmark-pdf me-1"/>
           PDF dos resultados
          </button>
         )}
        </div>

        {loading?(
         <div className="text-center py-5">
          <div className="spinner-border text-primary"/>
         </div>
        ):visible.length===0?(
         <div className="bg-body text-center p-5 border rounded-4">
          <i className="bi bi-journal-plus fs-1 text-primary"/>

          <h5 className="fw-bold mt-3">
           Nenhuma anotação encontrada
          </h5>

          <p className="text-secondary">
           Crie uma nova anotação ou ajuste os filtros.
          </p>
         </div>
        ):(
         <div
          className="bg-body border overflow-hidden"
          style={{
           borderRadius:15,
           boxShadow:"0 4px 14px rgba(15,23,42,.035)",
          }}
         >
          <div className="d-none d-xl-block px-3 px-xl-4 py-2 bg-body-tertiary border-bottom">
           <div
            className="row gx-2 align-items-center text-secondary fw-semibold"
            style={{fontSize:12}}
           >
            <div className="col-xl-4">
             ANOTAÇÃO
            </div>

            <div className="col-xl-2 text-center">
             CATEGORIA / PRIORIDADE
            </div>

            <div className="col-xl-2 text-center">
             DATA
            </div>

            <div className="col-xl-2 text-center">
             STATUS
            </div>

            <div className="col-xl-2 text-center">
             AÇÕES
            </div>
           </div>
          </div>

          {visible.map(note=>(
           <NoteCard
            key={note.id}
            note={note}
            search={filters.search}
            onEdit={item=>{
             setEditing(item);
             setModal(true);
            }}
            onDelete={setDeleteTarget}
            onPatch={patch}
            onPdf={item=>
             void exportNotesToPdf(
              [item],
              item.title||"Anotação"
             )
            }
            onHistory={setHistory}
           />
          ))}
         </div>
        )}
       </>
      )}
     </div>
    </div>

    <button
     className="btn btn-primary rounded-circle d-sm-none position-fixed"
     onClick={()=>{
      setEditing(null);
      setModal(true);
     }}
     style={{
      width:58,
      height:58,
      right:20,
      bottom:20,
      zIndex:1050,
     }}
    >
     <i className="bi bi-plus-lg fs-4"/>
    </button>
   </main>

   <NoteModal
    open={modal}
    note={editing}
    categories={customCats}
    tags={customTags}
    categoryCounts={categoryCounts}
    tagCounts={tagCounts}
    saving={saving}
    onClose={()=>{
     if(!saving){
      setModal(false);
      setEditing(null);
     }
    }}
    onSave={save}
    onCreateCategory={createCat}
    onRenameCategory={renameCategory}
    onDeleteCategory={deleteCategory}
    onCreateTag={createTag}
    onRenameTag={renameTag}
    onDeleteTag={deleteTag}
   />

   <ConfirmModal
    open={!!deleteTarget}
    title="Excluir anotação definitivamente?"
    description={`"${
     deleteTarget?.title||"Sem título"
    }" e o histórico dessa anotação serão apagados do banco de dados. Esta ação não poderá ser desfeita.`}
    loading={busyDelete}
    dangerLabel="Excluir definitivamente"
    onCancel={()=>setDeleteTarget(null)}
    onConfirm={()=>void removeNote()}
   />

   <ProfileModal
    open={profile}
    onClose={()=>setProfile(false)}
    dark={dark}
    setDark={setDark}
   />

   <HistoryModal
    open={!!history}
    userId={user.uid}
    note={history}
    onClose={()=>setHistory(null)}
   />

   {toast&&(
    <div
     className={`alert alert-${toast.type} position-fixed shadow`}
     style={{
      right:20,
      top:20,
      zIndex:2500,
      maxWidth:420,
      borderRadius:14,
     }}
    >
     {toast.text}
    </div>
   )}
  </div>
 );
}
