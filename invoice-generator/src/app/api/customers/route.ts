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

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: { not: "archived" },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
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
      customerType,
      name,
      companyName,
      email,
      phone,
      taxNumber,
      billingAddress,
      paymentTerms,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
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

    const customer = await prisma.customer.create({
      data: {
        tenantId: session.user.tenantId,
        companyId: company.id,
        customerType: customerType || "business",
        name,
        companyName,
        email,
        phone,
        taxNumber,
        billingAddress,
        paymentTerms: paymentTerms || 30,
        status: "active",
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
