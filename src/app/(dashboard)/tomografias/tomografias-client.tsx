"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import QRCode from "react-qr-code"
import {
  getTomografias, uploadTomoFile, removeTomoFile,
  addTomoLink, removeTomoLink, saveReportHtml, deleteReport,
  saveReportPdf, markAsDelivered, markAsDelayed, updateOrderStatusAction,
  updateDeliveryDate
} from "@/actions/tomografias"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, UploadCloud, Link as LinkIcon, Trash2, FileText, ExternalLink,
  Printer, QrCode, Copy, Mail, Smartphone, UserCheck, PauseCircle,
  ChevronDown, ChevronUp, Bold, Italic, List, ListOrdered, X,
  Loader2, FileImage, Download, Eye, Plus, ScanLine,
  CheckCircle2, Clock, Package, Send, RefreshCw, Underline, Heading2,
  CalendarDays, ArrowUpDown
} from "lucide-react"

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getLocalDate() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().split('T')[0]
}

function isImage(url: string) { return /\.(jpe?g|png|webp|gif)$/i.test(url) }
function isPdf(url: string) { return /\.pdf$/i.test(url) }
function shortFileName(url: string) {
  const parts = url.split('/'); const name = parts[parts.length - 1] || url
  return decodeURIComponent(name.replace(/^[a-f0-9-]{36}-/, ''))
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  CREADA:            { label: 'Creada',          cls: 'bg-slate-100 text-slate-600' },
  EN_ESPERA:         { label: 'En espera',        cls: 'bg-yellow-100 text-yellow-700' },
  EN_ATENCION:       { label: 'En atención',      cls: 'bg-blue-100 text-blue-700' },
  PROCESANDO:        { label: 'Procesando',       cls: 'bg-brand-100 text-brand-700' },
  LISTO_PARA_ENTREGA:{ label: 'Lista ✓',          cls: 'bg-emerald-100 text-emerald-700' },
  ENVIADA_DIGITAL:   { label: 'Enviada digital',  cls: 'bg-teal-100 text-teal-700' },
  ENTREGADA:         { label: 'Entregada ✓',      cls: 'bg-green-100 text-green-700' },
  DEMORADA:          { label: 'Demorada',         cls: 'bg-orange-100 text-orange-700' },
}

// ─── Word-paste cleaner ───────────────────────────────────────────────────────
// Uses DOMParser to properly parse HTML and extract formatting from inline styles
function cleanWordHtml(html: string): string {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    function processNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent || ''
        return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return ''

      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()

      // Skip Word/Office XML tags and non-content elements
      if (tag.includes(':') || ['style', 'script', 'head', 'meta', 'link'].includes(tag)) return ''

      const style = el.getAttribute('style') || ''

      // Extract relevant formatting from inline styles (how Word stores formatting)
      const isBold = /font-weight\s*:\s*(bold|[6-9]\d{2})/i.test(style)
      const isItalic = /font-style\s*:\s*italic/i.test(style)
      const isUnderline = /text-decoration[^;]*:\s*[^;]*underline/i.test(style)
      const alignMatch = style.match(/text-align\s*:\s*(left|center|right|justify)/i)
      const textAlign = alignMatch ? alignMatch[1] : ''

      // Recurse into children
      let content = Array.from(el.childNodes).map(processNode).join('')

      // Apply formatting detected from styles (in addition to semantic tags)
      if (isUnderline) content = `<u>${content}</u>`
      if (isItalic) content = `<i>${content}</i>`
      if (isBold) content = `<b>${content}</b>`

      // Map tag to clean output
      const alignStyle = textAlign ? ` style="text-align:${textAlign}"` : ''

      if (tag === 'p' || tag === 'div') {
        if (!content.trim()) return ''
        return `<p${alignStyle}>${content}</p>`
      }
      if (['h1','h2','h3','h4','h5','h6'].includes(tag)) return `<${tag}${alignStyle}>${content}</${tag}>`
      if (tag === 'ul') return `<ul>${content}</ul>`
      if (tag === 'ol') return `<ol>${content}</ol>`
      if (tag === 'li') return `<li>${content}</li>`
      if (tag === 'b' || tag === 'strong') return `<b>${content}</b>`
      if (tag === 'i' || tag === 'em') return `<i>${content}</i>`
      if (tag === 'u') return `<u>${content}</u>`
      if (tag === 'br') return '<br>'
      if (tag === 'table') return `<p>${content}</p>`
      if (tag === 'tr') return `${content}<br>`
      if (tag === 'td' || tag === 'th') return `${content} `
      if (['body','html','span','font','a'].includes(tag)) return content

      return content
    }

    return Array.from(doc.body.childNodes).map(processNode).join('')
  } catch {
    // Fallback: basic regex strip if DOMParser fails
    return html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<\/?[a-z]+:[^>]*>/gi, '')
      .replace(/\s*(class|lang|xml:[a-z]+)="[^"]*"/gi, '')
  }
}

