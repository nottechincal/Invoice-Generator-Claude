import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/pdf-invoice";

/**
 * Generate invoices from recurring templates
 * This would typically be called by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recurringInvoiceId } = body;

    // Fetch the recurring template
    const template = await prisma.invoice.findFirst({
      where: {
        id: recurringInvoiceId,
        tenantId: session.user.tenantId,
        invoiceType: "recurring",
      },
      include: {
        customer: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Recurring invoice template not found" },
        { status: 404 }
      );
    }

    const metadata = template.metadata as any;

    // Check if template is active
    if (!metadata.isActive) {
      return NextResponse.json(
        { error: "Recurring invoice is inactive" },
        { status: 400 }
      );
    }

    // Check if we should generate (based on nextGenerationDate)
    const now = new Date();
    const nextGenDate = new Date(metadata.nextGenerationDate);

    if (now < nextGenDate) {
      return NextResponse.json(
        { error: "Not yet time to generate invoice" },
        { status: 400 }
      );
    }

    // Check if past end date
    if (metadata.endDate && now > new Date(metadata.endDate)) {
      // Deactivate the recurring invoice
      await prisma.invoice.update({
        where: { id: template.id },
        data: {
          metadata: {
            ...metadata,
            isActive: false,
          },
        },
      });

      return NextResponse.json(
        { error: "Recurring invoice has ended" },
        { status: 400 }
      );
    }

    // Get company
    const company = await prisma.company.findFirst({
      where: { id: template.companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: {
        tenantId: session.user.tenantId,
        companyId: company.id,
        invoiceType: "standard",
      },
    });

    const invoiceNumber = company.invoiceNumberPrefix
      ? `${company.invoiceNumberPrefix}-${String(invoiceCount + 1).padStart(5, "0")}`
      : `INV-${String(invoiceCount + 1).padStart(5, "0")}`;

    // Calculate dates
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (company.defaultPaymentTerms || 30));

    // Create the actual invoice
    const newInvoice = await prisma.invoice.create({
      data: {
        tenantId: session.user.tenantId,
        companyId: company.id,
        customerId: template.customerId,
        number: invoiceNumber,
        status: metadata.autoSend ? "sent" : "draft",
        invoiceType: "standard",
        issueDate,
        dueDate,
        currency: template.currency,
        subtotal: template.subtotal,
        taxTotal: template.taxTotal,
        total: template.total,
        amountDue: template.total,
        notes: template.notes,
        terms: template.terms,
        sentAt: metadata.autoSend ? new Date() : null,
        createdBy: session.user.id,
        lineItems: {
          create: metadata.lineItems.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || "unit",
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            taxPercent: item.taxPercent,
            taxAmount: item.taxAmount,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    // Calculate next generation date based on frequency
    const calculateNextDate = (current: Date, frequency: string): Date => {
      const next = new Date(current);

      switch (frequency) {
        case "daily":
          next.setDate(next.getDate() + 1);
          break;
        case "weekly":
          next.setDate(next.getDate() + 7);
          break;
        case "monthly":
          next.setMonth(next.getMonth() + 1);
          break;
        case "quarterly":
          next.setMonth(next.getMonth() + 3);
          break;
        case "yearly":
          next.setFullYear(next.getFullYear() + 1);
          break;
        default:
          next.setMonth(next.getMonth() + 1);
      }

      return next;
    };

    const nextGeneration = calculateNextDate(now, metadata.frequency);

    // Update recurring template
    await prisma.invoice.update({
      where: { id: template.id },
      data: {
        metadata: {
          ...metadata,
          lastGenerated: now.toISOString(),
          nextGenerationDate: nextGeneration.toISOString(),
        },
      },
    });

    // Update customer balance
    await prisma.customer.update({
      where: { id: template.customerId },
      data: {
        balance: {
          increment: Number(template.total),
        },
      },
    });

    // If autoSend is enabled, send the invoice
    if (metadata.autoSend && template.customer.email) {
      try {
        const pdfBuffer = await renderToBuffer(
          InvoicePDF({ invoice: newInvoice, company })
        );

        await sendInvoiceEmail({
          to: template.customer.email,
          invoiceNumber: newInvoice.number,
          customerName: template.customer.companyName || template.customer.name,
          amount: Number(newInvoice.total),
          dueDate: newInvoice.dueDate.toISOString(),
          companyName: company.tradingName || company.legalName || "Your Company",
          pdfBuffer,
        });
      } catch (emailError) {
        console.error("Failed to send auto-generated invoice:", emailError);
        // Don't fail the generation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: newInvoice.id,
        number: newInvoice.number,
        total: Number(newInvoice.total),
        status: newInvoice.status,
      },
      nextGenerationDate: nextGeneration.toISOString(),
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
