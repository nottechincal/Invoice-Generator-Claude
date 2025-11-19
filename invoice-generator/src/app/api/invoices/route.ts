import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: session.user.tenantId,
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
        lineItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

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
      dueDate,
      lineItems,
      subtotal,
      taxTotal,
      total,
      notes,
      terms,
    } = body;

    // Validate required fields
    if (!customerId || !issueDate || !dueDate || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the default company
    const company = await prisma.company.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isDefault: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "No default company found" },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `${company.invoiceNumberPrefix || "INV"}-${String(
      company.invoiceNumberNext
    ).padStart(5, "0")}`;

    // Create invoice with line items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          tenantId: session.user.tenantId,
          companyId: company.id,
          customerId,
          number: invoiceNumber,
          status: "draft",
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          currency: "USD",
          subtotal,
          taxTotal,
          total,
          amountDue: total,
          notes,
          terms,
          createdBy: session.user.id,
          lineItems: {
            create: lineItems.map((item: any, index: number) => ({
              description: item.description,
              quantity: item.quantity,
              unit: "unit",
              unitPrice: item.unitPrice,
              taxPercent: item.taxPercent,
              taxAmount: (item.quantity * item.unitPrice * item.taxPercent) / 100,
              subtotal: item.quantity * item.unitPrice,
              total:
                item.quantity * item.unitPrice +
                (item.quantity * item.unitPrice * item.taxPercent) / 100,
              sortOrder: index,
            })),
          },
        },
        include: {
          lineItems: true,
          customer: true,
        },
      });

      // Update company's invoice number
      await tx.company.update({
        where: { id: company.id },
        data: {
          invoiceNumberNext: company.invoiceNumberNext + 1,
        },
      });

      return newInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
