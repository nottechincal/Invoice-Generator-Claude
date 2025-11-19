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
      customerId,
      projectName,
      taskDescription,
      startTime,
      endTime,
      durationMinutes,
      hourlyRate,
      billable,
      notes,
    } = body;

    // Validate required fields
    if (!taskDescription || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate duration if end time provided
    let calculatedDuration = durationMinutes;
    if (endTime && startTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      calculatedDuration = Math.floor((end.getTime() - start.getTime()) / 60000);
    }

    // Create time entry
    const result = await prisma.$executeRaw`
      INSERT INTO time_entries (
        id, tenant_id, user_id, customer_id, project_name,
        task_description, start_time, end_time, duration_minutes,
        hourly_rate, billable, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${session.user.tenantId},
        ${session.user.id},
        ${customerId || null},
        ${projectName || null},
        ${taskDescription},
        ${new Date(startTime)},
        ${endTime ? new Date(endTime) : null},
        ${calculatedDuration || null},
        ${hourlyRate ? Number(hourlyRate) : null},
        ${billable !== false},
        ${notes || null},
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Time entry created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Time entry creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create time entry",
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
    const customerId = searchParams.get("customerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const billable = searchParams.get("billable");
    const invoiced = searchParams.get("invoiced");

    let query = `
      SELECT
        t.*,
        c.name as customer_name,
        c.company_name as customer_company_name
      FROM time_entries t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.tenant_id = $1
    `;

    const params: any[] = [session.user.tenantId];
    let paramIndex = 2;

    if (customerId) {
      query += ` AND t.customer_id = $${paramIndex}`;
      params.push(customerId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND t.start_time >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      query += ` AND t.start_time <= $${paramIndex}`;
      params.push(new Date(endDate));
      paramIndex++;
    }

    if (billable !== null && billable !== undefined) {
      query += ` AND t.billable = $${paramIndex}`;
      params.push(billable === "true");
      paramIndex++;
    }

    if (invoiced !== null && invoiced !== undefined) {
      query += ` AND t.invoiced = $${paramIndex}`;
      params.push(invoiced === "true");
      paramIndex++;
    }

    query += ` ORDER BY t.start_time DESC`;

    const timeEntries = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("Time entries fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
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
    const { id, endTime } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing time entry ID" }, { status: 400 });
    }

    // Update time entry to stop timer
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE time_entries
      SET
        end_time = ${endTime ? new Date(endTime) : now},
        duration_minutes = EXTRACT(EPOCH FROM (${endTime ? new Date(endTime) : now} - start_time)) / 60,
        updated_at = NOW()
      WHERE id = ${id} AND tenant_id = ${session.user.tenantId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Time entry update error:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}
