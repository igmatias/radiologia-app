"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatusAction } from "@/actions/orders"
import { toast } from "sonner"
import { Play, CheckCircle, Clock, Check, Monitor } from "lucide-react"

export default function OrderList({ orders }: { orders: any[] }) {
  const [filter, setFilter] = useState<"PENDIENTES" | "FINALIZADAS">("PENDIENTES")
  
  // Estado local para guardar qué equipo seleccionó el técnico antes de dar "Iniciar"
  const [selectedEquipments, setSelectedEquipments] = useState<Record<string, string>>({})

  const filteredOrders = orders.filter(order => {
    if (filter === "PENDIENTES") {
      return order.status === "CREADA" || order.status === "EN_ATENCION"
    } else {
      return order.status === "LISTO_PARA_ENTREGA" || order.status === "ENTREGADA"
    }
  })

  const handleStart = async (orderId: string) => {
    const equip = selectedEquipments[orderId]
    if (!equip) {
      toast.error("Selecciona un equipo primero")
      return
    }
    // Enviamos el estado EN_ATENCION y el nombre del equipo
    const result = await updateOrderStatusAction(orderId, "EN_ATENCION", equip)
    if (result.success) {
      toast.success(`Estudio iniciado en ${equip}`)
    } else {
      toast.error("Error al iniciar")
    }
  }

  const handleFinish = async (orderId: string) => {
    const result = await updateOrderStatusAction(orderId, "LISTO_PARA_ENTREGA")
    if (result.success) {
      toast.success("Estudio finalizado")
    }
  }

  // Formateador de hora (HH:mm)
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <Button 
          variant={filter === "PENDIENTES" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("PENDIENTES")}
        >
          <Clock className="h-4 w-4 mr-2" />
          Pendientes ({orders.filter(o => o.status === "CREADA" || o.status === "EN_ATENCION").length})
        </Button>
        <Button 
          variant={filter === "FINALIZADAS" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("FINALIZADAS")}
        >
          <Check className="h-4 w-4 mr-2" />
          Finalizadas ({orders.filter(o => o.status === "LISTO_PARA_ENTREGA" || o.status === "ENTREGADA").length})
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[100px]">Llegada</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Estudio / Equipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="text-slate-500 font-medium">
                  {formatTime(order.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="font-bold">{order.patient.lastName}, {order.patient.firstName}</div>
                  <div className="text-[10px] text-muted-foreground">DNI: {order.patient.dni}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.items.map((i: any) => i.procedure.name).join(", ")}
                  </div>
                  {order.equipmentName && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-fit">
                      <Monitor className="h-3 w-3" />
                      {order.equipmentName}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      order.status === "EN_ATENCION" ? "bg-amber-500 hover:bg-amber-600" : 
                      order.status === "LISTO_PARA_ENTREGA" ? "bg-green-600 hover:bg-green-700" : 
                      ""
                    }
                    variant={order.status === "CREADA" ? "outline" : "default"}
                  >
                    {order.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {order.status === "CREADA" && (
                      <>
                        <Select onValueChange={(val) => setSelectedEquipments({...selectedEquipments, [order.id]: val})}>
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="Elegir Equipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Equipo 1">Equipo 1</SelectItem>
                            <SelectItem value="Equipo 2">Equipo 2</SelectItem>
                            <SelectItem value="Panorámico">Panorámico</SelectItem>
                            <SelectItem value="Tomógrafo">Tomógrafo</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => handleStart(order.id)}>
                          <Play className="h-4 w-4 mr-1" /> Iniciar
                        </Button>
                      </>
                    )}
                    {order.status === "EN_ATENCION" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleFinish(order.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Finalizar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}