import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ChatClient from "./chat-client"

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [messages, user, branches] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { toChannel: 'general' },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.user.findUnique({
      where: { id: session.id },
      include: { branch: true },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const senderName = user ? `${user.firstName} ${user.lastName}` : session.username
  const branchName = user?.branch?.name ?? 'Administración'

  return (
    <ChatClient
      initialMessages={messages.reverse()}
      senderName={senderName}
      branchName={branchName}
      sessionRole={session.role}
      branches={branches}
    />
  )
}
