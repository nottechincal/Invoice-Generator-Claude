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

    // Generate PDF stream
    const pdfStream = await renderToStream(
      InvoicePDF({ invoice, company })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
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
