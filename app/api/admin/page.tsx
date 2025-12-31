import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const hasAccess = await isAdmin(userId)

  if (!hasAccess) {
    redirect('/dashboard')
  }

  return <AdminDashboard />
}