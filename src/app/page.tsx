import { redirect } from "next/navigation"

export default function Home() {
  // Redirige automáticamente al login apenas entran a la página principal
  redirect("/login") 
}