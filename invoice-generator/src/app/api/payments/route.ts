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
      invoiceId,
      amount,
      paymentMethod,
      paymentDate,
      reference,
      notes,
    } = body;

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod || !paymentDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch invoice with customer
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId: session.user.tenantId,
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if payment amount exceeds amount due
    const paymentAmount = Number(amount);
    const amountDue = Number(invoice.amountDue);

    if (paymentAmount > amountDue) {
      return NextResponse.json(
        { error: "Payment amount exceeds amount due" },
        { status: 400 }
      );
    }

    // Generate payment number
    const paymentCount = await prisma.payment.count({
      where: { tenantId: session.user.tenantId },
    });
    const paymentNumber = `PAY-${String(paymentCount + 1).padStart(5, "0")}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: session.user.tenantId,
        invoiceId,
        customerId: invoice.customerId,
        paymentNumber,
        amount: paymentAmount,
        currency: invoice.currency,
        paymentMethod,
        paymentDate: new Date(paymentDate),
        reference,
        notes,
        status: "succeeded",
        reconciled: false,
        createdBy: session.user.id,
      },
    });

    // Calculate new amounts
    const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
    const newAmountDue = Number(invoice.total) - newAmountPaid;

    // Determine new invoice status
    let newStatus = invoice.status;
    if (newAmountDue <= 0) {
      newStatus = "paid";
    } else if (newAmountPaid > 0 && newAmountDue > 0) {
      newStatus = "partial";
    }

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        paidAt: newAmountDue <= 0 ? new Date() : invoice.paidAt,
      },
    });

    // Update customer balance
    const newCustomerBalance = Number(invoice.customer.balance) - paymentAmount;
    await prisma.customer.update({
      where: { id: invoice.customerId },
      data: {
        balance: newCustomerBalance,
      },
    });

    return NextResponse.json(
      {
        success: true,
        payment,
        invoice: {
          id: invoiceId,
          status: newStatus,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to record payment",
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

    const payments = await prisma.payment.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        invoice: {
          select: {
            number: true,
          },
        },
        customer: {
          select: {
            name: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
