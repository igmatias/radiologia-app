"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

interface ReceiptModalProps {
  order: any
  open: boolean
  onClose: () => void
}

export default function ReceiptModal({ order, open, onClose }: ReceiptModalProps) {
  if (!order) return null

  const handlePrint = () => {
    const content = document.getElementById('receipt-print-content')?.innerHTML
    if (!content) return
    const w = window.open('', '_blank', 'width=420,height=700')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Comprobante ${order.code || ''}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:20px;max-width:380px;margin:0 auto;font-size:12px;color:#111}
      .logo{font-weight:900;font-size:18px;text-transform:uppercase;letter-spacing:-0.5px;margin-bottom:2px}
      .sub{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:16px}
      hr{border:none;border-top:1px dashed #ccc;margin:10px 0}
      .row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}
      .label{font-size:9px;text-transform:uppercase;color:#888;font-weight:700}
      .value{font-size:11px;font-weight:700;text-align:right;max-width:60%}
      .section{margin:10px 0}
      .section-title{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:3px}
      .item{margin-bottom:6px}
      .item-name{font-weight:700;font-size:11px}
      .item-sub{font-size:9px;color:#888}
      .total-row{display:flex;justify-content:space-between;font-size:13px;font-weight:900;padding:8px 0;border-top:2px solid #111;margin-top:8px}
      .footer{font-size:9px;color:#aaa;text-align:center;margin-top:20px;line-height:1.6}
      @media print{body{padding:10px}}
    </style></head><body>${content}</body></html>`)
    w.document.close()
    setTimeout(() => { w.print(); w.onafterprint = () => w.close() }, 300)
  }

  const fecha = new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora = new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const paciente = `${order.patient?.lastName || ''}, ${order.patient?.firstName || ''}`.trim().replace(/^,\s*/, '')
  const methodLabels: Record<string, string> = { EFECTIVO: 'Efectivo', TARJETA_DEBITO: 'Débito', TARJETA_CREDITO: 'Crédito', TRANSFERENCIA: 'Transferencia', MERCADOPAGO: 'MercadoPago', CUENTA_CORRIENTE: 'Cta. Cte.', SALDO: 'Saldo', OTRO: 'Otro' }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] bg-white rounded-[2rem] border-t-8 border-brand-600 p-0 overflow-hidden outline-none [&>button]:hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-black uppercase tracking-tight text-slate-900 flex items-center gap-2"><Printer size={18} className="text-brand-600"/> Comprobante de Orden</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18}/></button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <div id="receipt-print-content">
            <div className="logo">i-R Dental</div>
            <div className="sub">Instituto Radiodiagnóstico Dentomaxilofacial</div>
            <div className="sub" style={{marginTop:'-12px',marginBottom:'14px'}}>CUIT: 30-66397607-5</div>

            <hr/>

            <div className="section">
              <div className="row"><span className="label">Orden N°</span><span className="value font-mono">{order.code || `#${order.dailyId}`}</span></div>
              <div className="row"><span className="label">Sede</span><span className="value">{order.branch?.name || '—'}</span></div>
              <div className="row"><span className="label">Fecha</span><span className="value">{fecha} {hora}</span></div>
            </div>

            <hr/>

            <div className="section">
              <div className="section-title">Paciente</div>
              <div className="row"><span className="label">Nombre</span><span className="value">{paciente}</span></div>
              <div className="row"><span className="label">DNI</span><span className="value">{order.patient?.dni || '—'}</span></div>
              {order.obraSocial && <div className="row"><span className="label">Obra Social</span><span className="value">{order.obraSocial.name}</span></div>}
            </div>

            <hr/>

            <div className="section">
              <div className="section-title">Estudios</div>
              {order.items?.map((item: any, i: number) => {
                const meta = item.metadata || {}
                const teeth = meta.teeth || []
                const photos = meta.photos || []
                return (
                  <div key={i} className="item">
                    <div className="item-name">{item.procedure?.name}</div>
                    {teeth.length > 0 && <div className="item-sub">Piezas: {teeth.join(', ')}</div>}
                    {photos.length > 0 && <div className="item-sub">Fotos: {photos.join(', ')}</div>}
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:'2px'}}>
                      <span className="item-sub">Paciente: ${Number(item.patientCopay).toLocaleString('es-AR')}</span>
                      {Number(item.insuranceCoverage) > 0 && <span className="item-sub">OS: ${Number(item.insuranceCoverage).toLocaleString('es-AR')}</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <hr/>

            <div className="section">
              <div className="row"><span className="label">Total</span><span className="value">${Number(order.totalAmount).toLocaleString('es-AR')}</span></div>
              {Number(order.insuranceAmount) > 0 && <div className="row"><span className="label">A cargo OS</span><span className="value">${Number(order.insuranceAmount).toLocaleString('es-AR')}</span></div>}
              <div className="total-row"><span>Total Paciente</span><span>${Number(order.patientAmount).toLocaleString('es-AR')}</span></div>
            </div>

            {order.payments?.length > 0 && (
              <>
                <hr/>
                <div className="section">
                  <div className="section-title">Forma de Pago</div>
                  {order.payments.map((p: any, i: number) => (
                    <div key={i} className="row">
                      <span className="label">{methodLabels[p.method] || p.method}</span>
                      <span className="value">${Number(p.amount).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="footer">
              <div>i-R Dental — 0810.333.4507</div>
              <div>www.irdental.com — info@irdental.com</div>
              <div style={{marginTop:'8px',fontSize:'8px'}}>Este comprobante no reemplaza a la factura oficial</div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100">
          <Button onClick={handlePrint} className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase rounded-xl shadow-lg flex items-center gap-2">
            <Printer size={18}/> Imprimir Comprobante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
