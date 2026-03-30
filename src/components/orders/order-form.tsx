"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  createOrder, getProcedurePrice, getPatientByDni, getNextOrderNumber, 
  getPatientHistory, getDailyOrders, updateOrder, toggleOrderActivation 
} from "@/actions/orders"
import { importDentistsAction } from "@/actions/dentists"
import { logoutUser, getCurrentSession } from "@/actions/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import {
  Search, Monitor, Send, Plus, Check, Settings2, X, Phone, User as UserIcon, UserCheck, GraduationCap,
  CreditCard, LogOut, Building2, FileText, History, Calendar, LayoutGrid, MessageCircle, Mail, Wallet, Trash2,
  Banknote, Printer, Edit, AlertTriangle, RefreshCw, ScanLine, MapPin
} from "lucide-react"

export default function OrderForm({ branches, dentists, obrasSociales, procedures, activeTab, setActiveTab, resetTrigger, prefillData, onPrefillUsed }: any) {
  const [session, setSession] = useState<{ branchId: string, userName: string } | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false) 
  
  const [step, setStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [procedureSearch, setProcedureSearch] = useState("")
  const [isDentistModalOpen, setIsDentistModalOpen] = useState(false)
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [printData, setPrintData] = useState<any>(null)
  const [patientHistory, setPatientHistory] = useState<any[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [dailyOrders, setDailyOrders] = useState<any[]>([])
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [orderSearch, setOrderSearch] = useState("")
  const [sinOdontologo, setSinOdontologo] = useState(false)
  const [derivacionSugerida, setDerivacionSugerida] = useState<{ procId: string, procName: string, teeth: number[], options: string[] }[]>([])
  const [derivacionIndicacion, setDerivacionIndicacion] = useState("")

  const form = useForm({
    defaultValues: {
      branchId: "",
      patient: { dni: "", firstName: "", lastName: "", birthDate: "", phone: "", email: "", affiliateNumber: "", obrasocialId: "", plan: "" },
      dentistId: "",
      items: [] as any[],
      total: 0,
      patientAmount: 0,
      insuranceAmount: 0,
      paymentsList: [{ method: "EFECTIVO", amount: 0 }],
      notes: ""
    }
  })

  // 👉 LÓGICA DE SALDO A FAVOR (SÓLO PARA EDICIÓN)
  const yaPagado = useMemo(() => {
    if (!editingOrderId || !dailyOrders) return 0;
    const ordenOriginal = dailyOrders.find(o => o.id === editingOrderId);
    return ordenOriginal?.payments?.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0) || 0;
  }, [editingOrderId, dailyOrders]);

  const saldoDiferencia = useMemo(() => {
    return form.watch("patientAmount") - yaPagado;
  }, [form.watch("patientAmount"), yaPagado]);

  const resetFormToNew = async () => {
    form.reset({
      branchId: session?.branchId || "",
      patient: { dni: "", firstName: "", lastName: "", birthDate: "", phone: "", email: "", affiliateNumber: "", obrasocialId: "", plan: "" },
      dentistId: "",
      items: [],
      total: 0,
      patientAmount: 0,
      insuranceAmount: 0,
      paymentsList: [{ method: "EFECTIVO", amount: 0 }],
      notes: ""
    });
    setStep(1);
    setPatientHistory([]);
    setEditingOrderId(null);
    if (session?.branchId) {
      const nextNum = await getNextOrderNumber(session.branchId);
      setOrderNumber(nextNum);
    }
  }

  useEffect(() => {
    if (resetTrigger > 0 && !editingOrderId) resetFormToNew();
  }, [resetTrigger]);

  // Rellenar formulario desde derivación médica
  useEffect(() => {
    if (!prefillData) return;

    // Normalizar fecha
    let birthDate = "";
    if (prefillData.patientBirthDate) {
      const raw = String(prefillData.patientBirthDate);
      const ddmm = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      birthDate = ddmm ? `${ddmm[3]}-${ddmm[2]}-${ddmm[1]}` : raw.slice(0, 10);
    }

    // Buscar dentista
    let dentistId = "";
    if (prefillData.dentist) {
      const match = dentists.find((d: any) =>
        d.matriculaProv === prefillData.dentist.matriculaProv ||
        (`${d.lastName} ${d.firstName}`.toLowerCase() === `${prefillData.dentist.lastName} ${prefillData.dentist.firstName}`.toLowerCase())
      );
      if (match) dentistId = match.id;
    }

    // Usar reset + setValue extra para garantizar que el input de fecha se actualice
    const currentBranch = session?.branchId || localStorage.getItem("radiologia-branch") || "";
    form.reset({
      branchId: currentBranch,
      patient: {
        lastName:        prefillData.patientApellido || "",
        firstName:       prefillData.patientNombre   || "",
        dni:             prefillData.patientDni      || "",
        birthDate,
        phone: "", email: "",
        affiliateNumber: prefillData.nroAfiliado     || "",
        obrasocialId: "", plan: ""
      },
      dentistId,
      items: [],
      total: 0, patientAmount: 0, insuranceAmount: 0,
      paymentsList: [{ method: "EFECTIVO", amount: 0 }],
      notes: ""
    });
    // Segundo pass para el campo de fecha — algunos browsers ignoran el reset en type=date
    if (birthDate) {
      setTimeout(() => form.setValue("patient.birthDate", birthDate), 50);
    }

    // Guardar prácticas sugeridas para mostrar en step 2
    if (prefillData.procedures?.length) {
      setDerivacionSugerida(prefillData.procedures)
    }
    if (prefillData.indicaciones) {
      setDerivacionIndicacion(prefillData.indicaciones)
    }

    // Generar número de orden si no está seteado
    if (!orderNumber && session?.branchId) {
      getNextOrderNumber(session.branchId).then(n => setOrderNumber(n));
    }
    setStep(1);
    setActiveTab("NUEVA_ORDEN");
    if (onPrefillUsed) onPrefillUsed();
    toast.success("Datos de la derivación cargados ✓");
  }, [prefillData]);

  useEffect(() => {
    async function initSession() {
      const userSession = await getCurrentSession();
      if (userSession) {
        const savedBranch = localStorage.getItem("radiologia-branch");
        setSession({ userName: userSession.name || userSession.username || "OPERADOR", branchId: savedBranch || "" });
        if (savedBranch) form.setValue("branchId", savedBranch);
        else setShowSessionModal(true); 
      }
    }
    initSession();
  }, [form]);

  // 👉 FUNCIÓN DE REFRESCO DE LISTA
  const refreshOrders = async () => {
    if (session?.branchId) {
      const res = await getDailyOrders(session.branchId);
      if (res.success) setDailyOrders(res.data || []);
    }
  }

  useEffect(() => {
    if (activeTab === "ORDENES" && session?.branchId) {
      refreshOrders();
    }
  }, [activeTab, session]);

  const handleSessionSubmit = () => {
    if (session?.branchId) {
      localStorage.setItem("radiologia-branch", session.branchId);
      form.setValue("branchId", session.branchId);
      setShowSessionModal(false);
      toast.success(`Sede configurada`);
    } else toast.error("Por favor, seleccioná una sede para trabajar");
  };

  const handleLogout = async () => {
    if (confirm("¿Cerrar sesión?")) {
      localStorage.removeItem("radiologia-branch");
      setSession(null);
      await logoutUser();
      router.push("/login");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (printData) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      document.body.appendChild(iframe);

      const itemsHtml = printData.items.map((item: any) => `
        <div style="font-weight: 900; font-size: 12px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          • ${item.name} ${item.info ? `<span style="font-weight: 700; font-size: 10px;">(${item.info})</span>` : ''}
        </div>
      `).join('');

      const htmlContent = `<html><head><style>@page { size: 90mm 50mm; margin: 0; } body { margin: 0; padding: 2mm; width: 90mm; height: 50mm; box-sizing: border-box; font-family: sans-serif; display: flex; flex-direction: column; }</style></head><body><div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid black; padding-bottom: 2px; margin-bottom: 3px;"><span style="font-weight: 900; font-size: 13px;">Nº ${printData.code}</span><span style="font-weight: 700; font-size: 11px;">${printData.date}</span></div><div style="margin-bottom: 3px;"><div style="font-weight: 900; font-size: 17px; text-transform: uppercase;">${printData.patient}</div><div style="font-weight: 700; font-size: 11px; margin-top: 2px;">F. Nac: ${printData.dob}</div></div><div style="flex: 1; border-top: 2px solid black; padding-top: 4px;">${itemsHtml}</div><div style="border-top: 2px solid black; padding-top: 2px; margin-top: auto;"><div style="font-weight: 900; font-size: 9px;">Prof. Solicitante</div><div style="font-weight: 900; font-size: 14px; text-transform: uppercase;">${printData.dentist}</div></div></body></html>`;

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open(); doc.write(htmlContent); doc.close();
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
              setPrintData(null);
              // Solo reseteamos si estábamos creando una orden nueva (no si venimos de reimprimir)
              if (!editingOrderId && activeTab === "NUEVA_ORDEN") {
                resetFormToNew();
                setActiveTab("NUEVA_ORDEN");
              }
            }, 500);
          }, 200);
        };
      }
    }
  }, [printData]);

  const filteredDentists = useMemo(() => {
    const search = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!search || search.length < 2) return [];
    return dentists.filter((d:any) => 
      d.lastName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) || 
      d.firstName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) || 
      d.matriculaProv?.toString().includes(search)
    ).slice(0, 10);
  }, [searchTerm, dentists]);

  const filteredProcedures = useMemo(() => {
    const search = procedureSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!search) return procedures;
    return procedures.filter((p: any) => 
      p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) || p.code.toLowerCase().includes(search)
    );
  }, [procedureSearch, procedures]);

  const handleDniBlur = async (dni: string) => {
    if (dni.length < 7) { setPatientHistory([]); return; }
    const p = await getPatientByDni(dni);
    if (!orderNumber && session?.branchId && !editingOrderId) setOrderNumber(await getNextOrderNumber(session.branchId));
    if (p) {
      toast.info("Paciente encontrado.");
      form.setValue("patient.firstName", p.firstName?.toUpperCase() || "");
      form.setValue("patient.lastName", p.lastName?.toUpperCase() || "");
      form.setValue("patient.phone", p.phone || "");
      form.setValue("patient.email", p.email || "");
      form.setValue("patient.affiliateNumber", p.affiliateNumber || "");
      form.setValue("patient.plan", p.plan || "");
      form.setValue("patient.obrasocialId", p.defaultObraSocialId || "");
      if (p.birthDate) form.setValue("patient.birthDate", new Date(p.birthDate).toISOString().split('T')[0]);
      setPatientHistory(await getPatientHistory(dni));
    } else { setPatientHistory([]); }
  }

  const recalculateTotal = () => {
    const items = form.getValues("items");
    const totalInsurance = items.reduce((acc, curr) => acc + (Number(curr.insuranceCoverage) || 0), 0);
    const totalPatient = items.reduce((acc, curr) => acc + (Number(curr.patientCopay) || 0), 0);
    form.setValue("total", totalInsurance + totalPatient);
    form.setValue("insuranceAmount", totalInsurance);
    form.setValue("patientAmount", totalPatient);
    
    const valorACobrar = editingOrderId ? Math.max(0, totalPatient - yaPagado) : totalPatient;
    const currentPayments = form.getValues("paymentsList") || [];
    if (currentPayments.length === 1) form.setValue("paymentsList", [{ method: currentPayments[0].method, amount: valorACobrar }]);
  }

  const updateItemPrice = (index: number, field: 'insuranceCoverage' | 'patientCopay', value: number) => {
    const items = form.getValues("items");
    items[index][field] = value;
    items[index].price = (Number(items[index].insuranceCoverage) || 0) + (Number(items[index].patientCopay) || 0);
    form.setValue("items", items);
    recalculateTotal();
  }

  const toggleProcedure = async (pId: string) => {
    const osId = form.getValues("patient.obrasocialId")
    if (!osId) return toast.error("Seleccione Obra Social primero")
    const currentItems = form.getValues("items")
    const exists = currentItems.find(i => i.procedureId === pId)
    if (exists) {
      form.setValue("items", currentItems.filter(i => i.procedureId !== pId))
    } else {
      const priceData = await getProcedurePrice(pId, osId)
      const procedure = procedures.find((p: any) => p.id === pId);
      form.setValue("items", [...currentItems, { 
        procedureId: pId, price: priceData.amount, basePrice: priceData.amount,
        insuranceCoverage: priceData.insuranceCoverage, baseInsurance: priceData.insuranceCoverage,
        patientCopay: priceData.patientCopay, basePatient: priceData.patientCopay,
        teeth: [], locations: [], quantity: 1
      }])
      if (procedure?.requiresTooth || (procedure?.options && procedure.options.length > 0)) setActiveConfigId(pId);
    }
    recalculateTotal()
  }

  const addPaymentMethod = () => { form.setValue("paymentsList", [...form.getValues("paymentsList"), { method: "MERCADOPAGO", amount: 0 }]); }
  const removePaymentMethod = (index: number) => { const current = form.getValues("paymentsList"); current.splice(index, 1); form.setValue("paymentsList", current); }
  const updatePaymentList = (index: number, field: string, value: any) => { const current = form.getValues("paymentsList"); current[index] = { ...current[index], [field]: value }; form.setValue("paymentsList", current); }

  const currentPaymentsSum = form.watch("paymentsList").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const targetAmount = editingOrderId ? saldoDiferencia : form.watch("patientAmount");
  const remainingBalance = targetAmount - currentPaymentsSum;

  const onSubmit = async (data: any) => {
    if (!orderNumber) return toast.error("Falta Número de Orden")
    if (data.items.length === 0) return toast.error("Agregá al menos una práctica")
    if (data.patientAmount > 0 && remainingBalance !== 0) return toast.error(`Pagos no coinciden. Faltan cobrar: $${remainingBalance}`);

    setLoading(true)
    try {
        let res;
        if (editingOrderId) {
          res = await updateOrder(editingOrderId, { ...data, branchId: session?.branchId });
        } else {
          res = await createOrder({ ...data, branchId: session?.branchId });
        }

        if (res.success) {
          const finalCode = (res as any).orderCode || orderNumber;
          const dentist = dentists.find((d: any) => d.id === data.dentistId);
          const itemsFormatted = data.items.map((it: any) => {
            const proc = procedures.find((p: any) => p.id === it.procedureId);
            return { name: proc?.name, info: it.teeth?.length > 0 ? `P: ${it.teeth.join(', ')}` : (it.locations?.length > 0 ? `POS: ${it.locations.join(', ')}` : '') }
          });
          setPrintData({ code: finalCode, patient: `${data.patient.lastName}, ${data.patient.firstName}`, dob: data.patient.birthDate ? new Date(data.patient.birthDate).toLocaleDateString('es-AR') : "S/D", dentist: dentist ? `${dentist.lastName}, ${dentist.firstName}` : "PARTICULAR", items: itemsFormatted, date: new Date().toLocaleDateString('es-AR') });
          toast.success(editingOrderId ? "Orden Actualizada ✓" : "Orden Guardada ✓");
        } else {
          toast.error(res.error || "Error al procesar la orden");
        }
    } catch (e) { toast.error("Error al procesar orden"); }
    setLoading(false)
  }

  const handleEditarOrden = (orden: any) => {
    setEditingOrderId(orden.id);
    setOrderNumber(orden.code || orden.dailyId?.toString());
    form.reset({
      branchId: orden.branchId,
      patient: { 
        dni: orden.patient.dni, firstName: orden.patient.firstName, lastName: orden.patient.lastName, 
        birthDate: orden.patient.birthDate ? new Date(orden.patient.birthDate).toISOString().split('T')[0] : "", 
        phone: orden.patient.phone || "", email: orden.patient.email || "", 
        affiliateNumber: orden.patient.affiliateNumber || "", obrasocialId: orden.patient.defaultObraSocialId || "", plan: orden.patient.plan || "" 
      },
      dentistId: orden.dentistId || "",
      items: orden.items.map((i:any) => ({
        procedureId: i.procedureId, price: i.price, basePrice: i.price,
        insuranceCoverage: i.insuranceCoverage, baseInsurance: i.insuranceCoverage,
        patientCopay: i.patientCopay, basePatient: i.patientCopay,
        teeth: i.teeth || [], locations: i.locations || [], quantity: i.quantity || 1
      })),
      total: orden.totalAmount,
      patientAmount: orden.patientAmount,
      insuranceAmount: orden.insuranceAmount,
      paymentsList: [{ method: "EFECTIVO", amount: 0 }], 
      notes: orden.notes || ""
    });
    setStep(2);
    setActiveTab("NUEVA_ORDEN");
    toast.info(`Editando Orden Nº ${orden.code || orden.dailyId}`);
  }

  // 👉 NUEVA FUNCIÓN DE REIMPRESIÓN CORREGIDA
  const handleReimprimir = (orden: any) => {
    const dentistName = orden.dentist ? `${orden.dentist.lastName}, ${orden.dentist.firstName}` : "PARTICULAR";
    const itemsFormatted = orden.items.map((it: any) => {
      const procName = it.procedure?.name || procedures.find((p:any) => p.id === it.procedureId)?.name || "ESTUDIO";
      const info = it.teeth?.length > 0 ? `P: ${it.teeth.join(', ')}` : (it.locations?.length > 0 ? `POS: ${it.locations.join(', ')}` : '');
      return { name: procName, info };
    });
    
    setPrintData({
      code: orden.code || orden.dailyId?.toString(),
      patient: `${orden.patient?.lastName}, ${orden.patient?.firstName}`,
      dob: orden.patient?.birthDate ? new Date(orden.patient.birthDate).toLocaleDateString('es-AR') : "S/D",
      dentist: dentistName,
      items: itemsFormatted,
      date: new Date(orden.createdAt).toLocaleDateString('es-AR')
    });
    
    toast.success("Enviando a la impresora...");
  };

  if (!session && !showSessionModal) return null;

  return (
    <div className={`space-y-6 mx-auto hide-on-print`}>

      {/* HEADER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in">
        <StatCard title="N° ORDEN" value={orderNumber || "---"} />
        <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl h-full border-l-4 border-l-brand-700 relative">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">
                {editingOrderId ? "DIFERENCIA A COBRAR" : "A COBRAR EN CAJA"}
              </p>
              <p className={`text-3xl font-black italic uppercase ${editingOrderId && saldoDiferencia <= 0 ? 'text-emerald-600' : 'text-brand-700'}`}>
                ${editingOrderId ? saldoDiferencia : form.watch("patientAmount")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl relative group">
          <CardContent className="p-6 flex justify-between items-start">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">OPERADOR</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate pr-1">{session?.userName?.split(' ')[0] || "OPERADOR"}</p></div>
            <button onClick={handleLogout} className="bg-brand-100 text-brand-700 p-2 rounded-xl hover:bg-brand-200 shrink-0"><LogOut size={16} /></button>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl relative group">
          <CardContent className="p-6 flex justify-between items-start">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">SEDE</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate pr-2">{branches.find((b:any) => b.id === session?.branchId)?.name || "---"}</p></div>
            <button onClick={() => setShowSessionModal(true)} className="bg-slate-200 text-slate-700 p-2 rounded-xl hover:bg-slate-300 transition-colors shrink-0"><Building2 size={16} /></button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSessionModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px] bg-white border-t-8 border-brand-700 rounded-3xl p-8 outline-none">
          <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase text-center">Elegir Sede</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4 font-black uppercase italic">
            <Select value={session?.branchId} onValueChange={(v) => setSession(prev => ({ ...prev!, branchId: v }))}>
              <SelectTrigger className="h-14 border-2 rounded-xl text-lg"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
              <SelectContent className="font-black uppercase italic">
                {branches.map((b: any) => <SelectItem key={b.id} value={b.id} className="py-3">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="w-full bg-brand-700 hover:bg-brand-800 h-14 text-white text-lg rounded-2xl shadow-xl transition-all" onClick={handleSessionSubmit}>COMENZAR TURNO ✓</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= VISTA: NUEVA ORDEN / EDICIÓN ================= */}
      {activeTab === "NUEVA_ORDEN" && (
        <div className="animate-in fade-in duration-500 space-y-6">
          <Card className={`shadow-xl border-t-8 ${editingOrderId ? 'border-t-slate-900' : 'border-t-brand-700'} bg-white rounded-3xl`}>
            <CardContent className="p-8" onKeyDown={handleKeyDown}>
              
              {editingOrderId && (
                <div className="bg-slate-900 text-white p-5 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-amber-400" size={24}/>
                    <div>
                      <span className="font-black uppercase italic block">⚠️ Modo Edición: Orden {orderNumber}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">El paciente ya abonó anteriormente: ${yaPagado.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { resetFormToNew(); }} className="border-white/20 text-white hover:bg-white hover:text-slate-900 bg-transparent">Cancelar Edición</Button>
                </div>
              )}

              <div className="flex items-center justify-center mb-10 max-w-3xl mx-auto">
                <Step num={1} label="Paciente" active={step >= 1} current={step === 1} />
                <Line active={step >= 2} />
                <Step num={2} label="Estudios" active={step >= 2} current={step === 2} />
                <Line active={step >= 3} />
                <Step num={3} label="Cobro" active={step >= 3} current={step === 3} />
              </div>

              {step === 1 && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                  <div className="space-y-2 relative"><Label className="text-[10px] font-bold text-slate-400 uppercase">DNI</Label><div className="flex gap-2"><Input {...form.register("patient.dni")} onBlur={(e) => handleDniBlur(e.target.value)} onChange={(e) => { form.setValue("patient.dni", e.target.value); if (e.target.value.replace(/\D/g,'').length >= 7) handleDniBlur(e.target.value); }} className="h-11 font-black border-2 flex-1" autoFocus />{patientHistory.length > 0 && (<Button type="button" onClick={() => setShowHistoryModal(true)} className="h-11 px-4 bg-slate-900 hover:bg-brand-700 text-white font-black italic uppercase rounded-lg shadow-md"><FileText size={18} className="mr-2" /> Historial ({patientHistory.length})</Button>)}</div></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">Apellido</Label><Input {...form.register("patient.lastName")} className="h-11 uppercase font-bold border-2" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</Label><Input {...form.register("patient.firstName")} className="h-11 uppercase font-bold border-2" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Nac.</Label><Input type="date" value={form.watch("patient.birthDate") || ""} onChange={(e) => form.setValue("patient.birthDate", e.target.value, { shouldDirty: true })} className="h-11 border-2 font-bold" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</Label><Input {...form.register("patient.phone")} className="h-11 font-bold border-2" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">E-mail</Label><Input {...form.register("patient.email")} type="email" className="h-11 font-bold border-2 lowercase" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">Obra Social</Label><Select value={form.watch("patient.obrasocialId")} onValueChange={(v) => form.setValue("patient.obrasocialId", v)}><SelectTrigger className="h-11 font-bold border-2"><SelectValue placeholder="MUTUAL..." /></SelectTrigger><SelectContent className="font-black italic uppercase">{obrasSociales.map((os: any) => <SelectItem key={os.id} value={os.id}>{os.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">N° Afiliado</Label><Input {...form.register("patient.affiliateNumber")} className="h-11 uppercase font-bold border-2" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold text-slate-400 uppercase">Plan OS</Label><Input {...form.register("patient.plan")} placeholder="Ej: 210, PMO..." className="h-11 uppercase font-bold border-2 bg-blue-50 focus-visible:ring-blue-500" /></div>
                  <div className="space-y-2 md:col-span-3 mt-2"><Label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">Observaciones / Notas</Label><textarea {...form.register("notes")} className="flex w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold uppercase placeholder:text-slate-400 focus-visible:ring-brand-700 resize-none h-20 shadow-inner"/></div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right">
                  <div className="bg-white p-6 rounded-2xl border-2 border-brand-500 relative shadow-md">
                    <div className="flex justify-between items-center mb-4 text-brand-700 font-black uppercase italic">
                      <Label className="text-sm flex items-center gap-1.5">Odontólogo Solicitante <span className="text-brand-500">*</span></Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] bg-slate-50 shadow-sm hover:bg-slate-100 border-slate-300 text-slate-600"
                          onClick={() => { setSinOdontologo(true); form.setValue("dentistId", ""); setSearchTerm(""); }}>
                          Sin Odontólogo
                        </Button>
                        <Dialog open={isDentistModalOpen} onOpenChange={setIsDentistModalOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-[10px] bg-white shadow-sm hover:bg-brand-50 border-brand-200 text-brand-700">+ Nuevo Profesional</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] border-none bg-transparent shadow-none p-0 outline-none">
                            <DialogTitle className="sr-only">Nuevo Profesional</DialogTitle>
                            <QuickDentistForm onSuccess={() => setIsDentistModalOpen(false)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    {sinOdontologo ? (
                      <div className="flex items-center justify-between px-5 py-3 bg-slate-700 text-white rounded-xl text-sm font-black italic shadow-md">
                        <div className="flex items-center gap-2 uppercase"><GraduationCap size={16} /> Paciente Particular</div>
                        <button type="button" onClick={() => setSinOdontologo(false)} className="bg-slate-900 hover:bg-black p-1.5 rounded-full transition-colors"><X size={14} /></button>
                      </div>
                    ) : !form.watch("dentistId") ? (
                      <div className="relative shadow-sm rounded-xl">
                        <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                        <Input placeholder="Escribí APELLIDO O MATRÍCULA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 uppercase font-bold border-2 border-slate-300 bg-slate-50 focus-visible:ring-brand-500" autoFocus />
                        {searchTerm && (
                          <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-slate-200 shadow-2xl rounded-xl overflow-hidden font-bold">
                            {filteredDentists.map((d: any) => (
                              <div key={d.id} className="p-4 hover:bg-brand-50 cursor-pointer border-b last:border-0 font-black uppercase italic text-sm" onClick={() => { form.setValue("dentistId", d.id); setSearchTerm(""); }}>
                                {d.lastName}, {d.firstName} {d.matriculaProv ? `(MP: ${d.matriculaProv})` : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (() => {
                      const d = dentists.find((doc: any) => doc.id === form.watch("dentistId"));
                      return d && (
                        <div className="flex flex-col gap-2">
                          <div className="px-5 py-3 bg-brand-700 text-white rounded-xl text-sm font-black italic flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-2 uppercase"><GraduationCap size={16} /> {d.lastName}, {d.firstName}</div>
                            <button type="button" onClick={() => { form.setValue("dentistId", ""); setSinOdontologo(false); }} className="bg-brand-900 hover:bg-brand-900 p-1.5 rounded-full transition-colors"><X size={14} /></button>
                          </div>
                          <div className="flex gap-2 ml-1">
                            {(d.deliveryMethod === 'IMPRESA' || d.deliveryMethod === 'AMBAS') && (
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-orange-100 text-orange-800 border border-orange-200 shadow-sm flex items-center gap-1">📦 FÍSICO</span>
                            )}
                            {(d.deliveryMethod === 'DIGITAL' || d.deliveryMethod === 'AMBAS' || !d.deliveryMethod) && (
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-blue-100 text-blue-800 border border-blue-200 shadow-sm flex items-center gap-1">📱 DIGITAL ({d.resultPreference || 'WHATSAPP'})</span>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* PRÁCTICAS SUGERIDAS POR EL MÉDICO */}
                  {derivacionSugerida.length > 0 && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2">
                        <GraduationCap size={13}/> Prácticas indicadas por el médico
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {derivacionSugerida.map((sug, i) => {
                          // Intentar matchear con una práctica real por nombre/procId
                          const matched = procedures.find((p: any) => p.id === sug.procId || p.name.toLowerCase() === sug.procName.toLowerCase())
                          const isSelected = matched && !!form.watch("items").find((it: any) => it.procedureId === matched.id)
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={async () => {
                                if (matched) {
                                  if (!isSelected) await toggleProcedure(matched.id)
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : matched
                                    ? 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                                    : 'bg-white text-slate-400 border-slate-200 cursor-default'
                              }`}
                            >
                              {isSelected && <Check size={11}/>}
                              <span>{sug.procName}</span>
                              {sug.options?.length > 0 && <span className="text-[10px] opacity-80 font-bold">— {sug.options.join(' / ')}</span>}
                              {sug.teeth?.length > 0 && <span className="text-[10px] opacity-80">P:{sug.teeth.join(',')}</span>}
                            </button>
                          )
                        })}
                      </div>
                      {derivacionIndicacion && (
                        <div className="bg-white rounded-xl border border-indigo-200 px-3 py-2">
                          <p className="text-[9px] font-black uppercase text-indigo-400 tracking-wider mb-0.5">Indicación clínica</p>
                          <p className="text-xs font-bold text-slate-700 uppercase">{derivacionIndicacion}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                       <Label className="text-xs font-black uppercase italic text-slate-900 flex items-center gap-2"><LayoutGrid size={16}/> Prácticas</Label>
                       <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="FILTRAR ESTUDIO..." value={procedureSearch} onChange={(e) => setProcedureSearch(e.target.value)} className="pl-9 h-9 text-xs uppercase font-bold border-2 border-slate-200 bg-slate-50 rounded-lg" /></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 pb-2">
                      {filteredProcedures.map((p: any) => {
                        const selectedItem = form.watch("items").find(i => i.procedureId === p.id);
                        const isSelected = !!selectedItem;
                        const hasConfig = p.requiresTooth || (p.options && p.options.length > 0);
                        
                        return (
                          <div key={p.id} className={`flex items-center p-2 rounded-2xl border-2 transition-all ${isSelected ? 'bg-brand-50 border-brand-700 shadow-md scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                             <button type="button" onClick={() => toggleProcedure(p.id)} className="flex-1 flex items-start gap-3 p-1.5 text-left">
                               <div className={`h-8 w-8 mt-1 shrink-0 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                 {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                               </div>
                               <div className="overflow-hidden flex-1">
                                 <p className="text-[9px] font-black uppercase text-brand-700 mb-0.5 leading-none">{p.code}</p>
                                 <p className="text-xs font-black uppercase leading-tight truncate" title={p.name}>{p.name}</p>
                                 {isSelected && selectedItem && (
                                   <div className="mt-1.5 flex flex-wrap gap-1">
                                     {selectedItem.teeth?.length > 0 && <span className="text-[9px] font-black bg-brand-200 text-brand-800 px-1.5 py-0.5 rounded-md uppercase border border-brand-300 inline-flex items-center gap-1"><ScanLine size={9} /> {selectedItem.teeth.join(', ')}</span>}
                                     {selectedItem.locations?.length > 0 && <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md uppercase border border-blue-200 inline-flex items-center gap-1"><MapPin size={9} /> {selectedItem.locations.join(', ')}</span>}
                                   </div>
                                 )}
                               </div>
                             </button>
                             {isSelected && hasConfig && (
                               <button onClick={() => setActiveConfigId(p.id)} className="mr-2 shrink-0 bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                                 <Settings2 className="h-4 w-4" />
                               </button>
                             )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right">
                  <div className="bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 italic">
                        <tr><th className="p-4 border-b-2 border-slate-200">Estudio</th><th className="p-4 w-36 text-center border-b-2 border-slate-200">Mutual</th><th className="p-4 w-36 text-center border-b-2 bg-brand-50 text-brand-800">Paciente</th><th className="p-4 w-28 text-right border-b-2 border-slate-200">Total</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold">
                        {form.watch("items").map((item, index) => {
                          const proc = procedures.find((p:any) => p.id === item.procedureId);
                          return (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <p className="text-sm font-black uppercase text-slate-800">{proc?.name}</p>
                                {(item.teeth?.length > 0) && <p className="text-[10px] font-bold text-brand-600 uppercase italic">Piezas: {item.teeth.join(' - ')}</p>}
                                {(item.locations?.length > 0) && <p className="text-[10px] font-bold text-blue-600 uppercase italic">Pos: {item.locations.join(' - ')}</p>}
                              </td>
                              <td className="p-4"><div className="relative flex items-center justify-center"><span className="absolute left-3 text-slate-400 text-sm">$</span><Input type="number" className="pl-6 h-9 w-full text-center font-bold text-slate-600 border-2" value={item.insuranceCoverage || 0} onChange={(e) => updateItemPrice(index, 'insuranceCoverage', Number(e.target.value))}/></div></td>
                              <td className="p-4 bg-brand-50/30"><div className="relative flex items-center justify-center"><span className="absolute left-3 text-brand-700 text-sm">$</span><Input type="number" className="pl-6 h-9 w-full text-center font-black text-brand-700 border-2 border-brand-200 focus-visible:ring-brand-700 bg-white" value={item.patientCopay || 0} onChange={(e) => updateItemPrice(index, 'patientCopay', Number(e.target.value))}/></div></td>
                              <td className="p-4 text-right text-lg font-black italic text-slate-900">${(Number(item.insuranceCoverage) || 0) + (Number(item.patientCopay) || 0)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-4">
                      <div className="bg-slate-100 p-5 rounded-2xl border-2 border-slate-200 text-center flex flex-col justify-center shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">A Facturar O.S.</p><p className="text-3xl font-black italic text-slate-700">${form.watch("insuranceAmount")}</p></div>
                      
                      {editingOrderId && yaPagado > 0 && (
                        <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-200 text-center shadow-md animate-in zoom-in-95 duration-300">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ya abonado anteriormente</p>
                          <p className="text-3xl font-black italic text-emerald-700">-${yaPagado.toLocaleString('es-AR')}</p>
                        </div>
                      )}

                      <div className="bg-slate-900 p-5 rounded-2xl border-t-8 border-brand-700 flex flex-col justify-center shadow-xl text-center"><p className="text-[11px] font-black text-brand-400 uppercase tracking-widest mb-1">{editingOrderId ? "DIFERENCIA A COBRAR" : "A COBRAR AL PACIENTE"}</p><h3 className="text-5xl tracking-tighter text-white uppercase italic leading-none">${editingOrderId ? saldoDiferencia : form.watch("patientAmount")}</h3></div>
                    </div>

                    <div className="md:col-span-2 bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b pb-3"><h4 className="font-black italic uppercase text-slate-800 flex items-center gap-2"><CreditCard size={18} className="text-brand-700"/> Medios de Pago</h4>{(editingOrderId ? saldoDiferencia : form.watch("patientAmount")) > 0 && (<Button onClick={addPaymentMethod} variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase text-blue-600 border-blue-200 hover:bg-blue-50">+ Agregar Pago</Button>)}</div>
                      
                      {(editingOrderId ? saldoDiferencia : form.watch("patientAmount")) <= 0 ? (
                        <div className="text-center py-8 text-emerald-600 font-black uppercase italic bg-emerald-50 rounded-xl border border-emerald-100">La orden ya está cubierta o posee saldo a favor.</div>
                      ) : (
                        <div className="space-y-3">
                          {form.watch("paymentsList").map((payment: any, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                              <Select value={payment.method} onValueChange={(v) => updatePaymentList(index, 'method', v)}>
                                <SelectTrigger className="h-12 w-full font-black uppercase italic bg-slate-50 border-2"><SelectValue /></SelectTrigger>
                                <SelectContent className="font-black uppercase italic">
                                  <SelectItem value="EFECTIVO">💵 EFECTIVO</SelectItem>
                                  <SelectItem value="MERCADOPAGO">📱 MERCADOPAGO</SelectItem>
                                  <SelectItem value="TARJETA_DEBITO">💳 DÉBITO</SelectItem>
                                  <SelectItem value="TARJETA_CREDITO">💳 CRÉDITO</SelectItem>
                                  <SelectItem value="TRANSFERENCIA">🏛️ TRANSFERENCIA</SelectItem>
                                  <SelectItem value="SALDO" className="font-black text-brand-600 uppercase">⏳ Deuda / Saldo Pendiente</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="relative w-48 shrink-0"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span><Input type="number" className="pl-8 h-12 font-black text-lg border-2" value={payment.amount} onChange={(e) => updatePaymentList(index, 'amount', Number(e.target.value))} /></div>
                              {form.watch("paymentsList").length > 1 && (<Button variant="ghost" onClick={() => removePaymentMethod(index)} className="text-slate-400 hover:text-brand-600 shrink-0"><Trash2 size={18}/></Button>)}
                            </div>
                          ))}
                          <div className={`mt-4 p-3 rounded-xl flex justify-between items-center font-black uppercase italic transition-colors ${remainingBalance === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-brand-50 text-brand-700 border border-brand-200'}`}><span className="text-xs">{remainingBalance === 0 ? '✓ Pagos cuadrados' : '⚠️ Saldo pendiente'}</span><span className="text-xl">${Math.abs(remainingBalance)}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-16 border-t-2 border-slate-100 pt-8">
                <Button variant="ghost" className="font-black uppercase italic h-14 px-8 text-slate-500 hover:text-slate-900" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>{step === 1 ? "CANCELAR" : "← VOLVER"}</Button>
                <Button className={`px-24 h-16 text-white font-black italic uppercase text-xl rounded-2xl shadow-xl transition-all border-b-4 active:border-b-0 active:translate-y-1 ${remainingBalance !== 0 && step === 3 && targetAmount > 0 ? 'bg-slate-300 border-slate-400 cursor-not-allowed' : (editingOrderId ? 'bg-slate-900 hover:bg-slate-800 border-slate-950' : 'bg-brand-700 hover:bg-brand-800 border-brand-900')}`} onClick={() => step < 3 ? setStep(step + 1) : form.handleSubmit(onSubmit)()} disabled={loading || (remainingBalance !== 0 && step === 3 && targetAmount > 0)}>{step < 3 ? "SIGUIENTE →" : (loading ? "GUARDANDO..." : (editingOrderId ? "GUARDAR CAMBIOS ✓" : "FINALIZAR ✓"))}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= VISTA: ÓRDENES DEL DÍA ================= */}
      {activeTab === "ORDENES" && (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-4">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white border-t-8 border-slate-900 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
               <div>
                 <h3 className="text-3xl font-black uppercase italic text-slate-900 flex items-center gap-3">
                   <LayoutGrid className="text-brand-700" size={32}/> Órdenes de Hoy
                 </h3>
               </div>
               <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="BUSCAR..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-10 h-12 text-xs font-bold border-2 rounded-xl uppercase" /></div>
                 <Button onClick={refreshOrders} variant="outline" className="border-2 rounded-xl font-black text-[10px] h-12">Actualizar</Button>
               </div>
            </div>
            
            <div className="space-y-4">
              {dailyOrders
                .filter((o: any) => {
                  const term = orderSearch.toLowerCase();
                  if (!term) return true;
                  return o.patient?.lastName?.toLowerCase().includes(term) || 
                         o.patient?.dni?.includes(term) ||
                         (o.code && o.code.toLowerCase().includes(term));
                })
                .map((orden: any) => {
                  const isAnulada = orden.status === 'ANULADA';

                  return (
                    <div 
                      key={orden.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between md:items-center gap-6 group 
                        ${isAnulada 
                          ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-400 shadow-sm'
                        }`}
                    >
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`${isAnulada ? 'bg-slate-400' : 'bg-brand-700'} text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest`}>
                              Nº {orden.code || orden.dailyId}
                            </span>
                            
                            {/* 👉 CHIP ROJO VIVO PARA ANULADA (CORREGIDO) */}
                            {isAnulada && (
                              <span className="bg-brand-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm italic flex items-center gap-1 animate-pulse">
                                <AlertTriangle size={10} /> ANULADA
                              </span>
                            )}

                            <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(orden.createdAt).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}hs</span>
                          </div>
                          <p className={`text-xl font-black uppercase leading-tight mb-1 ${isAnulada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {orden.patient?.lastName}, {orden.patient?.firstName}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{orden.items.length} Estudio(s) • {orden.dentist ? `Dr. ${orden.dentist.lastName}` : "Particular"}</p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 items-center">
                          {!isAnulada && (
                            <div className="text-right mr-4 hidden md:block">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Abonado</p>
                              <p className="text-2xl font-black italic text-emerald-600 leading-none">${(orden.patientAmount || 0).toLocaleString()}</p>
                            </div>
                          )}

                          {!isAnulada ? (
                            <>
                              <Button onClick={() => handleReimprimir(orden)} variant="outline" className="h-12 border-2 border-slate-200 text-slate-700 font-black uppercase text-xs rounded-xl shadow-sm hover:bg-white"><Printer size={16} className="mr-2"/> Etiqueta</Button>
                              <Button onClick={() => handleEditarOrden(orden)} className="h-12 bg-slate-900 text-white font-black uppercase text-xs rounded-xl shadow-md"><Edit size={16} className="mr-2"/> Editar</Button>
                              <Button 
                                variant="ghost" 
                                className="h-12 text-brand-500 hover:bg-brand-50 font-black uppercase text-[10px]" 
                                onClick={async () => { 
                                  if(confirm("¿Estás seguro de ANULAR esta orden?")) { 
                                    const res = await toggleOrderActivation(orden.id, orden.status); 
                                    if(res.success) { 
                                      toast.success("Orden Anulada ✓"); 
                                      await refreshOrders(); // Refresca la lista local
                                    } 
                                  } 
                                }}
                              >
                                <Trash2 size={16} className="mr-2"/> Anular
                              </Button>
                            </>
                          ) : (
                            // 👉 BOTÓN DE REACTIVACIÓN (LOGICA REAL)
                            <Button 
                              variant="outline" 
                              className="h-12 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-black uppercase text-xs rounded-xl shadow-sm"
                              onClick={async () => {
                                if(confirm("¿Deseas REACTIVAR esta orden? El dinero volverá a figurar en caja.")) {
                                  const res = await toggleOrderActivation(orden.id, orden.status);
                                  if(res.success) { 
                                    toast.success("Orden Reactivada ✓"); 
                                    await refreshOrders(); // Refresca la lista local
                                  } else {
                                    toast.error("Error al reactivar");
                                  }
                                }
                              }}
                            >
                              <RefreshCw size={16} className="mr-2"/> Reactivar Orden
                            </Button>
                          )}
                        </div>
                    </div>
                  )
                })
              }
            </div>
          </Card>
        </div>
      )}

      {/* ODONTOGRAMA DINÁMICO */}
      {activeConfigId && (() => {
          const p = procedures.find((proc: any) => proc.id === activeConfigId);
          const itemIndex = form.watch("items").findIndex(i => i.procedureId === activeConfigId);
          return (
            <div className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-slate-900 w-full max-w-5xl rounded-[3rem] border-t-[8px] border-brand-700 p-10">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6"><h4 className="text-white text-2xl font-black uppercase italic pr-4">{p?.name}</h4><Button size="lg" className="bg-brand-700 hover:bg-brand-800 text-white font-black uppercase rounded-2xl h-14 px-8 shadow-lg" onClick={() => setActiveConfigId(null)}>CONFIRMAR ✓</Button></div>
                  {p?.requiresTooth ? (
                    <div className="py-6 flex flex-col items-center">
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4 border-b-2 border-slate-700 pb-4">
                          <div className="flex gap-1 border-r-2 border-slate-700 pr-4">{[18,17,16,15,14,13,12,11].map(t => <ToothBtn key={t} t={t} itemIndex={itemIndex} form={form} recalculate={recalculateTotal} />)}</div>
                          <div className="flex gap-1 pl-4">{[21,22,23,24,25,26,27,28].map(t => <ToothBtn key={t} t={t} itemIndex={itemIndex} form={form} recalculate={recalculateTotal} />)}</div>
                        </div>
                        <div className="flex gap-4 pt-2">
                          <div className="flex gap-1 border-r-2 border-slate-700 pr-4">{[48,47,46,45,44,43,42,41].map(t => <ToothBtn key={t} t={t} itemIndex={itemIndex} form={form} recalculate={recalculateTotal} />)}</div>
                          <div className="flex gap-1 pl-4">{[31,32,33,34,35,36,37,38].map(t => <ToothBtn key={t} t={t} itemIndex={itemIndex} form={form} recalculate={recalculateTotal} />)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-4 py-10">
                      {p?.options?.map((opt: string) => {
                        const selectedLocs = form.watch(`items.${itemIndex}.locations`) || [];
                        const isSelected = selectedLocs.includes(opt);
                        return (
                          <Button key={opt} type="button" onClick={() => {
                              const next = isSelected ? selectedLocs.filter((l: string) => l !== opt) : [...selectedLocs, opt];
                              const count = next.length || 1;
                              const baseIns = form.getValues(`items.${itemIndex}.baseInsurance`);
                              const basePat = form.getValues(`items.${itemIndex}.basePatient`);
                              form.setValue(`items.${itemIndex}.locations`, next);
                              form.setValue(`items.${itemIndex}.insuranceCoverage`, baseIns * count);
                              form.setValue(`items.${itemIndex}.patientCopay`, basePat * count);
                              recalculateTotal();
                            }} className={`h-16 px-8 text-lg font-black uppercase rounded-2xl border-2 ${isSelected ? 'bg-brand-700 text-white border-brand-500 shadow-lg scale-105' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>{opt}</Button>
                        )
                      })}
                    </div>
                  )}
               </div>
            </div>
          )
      })()}

      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-[700px] bg-white rounded-[2rem] border-t-8 border-slate-900 p-8 max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-3xl font-black italic uppercase text-slate-900 flex items-center gap-3"><History className="text-brand-700" size={28} /> Historia Clínica</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">{patientHistory.map((order: any) => (
              <div key={order.id} className="bg-slate-50 p-5 rounded-[1.5rem] border-2 border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /><span className="text-lg font-black italic uppercase leading-none mt-1">{new Date(order.createdAt).toLocaleDateString('es-AR')}</span></div>
                  <span className="text-[10px] font-black uppercase text-slate-600 bg-white border px-3 py-1 rounded-md">{order.branch?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2"><GraduationCap size={14} className="text-brand-700 mt-0.5" /><div><span className="font-bold text-slate-400 uppercase text-[9px]">Odontólogo</span><p className="font-black text-slate-800 uppercase text-xs">{order.dentist ? `${order.dentist.lastName}` : 'PARTICULAR'}</p></div></div>
                  <div className="text-right"><span className="font-bold text-slate-400 uppercase text-[9px]">Abonado</span><p className="font-black text-emerald-700 uppercase text-xs">${order.patientAmount || order.totalAmount}</p></div>
                </div>
              </div>
            ))}</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ToothBtn({ t, itemIndex, form, recalculate }: any) {
  const selected = form.watch(`items.${itemIndex}.teeth`) || [];
  const isSelected = selected.includes(t);
  return (
    <button type="button" onClick={() => {
        const next = isSelected ? selected.filter((tooth: number) => tooth !== t) : [...selected, t];
        const count = next.length || 1;
        const baseIns = form.getValues(`items.${itemIndex}.baseInsurance`);
        const basePat = form.getValues(`items.${itemIndex}.basePatient`);
        form.setValue(`items.${itemIndex}.teeth`, next);
        form.setValue(`items.${itemIndex}.insuranceCoverage`, baseIns * count);
        form.setValue(`items.${itemIndex}.patientCopay`, basePat * count);
        recalculate();
      }} className={`h-12 w-10 text-sm font-black rounded-lg border-2 transition-all shadow-sm ${isSelected ? "bg-brand-600 text-white border-brand-500 scale-110" : "bg-slate-800 text-slate-300 border-slate-700"}`}>{t}</button>
  );
}

function StatCard({ title, value }: any) {
  return (
    <Card className="border-none shadow-md bg-white/60 backdrop-blur-md rounded-2xl h-full">
      <CardContent className="p-6"><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">{title}</p><p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase truncate">{value}</p></CardContent>
    </Card>
  )
}

function Step({ num, label, active, current }: any) {
  return (
    <div className={`flex items-center gap-3 transition-all ${active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 transition-all ${current ? 'bg-brand-700 text-white border-brand-700 shadow-lg scale-110' : active ? 'bg-white text-brand-700 border-brand-700' : 'bg-slate-100 text-slate-400 border-transparent'}`}>{num}</div>
      <div className="flex flex-col uppercase italic"><span className={`text-[8px] font-black tracking-widest ${current ? 'text-brand-700' : 'text-slate-400'}`}>PASO {num}</span><span className={`text-base font-black ${current ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span></div>
    </div>
  )
}

function Line({ active }: { active: boolean }) { return <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${active ? 'bg-brand-700 shadow-sm' : 'bg-slate-200'}`} /> }

function QuickDentistForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ Nombre: "", Apellido: "", MatriculaProvincial: "", MatriculaNacional: "", Telefono: "", Email: "", deliveryMethod: "DIGITAL", digitalChannel: "WHATSAPP" });
  
  const handleSubmit = async () => {
    if (!data.Apellido || !data.Nombre) return toast.error("Completá nombre y apellido");
    setLoading(true);
    const res = await importDentistsAction([{ 
      firstName: data.Nombre, 
      lastName: data.Apellido, 
      matriculaProv: data.MatriculaProvincial, 
      email: data.Email, 
      deliveryMethod: data.deliveryMethod, 
      resultPreference: data.digitalChannel,
      isActive: true 
    }]);
    if (res.success) { toast.success("Profesional guardado"); onSuccess(); }
    setLoading(false);
  };
  
  return (
    <div className="bg-white p-8 font-black uppercase italic rounded-3xl flex flex-col gap-6">
      <h3 className="text-2xl border-b-2 border-brand-700 pb-2">Nuevo Profesional</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="APELLIDO" value={data.Apellido} onChange={e => setData({...data, Apellido: e.target.value.toUpperCase()})} className="h-12 border-2"/>
        <Input placeholder="NOMBRE" value={data.Nombre} onChange={e => setData({...data, Nombre: e.target.value.toUpperCase()})} className="h-12 border-2"/>
      </div>
      <Button className="bg-brand-700 text-white h-14 uppercase" onClick={handleSubmit} disabled={loading}>GUARDAR PROFESIONAL ✓</Button>
    </div>
  )
}