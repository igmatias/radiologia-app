"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { toNum } from "@/lib/utils"
import { getCurrentSession } from "@/actions/auth"
import { startOfTodayAR, endOfTodayAR, startOfYesterdayAR } from "@/lib/dates"

// Roles autorizados para operar la caja
const CAJA_ROLES = ['RECEPTIONIST', 'ADMIN', 'SUPERADMIN'] as const
function isCajaRole(role: string) {
  return (CAJA_ROLES as readonly string[]).includes(role)
}

// 1. OBTENER EL ESTADO ACTUAL DE LA CAJA DEL DÍA
export async function getEstadoCaja(branchId: string) {
  // Fix #1 — verificar sesión y rol antes de leer datos financieros
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!isCajaRole(session.role)) return { success: false, error: "Sin permisos para acceder a la caja." };

  const inicioHoy = startOfTodayAR();
  const finHoy = endOfTodayAR();

  try {
    let cajaDiaria = await prisma.dailyRegister.findFirst({
      where: { branchId, date: { gte: inicioHoy, lte: finHoy } }
    });

    // AUTO-APERTURA: si no hay caja hoy, la creamos automáticamente
    if (!cajaDiaria) {
      const ultimaCaja = await prisma.dailyRegister.findFirst({
        where: { branchId },
        orderBy: { date: 'desc' }
      });

      if (!ultimaCaja) {
        return { success: true, cajaAbierta: false, primeraVez: true };
      }

      // Fix #5 — upsert evita race condition si dos requests llegan al mismo tiempo
      cajaDiaria = await prisma.dailyRegister.upsert({
        where: { branchId_date: { branchId, date: inicioHoy } },
        update: {},
        create: {
          branchId,
          openedBy: session.name || 'Sistema',
          startBalance: ultimaCaja.endBalance || 0,
          date: inicioHoy,
        }
      });
    }

    // Perf fix: 2 queries en paralelo (el aggregate de EFECTIVO es redundante —
    // se puede derivar de pagosDetalleHoy filtrando en JS)
    const [pagosDetalleHoy, movimientos] = await Promise.all([
      prisma.payment.findMany({
        where: {
          method: { not: 'SALDO' },
          createdAt: { gte: inicioHoy, lte: finHoy },
          order: { branchId }
        },
        include: { order: { include: { patient: true } } },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.cashMovement.findMany({
        where: {
          branchId,
          createdAt: { gte: inicioHoy, lte: finHoy },
          method: 'EFECTIVO'
        },
        orderBy: { createdAt: 'desc' }
      }),
    ]);

    // ingresosEfectivo derivado de pagosDetalleHoy (elimina un round-trip extra a la DB)
    const ingresosEfectivo = pagosDetalleHoy
      .filter((p: any) => p.method === 'EFECTIVO')
      .reduce((acc: number, p: any) => acc + toNum(p.amount), 0);

    const pagosPorMetodo: Record<string, { patient: string; amount: number; time: Date }[]> = {};
    const totalesPorMetodo: Record<string, number> = {};
    pagosDetalleHoy.forEach((p: any) => {
      const method = p.method as string;
      if (!pagosPorMetodo[method]) pagosPorMetodo[method] = [];
      pagosPorMetodo[method].push({
        patient: `${p.order.patient.lastName}, ${p.order.patient.firstName}`,
        amount: toNum(p.amount),
        time: p.createdAt
      });
      totalesPorMetodo[method] = (totalesPorMetodo[method] || 0) + toNum(p.amount);
    });

    let salidasEfectivo = 0;
    movimientos.forEach(m => {
      if (m.type === 'GASTO' || m.type === 'A_CAJA_FUERTE' || m.type === 'RETIRO_DUENO') {
        salidasEfectivo += toNum(m.amount);
      }
    });

    const saldoInicial = toNum(cajaDiaria.startBalance);
    const totalEnCajon = saldoInicial + ingresosEfectivo - salidasEfectivo;

    return {
      success: true,
      cajaAbierta: true,
      caja: cajaDiaria,
      ingresosEfectivo,
      salidasEfectivo,
      totalEnCajon,
      movimientos,
      pagosPorMetodo,
      totalesPorMetodo
    };
  } catch (error) {
    console.error("Error obteniendo caja:", error);
    return { success: false, error: "No se pudo obtener el estado de la caja." };
  }
}

// 2. ABRIR LA CAJA A LA MAÑANA
export async function abrirCajaDiaria(branchId: string, userName: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!isCajaRole(session.role)) return { success: false, error: "Sin permisos para operar la caja." };
  try {
    const ultimaCaja = await prisma.dailyRegister.findFirst({
      where: { branchId },
      orderBy: { date: 'desc' }
    });

    const startBalance = ultimaCaja?.endBalance || 0;
    const inicioHoy = startOfTodayAR();

    await prisma.dailyRegister.create({
      data: { branchId, openedBy: userName, startBalance, date: inicioHoy }
    });

    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error al abrir caja:", error);
    return { success: false, error: "No se pudo abrir la caja." };
  }
}