// Altura del área de contenido por página en el PDF (lógica px = H - MT - MB)
// Ajustada al tamaño de fuente del editor (text-sm ≈ 14px, PDF 11pt ≈ 14.67px → factor ~0.97)
const PDF_PAGE_CONTENT_H = 897   // 1123 - 113 - 113

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichEditor({ value, onChange }: { value: string; onChange: (h: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const [pageBreaks, setPageBreaks] = useState<number[]>([])

  // Recalculate page break indicator positions based on current content height
  const recalcBreaks = useCallback(() => {
    if (!ref.current) return
    const PADDING = 16  // p-4
    const contentH = ref.current.scrollHeight - 2 * PADDING
    const positions: number[] = []
    for (let y = PDF_PAGE_CONTENT_H; y < contentH; y += PDF_PAGE_CONTENT_H) {
      positions.push(y + PADDING)
    }
    setPageBreaks(positions)
  }, [])

  useEffect(() => {
    if (ref.current && isFirstRender.current) {
      ref.current.innerHTML = value
      isFirstRender.current = false
      recalcBreaks()
    }
  }, [value, recalcBreaks])

  // ResizeObserver fires whenever the editor grows/shrinks as user types
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(recalcBreaks)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [recalcBreaks])

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, val)
    onChange(ref.current?.innerHTML || '')
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    if (html) {
      const cleaned = cleanWordHtml(html)
      document.execCommand('insertHTML', false, cleaned)
    } else {
      const escaped = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
      document.execCommand('insertHTML', false, escaped)
    }
    onChange(ref.current?.innerHTML || '')
  }

  const ToolBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
    >{children}</button>
  )

  return (
    <div className="border-2 border-slate-200 rounded-2xl overflow-hidden focus-within:border-brand-400 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 bg-slate-100 border-b border-slate-200">
        <ToolBtn onClick={() => exec('bold')} title="Negrita (Ctrl+B)"><Bold size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Cursiva (Ctrl+I)"><Italic size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Subrayado (Ctrl+U)"><Underline size={14} /></ToolBtn>
        <div className="w-px bg-slate-300 mx-1 self-stretch" />
        <ToolBtn onClick={() => exec('justifyLeft')} title="Alinear izquierda">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Centrar">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Alinear derecha">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </ToolBtn>
        <div className="w-px bg-slate-300 mx-1 self-stretch" />
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Lista con viñetas"><List size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Lista numerada"><ListOrdered size={14} /></ToolBtn>
        <div className="w-px bg-slate-300 mx-1 self-stretch" />
        <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="Título"><Heading2 size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'p')} title="Párrafo normal"><FileText size={14} /></ToolBtn>
        <div className="w-px bg-slate-300 mx-1 self-stretch" />
        <ToolBtn onClick={() => exec('removeFormat')} title="Limpiar formato"><X size={14} /></ToolBtn>
        <div className="w-px bg-slate-300 mx-1 self-stretch" />
        <ToolBtn
          onClick={() => {
            ref.current?.focus()
            document.execCommand('insertHTML', false,
              '<hr class="page-break" style="height:0;border:none;border-top:2px dashed #ccc;margin:8px 0;" /><p><br></p>')
            onChange(ref.current?.innerHTML || '')
          }}
          title="Insertar salto de página manual"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="4 2"/>
            <polyline points="8 8 3 12 8 16"/>
            <polyline points="16 8 21 12 16 16"/>
          </svg>
        </ToolBtn>
      </div>

      {/* Editor area — relative so page break indicators can be absolutely positioned */}
      <div className="relative bg-white">

        {/* ── Page break indicators (visual only, not in PDF) ── */}
        {pageBreaks.map((y, i) => (
          <div
            key={i}
            className="absolute inset-x-0 pointer-events-none z-10 flex items-center select-none"
            style={{ top: y }}
          >
            <div className="flex-1 border-t-2 border-dashed border-brand-300 opacity-50" />
            <div className="mx-3 flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-full px-3 py-0.5 shadow-sm">
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-brand-400">
                <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="4 2"/>
                <polyline points="8 8 3 12 8 16"/>
                <polyline points="16 8 21 12 16 16"/>
              </svg>
              <span className="text-[10px] font-black text-brand-500 uppercase tracking-wider">
                Página {i + 2}
              </span>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-brand-300 opacity-50" />
          </div>
        ))}

        {/* Contenteditable */}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { onChange(ref.current?.innerHTML || ''); recalcBreaks() }}
          onPaste={handlePaste}
          className="min-h-[280px] p-4 outline-none text-sm leading-relaxed text-slate-800"
          style={{ fontFamily: 'Georgia, serif' }}
        />
      </div>
    </div>
  )
}

