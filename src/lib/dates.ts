/**
 * Utilidades de fecha con zona horaria Argentina (UTC-3, sin DST).
 * Todas las funciones devuelven objetos Date en UTC, pero calculados
 * a partir de la hora local argentina para que los rangos de BD sean correctos.
 */
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

export const TZ = "America/Argentina/Buenos_Aires"

/** Fecha/hora actual representada en zona Argentina */
export const nowAR = () => toZonedTime(new Date(), TZ)

/** Inicio del día de hoy en Argentina → UTC para consultas Prisma */
export const startOfTodayAR = () => fromZonedTime(startOfDay(toZonedTime(new Date(), TZ)), TZ)

/** Fin del día de hoy en Argentina → UTC para consultas Prisma */
export const endOfTodayAR = () => fromZonedTime(endOfDay(toZonedTime(new Date(), TZ)), TZ)

/** Inicio de ayer en Argentina → UTC */
export const startOfYesterdayAR = () => fromZonedTime(startOfDay(subDays(toZonedTime(new Date(), TZ), 1)), TZ)

/** Inicio de un día dado como string "YYYY-MM-DD" */
export const startOfDateAR = (dateStr: string) =>
  fromZonedTime(startOfDay(toZonedTime(new Date(dateStr + "T12:00:00"), TZ)), TZ)

/** Fin de un día dado como string "YYYY-MM-DD" */
export const endOfDateAR = (dateStr: string) =>
  fromZonedTime(endOfDay(toZonedTime(new Date(dateStr + "T12:00:00"), TZ)), TZ)

/** Inicio de la semana actual en Argentina */
export const startOfThisWeekAR = () => fromZonedTime(startOfWeek(toZonedTime(new Date(), TZ), { weekStartsOn: 1 }), TZ)

/** Inicio del mes actual en Argentina */
export const startOfThisMonthAR = () => fromZonedTime(startOfMonth(toZonedTime(new Date(), TZ)), TZ)

/** Año actual en Argentina */
export const currentYearAR = () => toZonedTime(new Date(), TZ).getFullYear()
