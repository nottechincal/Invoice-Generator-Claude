import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Get exchange rates for currencies
 * In production, you would call a real exchange rate API like:
 * - https://exchangeratesapi.io
 * - https://openexchangerates.org
 * - https://fixer.io
 *
 * For now, returning mock data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base") || "AUD";
    const target = searchParams.get("target");

    // Mock exchange rates (in production, fetch from real API)
    const exchangeRates: Record<string, Record<string, number>> = {
      AUD: {
        USD: 0.67,
        EUR: 0.62,
        GBP: 0.53,
        NZD: 1.08,
        JPY: 98.45,
        CNY: 4.76,
        INR: 55.23,
        SGD: 0.89,
        AUD: 1.0,
      },
      USD: {
        AUD: 1.49,
        EUR: 0.92,
        GBP: 0.79,
        NZD: 1.61,
        JPY: 147.12,
        CNY: 7.11,
        INR: 82.54,
        SGD: 1.33,
        USD: 1.0,
      },
      EUR: {
        AUD: 1.62,
        USD: 1.09,
        GBP: 0.86,
        NZD: 1.75,
        JPY: 160.24,
        CNY: 7.74,
        INR: 89.83,
        SGD: 1.45,
        EUR: 1.0,
      },
      GBP: {
        AUD: 1.88,
        USD: 1.27,
        EUR: 1.16,
        NZD: 2.04,
        JPY: 186.54,
        CNY: 9.01,
        INR: 104.52,
        SGD: 1.69,
        GBP: 1.0,
      },
    };

    const rates = exchangeRates[base] || exchangeRates.AUD;

    // If specific target requested
    if (target) {
      return NextResponse.json({
        base,
        target,
        rate: rates[target] || 1.0,
        timestamp: new Date().toISOString(),
      });
    }

    // Return all rates for base currency
    return NextResponse.json({
      base,
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Exchange rates fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch exchange rates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
