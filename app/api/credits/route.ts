import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCreditsSummary } from '@/lib/credits'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const summary = await getCreditsSummary(userId)
    return NextResponse.json({ success: true, credits: summary })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}