// 3. REGISTRAR UN GASTO O MANDAR PLATA A CAJA FUERTE
export async function registrarMovimientoRecepcion(branchId: string, type: any, amount: number, description: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!isCajaRole(session.role)) return { success: false, error: "Sin permisos para registrar movimientos." };
  try {
    await prisma.cashMovement.create({
      data: { branchId, type, amount, description, method: 'EFECTIVO' }
    });

    if (type === 'A_CAJA_FUERTE') {
      await prisma.safeVault.upsert({
        where: { branchId },
        update: { balance: { increment: amount } },
        create: { branchId, balance: amount }
      });
    }

    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return { success: false, error: "No se pudo registrar el movimiento." };
  }
}

// 4. ELIMINAR UN MOVIMIENTO (Por error de carga)
export async function eliminarMovimientoRecepcion(movimientoId: string, branchId: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!isCajaRole(session.role)) return { success: false, error: "Sin permisos para eliminar movimientos." };
  try {
    const mov = await prisma.cashMovement.findUnique({ where: { id: movimientoId } });
    if (!mov) return { success: false, error: "Movimiento no encontrado" };

    if (mov.type === 'A_CAJA_FUERTE') {
      await prisma.safeVault.update({
        where: { branchId },
        data: { balance: { decrement: mov.amount } }
      });
    }

    await prisma.cashMovement.delete({ where: { id: movimientoId } });
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar movimiento:", error);
    return { success: false, error: "No se pudo eliminar el movimiento." };
  }
}

// 5. ARQUEO PARCIAL (MID-TURNO)
export async function registrarArqueoParcial(branchId: string, montoContado: number, notas: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!isCajaRole(session.role)) return { success: false, error: "Sin permisos para registrar arqueos." };
  try {
    const cajaAbierta = await prisma.dailyRegister.findFirst({
      where: { branchId, date: { gte: startOfTodayAR(), lte: endOfTodayAR() }, status: 'ABIERTA' }
    });

    if (!cajaAbierta) return { success: false, error: "No se encontró una caja abierta." };

    const timestamp = new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' });
    const lineaNueva = `[Arqueo ${timestamp}] Contado: $${montoContado.toLocaleString('es-AR')}${notas ? ` - ${notas}` : ''}`;
    const notasActualizadas = cajaAbierta.notes
      ? `${cajaAbierta.notes}\n${lineaNueva}`
      : lineaNueva;

    await prisma.dailyRegister.update({
      where: { id: cajaAbierta.id },
      data: { notes: notasActualizadas }
    });

    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar arqueo parcial:", error);
    return { success: false, error: "No se pudo guardar el arqueo parcial." };
  }
}

// 6. CERRAR LA CAJA (FINAL DEL DÍA)
export async function cerrarCajaDiaria(branchId: string, userName: string, endBalance: number, notes: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!isCajaRole(session.role)) return { success: false, error: "Sin permisos para cerrar la caja." };
  try {
    const cajaAbierta = await prisma.dailyRegister.findFirst({
      where: { branchId, date: { gte: startOfTodayAR(), lte: endOfTodayAR() }, status: 'ABIERTA' }
    });

    if (!cajaAbierta) return { success: false, error: "No se encontró una caja abierta para cerrar." };

    await prisma.dailyRegister.update({
      where: { id: cajaAbierta.id },
      data: { status: 'CERRADA', endBalance, closedBy: userName, notes }
    });

    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error al cerrar caja:", error);
    return { success: false, error: "No se pudo cerrar la caja." };
  }
}

// 7. CONFIGURAR SALDO INICIAL (primera puesta en marcha del sistema)
export async function configurarSaldoInicial(branchId: string, monto: number) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!isCajaRole(session.role)) return { success: false, error: "Sin permisos para configurar el saldo inicial." };
  try {
    const ayer = startOfYesterdayAR();

    await prisma.dailyRegister.create({
      data: {
        branchId,
        openedBy: session.name || 'Admin',
        startBalance: monto,
        endBalance: monto,
        status: 'CERRADA',
        closedBy: session.name || 'Admin',
        date: ayer,
        notes: 'Saldo inicial configurado al activar el sistema',
      }
    });

    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("Error al configurar saldo inicial:", error);
    return { success: false, error: "No se pudo configurar el saldo inicial." };
  }
}
