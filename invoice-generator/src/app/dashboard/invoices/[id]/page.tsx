"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface InvoiceDetail {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  customer: {
    id: string;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    billingAddress?: any;
  };
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxPercent: number;
    total: number;
  }>;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        } else {
          setError("Invoice not found");
        }
      } catch (error) {
        console.error("Failed to fetch invoice:", error);
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    if (session && params.id) {
      fetchInvoice();
    }
  }, [session, params.id]);

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

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      setDownloading(true);
      const response = await fetch(`/api/invoices/${params.id}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendToCustomer = async () => {
    if (!invoice) return;

    if (!invoice.customer.email) {
      alert("This customer does not have an email address. Please add one before sending.");
      return;
    }

    const confirmed = window.confirm(
      `Send invoice ${invoice.number} to ${invoice.customer.email}?\n\nThe invoice will be sent as a PDF attachment.`
    );

    if (!confirmed) return;

    try {
      setSending(true);
      setSendSuccess(false);

      const response = await fetch(`/api/invoices/${params.id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || "Failed to send invoice");
      }

      setSendSuccess(true);
      alert(`Invoice sent successfully to ${invoice.customer.email}!`);

      // Refresh invoice data to update status
      const refreshResponse = await fetch(`/api/invoices/${params.id}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setInvoice(data);
      }
    } catch (error) {
      console.error("Invoice send error:", error);
      alert(`Failed to send invoice: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <p style={{ color: '#6b7280' }}>Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          {error || "Invoice not found"}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          The invoice you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/dashboard/invoices">
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
            Back to Invoices
          </button>
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColor(invoice.status);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Invoice {invoice.number}
          </h1>
          <p style={{ color: '#6b7280' }}>
            View invoice details and manage payments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer'
            }}>
              Edit
            </button>
          </Link>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: downloading ? '#9ca3af' : '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: downloading ? 'not-allowed' : 'pointer'
            }}>
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Status and Dates */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <span style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              border: `1px solid ${statusColors.border}`,
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {invoice.status}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Issue Date: </span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                {new Date(invoice.issueDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Due Date: </span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Bill To
          </h3>
          <div style={{ fontSize: '1rem', color: '#1f2937' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              {invoice.customer.companyName || invoice.customer.name}
            </div>
            {invoice.customer.companyName && (
              <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                Attn: {invoice.customer.name}
              </div>
            )}
            {invoice.customer.email && (
              <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                {invoice.customer.email}
              </div>
            )}
            {invoice.customer.phone && (
              <div style={{ color: '#6b7280' }}>
                {invoice.customer.phone}
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Description
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '100px' }}>
                  Qty
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '120px' }}>
                  Unit Price
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '100px' }}>
                  GST %
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '120px' }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', color: '#1f2937' }}>
                    {item.description}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7280' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7280' }}>
                    ${Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7280' }}>
                    {item.taxPercent}%
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                    ${Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280' }}>Subtotal:</span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                ${Number(invoice.subtotal).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280' }}>GST:</span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                ${Number(invoice.taxTotal).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Total:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                ${Number(invoice.total).toFixed(2)}
              </span>
            </div>
            {Number(invoice.amountDue) > 0 && Number(invoice.amountDue) !== Number(invoice.total) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px', marginTop: '0.5rem', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e' }}>Amount Due:</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e' }}>
                  ${Number(invoice.amountDue).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            {invoice.notes && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Notes
                </h3>
                <p style={{ color: '#1f2937', lineHeight: '1.6' }}>
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Terms & Conditions
                </h3>
                <p style={{ color: '#1f2937', lineHeight: '1.6' }}>
                  {invoice.terms}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          Actions
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Mark as Paid
          </button>
          <button
            onClick={handleSendToCustomer}
            disabled={sending || !invoice.customer.email}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: sending || !invoice.customer.email ? '#9ca3af' : '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: sending || !invoice.customer.email ? 'not-allowed' : 'pointer'
            }}
            title={!invoice.customer.email ? 'Customer email address required' : 'Send invoice to customer'}>
            {sending ? 'Sending...' : 'Send to Customer'}
          </button>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Duplicate
          </button>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
