"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  invoice?: {
    number: string;
  };
  customer: {
    name: string;
    companyName?: string;
  };
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch("/api/payments");
        if (response.ok) {
          const data = await response.json();
          setPayments(data);
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchPayments();
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" };
      case "pending":
        return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
      case "failed":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
      default:
        return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
    }
  };

  const totalReceived = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingPayments = payments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Payments
        </h1>
        <p style={{ color: '#6b7280' }}>
          Track all customer payments
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Total Payments
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {payments.length}
          </p>
        </div>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Total Received
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            ${totalReceived.toFixed(2)}
          </p>
        </div>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Pending
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            ${pendingPayments.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              No payments yet
            </h3>
            <p style={{ color: '#6b7280' }}>
              Payments will appear here once invoices are paid
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Payment #
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Customer
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Invoice
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Date
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Method
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Amount
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const statusColors = getStatusColor(payment.status);
                return (
                  <tr key={payment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#1f2937' }}>
                      {payment.paymentNumber}
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {payment.customer.companyName || payment.customer.name}
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {payment.invoice?.number || '—'}
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280', textTransform: 'capitalize' }}>
                      {payment.paymentMethod}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                      ${Number(payment.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        border: `1px solid ${statusColors.border}`,
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
