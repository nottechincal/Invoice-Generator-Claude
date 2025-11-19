import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Enterprise Invoice Generator',
    version: '1.0.0',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
  })
}
