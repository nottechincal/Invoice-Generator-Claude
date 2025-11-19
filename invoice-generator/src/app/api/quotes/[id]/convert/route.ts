import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Convert a quote to an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the quote
    const quote = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
        number: {
          startsWith: "QUO-",
        },
      },
      include: {
        lineItems: true,
        company: true,
        customer: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteMetadata = quote.metadata as any;

    // Check if already converted
    if (quoteMetadata?.convertedToInvoiceId) {
      return NextResponse.json(
        {
          error: "Quote already converted to invoice",
          invoiceId: quoteMetadata.convertedToInvoiceId,
        },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: {
        tenantId: session.user.tenantId,
        companyId: quote.companyId,
        number: {
          not: {
            startsWith: "QUO-",
          },
        },
      },
    });

    const invoiceNumber = quote.company.invoiceNumberPrefix
      ? `${quote.company.invoiceNumberPrefix}-${String(invoiceCount + 1).padStart(5, "0")}`
      : `INV-${String(invoiceCount + 1).padStart(5, "0")}`;

    // Calculate due date
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(
      dueDate.getDate() + (quote.company.defaultPaymentTerms || 30)
    );

    // Create invoice from quote
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: session.user.tenantId,
        companyId: quote.companyId,
        customerId: quote.customerId,
        number: invoiceNumber,
        status: "draft",
        invoiceType: "standard",
        issueDate,
        dueDate,
        currency: quote.currency,
        subtotal: quote.subtotal,
        discountType: quote.discountType,
        discountValue: quote.discountValue,
        discountTotal: quote.discountTotal,
        taxTotal: quote.taxTotal,
        total: quote.total,
        amountDue: quote.total,
        notes: quote.notes,
        terms: quote.terms,
        createdBy: session.user.id,
        metadata: {
          convertedFromQuote: quote.id,
          quoteNumber: quote.number,
        },
        lineItems: {
          create: quote.lineItems.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            subtotal: item.subtotal,
            taxPercent: item.taxPercent,
            taxAmount: item.taxAmount,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    // Update quote metadata to mark as converted
    await prisma.invoice.update({
      where: { id: quote.id },
      data: {
        metadata: {
          ...quoteMetadata,
          status: "accepted",
          convertedToInvoiceId: invoice.id,
          convertedAt: new Date().toISOString(),
        },
      },
    });

    // Update customer balance
    await prisma.customer.update({
      where: { id: quote.customerId },
      data: {
        balance: {
          increment: Number(invoice.total),
        },
      },
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        number: invoice.number,
        total: Number(invoice.total),
      },
    });
  } catch (error) {
    console.error("Quote conversion error:", error);
    return NextResponse.json(
      {
        error: "Failed to convert quote to invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
