"use client";
import { createContext,useContext,useEffect,useMemo,useState,type ReactNode } from "react";
import { createUserWithEmailAndPassword,onAuthStateChanged,sendPasswordResetEmail,signInWithEmailAndPassword,signOut,updateProfile,type User } from "firebase/auth";
import { doc,serverTimestamp,setDoc } from "firebase/firestore";
import { auth,db } from "@/lib/firebase";
interface Value{user:User|null;loading:boolean;login:(e:string,p:string)=>Promise<void>;register:(n:string,e:string,p:string)=>Promise<void>;logout:()=>Promise<void>;resetPassword:(e:string)=>Promise<void>;updateName:(n:string)=>Promise<void>}
const C=createContext<Value|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setLoading(false)}),[]);
 async function login(e:string,p:string){await signInWithEmailAndPassword(auth,e,p)}
 async function register(n:string,e:string,p:string){const c=await createUserWithEmailAndPassword(auth,e,p); if(n.trim()) await updateProfile(c.user,{displayName:n.trim()}); await setDoc(doc(db,"users",c.user.uid),{name:n.trim(),email:e.trim().toLowerCase(),createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true})}
 async function logout(){await signOut(auth)}
 async function resetPassword(e:string){await sendPasswordResetEmail(auth,e)}
 async function updateName(n:string){if(!auth.currentUser) return; await updateProfile(auth.currentUser,{displayName:n.trim()}); await setDoc(doc(db,"users",auth.currentUser.uid),{name:n.trim(),updatedAt:serverTimestamp()},{merge:true}); setUser({...auth.currentUser} as User)}
 const value=useMemo(()=>({user,loading,login,register,logout,resetPassword,updateName}),[user,loading]);
 return <C.Provider value={value}>{children}</C.Provider>
}
export function useAuth(){const x=useContext(C); if(!x) throw new Error("useAuth deve estar em AuthProvider"); return x}
