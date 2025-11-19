import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List of supported currencies
    const currencies = [
      {
        code: "AUD",
        name: "Australian Dollar",
        symbol: "$",
        flag: "🇦🇺",
      },
      {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        flag: "🇺🇸",
      },
      {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        flag: "🇪🇺",
      },
      {
        code: "GBP",
        name: "British Pound",
        symbol: "£",
        flag: "🇬🇧",
      },
      {
        code: "NZD",
        name: "New Zealand Dollar",
        symbol: "$",
        flag: "🇳🇿",
      },
      {
        code: "JPY",
        name: "Japanese Yen",
        symbol: "¥",
        flag: "🇯🇵",
      },
      {
        code: "CNY",
        name: "Chinese Yuan",
        symbol: "¥",
        flag: "🇨🇳",
      },
      {
        code: "INR",
        name: "Indian Rupee",
        symbol: "₹",
        flag: "🇮🇳",
      },
      {
        code: "SGD",
        name: "Singapore Dollar",
        symbol: "$",
        flag: "🇸🇬",
      },
      {
        code: "CAD",
        name: "Canadian Dollar",
        symbol: "$",
        flag: "🇨🇦",
      },
      {
        code: "CHF",
        name: "Swiss Franc",
        symbol: "CHF",
        flag: "🇨🇭",
      },
      {
        code: "HKD",
        name: "Hong Kong Dollar",
        symbol: "$",
        flag: "🇭🇰",
      },
      {
        code: "SEK",
        name: "Swedish Krona",
        symbol: "kr",
        flag: "🇸🇪",
      },
      {
        code: "NOK",
        name: "Norwegian Krone",
        symbol: "kr",
        flag: "🇳🇴",
      },
      {
        code: "DKK",
        name: "Danish Krone",
        symbol: "kr",
        flag: "🇩🇰",
      },
      {
        code: "ZAR",
        name: "South African Rand",
        symbol: "R",
        flag: "🇿🇦",
      },
      {
        code: "MXN",
        name: "Mexican Peso",
        symbol: "$",
        flag: "🇲🇽",
      },
      {
        code: "BRL",
        name: "Brazilian Real",
        symbol: "R$",
        flag: "🇧🇷",
      },
    ];

    return NextResponse.json(currencies);
  } catch (error) {
    console.error("Currencies fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch currencies" },
      { status: 500 }
    );
  }
}
