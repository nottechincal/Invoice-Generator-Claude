import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/pdf-invoice";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
            billingAddress: true,
          },
        },
        lineItems: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if customer has email
    if (!invoice.customer.email) {
      return NextResponse.json(
        { error: "Customer does not have an email address" },
        { status: 400 }
      );
    }

    // Fetch company data
    const company = await prisma.company.findFirst({
      where: {
        tenantId: session.user.tenantId,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company profile not found" },
        { status: 404 }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice, company }));

    // Send email with PDF attachment
    await sendInvoiceEmail({
      to: invoice.customer.email,
      invoiceNumber: invoice.number,
      customerName: invoice.customer.companyName || invoice.customer.name,
      amount: Number(invoice.amountDue),
      dueDate: invoice.dueDate.toISOString(),
      companyName: company.tradingName || company.legalName || "Your Company",
      pdfBuffer,
    });

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === "draft") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "sent" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    console.error("Invoice send error:", error);
    return NextResponse.json(
      {
        error: "Failed to send invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
