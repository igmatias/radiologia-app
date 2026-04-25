// ============================================================
// Radiologia - DICOM Modality Worklist Agent
// Usa Prisma + polling cada 30s para no depender de PostgREST.
// Corre en la miniPC de cada sucursal junto a Orthanc.
// ============================================================

require('dotenv').config()
const { PrismaClient } = require('../node_modules/@prisma/client')
const dcmjs = require('dcmjs')
const fs   = require('fs')
const path = require('path')

// ── Configuración ─────────────────────────────────────────────
const BRANCH_ID       = process.env.BRANCH_ID
const WORKLIST_FOLDER = process.env.WORKLIST_FOLDER || 'C:\\Orthanc\\Worklists'
const POLL_INTERVAL   = parseInt(process.env.POLL_INTERVAL || '30000') // ms

if (!BRANCH_ID) {
  console.error('[ERROR] Falta BRANCH_ID en el .env')
  process.exit(1)
}

const prisma = new PrismaClient()

// ── Mapeo código de procedimiento → modalidad DICOM ──────────
const PROCEDURE_MODALITY = {
  '09.02.04': 'DX',   // Panorámica OPG
  '09.02.05': 'DX',   // Telerradiografía
  '09.03.01': 'CT',   // Tomografías CBCT
  '09.03.02': 'CT',
  '09.03.03': 'CT',
  '09.03.04': 'CT',
  '09.03.05': 'CT',
  '09.03.06': 'CT',
  '09.03.07': 'CT',
}
const WORKLIST_CODES = new Set(Object.keys(PROCEDURE_MODALITY))

// ── Utilidades ────────────────────────────────────────────────
function toDate(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
}
function toTime(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(11, 19).replace(/:/g, '') // HHMMSS
}
function generateUID() {
  const t = BigInt(Date.now()) * 1000000n + BigInt(Math.floor(Math.random() * 1000000))
  return `2.25.${t}`
}

// ── Crear archivo .wl usando dcmjs ────────────────────────────
function createWorklistFile(orderId, patient, procedureCode, procedureName, modality, scheduledAt) {
  const { DicomMessage, DicomDict, DicomMetaDictionary } = dcmjs.data

  const sopInstanceUID = generateUID()
  const studyUID       = generateUID()
  const date           = toDate(scheduledAt)
  const time           = toTime(scheduledAt)
  const birthDate      = toDate(patient.birthDate)
  const lastName       = (patient.lastName  || '').toUpperCase()
  const firstName      = (patient.firstName || '').toUpperCase()
  const patientName    = `${lastName}^${firstName}`
  const accession      = orderId.slice(0, 16)

  const naturalDataset = {
    SOPClassUID:                    '1.2.840.10008.5.1.4.31',
    SOPInstanceUID:                 sopInstanceUID,
    AccessionNumber:                accession,
    PatientName:                    patientName,
    PatientID:                      patient.dni || '',
    PatientBirthDate:               birthDate,
    PatientSex:                     '',
    StudyInstanceUID:               studyUID,
    RequestedProcedureDescription:  procedureName,
    RequestedProcedureID:           procedureCode.slice(0, 16),
    ScheduledProcedureStepSequence: [{
      Modality:                           modality,
      ScheduledStationAETitle:            'SIDEXIS',
      ScheduledProcedureStepStartDate:    date,
      ScheduledProcedureStepStartTime:    time,
      ScheduledProcedureStepDescription:  procedureName,
      ScheduledProcedureStepID:           procedureCode.slice(0, 16),
    }],
  }

  const denaturalized = DicomMetaDictionary.denaturalizeDataset(naturalDataset)

  const meta = {
    '00020001': { vr: 'OB', Value: [new Uint8Array([0, 1])] },
    '00020002': { vr: 'UI', Value: ['1.2.840.10008.5.1.4.31'] },
    '00020003': { vr: 'UI', Value: [sopInstanceUID] },
    '00020010': { vr: 'UI', Value: ['1.2.840.10008.1.2.1'] },
  }

  const dicomDict  = new DicomDict(meta)
  dicomDict.dict   = denaturalized
  const buffer     = Buffer.from(DicomMessage.write(dicomDict))
  const filename   = path.join(WORKLIST_FOLDER, `${orderId}.wl`)
  fs.writeFileSync(filename, buffer)
  console.log(`[✓] Creado: ${path.basename(filename)} | ${patientName} | ${modality} - ${procedureName}`)
  return filename
}

