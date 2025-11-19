import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      issueDate,
      expiryDate,
      lineItems,
      notes,
      terms,
      discountType,
      discountValue,
    } = body;

    // Validate required fields
    if (!customerId || !issueDate || !lineItems?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get company for quote number prefix
    const company = await prisma.company.findFirst({
      where: { tenantId: session.user.tenantId, isDefault: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company profile not found" },
        { status: 404 }
      );
    }

    // Generate quote number
    const quoteCount = await prisma.invoice.count({
      where: {
        tenantId: session.user.tenantId,
        number: {
          startsWith: "QUO-",
        },
      },
    });

    const quoteNumber = `QUO-${String(quoteCount + 1).padStart(5, "0")}`;

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;

    const processedItems = lineItems.map((item: any, index: number) => {
      const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
      const taxAmount = (itemSubtotal * Number(item.taxPercent)) / 100;
      const itemTotal = itemSubtotal + taxAmount;

      subtotal += itemSubtotal;
      taxTotal += taxAmount;

      return {
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || "unit",
        unitPrice: Number(item.unitPrice),
        taxPercent: Number(item.taxPercent),
        subtotal: itemSubtotal,
        taxAmount,
        total: itemTotal,
        sortOrder: index,
        productId: item.productId || null,
      };
    });

    // Apply discount
    let discountTotal = 0;
    if (discountValue) {
      if (discountType === "percent") {
        discountTotal = (subtotal * Number(discountValue)) / 100;
      } else {
        discountTotal = Number(discountValue);
      }
    }

    const finalSubtotal = subtotal - discountTotal;
    const total = finalSubtotal + taxTotal;

    // Create quote (stored as invoice with special metadata)
    const quote = await prisma.invoice.create({
      data: {
        tenantId: session.user.tenantId,
        companyId: company.id,
        customerId,
        number: quoteNumber,
        status: "draft",
        issueDate: new Date(issueDate),
        dueDate: expiryDate ? new Date(expiryDate) : new Date(issueDate),
        currency: company.defaultCurrency,
        subtotal,
        discountType,
        discountValue: discountValue ? Number(discountValue) : null,
        discountTotal,
        taxTotal,
        total,
        amountDue: total,
        notes,
        terms,
        createdBy: session.user.id,
        metadata: {
          isQuote: true,
          expiryDate: expiryDate || null,
          status: "pending", // pending, accepted, declined, expired
        },
        lineItems: {
          create: processedItems,
        },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Quote creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create quote",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quotes = await prisma.invoice.findMany({
      where: {
        tenantId: session.user.tenantId,
        number: {
          startsWith: "QUO-",
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Quotes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
