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

    const company = await prisma.company.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isDefault: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Get company error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      legalName,
      tradingName,
      taxNumber,
      registrationNumber,
      email,
      phone,
      website,
      address,
      bankDetails,
      invoiceNumberPrefix,
      defaultPaymentTerms,
      defaultCurrency,
    } = body;

    const company = await prisma.company.findFirst({
      where: {
        tenantId: session.user.tenantId,
        isDefault: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        legalName,
        tradingName,
        taxNumber,
        registrationNumber,
        email,
        phone,
        website,
        addresses: address ? [address] : [],
        bankDetails: bankDetails ? [bankDetails] : [],
        invoiceNumberPrefix,
        defaultPaymentTerms,
        defaultCurrency,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Update company error:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}
