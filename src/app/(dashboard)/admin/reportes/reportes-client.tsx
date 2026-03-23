"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getDentistStats, getInsuranceBilling, updateItemInsuranceAmount, updateItemPatientCopay } from "@/actions/reports"
import { 
  BarChart3, Receipt, FileSpreadsheet, Printer, Search, 
  Stethoscope, Activity, User, X, ArrowUpDown
} from "lucide-react"

export default function ReportesClient({ dentists, obrasSociales, branches }: { dentists: any[], obrasSociales: any[], branches: any[] }) {
  const [activeTab, setActiveTab] = useState<'FACTURACION' | 'DENTISTAS'>('FACTURACION')
  
  // Estados Filtros Comunes
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  
  // Estados Facturación
  const [selectedOS, setSelectedOS] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<string>("PACIENTE_ASC")
  const [billingItems, setBillingItems] = useState<any[]>([])
  
  // Estados Dentistas
  const [dentistSearchTerm, setDentistSearchTerm] = useState("")
  const [selectedDentist, setSelectedDentist] = useState<string>("")
  const [dentistStats, setDentistStats] = useState<any>(null)

  const [loading, setLoading] = useState(false)

  // --- LÓGICA DENTISTAS ---
  const filteredDentists = useMemo(() => {
    const search = dentistSearchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!search || search.length < 2) return [];
    return dentists.filter((d:any) => 
      d.lastName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) || 
      d.firstName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) || 
      d.matriculaProv?.toString().includes(search)
    ).slice(0, 10);
  }, [dentistSearchTerm, dentists]);

  const handleSearchDentist = async () => {
    if (!selectedDentist) return toast.error("Buscá y seleccioná un odontólogo");
    setLoading(true);
    const res = await getDentistStats(selectedDentist, startDate, endDate);
    if (res.success) {
      setDentistStats({ orders: res.orders, chartData: res.chartData, totalProcedures: res.totalProcedures, totalPatients: res.totalPatients });
    } else toast.error("Error al buscar métricas");
    setLoading(false);
  }

  // --- LÓGICA FACTURACIÓN ---
  const handleSearchBilling = async () => {
    if (!selectedOS) return toast.error("Seleccioná una Obra Social");
    setLoading(true);
    const res = await getInsuranceBilling(selectedOS, startDate, endDate, selectedBranch);
    if (res.success) setBillingItems(res.items);
    else toast.error("Error al buscar liquidación");
    setLoading(false);
  }

  const handleUpdatePrice = async (itemId: string, newAmount: number, index: number) => {
    const res = await updateItemInsuranceAmount(itemId, newAmount);
    if (res.success) {
      toast.success("Valor OS actualizado ✓");
      const newItems = [...billingItems];
      newItems[index].insuranceCoverage = newAmount;
      setBillingItems(newItems);
    } else {
      toast.error(res.error);
    }
  }

  const handleUpdateCopago = async (itemId: string, newAmount: number, index: number) => {
    const res = await updateItemPatientCopay(itemId, newAmount);
    if (res.success) {
      toast.success("Copago actualizado ✓");
      const newItems = [...billingItems];
      newItems[index].patientCopay = newAmount;
      setBillingItems(newItems);
    } else {
      toast.error(res.error);
    }
  }

  const sortedBillingItems = useMemo(() => {
    let sorted = [...billingItems];
    sorted.sort((a, b) => {
      const nameA = `${a.order.patient.lastName} ${a.order.patient.firstName}`.toLowerCase();
      const nameB = `${b.order.patient.lastName} ${b.order.patient.firstName}`.toLowerCase();
      const dateA = new Date(a.order.createdAt).getTime();
      const dateB = new Date(b.order.createdAt).getTime();
      const codeA = a.procedure?.code || "";
      const codeB = b.procedure?.code || "";
      const valA = Number(a.insuranceCoverage) || 0;
      const valB = Number(b.insuranceCoverage) || 0;

      switch (sortBy) {
        case "PACIENTE_ASC": return nameA.localeCompare(nameB);
        case "FECHA_DESC": return dateB - dateA;
        case "FECHA_ASC": return dateA - dateB;
        case "CODIGO_ASC": return codeA.localeCompare(codeB);
        case "VALOR_DESC": return valB - valA;
        default: return nameA.localeCompare(nameB);
      }
    });
    return sorted;
  }, [billingItems, sortBy]);


  // 🔥 IDENTIFICADORES SEGUROS (Evita el bug del ID numérico vs string)
  const activeOS = obrasSociales.find(o => String(o.id) === String(selectedOS));
  const activeBranch = branches.find(b => String(b.id) === String(selectedBranch));
  
  const osNameSafe = activeOS ? activeOS.name.toUpperCase() : "OBRA SOCIAL";
  const branchNameSafe = selectedBranch === 'ALL' ? 'TODAS LAS SEDES' : (activeBranch ? activeBranch.name.toUpperCase() : "");

  // --- EXPORTACIÓN EXCEL (.XLS) ---
  const handleExportExcel = () => {
    if (sortedBillingItems.length === 0) return toast.error("No hay datos para exportar");
    
    const totalOS = sortedBillingItems.reduce((acc, curr) => acc + (Number(curr.insuranceCoverage) || 0), 0);
    const totalCopago = sortedBillingItems.reduce((acc, curr) => acc + (Number(curr.patientCopay) || 0), 0);
    
    const fechaInicioStr = new Date(startDate).toLocaleDateString('es-AR');
    const fechaFinStr = new Date(endDate).toLocaleDateString('es-AR');

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            body, table, td, th { font-family: Arial, sans-serif; font-size: 10px; }
            table { border-collapse: collapse; width: 700px; } 
            td, th { border: 1px solid #000000; vertical-align: middle; }
            .title { font-size: 14px; font-weight: bold; text-align: left; border: none !important; }
            .subtitle { font-size: 11px; font-weight: normal; text-align: left; border: none !important; padding-bottom: 10px; }
            .header { background-color: #f9f9f9; font-weight: bold; text-align: center; height: 40px; vertical-align: middle; } 
            .center { text-align: center; mso-number-format:"\\@"; } 
            .money { text-align: right; mso-number-format:"\\$#,##0.00"; } 
            .footer-label { font-weight: bold; text-align: right; border: none !important; padding-right: 10px; }
            .footer-value { font-weight: bold; text-align: right; mso-number-format:"\\$#,##0.00"; border: 2px solid #000000; }
          </style>
        </head>
        <body>
          <table style="width: 700px;">
            <tr>
              <td colspan="7" class="title">LIQUIDACIÓN DE PRESTACIONES - ${osNameSafe}</td>
            </tr>
            <tr>
              <td colspan="7" class="subtitle">SEDE: ${branchNameSafe} | PERÍODO: ${fechaInicioStr} AL ${fechaFinStr}</td>
            </tr>
            <tr><td colspan="7" style="border: none; height: 10px;"></td></tr>
            
            <colgroup>
              <col width="160"> <col width="110"> <col width="80"> <col width="80"> <col width="80"> <col width="80"> <col width="80"> 
            </colgroup>

            <tr>
              <td class="header" width="160">PACIENTE</td>
              <td class="header" width="110">NRO. AFILIADO</td>
              <td class="header" width="80">PLAN</td>
              <td class="header" width="80">FECHA</td>
              <td class="header" width="80">CÓDIGO</td>
              <td class="header" width="80">VALOR OS</td>
              <td class="header" width="80">COPAGO</td>
            </tr>
    `;

    sortedBillingItems.forEach(item => {
      const paciente = `${item.order.patient.lastName}, ${item.order.patient.firstName}`.toUpperCase();
      const afiliado = (item.order.patient.affiliateNumber || '---').toUpperCase();
      const plan = (item.order.patient.plan || '---').toUpperCase();
      const fecha = new Date(item.order.createdAt).toLocaleDateString('es-AR');
      const codigo = (item.procedure?.code || 'S/D').toUpperCase();
      const valorOS = item.insuranceCoverage || 0;
      const copago = item.patientCopay || 0;

      tableHtml += `
        <tr>
          <td style="padding-left: 5px;">${paciente}</td>
          <td class="center">${afiliado}</td>
          <td class="center">${plan}</td>
          <td class="center">${fecha}</td>
          <td class="center">${codigo}</td>
          <td class="money">${valorOS}</td>
          <td class="money">${copago}</td>
        </tr>
      `;
    });

    tableHtml += `
            <tr><td colspan="7" style="border: none; height: 10px;"></td></tr>
            <tr>
              <td colspan="5" class="footer-label">TOTALES:</td>
              <td class="footer-value">${totalOS}</td>
              <td class="footer-value">${totalCopago}</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Liquidacion_${osNameSafe.replace(/\s+/g, '_')}_${startDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalBillingOS = sortedBillingItems.reduce((acc, curr) => acc + (Number(curr.insuranceCoverage) || 0), 0);
  const totalBillingCopago = sortedBillingItems.reduce((acc, curr) => acc + (Number(curr.patientCopay) || 0), 0);

  return (
    <div className="space-y-6">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; color: black !important; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
        }
      `}} />

      <div className="flex gap-4 print:hidden">
        <Button onClick={() => setActiveTab('FACTURACION')} className={`h-14 flex-1 rounded-2xl text-lg font-black uppercase italic transition-all ${activeTab === 'FACTURACION' ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 'bg-white text-slate-500 hover:bg-slate-50 border-2'}`}><Receipt className="mr-2"/> Facturación OS</Button>
        <Button onClick={() => setActiveTab('DENTISTAS')} className={`h-14 flex-1 rounded-2xl text-lg font-black uppercase italic transition-all ${activeTab === 'DENTISTAS' ? 'bg-red-700 text-white shadow-lg scale-[1.02]' : 'bg-white text-slate-500 hover:bg-slate-50 border-2'}`}><BarChart3 className="mr-2"/> Métricas Derivantes</Button>
      </div>

      {activeTab === 'FACTURACION' && (
        <div className="space-y-6 animate-in fade-in">
          
          <Card className="border-none shadow-md rounded-[2rem] bg-white border-t-8 border-slate-900 print:hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Obra Social / Prepaga</Label>
                  <Select value={selectedOS} onValueChange={setSelectedOS}>
                    <SelectTrigger className="h-14 font-black uppercase italic border-2 border-slate-200 focus:border-red-700 text-lg"><SelectValue placeholder="SELECCIONAR..."/></SelectTrigger>
                    <SelectContent className="font-black uppercase italic">
                      {/* Convertimos a String explícitamente */}
                      {obrasSociales.map(os => <SelectItem key={os.id} value={String(os.id)}>{os.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Sede (Sucursal)</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="h-14 font-black uppercase border-2"><SelectValue/></SelectTrigger>
                    <SelectContent className="font-black uppercase">
                      <SelectItem value="ALL">🌐 TODAS LAS SEDES</SelectItem>
                      {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>🏢 {b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Fecha Desde</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-14 font-bold border-2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Fecha Hasta</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-14 font-bold border-2" />
                </div>
              </div>
              <Button onClick={handleSearchBilling} disabled={loading} className="w-full mt-4 h-14 bg-red-700 hover:bg-red-800 text-white font-black uppercase italic rounded-xl shadow-md"><Search size={18} className="mr-2"/> {loading ? "Buscando..." : "Generar Liquidación"}</Button>
            </CardContent>
          </Card>

          {sortedBillingItems.length > 0 && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center gap-3 print:hidden bg-slate-100 p-3 rounded-2xl border-2 border-slate-200">
                <div className="flex items-center gap-3 pl-2">
                  <ArrowUpDown size={18} className="text-slate-400"/>
                  <Label className="text-xs font-black uppercase text-slate-500 whitespace-nowrap">Ordenar por:</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 w-64 font-bold uppercase text-xs border-2 bg-white"><SelectValue/></SelectTrigger>
                    <SelectContent className="font-bold uppercase text-xs">
                      <SelectItem value="PACIENTE_ASC">A-Z Paciente (Defecto)</SelectItem>
                      <SelectItem value="FECHA_DESC">Fecha (Más reciente primero)</SelectItem>
                      <SelectItem value="FECHA_ASC">Fecha (Más antigua primero)</SelectItem>
                      <SelectItem value="CODIGO_ASC">Código de Práctica</SelectItem>
                      <SelectItem value="VALOR_DESC">Valor OS (Mayor a Menor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExportExcel} variant="outline" className="h-10 border-2 border-slate-200 text-slate-800 hover:bg-white font-black uppercase text-xs shadow-sm"><FileSpreadsheet size={14} className="mr-2"/> Excel (.XLS)</Button>
                  <Button onClick={() => window.print()} className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs shadow-sm"><Printer size={14} className="mr-2"/> PDF / Imprimir</Button>
                </div>
              </div>

              <div id="printable-area" className="bg-white p-8 rounded-3xl shadow-xl border-2 border-slate-100 print:shadow-none print:border-none print:p-0">
                <div className="border-b-2 border-slate-400 pb-4 mb-6">
                  <h2 className="text-2xl font-black uppercase italic text-slate-800 leading-tight">Liquidación de Prestaciones</h2>
                  <div className="mt-2">
                    <p className="text-sm font-bold uppercase text-slate-700">Obra Social: <span className="font-black text-red-700">{osNameSafe}</span></p>
                    <p className="text-xs font-bold uppercase text-slate-600">Sede: {branchNameSafe}</p>
                    <p className="text-xs font-bold uppercase text-slate-600">Período: {new Date(startDate).toLocaleDateString('es-AR')} al {new Date(endDate).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>

                <table className="w-full table-fixed text-left border-collapse text-xs print:text-[10px] print:leading-tight">
                  <thead className="bg-slate-100 text-[9px] print:text-[10px] font-black uppercase text-slate-800 print:bg-white">
                    <tr>
                      <th className="w-[20%] p-3 print:p-1.5 border-b-2 border-slate-300">PACIENTE</th>
                      <th className="w-[12%] p-3 print:p-1.5 border-b-2 border-slate-300">NRO. AFILIADO</th>
                      <th className="w-[10%] p-3 print:p-1.5 border-b-2 border-slate-300">PLAN</th>
                      <th className="w-[10%] p-3 print:p-1.5 border-b-2 border-slate-300">FECHA</th>
                      <th className="w-[10%] p-3 print:p-1.5 border-b-2 border-slate-300">CÓDIGO</th>
                      <th className="w-[18%] p-3 print:p-1.5 border-b-2 border-slate-300">PRÁCTICA</th>
                      <th className="w-[10%] p-3 print:p-1.5 border-b-2 border-slate-300 text-right">VALOR OS</th>
                      <th className="w-[10%] p-3 print:p-1.5 border-b-2 border-slate-300 text-right text-red-700">COPAGO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedBillingItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 print:p-1.5 font-black uppercase text-slate-800 break-words">{item.order.patient.lastName}, {item.order.patient.firstName}</td>
                        <td className="p-3 print:p-1.5 font-bold text-slate-600 uppercase break-words">{item.order.patient.affiliateNumber || '---'}</td>
                        <td className="p-3 print:p-1.5 font-bold text-slate-600 uppercase break-words">{item.order.patient.plan || '---'}</td>
                        <td className="p-3 print:p-1.5 font-bold text-slate-600">{new Date(item.order.createdAt).toLocaleDateString('es-AR')}</td>
                        <td className="p-3 print:p-1.5 font-black text-slate-900 break-words">{item.procedure?.code}</td>
                        <td className="p-3 print:p-1.5 font-bold text-slate-700 uppercase break-words">{item.procedure?.name}</td>
                        
                        {/* COLUMNA VALOR OS EDITABLE */}
                        <td className="p-3 print:p-1.5 text-right">
                          <div className="flex justify-end items-center gap-1 print:hidden">
                            <span className="text-slate-400 font-bold">$</span>
                            <Input 
                              type="number" 
                              defaultValue={item.insuranceCoverage} 
                              onBlur={(e) => handleUpdatePrice(item.id, Number(e.target.value), index)} 
                              className="h-8 w-20 text-right font-black text-slate-900 border-2 bg-slate-50 focus:bg-white focus:border-red-700 transition-colors" 
                              title="Modificar valor OS" 
                            />
                          </div>
                          <span className="hidden print:inline font-black text-[11px] italic text-slate-900">${item.insuranceCoverage}</span>
                        </td>

                        {/* COLUMNA DE COPAGO EDITABLE */}
                        <td className="p-3 print:p-1.5 text-right">
                          <div className="flex justify-end items-center gap-1 print:hidden">
                            <span className="text-red-300 font-bold">$</span>
                            <Input 
                              type="number" 
                              defaultValue={item.patientCopay} 
                              onBlur={(e) => handleUpdateCopago(item.id, Number(e.target.value), index)} 
                              className="h-8 w-20 text-right font-black text-red-700 border-2 border-red-200 bg-red-50 focus:bg-white focus:border-red-700 transition-colors" 
                              title="Modificar copago" 
                            />
                          </div>
                          <span className="hidden print:inline font-black text-[11px] italic text-red-700">${item.patientCopay}</span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={6} className="p-4 print:p-2 text-right font-black uppercase text-slate-800 print:text-xs">
                        TOTALES:
                      </td>
                      <td className="p-4 print:p-2 text-right text-xl print:text-sm font-black italic text-slate-900 border-2 border-slate-300 bg-slate-50 print:border-none print:bg-white">
                        ${totalBillingOS.toLocaleString('es-AR')}
                      </td>
                      <td className="p-4 print:p-2 text-right text-lg print:text-sm font-black italic text-red-700 bg-red-50 border-y-2 border-red-300 print:border-none print:bg-white">
                        ${totalBillingCopago.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA DENTISTAS OMITIDA POR BREVEDAD */}
      {activeTab === 'DENTISTAS' && (
        <div className="space-y-6 animate-in fade-in print:hidden">
          <Card className="border-none shadow-md rounded-[2rem] bg-white border-t-8 border-red-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Odontólogo Derivante</Label>
                  {!selectedDentist ? (
                    <div className="relative shadow-sm rounded-xl">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input placeholder="Escribí APELLIDO O MATRÍCULA..." value={dentistSearchTerm} onChange={(e) => setDentistSearchTerm(e.target.value)} className="pl-12 h-14 uppercase font-bold border-2 focus-visible:ring-red-700 bg-slate-50 text-lg" />
                      {dentistSearchTerm && (
                        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-slate-200 shadow-2xl rounded-xl overflow-hidden font-bold max-h-[300px] overflow-y-auto">
                          {filteredDentists.map((d: any) => (
                            <div key={d.id} className="p-4 hover:bg-red-50 cursor-pointer border-b last:border-0 font-black uppercase italic text-sm text-slate-700 hover:text-red-700" onClick={() => { setSelectedDentist(String(d.id)); setDentistSearchTerm(""); }}>
                              {d.lastName}, {d.firstName} {d.matriculaProv ? `(MP: ${d.matriculaProv})` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (() => {
                    const d = dentists.find(doc => String(doc.id) === String(selectedDentist));
                    return d && (
                      <div className="h-14 px-5 bg-red-700 text-white rounded-xl text-lg font-black italic flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2 uppercase"><Stethoscope size={20} /> {d.lastName}, {d.firstName}</div>
                        <button type="button" onClick={() => {setSelectedDentist(""); setDentistStats(null);}} className="bg-red-900 hover:bg-red-950 p-2 rounded-full transition-colors" title="Cambiar Odontólogo"><X size={16} /></button>
                      </div>
                    )
                  })()}
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Fecha Desde</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-14 font-bold border-2" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Hasta</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-14 font-bold border-2" /></div>
              </div>
              <Button onClick={handleSearchDentist} disabled={loading || !selectedDentist} className="w-full mt-4 h-14 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic rounded-xl shadow-md disabled:opacity-50"><BarChart3 size={18} className="mr-2"/> {loading ? "Analizando..." : "Ver Estadísticas"}</Button>
            </CardContent>
          </Card>

          {dentistStats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-none shadow-lg bg-red-700 text-white rounded-3xl overflow-hidden relative"><div className="absolute right-[-20px] top-[-20px] opacity-20"><Activity size={120} /></div><CardContent className="p-6 relative"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200 mb-1">Total Estudios</p><h2 className="text-6xl font-black tracking-tighter italic">{dentistStats.totalProcedures}</h2></CardContent></Card>
                <Card className="border-none shadow-md bg-slate-900 text-white rounded-3xl"><CardContent className="p-6"><div className="flex items-center gap-2 mb-2"><User size={16} className="text-slate-400" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pacientes Diferentes</p></div><h2 className="text-4xl font-black tracking-tighter italic">{dentistStats.totalPatients}</h2></CardContent></Card>
              </div>
              <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-3xl">
                <CardHeader className="border-b p-5 bg-slate-50"><CardTitle className="text-sm font-black uppercase text-slate-800 flex items-center gap-2"><BarChart3 className="text-red-700" size={18}/> Desglose</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-5">
                    {dentistStats.chartData.map((data: any, idx: number) => (
                      <div key={idx}>
                        <div className="flex justify-between items-end mb-1"><span className="font-black uppercase text-slate-700 text-sm truncate pr-4">{data.name}</span><span className="font-black italic text-red-700">{data.count} <span className="text-[10px] text-slate-400">({data.percentage}%)</span></span></div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner"><div className="bg-red-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.percentage}%` }}></div></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}