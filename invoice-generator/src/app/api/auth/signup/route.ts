import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, firstName, lastName, email, password } = body;

    // Validate input
    if (!companyName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate subdomain from company name
    const subdomain = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);

    // Check subdomain uniqueness
    let finalSubdomain = subdomain;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { subdomain: finalSubdomain } })) {
      finalSubdomain = `${subdomain}-${counter}`;
      counter++;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          subdomain: finalSubdomain,
          plan: "starter",
          status: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      });

      // Create user as owner
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: email.toLowerCase(),
          emailVerified: false,
          passwordHash,
          firstName,
          lastName,
          role: "owner",
          status: "active",
        },
      });

      // Create default company
      const company = await tx.company.create({
        data: {
          tenantId: tenant.id,
          legalName: companyName,
          isDefault: true,
          isActive: true,
        },
      });

      // Create default tax profile (0% - can be customized later)
      await tx.taxProfile.create({
        data: {
          tenantId: tenant.id,
          companyId: company.id,
          name: "No Tax",
          type: "sales_tax",
          rate: 0,
          isDefault: true,
          isActive: true,
        },
      });

      return { tenant, user, company };
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
