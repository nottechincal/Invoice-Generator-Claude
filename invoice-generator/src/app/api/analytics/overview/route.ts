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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get revenue trend (daily for last X days)
    const revenueTrend = await prisma.$queryRaw<
      Array<{ date: Date; total: number }>
    >`
      SELECT
        DATE(issue_date) as date,
        SUM(total) as total
      FROM invoices
      WHERE tenant_id = ${session.user.tenantId}
        AND issue_date >= ${startDate}
        AND status IN ('paid', 'partial')
      GROUP BY DATE(issue_date)
      ORDER BY date ASC
    `;

    // Get invoice status breakdown
    const statusBreakdown = await prisma.invoice.groupBy({
      by: ["status"],
      where: {
        tenantId: session.user.tenantId,
      },
      _count: {
        status: true,
      },
      _sum: {
        total: true,
      },
    });

    // Get top customers by revenue
    const topCustomers = await prisma.customer.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        balance: true,
        invoices: {
          select: {
            total: true,
            status: true,
          },
        },
      },
      orderBy: {
        balance: "desc",
      },
      take: 5,
    });

    const topCustomersWithRevenue = topCustomers.map((customer) => ({
      id: customer.id,
      name: customer.companyName || customer.name,
      totalRevenue: customer.invoices.reduce(
        (sum, inv) =>
          sum +
          (inv.status === "paid" || inv.status === "partial"
            ? Number(inv.total)
            : 0),
        0
      ),
      outstandingBalance: Number(customer.balance),
      invoiceCount: customer.invoices.length,
    }));

    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        number: true,
        status: true,
        issueDate: true,
        dueDate: true,
        total: true,
        amountDue: true,
        customer: {
          select: {
            name: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        issueDate: "desc",
      },
      take: 10,
    });

    // Get overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: session.user.tenantId,
        dueDate: {
          lt: new Date(),
        },
        status: {
          in: ["sent", "partial", "draft"],
        },
        amountDue: {
          gt: 0,
        },
      },
      select: {
        id: true,
        number: true,
        dueDate: true,
        amountDue: true,
        customer: {
          select: {
            name: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
    });

    // Calculate monthly comparison
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const thisMonthRevenue = await prisma.invoice.aggregate({
      where: {
        tenantId: session.user.tenantId,
        issueDate: {
          gte: thisMonthStart,
        },
        status: {
          in: ["paid", "partial"],
        },
      },
      _sum: {
        amountPaid: true,
      },
    });

    const lastMonthRevenue = await prisma.invoice.aggregate({
      where: {
        tenantId: session.user.tenantId,
        issueDate: {
          gte: lastMonthStart,
          lt: thisMonthStart,
        },
        status: {
          in: ["paid", "partial"],
        },
      },
      _sum: {
        amountPaid: true,
      },
    });

    const thisMonth = Number(thisMonthRevenue._sum.amountPaid || 0);
    const lastMonth = Number(lastMonthRevenue._sum.amountPaid || 0);
    const monthlyGrowth =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return NextResponse.json({
      revenueTrend: revenueTrend.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        amount: Number(r.total),
      })),
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.status,
        total: Number(s._sum.total || 0),
      })),
      topCustomers: topCustomersWithRevenue,
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        issueDate: inv.issueDate.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        total: Number(inv.total),
        amountDue: Number(inv.amountDue),
        customerName: inv.customer.companyName || inv.customer.name,
      })),
      overdueInvoices: overdueInvoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        dueDate: inv.dueDate.toISOString(),
        amountDue: Number(inv.amountDue),
        customerName: inv.customer.companyName || inv.customer.name,
        daysOverdue: Math.floor(
          (new Date().getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      monthlyGrowth: {
        thisMonth,
        lastMonth,
        percentage: monthlyGrowth,
      },
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
