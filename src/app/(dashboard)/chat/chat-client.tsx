"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Send, Paperclip, X, Download, FileText, Building2, Globe, Hash } from "lucide-react"
import { getNewMessages, getMessages, sendMessage, sendFileMessage } from "@/actions/chat"
import { toast } from "sonner"

type ChatMessage = {
  id: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  senderName: string
  senderRole: string
  branchName: string
  branchId: string | null
  toChannel: string
  createdAt: Date | string
}

type Branch = { id: string; name: string }

const BRANCH_COLORS = [
  'bg-brand-600', 'bg-sky-600', 'bg-emerald-600', 'bg-violet-600',
  'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600',
]
function getBranchColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return BRANCH_COLORS[Math.abs(h) % BRANCH_COLORS.length]
}

function formatTime(date: Date | string) {
  const d = new Date(date), now = new Date()
  const yday = new Date(now); yday.setDate(yday.getDate() - 1)
  const t = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return t
  if (d.toDateString() === yday.toDateString()) return `Ayer ${t}`
  return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${t}`
}

function formatFileSize(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function FileAttachment({ msg }: { msg: ChatMessage }) {
  if (!msg.fileUrl) return null
  const isImg = msg.fileType?.startsWith('image/')
  return (
    <div className="mt-1.5">
      {isImg ? (
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={msg.fileUrl} alt={msg.fileName ?? 'imagen'}
            className="max-w-[260px] max-h-[180px] rounded-xl object-cover border border-white/20 cursor-pointer hover:opacity-90 transition-opacity" />
        </a>
      ) : (
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download={msg.fileName ?? true}
          className="flex items-center gap-2.5 bg-black/20 hover:bg-black/30 transition-colors rounded-xl px-3 py-2 max-w-[260px]">
          <FileText size={16} className="shrink-0 opacity-80" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate">{msg.fileName}</p>
            {msg.fileSize && <p className="text-[10px] opacity-60">{formatFileSize(msg.fileSize)}</p>}
          </div>
          <Download size={13} className="shrink-0 opacity-60" />
        </a>
      )}
    </div>
  )
}

export default function ChatClient({
  initialMessages, senderName, branchName, sessionRole, branches,
}: {
  initialMessages: ChatMessage[]
  senderName: string
  branchName: string
  sessionRole: string
  branches: Branch[]
}) {
  const [channel, setChannel] = useState('general')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [loadingChannel, setLoadingChannel] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastIdRef = useRef<string | null>(initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null)
  const channelRef = useRef(channel)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isAtBottomRef = useRef(true)

  channelRef.current = channel

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Switch channel — load messages for new channel
  const switchChannel = useCallback(async (ch: string) => {
    if (ch === channelRef.current) return
    setLoadingChannel(true)
    setChannel(ch)
    const res = await getMessages(ch)
    if (res.success) {
      setMessages(res.messages as ChatMessage[])
      lastIdRef.current = res.messages.length > 0 ? res.messages[res.messages.length - 1].id : null
    }
    setLoadingChannel(false)
    setTimeout(() => scrollToBottom(true), 80)
  }, [scrollToBottom])

  // Polling
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      if (!lastIdRef.current) return
      const res = await getNewMessages(lastIdRef.current, channelRef.current)
      if (res.success && res.messages.length > 0) {
        const newMsgs = res.messages as ChatMessage[]
        setMessages(prev => {
          const filtered = newMsgs.filter(m => !prev.find(p => p.id === m.id))
          if (!filtered.length) return prev
          lastIdRef.current = filtered[filtered.length - 1].id
          return [...prev, ...filtered]
        })
        scrollToBottom()
      }
    }, 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [scrollToBottom])

  useEffect(() => { scrollToBottom(true) }, [])
  useEffect(() => {
    if (messages.length > 0) lastIdRef.current = messages[messages.length - 1].id
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 20 * 1024 * 1024) { toast.error('El archivo supera 20 MB'); return }
    setFile(f)
    setFilePreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }
  const clearFile = () => {
    setFile(null); setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    if ((!text.trim() && !file) || sending) return
    setSending(true)
    try {
      let result: { success: boolean; message?: ChatMessage; error?: string }
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        if (text.trim()) fd.append('content', text.trim())
        fd.append('channel', channel)
        result = await sendFileMessage(fd) as typeof result
      } else {
        result = await sendMessage(text.trim(), channel) as typeof result
      }
      if (result.success && result.message) {
        setMessages(prev => prev.find(m => m.id === result.message!.id) ? prev : [...prev, result.message!])
        setText(''); clearFile()
        setTimeout(() => scrollToBottom(true), 50)
      } else {
        toast.error(result.error ?? 'Error al enviar')
      }
    } finally { setSending(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Group by day
  const grouped: Array<ChatMessage | { type: 'separator'; label: string }> = []
  let lastDate = ''
  for (const msg of messages) {
    const d = new Date(msg.createdAt), ds = d.toDateString(), now = new Date()
    const yday = new Date(now); yday.setDate(yday.getDate() - 1)
    if (ds !== lastDate) {
      lastDate = ds
      grouped.push({ type: 'separator', label: ds === now.toDateString() ? 'Hoy' : ds === yday.toDateString() ? 'Ayer' : d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' }) })
    }
    grouped.push(msg)
  }

  const isMine = (msg: ChatMessage) => msg.senderName === senderName && msg.branchName === branchName

  const channelLabel = channel === 'general'
    ? 'General'
    : branches.find(b => b.id === channel)?.name ?? channel

  return (
    <div className="flex h-full bg-slate-900 overflow-hidden">

      {/* SIDEBAR — CANALES */}
      <aside className="w-52 shrink-0 bg-slate-950 flex flex-col border-r border-slate-800">
        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className={`w-8 h-8 rounded-lg ${getBranchColor(branchName)} flex items-center justify-center text-[11px] font-black text-white mb-2`}>
            {branchName[0]}
          </div>
          <p className="text-xs font-black text-white truncate leading-none">{senderName}</p>
          <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{branchName}</p>
        </div>

        {/* Channels */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest px-2 py-2">Canales</p>

          {/* General */}
          <button
            onClick={() => switchChannel('general')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${channel === 'general' ? 'bg-brand-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Globe size={13} className="shrink-0" />
            <span className="text-xs font-bold truncate">General</span>
          </button>

          {/* Per-branch channels */}
          <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest px-2 pt-3 pb-1">Sucursales</p>
          {branches.map(b => (
            <button
              key={b.id}
              onClick={() => switchChannel(b.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${channel === b.id ? 'bg-brand-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Hash size={13} className="shrink-0" />
              <span className="text-xs font-bold truncate">{b.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-2.5 shrink-0">
          {channel === 'general'
            ? <Globe size={15} className="text-brand-400" />
            : <Hash size={15} className="text-brand-400" />}
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tight leading-none">{channelLabel}</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {channel === 'general' ? 'Visible para todas las sucursales' : `Mensajes directos a ${channelLabel}`}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
          onScroll={e => {
            const el = e.currentTarget
            isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          }}
        >
          {loadingChannel ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              {channel === 'general' ? <Globe size={32} className="mb-3 opacity-20" /> : <Hash size={32} className="mb-3 opacity-20" />}
              <p className="text-sm font-bold uppercase">Sin mensajes en {channelLabel}</p>
              <p className="text-xs mt-1 opacity-60">¡Sé el primero en escribir!</p>
            </div>
          ) : grouped.map((item, i) => {
            if ('type' in item) return (
              <div key={`sep-${i}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
            )
            const mine = isMine(item)
            const color = getBranchColor(item.branchName)
            return (
              <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[72%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className={`w-4 h-4 rounded-full ${color} flex items-center justify-center text-[8px] font-black text-white shrink-0`}>
                        {item.branchName[0]}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{item.branchName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-[10px] font-bold text-slate-500">{item.senderName}</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2.5 ${mine ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-slate-700 text-slate-100 rounded-tl-sm'}`}>
                    {item.content && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{item.content}</p>}
                    <FileAttachment msg={item} />
                  </div>
                  <span className="text-[9px] text-slate-600 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* File preview */}
        {file && (
          <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex items-center gap-3">
            {filePreview
              ? <img src={filePreview} alt="preview" className="h-12 w-12 object-cover rounded-lg border border-slate-600" />
              : <div className="h-12 w-12 bg-slate-700 rounded-lg flex items-center justify-center"><FileText size={20} className="text-slate-400" /></div>}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={clearFile} className="text-slate-400 hover:text-white p-1"><X size={16} /></button>
          </div>
        )}

        {/* Input */}
        <div className="bg-slate-800 border-t border-slate-700 px-3 py-3 flex items-end gap-2 shrink-0">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0" title="Adjuntar archivo">
            <Paperclip size={18} />
          </button>
          <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={`Mensaje en ${channelLabel}… (Enter para enviar)`}
            rows={1}
            className="flex-1 bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px` }}
          />
          <button onClick={handleSend} disabled={sending || (!text.trim() && !file)}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors shrink-0">
            <Send size={18} className={sending ? 'animate-pulse' : ''} />
          </button>
        </div>
      </div>
    </div>
  )
}
