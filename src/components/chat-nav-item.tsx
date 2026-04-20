"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { MessageSquare } from "lucide-react"
import { getNewMessages } from "@/actions/chat"

export default function ChatNavItem({ lastMessageId }: { lastMessageId: string | null }) {
  const pathname = usePathname()
  const isActive = pathname === '/chat'
  const [unread, setUnread] = useState(0)
  const lastIdRef = useRef<string | null>(lastMessageId)

  useEffect(() => {
    if (isActive) { setUnread(0); return }

    const interval = setInterval(async () => {
      if (!lastIdRef.current) return
      const res = await getNewMessages(lastIdRef.current)
      if (res.success && res.messages.length > 0) {
        lastIdRef.current = res.messages[res.messages.length - 1].id
        setUnread(prev => prev + res.messages.length)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isActive])

  // Reset unread when entering chat
  useEffect(() => {
    if (isActive) setUnread(0)
  }, [isActive])

  return (
    <Link href="/chat">
      <span className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
        isActive
          ? 'bg-slate-700 text-white'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
      }`}>
        <MessageSquare size={14} />
        <span className="hidden sm:inline">Chat</span>
        {unread > 0 && !isActive && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-brand-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </span>
    </Link>
  )
}
