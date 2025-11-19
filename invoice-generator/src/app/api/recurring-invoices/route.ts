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
      frequency, // daily, weekly, monthly, quarterly, yearly
      startDate,
      endDate,
      lineItems,
      notes,
      terms,
      autoSend,
    } = body;

    // Validate required fields
    if (!customerId || !frequency || !startDate || !lineItems?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get company for invoice number prefix
    const company = await prisma.company.findFirst({
      where: { tenantId: session.user.tenantId, isDefault: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company profile not found" },
        { status: 404 }
      );
    }

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
        ...item,
        subtotal: itemSubtotal,
        taxAmount,
        total: itemTotal,
        sortOrder: index,
      };
    });

    const total = subtotal + taxTotal;

    // Store as JSON in metadata since we don't have a dedicated recurring invoice table
    // In production, you'd want a proper RecurringInvoice model
    const recurringTemplate = {
      customerId,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      lineItems: processedItems,
      subtotal,
      taxTotal,
      total,
      notes,
      terms,
      autoSend: autoSend || false,
      isActive: true,
      lastGenerated: null,
      nextGenerationDate: new Date(startDate),
      createdBy: session.user.id,
      createdAt: new Date(),
    };

    // Store in invoice metadata with special type
    const placeholderInvoice = await prisma.invoice.create({
      data: {
        tenantId: session.user.tenantId,
        companyId: company.id,
        customerId,
        number: `RECURRING-TEMPLATE-${Date.now()}`,
        status: "draft",
        invoiceType: "recurring",
        issueDate: new Date(startDate),
        dueDate: new Date(startDate),
        currency: company.defaultCurrency,
        subtotal,
        taxTotal,
        total,
        amountDue: total,
        notes,
        terms,
        metadata: recurringTemplate,
      },
    });

    return NextResponse.json(
      {
        success: true,
        recurringInvoice: {
          id: placeholderInvoice.id,
          ...recurringTemplate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Recurring invoice creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create recurring invoice",
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

    // Fetch recurring invoice templates
    const recurringInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: session.user.tenantId,
        invoiceType: "recurring",
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

    const formattedRecurring = recurringInvoices.map((inv) => ({
      id: inv.id,
      customerId: inv.customerId,
      customerName: inv.customer.companyName || inv.customer.name,
      frequency: (inv.metadata as any)?.frequency || "monthly",
      startDate: (inv.metadata as any)?.startDate || inv.issueDate,
      endDate: (inv.metadata as any)?.endDate,
      nextGenerationDate: (inv.metadata as any)?.nextGenerationDate,
      lastGenerated: (inv.metadata as any)?.lastGenerated,
      autoSend: (inv.metadata as any)?.autoSend || false,
      isActive: (inv.metadata as any)?.isActive ?? true,
      total: Number(inv.total),
      createdAt: inv.createdAt,
    }));

    return NextResponse.json(formattedRecurring);
  } catch (error) {
    console.error("Recurring invoices fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring invoices" },
      { status: 500 }
    );
  }
}
