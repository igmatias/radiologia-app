export function generateOfflineHTML(data: any): string {
  const dataJson = JSON.stringify(data)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MODO EMERGENCIA — Sistema Radiológico</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh}
.header{background:#0f172a;color:white;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100}
.header-left{display:flex;align-items:center;gap:12px}
.badge{background:#ef4444;color:white;font-size:10px;font-weight:900;padding:3px 8px;border-radius:4px;letter-spacing:1px}
.header-title{font-size:14px;font-weight:900;letter-spacing:1px}
.header-meta{font-size:11px;color:#94a3b8}
.tabs{display:flex;gap:4px;background:#1e293b;padding:8px 20px}
.tab{padding:8px 20px;border:none;background:none;color:#94a3b8;font-weight:900;font-size:12px;cursor:pointer;border-radius:6px;text-transform:uppercase;letter-spacing:1px;transition:all .2s}
.tab.active{background:#9e2457;color:white}
.tab:hover:not(.active){background:#334155;color:white}
.main{max-width:1200px;margin:0 auto;padding:20px}
.card{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);margin-bottom:16px;overflow:hidden}
.card-header{padding:14px 18px;border-bottom:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:space-between;align-items:center}
.card-title{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#374151}
.card-body{padding:18px}
label{display:block;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:4px;margin-top:12px}
label:first-child{margin-top:0}
input,select,textarea{width:100%;padding:9px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;outline:none;transition:border .2s;background:white}
input:focus,select:focus,textarea:focus{border-color:#9e2457}
.row{display:grid;gap:12px}
.cols-2{grid-template-columns:1fr 1fr}
.cols-3{grid-template-columns:1fr 1fr 1fr}
.cols-4{grid-template-columns:1fr 1fr 1fr 1fr}
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border:none;border-radius:8px;font-size:12px;font-weight:900;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;transition:all .2s}
.btn-primary{background:#9e2457;color:white}
.btn-primary:hover{background:#821c47}
.btn-success{background:#16a34a;color:white}
.btn-success:hover{background:#15803d}
.btn-danger{background:#ef4444;color:white}
.btn-danger:hover{background:#dc2626}
.btn-outline{background:white;color:#374151;border:2px solid #e2e8f0}
.btn-outline:hover{border-color:#94a3b8;background:#f8fafc}
.btn-sm{padding:5px 12px;font-size:11px}
.btn-lg{padding:12px 24px;font-size:14px;border-radius:10px}
.search-box{position:relative}
.search-results{position:absolute;top:100%;left:0;right:0;background:white;border:2px solid #9e2457;border-top:none;border-radius:0 0 8px 8px;max-height:200px;overflow-y:auto;z-index:50;box-shadow:0 8px 20px rgba(0,0,0,.1)}
.search-item{padding:10px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center}
.search-item:hover{background:#eff6ff}
.search-item-name{font-size:13px;font-weight:700;color:#1e293b}
.search-item-meta{font-size:11px;color:#6b7280}
.selected-patient{background:#fdf0f5;border:2px solid #9e2457;border-radius:8px;padding:12px;margin-top:8px}
.proc-list{display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px}
.proc-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;cursor:pointer;transition:background .15s;border-bottom:1px solid #f1f5f9}
.proc-item:hover{background:#f8fafc}
.proc-item:last-child{border-bottom:none}
.proc-item-left{flex:1}
.proc-item-code{font-size:10px;font-weight:900;color:#6b7280;text-transform:uppercase}
.proc-item-name{font-size:13px;font-weight:700;color:#1e293b}
.proc-item-price{font-size:12px;font-weight:900;color:#16a34a;text-align:right}
.selected-procs{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.selected-proc{display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 12px}
.selected-proc-name{font-size:12px;font-weight:700;color:#166534}
.remove-btn{background:none;border:none;color:#ef4444;cursor:pointer;font-size:18px;line-height:1;padding:0 4px}
.totals{background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:16px;margin-top:16px}
.total-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0}
.total-label{font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase}
.total-value{font-size:14px;font-weight:900;color:#1e293b}
.total-row.grand{border-top:2px solid #e2e8f0;margin-top:6px;padding-top:8px}
.total-row.grand .total-value{color:#9e2457;font-size:16px}
.order-list{display:flex;flex-direction:column;gap:8px}
.order-card{border:2px solid #e2e8f0;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:flex-start;cursor:pointer;transition:border .2s}
.order-card:hover{border-color:#3b82f6;background:#f8fbff}
.order-card-name{font-size:14px;font-weight:900;text-transform:uppercase;color:#1e293b}
.order-card-meta{font-size:11px;color:#6b7280;margin-top:2px}
.order-card-amount{font-size:16px;font-weight:900;color:#16a34a}
.badge-count{background:#9e2457;color:white;border-radius:999px;font-size:11px;font-weight:900;padding:2px 8px}
.alert{padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:13px;font-weight:600}
.alert-warning{background:#fefce8;border:1px solid #fde047;color:#713f12}
.alert-success{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}
.alert-info{background:#fdf0f5;border:1px solid #e8b4cc;color:#821c47}
.empty{text-align:center;padding:40px 20px;color:#9ca3af}
.empty-icon{font-size:48px;display:block;margin-bottom:12px}
.divider{border:none;border-top:2px solid #e2e8f0;margin:20px 0}
.text-sm{font-size:12px}
.text-xs{font-size:11px}
.font-bold{font-weight:700}
.font-black{font-weight:900}
.text-gray{color:#6b7280}
.text-green{color:#16a34a}
.text-blue{color:#9e2457}
.text-red{color:#ef4444}
.flex{display:flex}
.gap-2{gap:8px}
.gap-3{gap:12px}
.items-center{align-items:center}
.justify-between{justify-content:space-between}
.mt-2{margin-top:8px}
.mt-4{margin-top:16px}
.mb-2{margin-bottom:8px}
.w-full{width:100%}
.text-right{text-align:right}
.branch-select{background:#5c1030;border:2px solid #9e2457;border-radius:8px;color:white;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer}
.branch-select option{background:#1e293b}
.section-title{font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#1e293b;margin-bottom:16px;border-bottom:3px solid #9e2457;padding-bottom:8px}
.caja-type-btn{flex:1;padding:12px;border:2px solid #e2e8f0;border-radius:10px;background:white;cursor:pointer;font-size:13px;font-weight:900;text-transform:uppercase;transition:all .2s}
.caja-type-btn.active-cobro{border-color:#16a34a;background:#f0fdf4;color:#16a34a}
.caja-type-btn.active-gasto{border-color:#ef4444;background:#fef2f2;color:#ef4444}
.movimiento-item{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:6px}
.movimiento-cobro{border-left:4px solid #16a34a;background:#f9fffe}
.movimiento-gasto{border-left:4px solid #ef4444;background:#fff9f9}
.export-stat{text-align:center;background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px}
.export-stat-num{font-size:36px;font-weight:900;color:#9e2457}
.export-stat-label{font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:1px;margin-top:4px}
.hint{font-size:11px;color:#9ca3af;margin-top:4px;font-style:italic}
@media print{
  .header,.tabs,.no-print{display:none!important}
  body{background:white}
}
</style>
</head>
<body>

<div id="app">Cargando...</div>

<script>
const APP_DATA = ${dataJson};

// ─── Estado global ───────────────────────────────────────────────
let S = {
  tab: 'ordenes',
  branchId: localStorage.getItem('em_branchId') || '',
  branchName: localStorage.getItem('em_branchName') || '',

  // Formulario de orden
  step: 1, // 1=paciente, 2=cobertura+practicas, 3=confirmar
  patientQuery: '',
  patientResults: [],
  patient: null,
  isNewPatient: false,
  newPatientData: { dni:'', firstName:'', lastName:'', birthDate:'', affiliateNumber:'', plan:'', phone:'' },

  obraSocialId: '',
  osVariantId: '',
  dentistId: '',
  notes: '',
  paymentMethod: 'EFECTIVO',
  selectedProcs: [], // { procedureId, procedureName, procedureCode, amount, insuranceCoverage, patientCopay }
  procSearch: '',

  // Caja
  cajaType: 'COBRO',
  cajaAmount: '',
  cajaDesc: '',
  cajaMethod: 'EFECTIVO',

  // Sesión persistida
  orders: JSON.parse(localStorage.getItem('em_orders') || '[]'),
  cajaMovimientos: JSON.parse(localStorage.getItem('em_caja') || '[]'),
}

function save() {
  localStorage.setItem('em_orders', JSON.stringify(S.orders))
  localStorage.setItem('em_caja', JSON.stringify(S.cajaMovimientos))
  localStorage.setItem('em_branchId', S.branchId)
  localStorage.setItem('em_branchName', S.branchName)
}

// ─── Helpers ────────────────────────────────────────────────────
function norm(s) { return (s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'') }

function searchPatients(q) {
  if (!q || q.length < 2) return []
  const n = norm(q)
  return APP_DATA.patients.filter(p =>
    (p.dni||'').includes(q) ||
    norm(p.lastName).includes(n) ||
    norm(p.firstName).includes(n)
  ).slice(0, 8)
}

function getOS(id) { return APP_DATA.obrasSociales.find(o => o.id === id) }
function getDentist(id) { return APP_DATA.dentists.find(d => d.id === id) }
function getBranch(id) { return APP_DATA.branches.find(b => b.id === id) }

function getPrice(osId, procId) {
  const os = getOS(osId)
  return os?.priceMap?.[procId] || { amount:0, insuranceCoverage:0, patientCopay:0 }
}

function formatDate(iso) {
  if (!iso) return 'S/D'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR')
}

function formatMoney(n) {
  return '$' + Number(n||0).toLocaleString('es-AR', {minimumFractionDigits:0})
}

function genTempId() { return 'OFFLINE-' + Date.now() + '-' + Math.floor(Math.random()*9999) }

function totalPaciente() { return S.selectedProcs.reduce((a,p)=>a+p.patientCopay,0) }
function totalOS() { return S.selectedProcs.reduce((a,p)=>a+p.insuranceCoverage,0) }
function totalGeneral() { return S.selectedProcs.reduce((a,p)=>a+p.amount,0) }

// ─── Render principal ────────────────────────────────────────────
function render() {
  document.getElementById('app').innerHTML = buildApp()
  attachEvents()
}

function buildApp() {
  const ordCount = S.orders.length
  const cajaCount = S.cajaMovimientos.length
  const genAt = APP_DATA.generatedAt ? new Date(APP_DATA.generatedAt).toLocaleString('es-AR') : '?'

  return \`
  <div class="header">
    <div class="header-left">
      <span class="badge">⚠ EMERGENCIA</span>
      <div>
        <div class="header-title">SISTEMA RADIOLÓGICO — MODO OFFLINE</div>
        <div class="header-meta">Datos al: \${genAt} &nbsp;·&nbsp; <strong>¡No olvides exportar al volver la conexión!</strong></div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <select class="branch-select" id="branchSelect">
        <option value="">— Elegir sede —</option>
        \${APP_DATA.branches.map(b=>\`<option value="\${b.id}" \${S.branchId===b.id?'selected':''}>\${b.name}</option>\`).join('')}
      </select>
    </div>
  </div>

  <div class="tabs">
    <button class="tab \${S.tab==='ordenes'?'active':''}" onclick="setTab('ordenes')">
      📋 Órdenes \${ordCount>0?\`<span class="badge-count">\${ordCount}</span>\`:''}
    </button>
    <button class="tab \${S.tab==='caja'?'active':''}" onclick="setTab('caja')">
      💰 Caja \${cajaCount>0?\`<span class="badge-count">\${cajaCount}</span>\`:''}
    </button>
    <button class="tab \${S.tab==='exportar'?'active':''}" onclick="setTab('exportar')">
      📤 Exportar
    </button>
  </div>

  <div class="main">
    \${!S.branchId ? buildNoBranch() : S.tab==='ordenes' ? buildOrdenes() : S.tab==='caja' ? buildCaja() : buildExportar()}
  </div>
  \`
}

function buildNoBranch() {
  return \`<div class="alert alert-warning">
    <strong>⚠ Primero elegí la sede</strong> en el selector del encabezado para empezar a trabajar.
  </div>\`
}

// ─── TAB ORDENES ─────────────────────────────────────────────────
function buildOrdenes() {
  return \`
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
    <div>
      \${buildOrderForm()}
    </div>
    <div>
      \${buildOrderHistory()}
    </div>
  </div>\`
}

function buildOrderForm() {
  return \`
  <div class="card">
    <div class="card-header">
      <span class="card-title">Nueva Orden</span>
      \${S.step > 1 ? \`<button class="btn btn-outline btn-sm" onclick="resetForm()">✕ Cancelar</button>\` : ''}
    </div>
    <div class="card-body">
      \${buildStep()}
    </div>
  </div>\`
}

function buildStep() {
  if (S.step === 1) return buildPatientStep()
  if (S.step === 2) return buildProcsStep()
  if (S.step === 3) return buildConfirmStep()
  return ''
}

function buildPatientStep() {
  const patInfo = S.patient || S.isNewPatient ? buildPatientInfo() : ''
  const patientOS = S.patient?.defaultObraSocialId || ''
  return \`
    <p class="text-xs text-gray mb-2 font-bold">PASO 1 DE 3 — PACIENTE</p>
    <label>Buscar por DNI o apellido</label>
    <div class="search-box">
      <input id="patQuery" type="text" placeholder="Escribí DNI o apellido..."
        value="\${S.patientQuery}"
        oninput="onPatientSearch(this.value)"
        autocomplete="off" />
      \${S.patientResults.length > 0 ? \`
        <div class="search-results">
          \${S.patientResults.map(p=>\`
            <div class="search-item" onclick="selectPatient('\${p.id}')">
              <div>
                <div class="search-item-name">\${(p.lastName||'').toUpperCase()}, \${p.firstName||''}</div>
                <div class="search-item-meta">DNI: \${p.dni||'S/D'} · \${getOS(p.defaultObraSocialId)?.name||'Particular'}</div>
              </div>
              <span class="text-xs text-gray">\${p.affiliateNumber||''}</span>
            </div>
          \`).join('')}
        </div>
      \` : ''}
    </div>
    \${patInfo}
    <hr class="divider">
    \${!S.patient && !S.isNewPatient ? \`
      <button class="btn btn-outline w-full" onclick="startNewPatient()">+ Paciente nuevo</button>
    \` : ''}
    \${(S.patient || S.isNewPatient) ? \`
      <button class="btn btn-primary w-full mt-4" onclick="goToStep2()">Continuar →</button>
    \` : ''}
  \`
}

function buildPatientInfo() {
  if (S.isNewPatient) {
    const d = S.newPatientData
    return \`
      <div class="selected-patient mt-2">
        <p class="text-xs font-black text-blue mb-2">NUEVO PACIENTE</p>
        <div class="row cols-2">
          <div>
            <label>DNI *</label>
            <input type="text" placeholder="12345678" value="\${d.dni}"
              oninput="S.newPatientData.dni=this.value">
          </div>
          <div>
            <label>Teléfono</label>
            <input type="text" placeholder="351..." value="\${d.phone}"
              oninput="S.newPatientData.phone=this.value">
          </div>
        </div>
        <div class="row cols-2 mt-2">
          <div>
            <label>Apellido *</label>
            <input type="text" placeholder="GARCIA" value="\${d.lastName}"
              oninput="S.newPatientData.lastName=this.value.toUpperCase()">
          </div>
          <div>
            <label>Nombre *</label>
            <input type="text" placeholder="Carlos" value="\${d.firstName}"
              oninput="S.newPatientData.firstName=this.value">
          </div>
        </div>
        <div class="row cols-2 mt-2">
          <div>
            <label>Fecha de Nacimiento</label>
            <input type="date" value="\${d.birthDate}"
              oninput="S.newPatientData.birthDate=this.value">
          </div>
        </div>
        <div class="row cols-2 mt-2">
          <div>
            <label>Obra Social</label>
            <select onchange="S.newPatientData.defaultObraSocialId=this.value;S.obraSocialId=this.value">
              <option value="">— Particular —</option>
              \${APP_DATA.obrasSociales.map(o=>\`<option value="\${o.id}" \${d.defaultObraSocialId===o.id?'selected':''}>\${o.name}</option>\`).join('')}
            </select>
          </div>
          <div>
            <label>Nº de Afiliado</label>
            <input type="text" placeholder="123456" value="\${d.affiliateNumber||''}"
              oninput="S.newPatientData.affiliateNumber=this.value">
          </div>
        </div>
        <div class="row cols-2 mt-2">
          <div>
            <label>Plan</label>
            <input type="text" placeholder="Ej: 210, GOLD..." value="\${d.plan||''}"
              oninput="S.newPatientData.plan=this.value">
          </div>
        </div>
        <button class="btn btn-outline btn-sm mt-2" onclick="cancelNewPatient()">Cancelar</button>
      </div>
    \`
  }
  if (S.patient) {
    const p = S.patient
    const osName = getOS(p.defaultObraSocialId)?.name || 'Particular'
    const dob = p.birthDate ? formatDate(p.birthDate) : 'S/D'
    return \`
      <div class="selected-patient mt-2">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-black" style="font-size:15px;text-transform:uppercase">\${(p.lastName||'').toUpperCase()}, \${p.firstName||''}</div>
            <div class="text-xs text-gray mt-1">DNI: \${p.dni} &nbsp;·&nbsp; F. Nac: \${dob}</div>
            <div class="text-xs text-gray">\${osName}\${p.affiliateNumber?' · Afil: '+p.affiliateNumber:''}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="clearPatient()">Cambiar</button>
        </div>
      </div>
    \`
  }
  return ''
}

function buildProcsStep() {
  const os = getOS(S.obraSocialId)
  const filteredProcs = APP_DATA.procedures.filter(p => {
    if (!S.procSearch) return true
    const n = norm(S.procSearch)
    return norm(p.name).includes(n) || (p.code||'').includes(S.procSearch)
  })

  return \`
    <p class="text-xs text-gray mb-2 font-bold">PASO 2 DE 3 — COBERTURA Y PRÁCTICAS</p>

    <label>Obra Social / Cobertura</label>
    <select onchange="setOS(this.value)">
      <option value="">— Particular —</option>
      \${APP_DATA.obrasSociales.map(o=>\`<option value="\${o.id}" \${S.obraSocialId===o.id?'selected':''}>\${o.name}</option>\`).join('')}
    </select>

    \${os?.variants?.length ? \`
      <label>Variante</label>
      <select onchange="S.osVariantId=this.value">
        <option value="">— Todas —</option>
        \${os.variants.map(v=>\`<option value="\${v.id}" \${S.osVariantId===v.id?'selected':''}>\${v.name}</option>\`).join('')}
      </select>
    \` : ''}

    <label>Odontólogo solicitante</label>
    <select onchange="S.dentistId=this.value">
      <option value="">— Particular / Sin referir —</option>
      \${APP_DATA.dentists.map(d=>\`<option value="\${d.id}" \${S.dentistId===d.id?'selected':''}>\${d.lastName}, \${d.firstName} \${d.matriculaProv?'(MP '+d.matriculaProv+')':''}</option>\`).join('')}
    </select>

    <hr class="divider">

    <label>Agregar práctica</label>
    <input type="text" id="procSearch" placeholder="Buscar por nombre o código..."
      value="\${S.procSearch}" oninput="S.procSearch=this.value;renderProcList()">

    <div class="proc-list mt-2" id="procListContainer">
      \${filteredProcs.slice(0,30).map(p=>{
        const pr = getPrice(S.obraSocialId, p.id)
        return \`<div class="proc-item" onclick="addProc('\${p.id}')">
          <div class="proc-item-left">
            <div class="proc-item-code">\${p.code}</div>
            <div class="proc-item-name">\${p.name}</div>
          </div>
          <div class="proc-item-price">\${formatMoney(pr.patientCopay || pr.amount)}</div>
        </div>\`
      }).join('')}
      \${filteredProcs.length === 0 ? '<div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">Sin resultados</div>' : ''}
    </div>

    \${S.selectedProcs.length > 0 ? \`
      <label class="mt-4">Prácticas seleccionadas (\${S.selectedProcs.length})</label>
      <div class="selected-procs">
        \${S.selectedProcs.map((p,i)=>\`
          <div class="selected-proc">
            <div>
              <div class="selected-proc-name">\${p.procedureName}</div>
              <div class="text-xs text-gray">\${formatMoney(p.patientCopay)} copago · \${formatMoney(p.insuranceCoverage)} OS</div>
            </div>
            <button class="remove-btn" onclick="removeProc(\${i})">×</button>
          </div>
        \`).join('')}
      </div>

      \${buildTotals()}
      <button class="btn btn-primary w-full mt-4" onclick="goToStep3()">Ver resumen →</button>
    \` : \`<div class="alert alert-info mt-4">Seleccioná al menos una práctica para continuar.</div>\`}

    <button class="btn btn-outline btn-sm mt-2" onclick="S.step=1;render()">← Volver</button>
  \`
}

function buildConfirmStep() {
  const p = S.patient || S.newPatientData
  const os = getOS(S.obraSocialId)
  const dentist = getDentist(S.dentistId)
  const patName = \`\${(p.lastName||'').toUpperCase()}, \${p.firstName||''}\`
  const dob = p.birthDate ? formatDate(p.birthDate) : 'S/D'

  return \`
    <p class="text-xs text-gray mb-2 font-bold">PASO 3 DE 3 — CONFIRMAR ORDEN</p>

    <div class="alert alert-info">
      <strong>\${patName}</strong><br>
      DNI: \${p.dni||'S/D'} &nbsp;·&nbsp; F. Nac: \${dob}<br>
      OS: \${os?.name||'Particular'}\${S.osVariantId?' ('+os?.variants?.find(v=>v.id===S.osVariantId)?.name+')':''}<br>
      Dr/a: \${dentist?\`\${dentist.lastName}, \${dentist.firstName}\`:'Particular'}
    </div>

    <label>Prácticas</label>
    <div class="selected-procs">
      \${S.selectedProcs.map(p=>\`
        <div class="selected-proc">
          <div class="selected-proc-name">\${p.procedureName}</div>
          <div class="text-xs text-gray">\${formatMoney(p.patientCopay)} copago</div>
        </div>
      \`).join('')}
    </div>

    \${buildTotals()}

    <label class="mt-4">Método de cobro</label>
    <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
      \${['EFECTIVO','TRANSFERENCIA','TARJETA','CHEQUE','OS (sin cobro)'].map(m=>\`
        <button type="button"
          onclick="S.paymentMethod='\${m}';document.querySelectorAll('.pay-btn').forEach(b=>b.classList.remove('pay-active'));this.classList.add('pay-active')"
          class="pay-btn \${S.paymentMethod===m?'pay-active':''}"
          style="padding:8px 14px;border:2px solid \${S.paymentMethod===m?'#9e2457':'#e2e8f0'};background:\${S.paymentMethod===m?'#fdf0f5':'white'};color:\${S.paymentMethod===m?'#9e2457':'#374151'};border-radius:8px;font-size:11px;font-weight:900;cursor:pointer;text-transform:uppercase">
          \${m}
        </button>
      \`).join('')}
    </div>

    <label class="mt-4">Notas (opcional)</label>
    <textarea rows="2" placeholder="Observaciones..." oninput="S.notes=this.value">\${S.notes}</textarea>

    <hr class="divider">
    <div class="row cols-2">
      <button class="btn btn-success btn-lg" onclick="saveOrder(true)">🖨 Guardar e Imprimir etiqueta</button>
      <button class="btn btn-primary btn-lg" onclick="saveOrder(false)">✓ Solo guardar</button>
    </div>
    <button class="btn btn-outline btn-sm mt-2" onclick="S.step=2;render()">← Volver</button>
  \`
}

function buildTotals() {
  const tp = totalPaciente()
  const tos = totalOS()
  const tg = totalGeneral()
  return \`
    <div class="totals">
      \${tos > 0 ? \`<div class="total-row"><span class="total-label">Cubre OS</span><span class="total-value">\${formatMoney(tos)}</span></div>\` : ''}
      <div class="total-row"><span class="total-label">Copago paciente</span><span class="total-value">\${formatMoney(tp)}</span></div>
      <div class="total-row grand"><span class="total-label">Total</span><span class="total-value">\${formatMoney(tg)}</span></div>
    </div>
  \`
}

function buildOrderHistory() {
  if (S.orders.length === 0) {
    return \`<div class="card"><div class="card-header"><span class="card-title">Órdenes de esta sesión</span></div>
      <div class="card-body">
        <div class="empty"><span class="empty-icon">📋</span>No hay órdenes creadas aún</div>
      </div></div>\`
  }
  return \`
    <div class="card">
      <div class="card-header">
        <span class="card-title">Órdenes de esta sesión</span>
        <span class="badge-count">\${S.orders.length}</span>
      </div>
      <div class="card-body" style="padding:12px">
        <div class="order-list">
          \${S.orders.map((o,i)=>\`
            <div class="order-card">
              <div style="flex:1">
                <div class="order-card-name">\${o.patientLastName||''}, \${o.patientFirstName||''}</div>
                <div class="order-card-meta">
                  DNI: \${o.patientDni||'S/D'} ·
                  \${o.obraSocialName||'Particular'} ·
                  \${o.items.length} práctica\${o.items.length!==1?'s':''} ·
                  \${new Date(o.createdAt).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
              <div style="text-align:right">
                <div class="order-card-amount">\${formatMoney(o.patientAmount)}</div>
                <button class="btn btn-outline btn-sm mt-2" onclick="reprintLabel(\${i})">🖨 Reimprimir</button>
              </div>
            </div>
          \`).join('')}
        </div>
      </div>
    </div>
  \`
}

// ─── TAB CAJA ────────────────────────────────────────────────────
function buildCaja() {
  const totalEfectivo = S.cajaMovimientos
    .filter(m => m.method === 'EFECTIVO')
    .reduce((a,m) => m.type==='COBRO' ? a+m.amount : a-m.amount, 0)

  return \`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
      <div class="card">
        <div class="card-header"><span class="card-title">Registrar movimiento</span></div>
        <div class="card-body">
          <div class="flex gap-2 mb-4">
            <button class="caja-type-btn \${S.cajaType==='COBRO'?'active-cobro':''}" onclick="S.cajaType='COBRO';render()">💚 Cobro</button>
            <button class="caja-type-btn \${S.cajaType==='GASTO'?'active-gasto':''}" onclick="S.cajaType='GASTO';render()">🔴 Gasto</button>
          </div>
          <label>Monto *</label>
          <input type="number" id="cajaAmount" placeholder="0.00" value="\${S.cajaAmount}"
            oninput="S.cajaAmount=this.value">
          <label>Descripción *</label>
          <input type="text" id="cajaDesc" placeholder="\${S.cajaType==='COBRO'?'Orden #...':'Detalle del gasto...'}"
            value="\${S.cajaDesc}" oninput="S.cajaDesc=this.value">
          <label>Método de pago</label>
          <select onchange="S.cajaMethod=this.value">
            <option value="EFECTIVO" \${S.cajaMethod==='EFECTIVO'?'selected':''}>Efectivo</option>
            <option value="TRANSFERENCIA" \${S.cajaMethod==='TRANSFERENCIA'?'selected':''}>Transferencia</option>
            <option value="TARJETA" \${S.cajaMethod==='TARJETA'?'selected':''}>Tarjeta</option>
            <option value="CHEQUE" \${S.cajaMethod==='CHEQUE'?'selected':''}>Cheque</option>
          </select>
          <button class="btn \${S.cajaType==='COBRO'?'btn-success':'btn-danger'} w-full mt-4"
            onclick="saveCajaMovimiento()">
            \${S.cajaType==='COBRO'?'+ Registrar cobro':'+ Registrar gasto'}
          </button>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:12px">
          <div class="card-header"><span class="card-title">Resumen de caja</span></div>
          <div class="card-body">
            <div class="total-row"><span class="total-label">Total efectivo</span>
              <span class="total-value \${totalEfectivo>=0?'text-green':'text-red'}">\${formatMoney(totalEfectivo)}</span>
            </div>
            <div class="total-row"><span class="total-label">Movimientos</span>
              <span class="total-value">\${S.cajaMovimientos.length}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Movimientos</span></div>
          <div class="card-body" style="padding:12px">
            \${S.cajaMovimientos.length === 0
              ? '<div class="empty"><span class="empty-icon">💰</span>Sin movimientos aún</div>'
              : S.cajaMovimientos.slice().reverse().map((m,i)=>\`
                  <div class="movimiento-item \${m.type==='COBRO'?'movimiento-cobro':'movimiento-gasto'}">
                    <div>
                      <div class="font-bold text-sm">\${m.description}</div>
                      <div class="text-xs text-gray">\${m.method} · \${new Date(m.createdAt).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                    <div class="\${m.type==='COBRO'?'text-green':'text-red'} font-black">
                      \${m.type==='COBRO'?'+':'-'}\${formatMoney(m.amount)}
                    </div>
                  </div>
                \`).join('')
            }
          </div>
        </div>
      </div>
    </div>
  \`
}

// ─── TAB EXPORTAR ────────────────────────────────────────────────
function buildExportar() {
  const totalCobrado = S.orders.reduce((a,o)=>a+o.patientAmount, 0)
  const hasData = S.orders.length > 0 || S.cajaMovimientos.length > 0

  return \`
    <div class="card">
      <div class="card-header"><span class="card-title">Exportar sesión offline</span></div>
      <div class="card-body">
        \${hasData
          ? \`<div class="alert alert-success">Tenés datos offline pendientes de importar al sistema.</div>\`
          : \`<div class="alert alert-info">No hay datos para exportar aún.</div>\`
        }

        <div class="row cols-3 mt-4">
          <div class="export-stat">
            <div class="export-stat-num">\${S.orders.length}</div>
            <div class="export-stat-label">Órdenes</div>
          </div>
          <div class="export-stat">
            <div class="export-stat-num">\${S.cajaMovimientos.length}</div>
            <div class="export-stat-label">Movimientos de caja</div>
          </div>
          <div class="export-stat">
            <div class="export-stat-num">\${formatMoney(totalCobrado)}</div>
            <div class="export-stat-label">Cobrado</div>
          </div>
        </div>

        \${hasData ? \`
          <hr class="divider">
          <p class="text-sm text-gray mb-4">
            Descargá el archivo <strong>.json</strong> y subilo al sistema cuando vuelva internet
            desde <strong>Admin → Importar sesión offline</strong>.
          </p>
          <button class="btn btn-success btn-lg w-full" onclick="exportData()">
            📥 Descargar archivo de exportación
          </button>
          <hr class="divider">
          <button class="btn btn-danger btn-sm" onclick="clearSession()"
            style="width:auto">
            🗑 Limpiar sesión (solo hacerlo después de importar)
          </button>
        \` : ''}
      </div>
    </div>
  \`
}

// ─── Lógica de formulario ────────────────────────────────────────
function setTab(tab) { S.tab = tab; render() }

function onPatientSearch(q) {
  S.patientQuery = q
  S.patientResults = q.length >= 2 ? searchPatients(q) : []
  S.patient = null
  render()
}

function selectPatient(id) {
  const p = APP_DATA.patients.find(x => x.id === id)
  S.patient = p
  S.isNewPatient = false
  S.patientQuery = \`\${p.lastName||''}, \${p.firstName||''}\`
  S.patientResults = []
  if (p.defaultObraSocialId) S.obraSocialId = p.defaultObraSocialId
  render()
}

function clearPatient() {
  S.patient = null; S.patientQuery = ''; S.patientResults = []
  render()
}

function startNewPatient() {
  S.isNewPatient = true
  S.patient = null
  S.newPatientData = { dni:'', firstName:'', lastName:'', birthDate:'', affiliateNumber:'', plan:'', phone:'' }
  render()
}

function cancelNewPatient() { S.isNewPatient = false; render() }

function setNewPatient(field, val) {
  S.newPatientData[field] = val
}

function setOS(id) {
  S.obraSocialId = id
  S.osVariantId = ''
  // Recalcular precios de prácticas ya seleccionadas
  S.selectedProcs = S.selectedProcs.map(p => {
    const pr = getPrice(id, p.procedureId)
    return { ...p, ...pr }
  })
  render()
}

function goToStep2() {
  if (!S.patient && !S.isNewPatient) return
  if (S.isNewPatient && (!S.newPatientData.dni || !S.newPatientData.lastName)) {
    alert('Completá DNI y apellido del paciente')
    return
  }
  S.step = 2
  render()
}

function goToStep3() {
  if (S.selectedProcs.length === 0) return
  S.step = 3
  render()
}

function resetForm() {
  S.step = 1; S.patient = null; S.isNewPatient = false; S.patientQuery = ''
  S.patientResults = []; S.newPatientData = { dni:'', firstName:'', lastName:'', birthDate:'', affiliateNumber:'', plan:'', phone:'' }
  S.obraSocialId = ''; S.osVariantId = ''; S.dentistId = ''; S.notes = ''
  S.paymentMethod = 'EFECTIVO'
  S.selectedProcs = []; S.procSearch = ''
  render()
}

function addProc(id) {
  const proc = APP_DATA.procedures.find(p => p.id === id)
  if (!proc) return
  const pr = getPrice(S.obraSocialId, id)
  S.selectedProcs.push({
    procedureId: id,
    procedureName: proc.name,
    procedureCode: proc.code,
    amount: pr.amount,
    insuranceCoverage: pr.insuranceCoverage,
    patientCopay: pr.patientCopay
  })
  render()
}

function removeProc(i) { S.selectedProcs.splice(i, 1); render() }

function renderProcList() {
  S.procSearch = document.getElementById('procSearch')?.value || ''
  const filtered = APP_DATA.procedures.filter(p => {
    if (!S.procSearch) return true
    const n = norm(S.procSearch)
    return norm(p.name).includes(n) || (p.code||'').includes(S.procSearch)
  })
  const container = document.getElementById('procListContainer')
  if (!container) return
  container.innerHTML = filtered.slice(0,30).map(p => {
    const pr = getPrice(S.obraSocialId, p.id)
    return \`<div class="proc-item" onclick="addProc('\${p.id}')">
      <div class="proc-item-left">
        <div class="proc-item-code">\${p.code}</div>
        <div class="proc-item-name">\${p.name}</div>
      </div>
      <div class="proc-item-price">\${formatMoney(pr.patientCopay || pr.amount)}</div>
    </div>\`
  }).join('') || '<div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">Sin resultados</div>'
}

function saveOrder(printLabel) {
  const p = S.patient || S.newPatientData
  const os = getOS(S.obraSocialId)
  const dentist = getDentist(S.dentistId)
  const branch = getBranch(S.branchId)

  const order = {
    tempId: genTempId(),
    branchId: S.branchId,
    branchName: branch?.name || '',
    patientId: S.patient?.id || null,
    patientDni: p.dni || '',
    patientFirstName: p.firstName || '',
    patientLastName: p.lastName || '',
    patientBirthDate: p.birthDate || null,
    patientAffiliateNumber: S.patient?.affiliateNumber || S.newPatientData?.affiliateNumber || '',
    patientPlan: S.patient?.plan || S.newPatientData?.plan || '',
    patientPhone: S.patient?.phone || S.newPatientData?.phone || '',
    obraSocialId: S.obraSocialId || null,
    obraSocialName: os?.name || 'Particular',
    osVariantId: S.osVariantId || null,
    osVariantName: os?.variants?.find(v=>v.id===S.osVariantId)?.name || null,
    dentistId: S.dentistId || null,
    dentistName: dentist ? \`\${dentist.lastName}, \${dentist.firstName}\` : 'PARTICULAR',
    notes: S.notes,
    items: S.selectedProcs.map(p => ({
      procedureId: p.procedureId,
      procedureName: p.procedureName,
      procedureCode: p.procedureCode,
      amount: p.amount,
      insuranceCoverage: p.insuranceCoverage,
      patientCopay: p.patientCopay
    })),
    totalAmount: totalGeneral(),
    patientAmount: totalPaciente(),
    insuranceAmount: totalOS(),
    createdAt: new Date().toISOString()
  }

  S.orders.push(order)

  // Auto-registrar cobro en caja si hay monto de paciente y no es "OS (sin cobro)"
  if (order.patientAmount > 0 && S.paymentMethod !== 'OS (sin cobro)') {
    const patName = \`\${(order.patientLastName||'').toUpperCase()}, \${order.patientFirstName||''}\`
    S.cajaMovimientos.push({
      tempId: genTempId(),
      type: 'COBRO',
      amount: order.patientAmount,
      description: \`Cobro - \${patName} - \${order.items.map(i=>i.procedureName).join(', ')}\`,
      method: S.paymentMethod,
      createdAt: order.createdAt,
      fromOrderTempId: order.tempId
    })
  }

  save()

  if (printLabel) printOrderLabel(order)

  resetForm()
  alert(\`✓ Orden guardada\${order.patientAmount > 0 && S.paymentMethod !== 'OS (sin cobro)' ? ' y cobro registrado en caja' : ''}\`)
}

function printOrderLabel(order) {
  const itemsHtml = order.items.map(it =>
    \`<div style="font-weight:900;font-size:12px;text-transform:uppercase;margin-bottom:2px;">• \${it.procedureName}</div>\`
  ).join('')

  const patName = \`\${(order.patientLastName||'').toUpperCase()}, \${order.patientFirstName||''}\`
  const dob = order.patientBirthDate ? formatDate(order.patientBirthDate) : 'S/D'
  const today = new Date().toLocaleDateString('es-AR')
  const code = 'OFFLINE-' + new Date().toLocaleDateString('es-AR').replace(/\\//g,'-')

  const htmlContent = \`<html><head><style>
    @page { size: 90mm 50mm; margin: 0; }
    body { margin: 0; padding: 2mm; width: 90mm; height: 50mm; box-sizing: border-box; font-family: sans-serif; display: flex; flex-direction: column; }
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid black;padding-bottom:2px;margin-bottom:3px;">
      <span style="font-weight:900;font-size:13px;">Nº \${code}</span>
      <span style="font-weight:700;font-size:11px;">\${today}</span>
    </div>
    <div style="margin-bottom:3px;">
      <div style="font-weight:900;font-size:17px;text-transform:uppercase;">\${patName}</div>
      <div style="font-weight:700;font-size:11px;margin-top:2px;">F. Nac: \${dob}</div>
    </div>
    <div style="flex:1;border-top:2px solid black;padding-top:4px;">\${itemsHtml}</div>
    <div style="border-top:2px solid black;padding-top:2px;margin-top:auto;">
      <div style="font-weight:900;font-size:9px;">Prof. Solicitante</div>
      <div style="font-weight:900;font-size:14px;text-transform:uppercase;">\${order.dentistName}</div>
    </div>
  </body></html>\`

  const iframe = document.createElement('iframe')
  iframe.style.position = 'absolute'; iframe.style.top = '-9999px'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open(); doc.write(htmlContent); doc.close()
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 200)
    }
  }
}

function reprintLabel(i) {
  if (S.orders[i]) printOrderLabel(S.orders[i])
}

// ─── Caja ────────────────────────────────────────────────────────
function saveCajaMovimiento() {
  const amount = parseFloat(S.cajaAmount)
  if (!amount || amount <= 0) { alert('Ingresá un monto válido'); return }
  if (!S.cajaDesc.trim()) { alert('Ingresá una descripción'); return }

  S.cajaMovimientos.push({
    tempId: genTempId(),
    type: S.cajaType,
    amount,
    description: S.cajaDesc.trim(),
    method: S.cajaMethod,
    createdAt: new Date().toISOString()
  })
  S.cajaAmount = ''
  S.cajaDesc = ''
  save()
  render()
}

// ─── Exportar ────────────────────────────────────────────────────
function exportData() {
  const exportObj = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    branchId: S.branchId,
    branchName: S.branchName,
    dataGeneratedAt: APP_DATA.generatedAt,
    orders: S.orders,
    cajaMovimientos: S.cajaMovimientos
  }
  const json = JSON.stringify(exportObj, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'offline-export-' + new Date().toISOString().slice(0,16).replace(/[T:]/g,'-') + '.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function clearSession() {
  if (!confirm('¿Limpiar toda la sesión offline? Hacé esto solo DESPUÉS de haber importado el archivo en el sistema.')) return
  S.orders = []; S.cajaMovimientos = []
  save()
  render()
}

// ─── Eventos ─────────────────────────────────────────────────────
function attachEvents() {
  document.getElementById('branchSelect')?.addEventListener('change', function() {
    S.branchId = this.value
    S.branchName = APP_DATA.branches.find(b=>b.id===this.value)?.name || ''
    save()
    render()
  })

  // Cerrar resultados de búsqueda al hacer click afuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
      S.patientResults = []
      const sr = document.querySelector('.search-results')
      if (sr) sr.remove()
    }
  }, { once: true })
}

// ─── Init ────────────────────────────────────────────────────────
render()
</script>

</body>
</html>`
}
