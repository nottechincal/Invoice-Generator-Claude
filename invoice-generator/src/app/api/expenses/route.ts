import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      amount,
      category,
      description,
      vendor,
      paymentMethod,
      receiptUrl,
      receiptData, // base64 encoded receipt image
      billable,
      customerId,
      taxAmount,
      notes,
    } = body;

    // Validate required fields
    if (!date || !amount || !category || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate expense number
    const expenseCount = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*) as count FROM expenses WHERE tenant_id = ${session.user.tenantId}`;

    const expenseNumber = `EXP-${String(Number(expenseCount[0].count) + 1).padStart(5, "0")}`;

    // Create expense record
    // Note: In a real app, you'd upload receiptData to S3/CloudStorage
    // For now, we'll store the URL or base64 in metadata
    const expense = await prisma.$executeRaw`
      INSERT INTO expenses (
        id, tenant_id, expense_number, date, amount, category,
        description, vendor, payment_method, receipt_url,
        billable, customer_id, tax_amount, notes, metadata,
        created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${session.user.tenantId},
        ${expenseNumber},
        ${new Date(date)},
        ${Number(amount)},
        ${category},
        ${description},
        ${vendor || null},
        ${paymentMethod || null},
        ${receiptUrl || null},
        ${billable || false},
        ${customerId || null},
        ${taxAmount ? Number(taxAmount) : 0},
        ${notes || null},
        ${JSON.stringify({ receiptData: receiptData || null })},
        ${session.user.id},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    return NextResponse.json(
      {
        success: true,
        expenseNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Expense creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create expense",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const billable = searchParams.get("billable");

    let query = `
      SELECT
        e.*,
        c.name as customer_name,
        c.company_name as customer_company_name
      FROM expenses e
      LEFT JOIN customers c ON e.customer_id = c.id
      WHERE e.tenant_id = $1
    `;

    const params: any[] = [session.user.tenantId];
    let paramIndex = 2;

    if (category) {
      query += ` AND e.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND e.date >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.date <= $${paramIndex}`;
      params.push(new Date(endDate));
      paramIndex++;
    }

    if (billable !== null && billable !== undefined) {
      query += ` AND e.billable = $${paramIndex}`;
      params.push(billable === "true");
      paramIndex++;
    }

    query += ` ORDER BY e.date DESC`;

    const expenses = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Expenses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
