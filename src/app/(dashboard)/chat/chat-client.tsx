"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Send, Paperclip, X, Download, FileText, Image as ImageIcon, Building2 } from "lucide-react"
import { getNewMessages, sendMessage, sendFileMessage } from "@/actions/chat"
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
  createdAt: Date | string
}

const BRANCH_COLORS = [
  'bg-brand-600',
  'bg-sky-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-indigo-600',
]

function getBranchColor(branchName: string) {
  let hash = 0
  for (let i = 0; i < branchName.length; i++) hash = branchName.charCodeAt(i) + ((hash << 5) - hash)
  return BRANCH_COLORS[Math.abs(hash) % BRANCH_COLORS.length]
}

function formatTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  if (isYesterday) return `Ayer ${time}`
  return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${time}`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(fileType: string | null) {
  return fileType?.startsWith('image/') ?? false
}

function FileAttachment({ msg }: { msg: ChatMessage }) {
  if (!msg.fileUrl) return null
  const img = isImage(msg.fileType)
  return (
    <div className="mt-1.5">
      {img ? (
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={msg.fileUrl}
            alt={msg.fileName ?? 'imagen'}
            className="max-w-[280px] max-h-[200px] rounded-xl object-cover border border-white/20 cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
      ) : (
        <a
          href={msg.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={msg.fileName ?? true}
          className="flex items-center gap-2.5 bg-black/20 hover:bg-black/30 transition-colors rounded-xl px-3 py-2.5 max-w-[280px]"
        >
          <FileText size={18} className="shrink-0 opacity-80" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate leading-tight">{msg.fileName}</p>
            {msg.fileSize && (
              <p className="text-[10px] opacity-60 leading-none mt-0.5">{formatFileSize(msg.fileSize)}</p>
            )}
          </div>
          <Download size={14} className="shrink-0 opacity-60" />
        </a>
      )}
    </div>
  )
}

export default function ChatClient({
  initialMessages,
  senderName,
  branchName,
  sessionRole,
}: {
  initialMessages: ChatMessage[]
  senderName: string
  branchName: string
  sessionRole: string
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastIdRef = useRef<string | null>(messages.length > 0 ? messages[messages.length - 1].id : null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isAtBottomRef = useRef(true)

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      if (!lastIdRef.current) return
      const res = await getNewMessages(lastIdRef.current)
      if (res.success && res.messages.length > 0) {
        setMessages(prev => {
          const newMsgs = res.messages.filter((m: ChatMessage) => !prev.find(p => p.id === m.id))
          if (newMsgs.length === 0) return prev
          lastIdRef.current = newMsgs[newMsgs.length - 1].id
          return [...prev, ...newMsgs]
        })
        // Scroll only if already at bottom or message is ours
        scrollToBottom()
      }
    }, 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [scrollToBottom])

  // Scroll on initial load
  useEffect(() => { scrollToBottom(true) }, [])

  // Update lastId when messages change
  useEffect(() => {
    if (messages.length > 0) {
      lastIdRef.current = messages[messages.length - 1].id
    }
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) { toast.error('El archivo supera 20 MB'); return }
    setFile(f)
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      setFilePreview(url)
    } else {
      setFilePreview(null)
    }
  }

  const clearFile = () => {
    setFile(null)
    setFilePreview(null)
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
        result = await sendFileMessage(fd) as typeof result
      } else {
        result = await sendMessage(text.trim()) as typeof result
      }

      if (result.success && result.message) {
        setMessages(prev => {
          if (prev.find(m => m.id === result.message!.id)) return prev
          return [...prev, result.message!]
        })
        setText('')
        clearFile()
        setTimeout(() => scrollToBottom(true), 50)
      } else {
        toast.error(result.error ?? 'Error al enviar')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages: show date separator when day changes
  const grouped: Array<ChatMessage | { type: 'separator'; label: string }> = []
  let lastDate = ''
  for (const msg of messages) {
    const d = new Date(msg.createdAt)
    const dateStr = d.toDateString()
    if (dateStr !== lastDate) {
      lastDate = dateStr
      const now = new Date()
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
      const label = dateStr === now.toDateString() ? 'Hoy' : dateStr === yesterday.toDateString() ? 'Ayer' : d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })
      grouped.push({ type: 'separator', label })
    }
    grouped.push(msg)
  }

  const isMine = (msg: ChatMessage) => msg.senderName === senderName && msg.branchName === branchName

  return (
    <div className="flex flex-col h-full bg-slate-900">

      {/* HEADER */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center">
          <Building2 size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white uppercase tracking-tight leading-none">Chat de Sucursales</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">{branchName} · {senderName}</p>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar"
        onScroll={e => {
          const el = e.currentTarget
          isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
      >
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Building2 size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-bold uppercase">No hay mensajes aún</p>
            <p className="text-xs mt-1 opacity-60">¡Sé el primero en escribir!</p>
          </div>
        )}

        {grouped.map((item, i) => {
          if ('type' in item) {
            return (
              <div key={`sep-${i}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
            )
          }

          const mine = isMine(item)
          const color = getBranchColor(item.branchName)

          return (
            <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
              <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Sender info */}
                {!mine && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className={`w-4 h-4 rounded-full ${color} flex items-center justify-center text-[8px] font-black text-white shrink-0`}>
                      {item.branchName[0]}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{item.branchName}</span>
                    <span className="text-[10px] text-slate-500">·</span>
                    <span className="text-[10px] font-bold text-slate-500">{item.senderName}</span>
                  </div>
                )}

                {/* Bubble */}
                <div className={`rounded-2xl px-3.5 py-2.5 ${
                  mine
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-slate-700 text-slate-100 rounded-tl-sm'
                }`}>
                  {item.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{item.content}</p>
                  )}
                  <FileAttachment msg={item} />
                </div>

                {/* Time */}
                <span className="text-[9px] text-slate-600 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(item.createdAt)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* FILE PREVIEW */}
      {file && (
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex items-center gap-3">
          {filePreview ? (
            <img src={filePreview} alt="preview" className="h-12 w-12 object-cover rounded-lg border border-slate-600" />
          ) : (
            <div className="h-12 w-12 bg-slate-700 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{file.name}</p>
            <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
          </div>
          <button onClick={clearFile} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className="bg-slate-800 border-t border-slate-700 px-3 py-3 flex items-end gap-2 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          title="Adjuntar archivo"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
          rows={1}
          className="flex-1 bg-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`
          }}
        />

        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !file)}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors shrink-0"
        >
          <Send size={18} className={sending ? 'animate-pulse' : ''} />
        </button>
      </div>
    </div>
  )
}
