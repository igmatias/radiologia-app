"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  createOrder, getProcedurePrice, getPatientByDni, getNextOrderNumber,
  getPatientHistory, getDailyOrders, updateOrder
} from "@/actions/orders"
import { logoutUser, getCurrentSession } from "@/actions/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, History, Calendar, Stethoscope
} from "lucide-react"

import { OrderHeader } from "./order-header"
import { Step, Line } from "./step-indicator"
import { StepPatient } from "./step-patient"
import { StepStudies } from "./step-studies"
import { StepPayment } from "./step-payment"
import { OrderListView } from "./order-list-view"

export default function OrderForm({ branches, dentists, obrasSociales, procedures, activeTab, setActiveTab, resetTrigger, onOrderCountChange }: any) {
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
  const dniDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const [dailyOrders, setDailyOrders] = useState<any[]>([])
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [orderSearch, setOrderSearch] = useState("")

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

  // LÓGICA DE SALDO A FAVOR (SÓLO PARA EDICIÓN)
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

  // FUNCIÓN DE REFRESCO DE LISTA
  const refreshOrders = async () => {
    if (session?.branchId) {
      const res = await getDailyOrders(session.branchId);
      if (res.success) { setDailyOrders(res.data || []); onOrderCountChange?.(res.data?.length || 0); }
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
        <div style="display:flex; align-items:baseline; gap:3px; margin-bottom:1.5px; line-height:1.2;">
          <span style="color:#c00; font-weight:900; font-size:9px; flex-shrink:0;">▶</span>
          <span style="font-weight:800; font-size:11px; text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
          ${item.info ? `<span style="font-weight:600; font-size:9px; color:#555; flex-shrink:0;">${item.info}</span>` : ''}
        </div>
      `).join('');

      const htmlContent = `
        <html>
        <head>
        <style>
          @page { size: 90mm 50mm; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 90mm; height: 50mm;
            overflow: hidden;
            font-family: 'Arial Narrow', Arial, sans-serif;
            background: white;
          }
          .label {
            width: 90mm; height: 50mm;
            padding: 3mm 3.5mm 2.5mm 3.5mm;
            display: flex; flex-direction: column; gap: 0;
          }
          .header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1.5px solid #111;
            padding-bottom: 1.5mm; margin-bottom: 1.5mm;
          }
          .order-num { font-weight: 900; font-size: 13px; letter-spacing: -0.3px; }
          .date { font-size: 10px; font-weight: 700; color: #333; }
          .patient-name {
            font-weight: 900; font-size: 16px; text-transform: uppercase;
            letter-spacing: -0.5px; line-height: 1.1;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .patient-dob { font-size: 9.5px; font-weight: 600; color: #444; margin-top: 0.5mm; margin-bottom: 1.5mm; }
          .studies { flex: 1; overflow: hidden; }
          .footer {
            border-top: 1.5px solid #111;
            padding-top: 1.5mm; margin-top: 1mm;
            display: flex; justify-content: space-between; align-items: baseline;
          }
          .dentist-label { font-size: 7px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
          .dentist-name { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.3px; }
        </style>
        </head>
        <body>
          <div class="label">
            <div class="header">
              <span class="order-num">Nº ${printData.code}</span>
              <span class="date">${printData.date}</span>
            </div>
            <div class="patient-name">${printData.patient}</div>
            <div class="patient-dob">F. Nac: ${printData.dob}</div>
            <div class="studies">${itemsHtml}</div>
            <div class="footer">
              <div>
                <div class="dentist-label">Prof. Solicitante</div>
                <div class="dentist-name">${printData.dentist}</div>
              </div>
            </div>
          </div>
        </body>
        </html>`;

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
    return dentists.filter((d: any) =>
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

  const handleDniChange = (value: string) => {
    form.setValue("patient.dni", value)
    if (dniDebounceRef.current) clearTimeout(dniDebounceRef.current)
    if (value.length >= 7) {
      dniDebounceRef.current = setTimeout(() => {
        handleDniBlur(value)
      }, 600)
    }
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
    if (!data.dentistId) return toast.error("Falta Odontólogo")
    if (data.patientAmount > 0 && remainingBalance !== 0) return toast.error(`Pagos no coinciden. Faltan cobrar: $${remainingBalance}`);

    setLoading(true)
    try {
      let res;
      if (editingOrderId) {
        res = await updateOrder(editingOrderId, { ...data, branchId: session?.branchId });
      } else {
        res = await createOrder({ ...data, orderNumber, branchId: session?.branchId });
      }

      if (res.success) {
        const dentist = dentists.find((d: any) => d.id === data.dentistId);
        const itemsFormatted = data.items.map((it: any) => {
          const proc = procedures.find((p: any) => p.id === it.procedureId);
          return { name: proc?.name, info: it.teeth?.length > 0 ? `P: ${it.teeth.join(', ')}` : (it.locations?.length > 0 ? `POS: ${it.locations.join(', ')}` : '') }
        });
        setPrintData({ code: orderNumber, patient: `${data.patient.lastName}, ${data.patient.firstName}`, dob: data.patient.birthDate ? new Date(data.patient.birthDate).toLocaleDateString('es-AR') : "S/D", dentist: dentist ? `${dentist.lastName}, ${dentist.firstName}` : "PARTICULAR", items: itemsFormatted, date: new Date().toLocaleDateString('es-AR') });
        toast.success(editingOrderId ? "Orden Actualizada ✓" : "Orden Guardada ✓");
        refreshOrders();
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
      items: orden.items.map((i: any) => ({
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

  const handleReimprimir = (orden: any) => {
    const dentistName = orden.dentist ? `${orden.dentist.lastName}, ${orden.dentist.firstName}` : "PARTICULAR";
    const itemsFormatted = orden.items.map((it: any) => {
      const procName = it.procedure?.name || procedures.find((p: any) => p.id === it.procedureId)?.name || "ESTUDIO";
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
      <OrderHeader
        orderNumber={orderNumber}
        editingOrderId={editingOrderId}
        saldoDiferencia={saldoDiferencia}
        patientAmount={form.watch("patientAmount")}
        session={session}
        branches={branches}
        onLogout={handleLogout}
        onChangeBranch={() => setShowSessionModal(true)}
      />

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
                <StepPatient
                  form={form}
                  patientHistory={patientHistory}
                  onShowHistory={() => setShowHistoryModal(true)}
                  obrasSociales={obrasSociales}
                  onDniChange={handleDniChange}
                  onDniBlur={handleDniBlur}
                />
              )}

              {step === 2 && (
                <StepStudies
                  form={form}
                  dentists={dentists}
                  procedures={procedures}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  procedureSearch={procedureSearch}
                  setProcedureSearch={setProcedureSearch}
                  filteredDentists={filteredDentists}
                  filteredProcedures={filteredProcedures}
                  isDentistModalOpen={isDentistModalOpen}
                  setIsDentistModalOpen={setIsDentistModalOpen}
                  activeConfigId={activeConfigId}
                  setActiveConfigId={setActiveConfigId}
                  onToggleProcedure={toggleProcedure}
                />
              )}

              {step === 3 && (
                <StepPayment
                  form={form}
                  procedures={procedures}
                  editingOrderId={editingOrderId}
                  yaPagado={yaPagado}
                  saldoDiferencia={saldoDiferencia}
                  remainingBalance={remainingBalance}
                  targetAmount={targetAmount}
                  onUpdateItemPrice={updateItemPrice}
                  onAddPayment={addPaymentMethod}
                  onRemovePayment={removePaymentMethod}
                  onUpdatePayment={updatePaymentList}
                />
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
        <OrderListView
          dailyOrders={dailyOrders}
          orderSearch={orderSearch}
          setOrderSearch={setOrderSearch}
          onRefresh={refreshOrders}
          onEdit={handleEditarOrden}
          onReprint={handleReimprimir}
        />
      )}

      {/* ODONTOGRAMA DINÁMICO */}
      {activeConfigId && (() => {
        const p = procedures.find((proc: any) => proc.id === activeConfigId);
        const itemIndex = form.watch("items").findIndex((i: any) => i.procedureId === activeConfigId);
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
        <DialogContent className="sm:max-w-[780px] bg-slate-50 rounded-[2rem] border-t-8 border-slate-900 p-0 max-h-[90vh] overflow-hidden flex flex-col">

          {/* CABECERA FIJA */}
          <div className="bg-slate-900 text-white px-8 py-6 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Historia Clínica</p>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">
                  {form.watch("patient.lastName")}, {form.watch("patient.firstName")}
                </h2>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <span className="text-slate-500">DNI</span> {form.watch("patient.dni")}
                  </span>
                  {form.watch("patient.birthDate") && (
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <span className="text-slate-500">Edad</span>{" "}
                      {(() => { const b = new Date(form.watch("patient.birthDate")); const hoy = new Date(); let age = hoy.getFullYear() - b.getFullYear(); if (hoy < new Date(hoy.getFullYear(), b.getMonth(), b.getDate())) age--; return `${age} años`; })()}
                    </span>
                  )}
                  {form.watch("patient.phone") && (
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <span className="text-slate-500">Tel</span> {form.watch("patient.phone")}
                    </span>
                  )}
                </div>
              </div>
              {/* Resumen rápido */}
              <div className="text-right shrink-0">
                <p className="text-3xl font-black italic text-white">{patientHistory.length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visitas totales</p>
                {patientHistory.length > 0 && (
                  <>
                    <p className="text-sm font-black text-emerald-400 mt-1">
                      ${patientHistory.reduce((acc: number, o: any) => acc + (Number(o.patientAmount) || 0), 0).toLocaleString('es-AR')}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total abonado</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* LISTADO SCROLLEABLE */}
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {patientHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <History size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-black uppercase text-sm">Sin visitas anteriores</p>
              </div>
            ) : patientHistory.map((order: any, idx: number) => {
              const paymentMethods: Record<string, string> = { EFECTIVO: 'Efectivo', DEBITO: 'Débito', TARJETA_DEBITO: 'Débito', TARJETA_CREDITO: 'Crédito', MERCADOPAGO: 'MercadoPago', TRANSFERENCIA: 'Transferencia', OBRA_SOCIAL: 'O.S.' }
              const statusColors: Record<string, string> = { PENDIENTE: 'bg-amber-100 text-amber-700', PROCESANDO: 'bg-blue-100 text-blue-700', LISTO_PARA_ENTREGA: 'bg-emerald-100 text-emerald-700', ENTREGADO: 'bg-slate-100 text-slate-600', CANCELADO: 'bg-brand-100 text-brand-700' }
              const statusLabels: Record<string, string> = { PENDIENTE: 'Pendiente', PROCESANDO: 'En proceso', LISTO_PARA_ENTREGA: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado' }
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

                  {/* Fila superior: código, fecha, sede, estado */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-slate-800 text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{idx + 1}</span>
                      <span className="text-sm font-black">{order.code || 'S/C'}</span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs text-slate-300 font-bold">{new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-slate-700 px-2 py-0.5 rounded text-slate-300">{order.branch?.name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusColors[order.status] || 'bg-slate-100 text-slate-600'}`}>{statusLabels[order.status] || order.status}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">

                    {/* Odontólogo derivante */}
                    <div className="flex items-center gap-2">
                      <Stethoscope size={14} className="text-slate-400 shrink-0" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Derivó:</span>
                      <span className="text-sm font-bold text-slate-700 uppercase">{order.dentist ? `${order.dentist.lastName}, ${order.dentist.firstName}` : 'Particular / Sin derivación'}</span>
                    </div>

                    {/* Prestaciones realizadas */}
                    {order.items?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Prestaciones realizadas</p>
                        <div className="space-y-1.5">
                          {order.items.map((item: any, i: number) => {
                            const teeth = item.metadata?.teeth || item.teeth || []
                            const locs = item.metadata?.locations || item.locations || []
                            return (
                              <div key={i} className="flex flex-wrap items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                <span className="text-xs font-bold text-slate-800 uppercase flex-1">{item.procedure?.name}</span>
                                {teeth.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {teeth.map((t: any) => <span key={t} className="bg-slate-800 text-white text-[10px] font-black px-1.5 py-0.5 rounded">{t}</span>)}
                                  </div>
                                )}
                                {locs.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {locs.map((l: string) => <span key={l} className="bg-slate-200 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">{l}</span>)}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pagos */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {order.payments?.map((p: any, i: number) => (
                          <span key={i} className="text-[10px] font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg">
                            {paymentMethods[p.method] || p.method} · ${Number(p.amount).toLocaleString('es-AR')}
                          </span>
                        ))}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400">Total abonado</p>
                        <p className="text-lg font-black text-emerald-600">${Number(order.patientAmount || order.totalAmount || 0).toLocaleString('es-AR')}</p>
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
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