// ─── File Name Dialog ──────────────────────────────────────────────────────────
function FileNameDialog({
  open, fileName, onConfirm, onCancel
}: {
  open: boolean
  fileName: string
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  useEffect(() => { if (open) setName(fileName.replace(/\.[^.]+$/, '')) }, [open, fileName])
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="sm:max-w-sm bg-white rounded-3xl p-8 border-none shadow-2xl outline-none">
        <DialogTitle className="text-lg font-black uppercase">Nombre del archivo</DialogTitle>
        <div className="space-y-4 mt-3">
          <p className="text-xs text-slate-500">Escribí un nombre descriptivo para identificar este archivo:</p>
          <Input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
            placeholder="Ej: Derivación Dr. García, Estudio CBCT..."
            className="h-11 rounded-2xl border-2 font-medium"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => name.trim() && onConfirm(name.trim())}
              disabled={!name.trim()}
              className="flex-1 h-11 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl"
            >
              Confirmar
            </Button>
            <Button variant="ghost" onClick={onCancel} className="rounded-2xl h-11">Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TomografiasClient({ branches, activeTemplate }: { branches: any[]; activeTemplate: any }) {
  // Filtros
  const [filters, setFilters] = useState({
    branchId: 'ALL', startDate: '', endDate: '',
    deliveryStartDate: '', deliveryEndDate: '',
    search: '', sortBy: 'createdAt' as 'createdAt' | 'deliveryDate', sortDir: 'desc' as 'asc' | 'desc'
  })
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Orden seleccionada
  const [selected, setSelected] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'archivos' | 'informe' | 'acciones'>('archivos')

  // Files
  const [uploadingStudy, setUploadingStudy] = useState(false)
  const [uploadingDeriv, setUploadingDeriv] = useState(false)
  const [newLink, setNewLink] = useState('')
  const fileStudyRef = useRef<HTMLInputElement>(null)
  const fileDerivRef = useRef<HTMLInputElement>(null)

  // File name dialog
  const [fileNameDialog, setFileNameDialog] = useState<{
    open: boolean; file: File | null; tipo: 'study' | 'derivacion'; queue: File[]
  }>({ open: false, file: null, tipo: 'study', queue: [] })

  // Informe
  const [reportHtml, setReportHtml] = useState('')
  const [savingReport, setSavingReport] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Delivery date
  const [editingDeliveryDate, setEditingDeliveryDate] = useState(false)
  const [deliveryDateValue, setDeliveryDateValue] = useState('')
  const [savingDeliveryDate, setSavingDeliveryDate] = useState(false)

  // Acciones
  const [showQr, setShowQr] = useState(false)
  const [delayReason, setDelayReason] = useState('')
  const [showDelayModal, setShowDelayModal] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState('RETIRO_PERSONAL')
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // ── Cargar órdenes ──────────────────────────────────────────────────────────
  const load = useCallback(async (f = filters) => {
    setLoading(true)
    const res = await getTomografias(f)
    if (res.success) setOrders(res.orders as any[])
    setHasSearched(true)
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, []) // eslint-disable-line

  // ── Seleccionar orden ───────────────────────────────────────────────────────
  const selectOrder = (order: any) => {
    setSelected(order)
    setActiveTab('archivos')
    setReportHtml(order.tomografiaData?.reportHtml || '')
    setConfirmDelete(false)
    setEditingDeliveryDate(false)
    const dd = order.tomografiaData?.deliveryDate
    setDeliveryDateValue(dd ? new Date(dd).toISOString().split('T')[0] : '')
  }

  // ── Refrescar orden seleccionada en la lista ────────────────────────────────
  const refreshSelected = async () => {
    const res = await getTomografias(filters)
    if (res.success) {
      setOrders(res.orders as any[])
      if (selected) {
        const updated = (res.orders as any[]).find((o: any) => o.id === selected.id)
        if (updated) { setSelected(updated); const dd = updated.tomografiaData?.deliveryDate; setDeliveryDateValue(dd ? new Date(dd).toISOString().split('T')[0] : '') }
      }
    }
  }

  // ── Upload file with custom name ────────────────────────────────────────────
  const openFileNameDialog = (files: FileList | null, tipo: 'study' | 'derivacion') => {
    if (!files || !files.length || !selected) return
    const arr = Array.from(files)
    setFileNameDialog({ open: true, file: arr[0], tipo, queue: arr.slice(1) })
    // Reset input so same file can be re-selected
    if (tipo === 'study' && fileStudyRef.current) fileStudyRef.current.value = ''
    if (tipo === 'derivacion' && fileDerivRef.current) fileDerivRef.current.value = ''
  }

  const handleFileNameConfirm = async (customName: string) => {
    const { file, tipo, queue } = fileNameDialog
    if (!file || !selected) return
    setFileNameDialog(d => ({ ...d, open: false }))
    if (tipo === 'study') setUploadingStudy(true)
    else setUploadingDeriv(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('orderId', selected.id)
    fd.append('tipo', tipo)
    fd.append('customName', customName)
    const res = await uploadTomoFile(fd)
    if (!res.success) toast.error(res.error || 'Error al subir archivo')

    // Process remaining files in queue (they get default names)
    for (const f of queue) {
      const fd2 = new FormData()
      fd2.append('file', f)
      fd2.append('orderId', selected.id)
      fd2.append('tipo', tipo)
      const r = await uploadTomoFile(fd2)
      if (!r.success) toast.error(r.error || 'Error al subir archivo')
    }

    await refreshSelected()
    if (tipo === 'study') setUploadingStudy(false)
    else setUploadingDeriv(false)
    toast.success('Archivo(s) subido(s) ✓')
  }

  // ── Add link ────────────────────────────────────────────────────────────────
  const handleAddLink = async () => {
    if (!newLink || !selected) return
    const res = await addTomoLink(selected.id, newLink)
    if (res.success) { setNewLink(''); await refreshSelected(); toast.success('Link agregado ✓') }
    else toast.error(res.error)
  }

  // ── Save delivery date ──────────────────────────────────────────────────────
  const handleSaveDeliveryDate = async () => {
    if (!selected) return
    setSavingDeliveryDate(true)
    const res = await updateDeliveryDate(selected.id, deliveryDateValue || null)
    if (res.success) { await refreshSelected(); setEditingDeliveryDate(false); toast.success('Fecha de entrega guardada ✓') }
    else toast.error(res.error)
    setSavingDeliveryDate(false)
  }

  // ── Save report ─────────────────────────────────────────────────────────────
  const handleSaveReport = async () => {
    if (!selected) return
    setSavingReport(true)
    const res = await saveReportHtml(selected.id, reportHtml)
    if (res.success) { await refreshSelected(); toast.success('Informe guardado ✓') }
    else toast.error(res.error)
    setSavingReport(false)
  }

  // ── Generate PDF (multi-page) ─────────────────────────────────────────────────
  const handleGeneratePdf = async () => {
    if (!reportHtml || !selected) return
    setGeneratingPdf(true)
    try {
      // 1. Save latest HTML first
      await saveReportHtml(selected.id, reportHtml)

      const MT = activeTemplate?.marginTop    ?? 113
      const ML = activeTemplate?.marginLeft   ?? 95
      const MR = activeTemplate?.marginRight  ?? 95
      const MB = activeTemplate?.marginBottom ?? 113
      const W = 794, H = 1123, SCALE = 2
      const WP = W * SCALE   // 1588 physical px
      const HP = H * SCALE   // 2246 physical px
      // Usable text height per page (between top and bottom margins)
      const PAGE_CONTENT_H = H - MT - MB   // e.g. 897 logical px

      // 2. Fetch background as base64 (avoids CORS with R2)
      let bgImgEl: HTMLImageElement | null = null
      if (activeTemplate?.backgroundImageUrl) {
        try {
          const res  = await fetch(activeTemplate.backgroundImageUrl)
          const blob = await res.blob()
          const b64  = await new Promise<string>((ok, fail) => {
            const r = new FileReader(); r.onload = () => ok(r.result as string); r.onerror = fail; r.readAsDataURL(blob)
          })
          bgImgEl = await new Promise<HTMLImageElement>(ok => {
            const img = new Image(); img.onload = () => ok(img); img.onerror = () => ok(img); img.src = b64
          })
        } catch (e) { console.warn('Background image load failed:', e) }
      }

      // 3. Render ALL text content in an isolated iframe (no Tailwind CSS leaks)
      //    Height is unconstrained so long reports flow to their natural height
      const iframe = document.createElement('iframe')
      iframe.style.cssText = `position:absolute;top:0;left:-9999px;width:${W}px;height:${H}px;border:none;visibility:hidden;`
      document.body.appendChild(iframe)

      const iDoc = iframe.contentDocument!
      iDoc.open()
      iDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        html { margin:0; padding:0; width:${W}px; }
        body {
          margin:0; padding:0;
          padding-left:${ML}px; padding-right:${MR}px;
          box-sizing:border-box; width:${W}px;
          background:transparent; color:#000000;
          font-family:Georgia,serif; font-size:11pt; line-height:1.6;
        }
        b,strong { font-weight:bold; }
        i,em     { font-style:italic; }
        u        { text-decoration:underline; }
        h1,h2,h3 { font-weight:bold; margin:.5em 0; }
        h2       { font-size:13pt; }
        p        { margin:.35em 0; }
        ul,ol    { margin:.35em 0; padding-left:1.6em; }
        hr.page-break { border:none; margin:0; padding:0; display:block; }
      </style></head><body>${reportHtml}</body></html>`)
      iDoc.close()

      // Wait for layout
      await new Promise(r => setTimeout(r, 150))

      // Detect explicit page breaks (<hr class="page-break">) and record their y positions
      const explicitBreakYs: number[] = Array.from(iDoc.querySelectorAll('hr.page-break'))
        .map(el => (el as HTMLElement).offsetTop)
        .filter(y => y > 10)
        .sort((a, b) => a - b)

      // Hide page-break <hr> elements in the rendered canvas (they're only visual in the editor)
      iDoc.querySelectorAll<HTMLElement>('hr.page-break').forEach(el => {
        el.style.cssText = 'display:block;height:0!important;border:none!important;margin:0!important;'
      })

      // Natural content height — determines how many pages we need
      const naturalH = Math.max(iDoc.body.scrollHeight, 1)

      // 4. Build page boundaries
      //    Priority: explicit <hr class="page-break"> positions, then auto every PAGE_CONTENT_H
      const pageBoundaries: number[] = [0]   // start of each page (logical px in the iframe doc)
      if (explicitBreakYs.length > 0) {
        explicitBreakYs.forEach(y => pageBoundaries.push(y))
      } else {
        let cursor = PAGE_CONTENT_H
        while (cursor < naturalH) { pageBoundaries.push(cursor); cursor += PAGE_CONTENT_H }
      }
      const numPages = pageBoundaries.length

      console.log('[PDF] naturalH:', naturalH, 'PAGE_CONTENT_H:', PAGE_CONTENT_H, 'pageBoundaries:', pageBoundaries, 'numPages:', numPages)

      const html2canvas = (await import('html2canvas')).default

      // Render the FULL document once at 2× resolution
      const fullCanvas = await html2canvas(iDoc.body, {
        scale:           SCALE,
        backgroundColor: null,
        useCORS:         false,
        allowTaint:      false,
        width:           W,
        height:          naturalH,
        windowWidth:     W,
        windowHeight:    naturalH,
      })

      document.body.removeChild(iframe)

      console.log('[PDF] fullCanvas:', fullCanvas.width, '×', fullCanvas.height)

      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')

      for (let page = 0; page < numPages; page++) {
        if (page > 0) pdf.addPage()

        const pageStart = pageBoundaries[page]
        const pageEnd   = page + 1 < numPages ? pageBoundaries[page + 1] : naturalH
        const sliceH    = Math.min(pageEnd - pageStart, PAGE_CONTENT_H)  // logical px

        // Physical coords in the full canvas
        const srcY = pageStart * SCALE
        const srcH = Math.min(sliceH * SCALE, fullCanvas.height - srcY)

        console.log(`[PDF] page ${page + 1}: pageStart=${pageStart} sliceH=${sliceH} srcY=${srcY} srcH=${srcH}`)

        // ── Intermediate canvas: slice lives at y=0 (avoids any coordinate confusion) ──
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width  = WP
        sliceCanvas.height = sliceH * SCALE   // exact slice height, content starts at y=0
        const sCtx = sliceCanvas.getContext('2d')!
        if (srcH > 0) {
          sCtx.drawImage(
            fullCanvas,
            0, srcY, WP, srcH,   // source: this page's slice
            0, 0,   WP, srcH     // dest: place at y=0 in sliceCanvas
          )
        }

        // ── Page canvas: white + template + text at top margin ──
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width  = WP
        pageCanvas.height = HP
        const pCtx = pageCanvas.getContext('2d')!

        pCtx.fillStyle = '#ffffff'
        pCtx.fillRect(0, 0, WP, HP)
        if (bgImgEl) pCtx.drawImage(bgImgEl, 0, 0, WP, HP)

        // sliceCanvas y=0 = document y=pageStart → place at the top margin
        pCtx.drawImage(sliceCanvas, 0, MT * SCALE)

        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297)
      }

      // 5. Upload to R2
      const pdfBlob = pdf.output('blob')
      const fd = new FormData()
      fd.append('pdf', pdfBlob, `informe-${selected.code || selected.id}.pdf`)
      const res = await saveReportPdf(selected.id, fd)
      if (res.success) {
        toast.success(`PDF generado ✓ (${numPages} página${numPages > 1 ? 's' : ''})`)
        await refreshSelected()
      } else {
        toast.error(res.error || 'Error al guardar PDF')
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Error al generar el PDF: ' + (err instanceof Error ? err.message : String(err)))
    }
    setGeneratingPdf(false)
  }

  // ── Acciones de entrega ──────────────────────────────────────────────────────
  const handleMarkReady = async () => {
    if (!selected) return
    setActionLoading(true)
    const res = await updateOrderStatusAction(selected.id, 'LISTO_PARA_ENTREGA')
    if (res.success) { toast.success('Marcado como lista ✓'); await refreshSelected() }
    else toast.error('Error al actualizar')
    setActionLoading(false)
  }

  const handleDeliver = async () => {
    if (!selected) return
    setActionLoading(true)
    const res = await markAsDelivered(selected.id, deliveryMethod)
    if (res.success) { toast.success('Marcada como entregada ✓'); setShowDeliveryModal(false); await refreshSelected() }
    else toast.error(res.error)
    setActionLoading(false)
  }

  const handleDelay = async () => {
    if (!delayReason.trim() || !selected) return
    setActionLoading(true)
    const res = await markAsDelayed(selected.id, delayReason)
    if (res.success) { toast.success('Marcada como demorada'); setShowDelayModal(false); setDelayReason(''); await refreshSelected() }
    else toast.error(res.error)
    setActionLoading(false)
  }

  const portalUrl = selected ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.irdsistema.com'}/resultados/${selected.accessCode}` : ''

  // ── Render ───────────────────────────────────────────────────────────────────
  const tomoData = selected?.tomografiaData

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 shrink-0">
        <div className="bg-brand-600 p-2 rounded-xl">
          <ScanLine size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Tomografías TC3D</h1>
          <p className="text-xs text-slate-500 font-medium">Gestión de estudios tomográficos</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="rounded-xl">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap gap-2 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Apellido, nombre o DNI..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && load({ ...filters })}
            className="pl-8 h-9 w-56 rounded-xl border-slate-200 text-sm"
          />
        </div>
        <Select value={filters.branchId} onValueChange={v => setFilters(f => ({ ...f, branchId: v }))}>
          <SelectTrigger className="h-9 w-44 rounded-xl border-slate-200 text-sm">
            <SelectValue placeholder="Todas las sedes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las sedes</SelectItem>
            {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Fecha creación */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Creación</span>
          <Input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            className="h-9 w-36 rounded-xl border-slate-200 text-sm" />
          <span className="text-slate-400 text-sm">→</span>
          <Input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            className="h-9 w-36 rounded-xl border-slate-200 text-sm" />
        </div>

        {/* Fecha entrega */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Entrega</span>
          <Input type="date" value={filters.deliveryStartDate} onChange={e => setFilters(f => ({ ...f, deliveryStartDate: e.target.value }))}
            className="h-9 w-36 rounded-xl border-slate-200 text-sm" />
          <span className="text-slate-400 text-sm">→</span>
          <Input type="date" value={filters.deliveryEndDate} onChange={e => setFilters(f => ({ ...f, deliveryEndDate: e.target.value }))}
            className="h-9 w-36 rounded-xl border-slate-200 text-sm" />
        </div>

        {/* Sort */}
        <Select value={`${filters.sortBy}-${filters.sortDir}`} onValueChange={v => {
          const [sb, sd] = v.split('-') as ['createdAt' | 'deliveryDate', 'asc' | 'desc']
          setFilters(f => ({ ...f, sortBy: sb, sortDir: sd }))
        }}>
          <SelectTrigger className="h-9 w-52 rounded-xl border-slate-200 text-sm">
            <ArrowUpDown size={13} className="mr-1.5 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Creación: más nuevos</SelectItem>
            <SelectItem value="createdAt-asc">Creación: más antiguos</SelectItem>
            <SelectItem value="deliveryDate-asc">Entrega: más próximos</SelectItem>
            <SelectItem value="deliveryDate-desc">Entrega: más lejanos</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => load({ ...filters })} size="sm" className="h-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4">
          <Search size={14} className="mr-1.5" /> Buscar
        </Button>
        <Button variant="ghost" size="sm" className="h-9 rounded-xl text-slate-500" onClick={() => {
          const reset = { branchId: 'ALL', startDate: '', endDate: '', deliveryStartDate: '', deliveryEndDate: '', search: '', sortBy: 'createdAt' as const, sortDir: 'desc' as const }
          setFilters(reset); load(reset)
        }}>Limpiar</Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Order List */}
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] xl:w-[420px] border-r border-slate-200 bg-white overflow-y-auto shrink-0`}>
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">
              <Loader2 size={24} className="animate-spin mr-2" /> Cargando...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <ScanLine size={32} className="opacity-30" />
              <p className="text-sm font-medium">{hasSearched ? 'Sin resultados para este filtro' : 'Aplicá un filtro para buscar'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map(order => {
                const st = STATUS_MAP[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-600' }
                const tomoProcs = order.items.filter((i: any) =>
                  i.procedure.code?.startsWith('09.03') || i.procedure.name?.startsWith('TC3D')
                )
                const hasReport = !!order.tomografiaData?.reportHtml
                const hasPdf = !!order.tomografiaData?.reportPdfUrl
                const fileCount = (order.tomografiaData?.studyFiles?.length || 0) + (order.tomografiaData?.derivacionFiles?.length || 0)
                const dd = order.tomografiaData?.deliveryDate
                return (
                  <div
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selected?.id === order.id ? 'bg-brand-50 border-l-2 border-brand-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 uppercase text-sm truncate">
                          {order.patient.lastName}, {order.patient.firstName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">DNI {order.patient.dni} · {order.branch?.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('es-AR')} · {order.code}
                        </p>
                        {dd && (
                          <p className="text-xs text-brand-600 mt-0.5 flex items-center gap-1 font-semibold">
                            <CalendarDays size={11} /> Entrega: {new Date(dd).toLocaleDateString('es-AR')}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {tomoProcs.slice(0, 2).map((i: any) => (
                            <span key={i.id} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-semibold">
                              {i.procedure.name}
                            </span>
                          ))}
                          {tomoProcs.length > 2 && <span className="text-[10px] text-slate-400">+{tomoProcs.length - 2}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${st.cls}`}>{st.label}</span>
                        <div className="flex gap-1">
                          {fileCount > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">{fileCount} arch.</span>}
                          {hasPdf && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">PDF ✓</span>}
                          {hasReport && !hasPdf && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">Inf.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Detail Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3 shrink-0">
              <button onClick={() => setSelected(null)} className="lg:hidden p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-lg uppercase text-slate-900">
                  {selected.patient.lastName}, {selected.patient.firstName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  DNI {selected.patient.dni} · {selected.branch?.name} · {new Date(selected.createdAt).toLocaleDateString('es-AR')} · <span className="font-mono">{selected.code}</span>
                </p>
                {selected.dentist && (
                  <p className="text-xs text-slate-400 mt-0.5">Dr./a {selected.dentist.lastName}, {selected.dentist.firstName}</p>
                )}

                {/* Delivery date inline editor */}
                <div className="flex items-center gap-2 mt-2">
                  <CalendarDays size={13} className="text-brand-500" />
                  {editingDeliveryDate ? (
                    <div className="flex items-center gap-1.5">
                      <Input type="date" value={deliveryDateValue} onChange={e => setDeliveryDateValue(e.target.value)}
                        className="h-7 text-xs rounded-xl border-brand-300 w-36 px-2" />
                      <button onClick={handleSaveDeliveryDate} disabled={savingDeliveryDate}
                        className="text-[10px] font-black bg-brand-600 text-white px-2 py-1 rounded-lg hover:bg-brand-700">
                        {savingDeliveryDate ? <Loader2 size={10} className="animate-spin" /> : 'OK'}
                      </button>
                      <button onClick={() => setEditingDeliveryDate(false)} className="text-[10px] text-slate-400 hover:text-slate-600 px-1">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingDeliveryDate(true)} className="text-xs text-slate-500 hover:text-brand-600 font-medium flex items-center gap-1">
                      {tomoData?.deliveryDate
                        ? <span className="text-brand-600 font-bold">Entrega: {new Date(tomoData.deliveryDate).toLocaleDateString('es-AR')}</span>
                        : <span className="text-slate-400">+ Agregar fecha de entrega</span>
                      }
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {selected.items.filter((i: any) => i.procedure.code?.startsWith('09.03') || i.procedure.name?.startsWith('TC3D'))
                    .map((i: any) => (
                      <span key={i.id} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-semibold">{i.procedure.name}</span>
                    ))
                  }
                </div>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${(STATUS_MAP[selected.status] ?? { cls: 'bg-slate-100 text-slate-600' }).cls}`}>
                {(STATUS_MAP[selected.status] ?? { label: selected.status }).label}
              </span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0 px-2">
              {(['archivos', 'informe', 'acciones'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors ${activeTab === tab ? 'border-b-2 border-brand-500 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab === 'archivos' ? '📁 Archivos' : tab === 'informe' ? '📝 Informe' : '✉️ Acciones'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* ── ARCHIVOS TAB ─────────────────────────────────────────── */}
              {activeTab === 'archivos' && (
                <>
                  {/* Orden de Derivación */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Orden de Derivación</h3>
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${uploadingDeriv ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-black text-white'}`}>
                        {uploadingDeriv ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                        {uploadingDeriv ? 'Subiendo...' : 'Subir'}
                        <input ref={fileDerivRef} type="file" accept=".pdf,image/*" multiple className="hidden"
                          onChange={e => openFileNameDialog(e.target.files, 'derivacion')} disabled={uploadingDeriv} />
                      </label>
                    </div>
                    {tomoData?.derivacionFiles?.length > 0 ? (
                      <div className="space-y-2">
                        {tomoData.derivacionFiles.map((url: string) => (
                          <FileRow key={url} url={url} onRemove={() => removeTomoFile(selected.id, url, 'derivacion').then(r => { if(r.success) refreshSelected(); else toast.error(r.error) })} />
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm">
                        Sin orden de derivación adjunta
                      </div>
                    )}
                  </section>

                  {/* Archivos del Estudio */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Archivos del Estudio</h3>
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${uploadingStudy ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}>
                        {uploadingStudy ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                        {uploadingStudy ? 'Subiendo...' : 'Agregar archivos'}
                        <input ref={fileStudyRef} type="file" accept=".pdf,image/*" multiple className="hidden"
                          onChange={e => openFileNameDialog(e.target.files, 'study')} disabled={uploadingStudy} />
                      </label>
                    </div>
                    {tomoData?.studyFiles?.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {tomoData.studyFiles.map((url: string) => (
                          isImage(url) ? (
                            <div key={url} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-lg"><Eye size={14} className="text-slate-700" /></a>
                                <a href={url} download className="p-1.5 bg-white rounded-lg"><Download size={14} className="text-slate-700" /></a>
                                <button onClick={() => removeTomoFile(selected.id, url, 'study').then(r => { if(r.success) refreshSelected(); else toast.error(r.error) })} className="p-1.5 bg-red-500 rounded-lg"><Trash2 size={14} className="text-white" /></button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                <p className="text-[10px] text-white truncate">{shortFileName(url)}</p>
                              </div>
                            </div>
                          ) : (
                            <FileRow key={url} url={url} onRemove={() => removeTomoFile(selected.id, url, 'study').then(r => { if(r.success) refreshSelected(); else toast.error(r.error) })} />
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm mb-4">
                        Sin archivos del estudio
                      </div>
                    )}

                    {/* Links externos */}
                    <div className="mt-2">
                      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Links externos (Drive, WeTransfer, etc.)</h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://drive.google.com/..."
                          value={newLink}
                          onChange={e => setNewLink(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                          className="h-9 rounded-xl border-slate-200 text-sm flex-1"
                        />
                        <Button size="sm" className="h-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white" onClick={handleAddLink}>
                          <Plus size={14} />
                        </Button>
                      </div>
                      {tomoData?.studyLinks?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {tomoData.studyLinks.map((link: string) => (
                            <div key={link} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                              <LinkIcon size={13} className="text-brand-500 shrink-0" />
                              <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline truncate flex-1">{link}</a>
                              <button onClick={() => removeTomoLink(selected.id, link).then(r => { if(r.success) refreshSelected(); else toast.error(r.error) })} className="p-1 hover:bg-red-100 rounded-lg text-red-500 shrink-0">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* ── INFORME TAB ──────────────────────────────────────────── */}
              {activeTab === 'informe' && (
                <section className="space-y-4">
                  {tomoData?.reportPdfUrl && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-emerald-800 uppercase">PDF Generado ✓</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {tomoData.reportGeneratedAt ? new Date(tomoData.reportGeneratedAt).toLocaleString('es-AR') : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a href={tomoData.reportPdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs border-emerald-300 text-emerald-700">
                            <Eye size={12} className="mr-1" /> Ver PDF
                          </Button>
                        </a>
                        <a href={tomoData.reportPdfUrl} download>
                          <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs border-emerald-300 text-emerald-700">
                            <Download size={12} className="mr-1" /> Descargar
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Redactar Informe</label>
                      {!activeTemplate && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          ⚠️ Sin template activo — PDF sin fondo
                        </span>
                      )}
                    </div>
                    <RichEditor value={reportHtml} onChange={setReportHtml} />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button onClick={handleSaveReport} disabled={savingReport || !reportHtml.trim()} className="rounded-xl bg-slate-800 hover:bg-black text-white text-xs h-9">
                      {savingReport ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                      Guardar borrador
                    </Button>
                    <Button onClick={handleGeneratePdf} disabled={generatingPdf || !reportHtml.trim()} className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs h-9">
                      {generatingPdf ? <Loader2 size={14} className="animate-spin mr-1" /> : <FileText size={14} className="mr-1" />}
                      {generatingPdf ? 'Generando PDF...' : 'Generar PDF y subir'}
                    </Button>
                    {(tomoData?.reportHtml || tomoData?.reportPdfUrl) && (
                      confirmDelete ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" className="rounded-xl h-9 text-xs" onClick={() => deleteReport(selected.id).then(r => { if(r.success) { refreshSelected(); setReportHtml(''); setConfirmDelete(false); toast.success('Informe eliminado') } })}>
                            Confirmar eliminación
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-xl h-9 text-xs" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="rounded-xl h-9 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
                          <Trash2 size={13} className="mr-1" /> Eliminar informe
                        </Button>
                      )
                    )}
                  </div>
                </section>
              )}

              {/* ── ACCIONES TAB ─────────────────────────────────────────── */}
              {activeTab === 'acciones' && (
                <section className="space-y-4">
                  {/* Status quick actions */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Estado del Estudio</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-xl h-11 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={handleMarkReady} disabled={actionLoading || selected.status === 'LISTO_PARA_ENTREGA'}>
                        <CheckCircle2 size={15} className="mr-1.5" /> Marcar lista
                      </Button>
                      <Button variant="outline" className="rounded-xl h-11 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => setShowDeliveryModal(true)} disabled={actionLoading}>
                        <UserCheck size={15} className="mr-1.5" /> Entregar
                      </Button>
                      <Button variant="outline" className="rounded-xl h-11 text-xs font-bold border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => setShowDelayModal(true)} disabled={actionLoading}>
                        <PauseCircle size={15} className="mr-1.5" /> Demorar
                      </Button>
                      <Button variant="outline" className="rounded-xl h-11 text-xs font-bold border-brand-300 text-brand-700 hover:bg-brand-50"
                        onClick={() => updateOrderStatusAction(selected.id, 'ENVIADA_DIGITAL').then(r => { if(r.success) { toast.success('Marcado como enviado digital'); refreshSelected() } })}
                        disabled={actionLoading}>
                        <Send size={15} className="mr-1.5" /> Enviada digital
                      </Button>
                    </div>
                  </div>

                  {/* Share */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Compartir Resultados</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-xl h-11 text-xs font-bold" onClick={() => setShowQr(true)}>
                        <QrCode size={15} className="mr-1.5" /> Ver QR
                      </Button>
                      <Button variant="outline" className="rounded-xl h-11 text-xs font-bold"
                        onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success('Link copiado ✓') }}>
                        <Copy size={15} className="mr-1.5" /> Copiar link
                      </Button>
                      <a href={`mailto:${selected.patient.email || ''}?subject=Resultados%20de%20su%20estudio&body=Hola%20${encodeURIComponent(selected.patient.firstName)}%2C%20puede%20ver%20sus%20resultados%20en%3A%20${encodeURIComponent(portalUrl)}`} className="col-span-1">
                        <Button variant="outline" className="rounded-xl h-11 text-xs font-bold w-full">
                          <Mail size={15} className="mr-1.5" /> Enviar email
                        </Button>
                      </a>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Hola ${selected.patient.firstName}, sus resultados están disponibles en: ${portalUrl}`)}`} target="_blank" rel="noopener noreferrer" className="col-span-1">
                        <Button variant="outline" className="rounded-xl h-11 text-xs font-bold w-full text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                          <Smartphone size={15} className="mr-1.5" /> WhatsApp
                        </Button>
                      </a>
                      <Button variant="outline" className="rounded-xl h-11 text-xs font-bold col-span-2"
                        onClick={() => { const w = window.open('', '_blank'); if(w) { w.document.write(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;"><div>${document.getElementById('qr-svg-' + selected.id)?.innerHTML || ''}</div></body></html>`); w.print() } }}>
                        <Printer size={15} className="mr-1.5" /> Imprimir QR
                      </Button>
                    </div>
                    <div id={`qr-svg-${selected.id}`} className="hidden">
                      <QRCode value={portalUrl} size={200} />
                    </div>
                  </div>

                  {/* Portal link */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 font-semibold">Link del portal</p>
                    <p className="text-xs text-brand-600 font-mono break-all">{portalUrl}</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden lg:flex items-center justify-center text-slate-400 flex-col gap-3">
            <ScanLine size={48} className="opacity-20" />
            <p className="text-sm font-medium">Seleccioná un estudio para ver el detalle</p>
          </div>
        )}
      </div>

      {/* ── File Name Dialog ─────────────────────────────────────────────── */}
      <FileNameDialog
        open={fileNameDialog.open}
        fileName={fileNameDialog.file?.name ?? ''}
        onConfirm={handleFileNameConfirm}
        onCancel={() => setFileNameDialog(d => ({ ...d, open: false }))}
      />

      {/* ── Modales ─────────────────────────────────────────────────────── */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="sm:max-w-xs bg-white rounded-3xl p-8 border-none shadow-2xl outline-none">
          <DialogTitle className="text-center font-black uppercase text-lg">Código QR</DialogTitle>
          <div className="flex flex-col items-center gap-4 mt-2">
            <QRCode value={portalUrl} size={200} />
            <p className="text-xs text-center text-slate-500 font-mono break-all">{selected?.patient?.lastName}, {selected?.patient?.firstName}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelayModal} onOpenChange={setShowDelayModal}>
        <DialogContent className="sm:max-w-sm bg-white rounded-3xl p-8 border-none shadow-2xl outline-none">
          <DialogTitle className="text-xl font-black uppercase">Demorar Estudio</DialogTitle>
          <div className="space-y-4 mt-4">
            <Input placeholder="Motivo de la demora..." value={delayReason} onChange={e => setDelayReason(e.target.value)}
              className="h-12 rounded-2xl border-2 font-medium" />
            <Button onClick={handleDelay} disabled={!delayReason.trim() || actionLoading}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl">
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Demora'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="sm:max-w-sm bg-white rounded-3xl p-8 border-none shadow-2xl outline-none">
          <DialogTitle className="text-xl font-black uppercase">Registrar Entrega</DialogTitle>
          <div className="space-y-4 mt-4">
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger className="h-12 rounded-2xl border-2 font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RETIRO_PERSONAL">Retiro personal</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="DRIVE">Drive / Link</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDeliver} disabled={actionLoading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl">
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Entrega'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── File Row Component ────────────────────────────────────────────────────────
function FileRow({ url, onRemove }: { url: string; onRemove: () => void }) {
  const name = shortFileName(url)
  const isPdf_ = isPdf(url)
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
      {isPdf_ ? <FileText size={14} className="text-red-500 shrink-0" /> : <FileImage size={14} className="text-blue-500 shrink-0" />}
      <span className="text-xs text-slate-700 truncate flex-1 font-medium">{name}</span>
      <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-200 rounded-lg shrink-0">
        <Eye size={12} className="text-slate-500" />
      </a>
      <a href={url} download className="p-1 hover:bg-slate-200 rounded-lg shrink-0">
        <Download size={12} className="text-slate-500" />
      </a>
      <button onClick={onRemove} className="p-1 hover:bg-red-100 rounded-lg shrink-0">
        <Trash2 size={12} className="text-red-500" />
      </button>
    </div>
  )
}
