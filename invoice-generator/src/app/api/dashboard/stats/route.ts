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

    const tenantId = session.user.tenantId;

    // Get invoice statistics
    const [invoices, customers] = await Promise.all([
      prisma.invoice.findMany({
        where: { tenantId },
        select: {
          status: true,
          total: true,
          amountPaid: true,
          amountDue: true,
        },
      }),
      prisma.customer.count({
        where: { tenantId, status: "active" },
      }),
    ]);

    const stats = invoices.reduce(
      (acc, invoice) => {
        acc.totalInvoices++;
        acc.totalRevenue += Number(invoice.total);

        if (invoice.status === "paid") {
          acc.paidInvoices++;
        } else if (invoice.status === "overdue") {
          acc.overdueInvoices++;
          acc.pendingAmount += Number(invoice.amountDue);
        } else if (invoice.status !== "void" && invoice.status !== "cancelled") {
          acc.pendingAmount += Number(invoice.amountDue);
        }

        return acc;
      },
      {
        totalInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        totalRevenue: 0,
        pendingAmount: 0,
      }
    );

    return NextResponse.json({
      totalInvoices: stats.totalInvoices,
      paidInvoices: stats.paidInvoices,
      overdueInvoices: stats.overdueInvoices,
      totalRevenue: `$${stats.totalRevenue.toFixed(2)}`,
      pendingAmount: `$${stats.pendingAmount.toFixed(2)}`,
      customersCount: customers,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
