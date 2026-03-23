import { z } from "zod"

// Esquema para el Paciente (lo mínimo para buscarlo o crearlo)
export const patientSchema = z.object({
  dni: z.string().min(6, "El DNI debe tener al menos 6 números"),
  firstName: z.string().min(1, "Nombre es obligatorio"),
  lastName: z.string().min(1, "Apellido es obligatorio"),
  email: z.string().email().optional().or(z.literal("")), // Email opcional pero válido si se pone
  phone: z.string().optional(),
  obrasocialId: z.string().optional(), // ID de la Obra Social
  afiliado: z.string().optional(), // Nro de credencial
})

// Esquema para los Items (Estudios)
export const orderItemSchema = z.object({
  procedureId: z.string().min(1, "Debes elegir un estudio"),
  equipmentId: z.string().optional(), // Puede ser null si el estudio no requiere equipo específico
  price: z.number().min(0),
  details: z.any().optional(), // JSON para dientes/zonas
})

// Esquema para los Pagos
export const paymentSchema = z.object({
  method: z.enum(["EFECTIVO", "TARJETA_DEBITO", "TARJETA_CREDITO", "TRANSFERENCIA", "MERCADOPAGO", "CUENTA_CORRIENTE", "OTRO"]),
  amount: z.number().min(0),
  notes: z.string().optional(),
})

// Esquema Principal: Crear Orden
export const createOrderSchema = z.object({
  branchId: z.string().min(1),
  
  // Datos del Paciente (puede ser uno nuevo o uno existente)
  patient: patientSchema,
  
  dentistId: z.string().min(1, "Debes seleccionar un odontólogo"),
  
  items: z.array(orderItemSchema).min(1, "La orden debe tener al menos un estudio"),
  payments: z.array(paymentSchema).optional(),
  
  total: z.number().min(0),
  notes: z.string().optional(),
})

// Tipo inferido para usar en TypeScript en el Frontend
export type CreateOrderInput = z.infer<typeof createOrderSchema>