"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"
import { revalidatePath } from "next/cache"
import { toNum } from "@/lib/utils"
import { getCurrentSession } from "@/actions/auth"

// 1. OBTENER EL ESTADO ACTUAL DE LA CAJA DEL DÍA
export async function getEstadoCaja(branchId: string) {
  const hoy = new Date();
  const inicioHoy = startOfDay(hoy);
  const finHoy = endOfDay(hoy);

  try {
    // Buscamos si ya existe la caja de hoy
    let cajaDiaria = await prisma.dailyRegister.findFirst({
      where: { branchId, date: { gte: inicioHoy, lte: finHoy } }
    });

    // AUTO-APERTURA: si no hay caja hoy, la creamos automáticamente
    if (!cajaDiaria) {
      const session = await getCurrentSession();
      const ultimaCaja = await prisma.dailyRegister.findFirst({
        where: { branchId },
        orderBy: { date: 'desc' }
      });

      // Primera vez: nunca hubo historial → pedimos saldo inicial al usuario
      if (!ultimaCaja) {
        return { success: true, cajaAbierta: false, primeraVez: true };
      }

      cajaDiaria = await prisma.dailyRegister.create({
        data: {
          branchId,
          openedBy: session?.name || 'Sistema',
          startBalance: ultimaCaja.endBalance || 0,
          date: inicioHoy,
        }
      });
    }

    // Sumamos todo el efectivo que cobraron HOY en esta sede
    const pagosHoy = await prisma.payment.aggregate({
      where: {
        method: 'EFECTIVO',
        createdAt: { gte: inicioHoy, lte: finHoy },
        order: { branchId } // Solo los cobros de esta sede
      },
      _sum: { amount: true }
    });
    const ingresosEfectivo = toNum(pagosHoy._sum.amount);

    // Traemos todos los pagos del día (excepto SALDO) con datos del paciente
    const pagosDetalleHoy = await prisma.payment.findMany({
      where: {
        method: { not: 'SALDO' },
        createdAt: { gte: inicioHoy, lte: finHoy },
        order: { branchId }
      },
      include: {
        order: { include: { patient: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Agrupar por método y calcular totales
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

    // Buscamos los movimientos manuales (Gastos de farmacia, envíos a caja fuerte, etc)
    const movimientos = await prisma.cashMovement.findMany({
      where: {
        branchId,
        createdAt: { gte: inicioHoy, lte: finHoy },
        method: 'EFECTIVO'
      },
      orderBy: { createdAt: 'desc' }
    });

    let salidasEfectivo = 0;
    movimientos.forEach(m => {
      if (m.type === 'GASTO' || m.type === 'A_CAJA_FUERTE' || m.type === 'RETIRO_DUENO') {
        salidasEfectivo += toNum(m.amount);
      }
    });

    // FÓRMULA DEL MOSTRADOR: Saldo Inicial + Cobros - Gastos/Envíos
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
  try {
    // Buscamos la caja de ayer (la última registrada) para traer la plata que quedó
    const ultimaCaja = await prisma.dailyRegister.findFirst({
      where: { branchId },
      orderBy: { date: 'desc' }
    });

    const startBalance = ultimaCaja?.endBalance || 0;
    const inicioHoy = startOfDay(new Date()); // Forzamos la hora a las 00:00:00

    await prisma.dailyRegister.create({
      data: {
        branchId,
        openedBy: userName,
        startBalance,
        date: inicioHoy
        // No enviamos "status", Prisma lo pone en "ABIERTA" por defecto solito
      }
    });

    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("⛔ ERROR AL ABRIR CAJA:", error);
    return { success: false, error: "No se pudo abrir la caja." };
  }
}

// 3. REGISTRAR UN GASTO O MANDAR PLATA A CAJA FUERTE
export async function registrarMovimientoRecepcion(branchId: string, type: any, amount: number, description: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    // 1. Anotamos la salida de plata del mostrador
    await prisma.cashMovement.create({
      data: {
        branchId,
        type,
        amount,
        description,
        method: 'EFECTIVO'
      }
    });

    // 2. Si el destino es la Caja Fuerte, le sumamos el saldo allá
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
    console.error("⛔ ERROR AL REGISTRAR MOVIMIENTO:", error);
    return { success: false, error: "No se pudo registrar el movimiento." };
  }
}

// 4. ELIMINAR UN MOVIMIENTO (Por error de carga)
export async function eliminarMovimientoRecepcion(movimientoId: string, branchId: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    const mov = await prisma.cashMovement.findUnique({ where: { id: movimientoId } });
    if (!mov) return { success: false, error: "Movimiento no encontrado" };

    // Si era plata enviada a la caja fuerte, la restamos de la bóveda para devolverla al cajón
    if (mov.type === 'A_CAJA_FUERTE') {
      await prisma.safeVault.update({
        where: { branchId },
        data: { balance: { decrement: mov.amount } }
      });
    }

    // Borramos el registro
    await prisma.cashMovement.delete({ where: { id: movimientoId } });
    
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error: any) {
    console.error("⛔ ERROR AL ELIMINAR MOVIMIENTO:", error);
    return { success: false, error: "No se pudo eliminar el movimiento." };
  }
}

// 5b. GUARDADO PARCIAL (ARQUEO MID-TURNO)
export async function registrarArqueoParcial(branchId: string, montoContado: number, notas: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);

    const cajaAbierta = await prisma.dailyRegister.findFirst({
      where: { branchId, date: { gte: inicioHoy, lte: finHoy }, status: 'ABIERTA' }
    });

    if (!cajaAbierta) return { success: false, error: "No se encontró una caja abierta." };

    const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const lineaNueva = `[Arqueo ${timestamp}] Contado: $${montoContado.toLocaleString('es-AR')}${notas ? ` — ${notas}` : ''}`;
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
    console.error("⛔ ERROR AL GUARDAR ARQUEO PARCIAL:", error);
    return { success: false, error: "No se pudo guardar el arqueo parcial." };
  }
}

// 5. CERRAR LA CAJA (FINAL DEL DÍA)
export async function cerrarCajaDiaria(branchId: string, userName: string, endBalance: number, notes: string) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);

    const cajaAbierta = await prisma.dailyRegister.findFirst({
      where: { branchId, date: { gte: inicioHoy, lte: finHoy }, status: 'ABIERTA' }
    });

    if (!cajaAbierta) return { success: false, error: "No se encontró una caja abierta para cerrar." };

    await prisma.dailyRegister.update({
      where: { id: cajaAbierta.id },
      data: {
        status: 'CERRADA',
        endBalance,
        closedBy: userName,
        notes
      }
    });
    
    revalidatePath("/recepcion");
    return { success: true };
  } catch (error) {
    console.error("⛔ ERROR AL CERRAR CAJA:", error);
    return { success: false, error: "No se pudo cerrar la caja." };
  }
}

// 6. CONFIGURAR SALDO INICIAL (primera puesta en marcha del sistema)
// Crea un registro "cerrado" de ayer con el saldo que el admin ingresa.
// A partir de ahí, el auto-open de hoy toma ese monto como startBalance.
export async function configurarSaldoInicial(branchId: string, monto: number) {
  const session = await getCurrentSession();
  if (!session) return { success: false, error: "No autenticado" };
  try {
    const ayer = startOfDay(new Date());
    ayer.setDate(ayer.getDate() - 1);

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
    console.error("⛔ ERROR AL CONFIGURAR SALDO INICIAL:", error);
    return { success: false, error: "No se pudo configurar el saldo inicial." };
  }
}