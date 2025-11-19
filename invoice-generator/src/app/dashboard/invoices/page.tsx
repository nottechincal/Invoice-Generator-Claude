"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Invoice {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  amountDue: number;
  customer: {
    name: string;
    companyName?: string;
    email?: string;
  };
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices");
        if (response.ok) {
          const data = await response.json();
          setInvoices(data);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchInvoices();
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" };
      case "draft":
        return { bg: "#e5e7eb", text: "#374151", border: "#9ca3af" };
      case "sent":
        return { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" };
      case "overdue":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
      case "partial":
        return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
      default:
        return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (filter === "all") return true;
    return invoice.status === filter;
  });

  const stats = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Invoices
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage all your invoices in one place
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#667eea',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>+</span>
            Create Invoice
          </button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {[
            { key: "all", label: "All", count: stats.all },
            { key: "draft", label: "Draft", count: stats.draft },
            { key: "sent", label: "Sent", count: stats.sent },
            { key: "paid", label: "Paid", count: stats.paid },
            { key: "overdue", label: "Overdue", count: stats.overdue },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === tab.key ? '#ede9fe' : 'transparent',
                color: filter === tab.key ? '#667eea' : '#6b7280',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {tab.label}
              <span style={{
                padding: '0.125rem 0.5rem',
                backgroundColor: filter === tab.key ? '#667eea' : '#e5e7eb',
                color: filter === tab.key ? '#ffffff' : '#6b7280',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
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
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              No invoices found
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {filter === "all"
                ? "Get started by creating your first invoice"
                : `No ${filter} invoices at the moment`
              }
            </p>
            <Link href="/dashboard/invoices/new">
              <button style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#667eea',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Create Invoice
              </button>
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Invoice
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Customer
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Issue Date
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Due Date
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Amount
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const statusColors = getStatusColor(invoice.status);
                return (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>
                        {invoice.number}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {invoice.customer.companyName || invoice.customer.name}
                      </div>
                      {invoice.customer.email && (
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {invoice.customer.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                      ${Number(invoice.total).toFixed(2)}
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
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <button style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          cursor: 'pointer'
                        }}>
                          View
                        </button>
                      </Link>
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
