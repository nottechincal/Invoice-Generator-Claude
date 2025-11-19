import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Fetch invoice by public token
    const invoice = await prisma.invoice.findFirst({
      where: {
        publicToken: params.token,
        // Optionally check if link hasn't expired
        OR: [
          { publicLinkExpiresAt: null },
          { publicLinkExpiresAt: { gte: new Date() } },
        ],
      },
      include: {
        customer: {
          select: {
            name: true,
            companyName: true,
            email: true,
            phone: true,
            billingAddress: true,
          },
        },
        company: {
          select: {
            legalName: true,
            tradingName: true,
            taxNumber: true,
            registrationNumber: true,
            email: true,
            phone: true,
            addresses: true,
            bankDetails: true,
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
        { error: "Invoice not found or link has expired" },
        { status: 404 }
      );
    }

    // Mark as viewed if not already
    if (!invoice.viewedAt) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { viewedAt: new Date() },
      });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Portal invoice fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
