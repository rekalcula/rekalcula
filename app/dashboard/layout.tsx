import DashboardNav from '@/components/DashboardNav'
import SubscriptionGuard from '@/components/SubscriptionGuard'
import TrialBanner from '@/components/TrialBanner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardNav />
        <main className="flex-1 pt-14 md:pt-0 overflow-x-hidden">
          <div className="px-2 pt-2 sm:pt-4">
            <TrialBanner />
          </div>
          {children}
        </main>
      </div>
    </SubscriptionGuard>
  )
}