import { getOrders } from "@/actions/orders"
import OrderList from "@/components/orders/order-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Hoy</h1>
          <p className="text-muted-foreground">Pacientes en lista de espera y estudios realizados.</p>
        </div>
        <Link href="/recepcion">
          <Button>+ Nueva Orden</Button>
        </Link>
      </div>

      <OrderList orders={orders} />
    </div>
  )
}