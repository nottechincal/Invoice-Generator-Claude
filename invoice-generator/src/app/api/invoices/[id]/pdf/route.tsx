import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/pdf-invoice";

export async function GET(
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

    // Parse JSON fields safely - Prisma returns them as objects/arrays
    const parseJsonField = (field: any): any[] => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const companyData = {
      id: company.id,
      legalName: company.legalName,
      tradingName: company.tradingName,
      taxNumber: company.taxNumber,
      registrationNumber: company.registrationNumber,
      email: company.email,
      phone: company.phone,
      addresses: parseJsonField(company.addresses),
      bankDetails: parseJsonField(company.bankDetails),
    };

    // Clean invoice data - ensure all fields are serializable
    const cleanInvoice = {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      subtotal: Number(invoice.subtotal),
      taxTotal: Number(invoice.taxTotal),
      total: Number(invoice.total),
      amountDue: Number(invoice.amountDue),
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name || '',
        companyName: invoice.customer.companyName || '',
        email: invoice.customer.email || '',
        phone: invoice.customer.phone || '',
      },
      lineItems: invoice.lineItems.map((item: any) => ({
        id: item.id,
        description: item.description || '',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxPercent: Number(item.taxPercent),
        total: Number(item.total),
      })),
    };

    // Generate PDF stream
    const pdfStream = await renderToStream(
      <InvoicePDF invoice={cleanInvoice} company={companyData} />
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${invoice.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
