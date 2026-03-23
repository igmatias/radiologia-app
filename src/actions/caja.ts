"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"
import { revalidatePath } from "next/cache"

// 1. OBTENER EL ESTADO ACTUAL DE LA CAJA DEL DÍA
export async function getEstadoCaja(branchId: string) {
  const hoy = new Date();
  const inicioHoy = startOfDay(hoy);
  const finHoy = endOfDay(hoy);

  try {
    // Buscamos si ya abrieron la caja hoy
    const cajaDiaria = await prisma.dailyRegister.findFirst({
      where: { 
        branchId, 
        date: { gte: inicioHoy, lte: finHoy } 
      }
    });

    // Si la caja no existe, cortamos acá para no gastar recursos
    if (!cajaDiaria) {
      return { success: true, cajaAbierta: false };
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
    const ingresosEfectivo = pagosHoy._sum.amount || 0;

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
        salidasEfectivo += m.amount;
      }
    });

    // FÓRMULA DEL MOSTRADOR: Saldo Inicial + Cobros - Gastos/Envíos
    const saldoInicial = cajaDiaria.startBalance || 0;
    const totalEnCajon = saldoInicial + ingresosEfectivo - salidasEfectivo;

    return { 
      success: true, 
      cajaAbierta: true, 
      caja: cajaDiaria,
      ingresosEfectivo,
      salidasEfectivo,
      totalEnCajon,
      movimientos
    };
  } catch (error: any) {
    console.error("Error obteniendo caja:", error);
    return { success: false, error: "Error de lectura: " + error.message };
  }
}

// 2. ABRIR LA CAJA A LA MAÑANA
export async function abrirCajaDiaria(branchId: string, userName: string) {
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
  } catch (error: any) {
    console.error("⛔ ERROR AL ABRIR CAJA:", error);
    // Ahora si falla te va a decir el por qué exacto en la pantalla
    return { success: false, error: `Error DB: ${error.message}` };
  }
}

// 3. REGISTRAR UN GASTO O MANDAR PLATA A CAJA FUERTE
export async function registrarMovimientoRecepcion(branchId: string, type: any, amount: number, description: string) {
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
  } catch (error: any) {
    console.error("⛔ ERROR AL REGISTRAR MOVIMIENTO:", error);
    return { success: false, error: `Error DB: ${error.message}` };
  }
}

// 4. ELIMINAR UN MOVIMIENTO (Por error de carga)
export async function eliminarMovimientoRecepcion(movimientoId: string, branchId: string) {
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

// 5. CERRAR LA CAJA (FINAL DEL DÍA)
export async function cerrarCajaDiaria(branchId: string, userName: string, endBalance: number, notes: string) {
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
  } catch (error: any) {
    console.error("⛔ ERROR AL CERRAR CAJA:", error);
    return { success: false, error: `Error DB: ${error.message}` };
  }
}