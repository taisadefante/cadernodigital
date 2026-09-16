import type { Metadata } from "next";
import type { ReactNode } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AuthProvider } from "@/contexts/AuthContext";
import BootstrapClient from "@/components/BootstrapClient";
import PwaRegister from "@/components/PwaRegister";
export const metadata:Metadata={title:"Meu Caderno Digital",description:"Bloco de notas, agenda e compromissos multiusuário",manifest:"/manifest.webmanifest"};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="pt-BR"><body style={{margin:0,minHeight:"100vh"}}><AuthProvider><BootstrapClient/><PwaRegister/>{children}</AuthProvider></body></html>}