function removeWorklistFile(orderId) {
  const filename = path.join(WORKLIST_FOLDER, `${orderId}.wl`)
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename)
    console.log(`[✓] Eliminado: ${path.basename(filename)}`)
  }
}

// ── Procesar una orden pendiente ──────────────────────────────
async function processOrder(order) {
  try {
    const patient = order.patient
    const items   = order.items || []

    const worklistItems = items.filter(i =>
      i.procedure && WORKLIST_CODES.has(i.procedure.code)
    )

    if (worklistItems.length === 0) {
      await prisma.order.update({ where: { id: order.id }, data: { worklistStatus: 'N/A' } })
      return
    }

    const proc     = worklistItems[0].procedure
    const modality = PROCEDURE_MODALITY[proc.code]

    createWorklistFile(order.id, patient, proc.code, proc.name, modality, order.createdAt)

    await prisma.order.update({
      where: { id: order.id },
      data: { worklistStatus: 'SENT', worklistSentAt: new Date() },
    })
    console.log(`[→] Orden ${order.code || order.id} enviada a worklist`)
  } catch (err) {
    console.error(`[✗] Error procesando orden ${order.id}:`, err.message)
    await prisma.order.update({ where: { id: order.id }, data: { worklistStatus: 'ERROR' } })
  }
}

// ── Cycle principal: buscar órdenes PENDING ───────────────────
async function tick() {
  try {
    const orders = await prisma.order.findMany({
      where:   { branchId: BRANCH_ID, worklistStatus: 'PENDING' },
      include: {
        patient: { select: { dni: true, firstName: true, lastName: true, birthDate: true } },
        items:   { include: { procedure: { select: { code: true, name: true } } } },
      },
    })

    if (orders.length > 0) {
      console.log(`[↻] ${new Date().toLocaleTimeString()} - ${orders.length} orden(es) PENDING`)
      for (const order of orders) {
        await processOrder(order)
      }
    }

    // También chequear si hay órdenes SENT que ya terminaron (para limpiar el .wl)
    const done = await prisma.order.findMany({
      where: {
        branchId:       BRANCH_ID,
        worklistStatus: 'SENT',
        status:         { in: ['PROCESANDO', 'LISTO_PARA_ENTREGA', 'ENTREGADA'] },
      },
      select: { id: true },
    })
    for (const o of done) {
      removeWorklistFile(o.id)
      await prisma.order.update({ where: { id: o.id }, data: { worklistStatus: 'COMPLETED' } })
    }

  } catch (err) {
    console.error('[✗] Error en tick:', err.message)
  }
}

// ── Inicio ────────────────────────────────────────────────────
async function startup() {
  console.log('═══════════════════════════════════════════')
  console.log('  Radiologia - Worklist Agent')
  console.log(`  Sucursal ID : ${BRANCH_ID}`)
  console.log(`  Carpeta     : ${WORKLIST_FOLDER}`)
  console.log(`  Polling     : cada ${POLL_INTERVAL / 1000}s`)
  console.log('═══════════════════════════════════════════')

  if (!fs.existsSync(WORKLIST_FOLDER)) {
    fs.mkdirSync(WORKLIST_FOLDER, { recursive: true })
    console.log(`[✓] Carpeta creada: ${WORKLIST_FOLDER}`)
  }

  // Primer tick inmediato
  await tick()

  // Polling periódico
  setInterval(tick, POLL_INTERVAL)
  console.log(`[✓] Agente corriendo. Revisando cada ${POLL_INTERVAL / 1000}s...\n`)
}

startup().catch(err => {
  console.error('[FATAL]', err)
  prisma.$disconnect()
  process.exit(1)
})

process.on('SIGINT',  () => { prisma.$disconnect(); process.exit(0) })
process.on('SIGTERM', () => { prisma.$disconnect(); process.exit(0) })
