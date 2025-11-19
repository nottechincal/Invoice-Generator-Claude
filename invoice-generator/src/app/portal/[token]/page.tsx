"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Invoice {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  notes?: string;
  terms?: string;
  customer: {
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    billingAddress?: any;
  };
  company: {
    legalName?: string;
    tradingName?: string;
    taxNumber?: string;
    registrationNumber?: string;
    email?: string;
    phone?: string;
    addresses?: any[];
    bankDetails?: any[];
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

export default function ClientPortalPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvoice();
  }, [params.token]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/portal/${params.token}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        setError("Invoice not found or link has expired");
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" };
      case "partial":
        return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
      case "overdue":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
      default:
        return { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" };
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <p style={{ color: "#6b7280" }}>Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            {error || "Invoice Not Found"}
          </h1>
          <p style={{ color: "#6b7280" }}>
            This invoice link may have expired or been revoked.
          </p>
        </div>
      </div>
    );
  }

  const statusColors = getStatusColor(invoice.status);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "2rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "0.5rem",
                }}
              >
                {invoice.company.tradingName || invoice.company.legalName}
              </h1>
              {invoice.company.taxNumber && (
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  ABN: {invoice.company.taxNumber}
                </p>
              )}
              {invoice.company.email && (
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {invoice.company.email}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: "0.5rem",
                }}
              >
                Invoice {invoice.number}
              </h2>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  backgroundColor: statusColors.bg,
                  color: statusColors.text,
                  border: `1px solid ${statusColors.border}`,
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                }}
              >
                Bill To
              </h3>
              <div style={{ fontSize: "1rem", color: "#1f2937" }}>
                <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                  {invoice.customer.companyName || invoice.customer.name}
                </div>
                {invoice.customer.email && (
                  <div style={{ color: "#6b7280", marginBottom: "0.25rem" }}>
                    {invoice.customer.email}
                  </div>
                )}
                {invoice.customer.phone && (
                  <div style={{ color: "#6b7280" }}>
                    {invoice.customer.phone}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Issue Date:{" "}
                </span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Due Date:{" "}
                </span>
                <span style={{ fontWeight: "600", color: "#1f2937" }}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{
                backgroundColor: "#f9fafb",
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    width: "100px",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    width: "120px",
                  }}
                >
                  Unit Price
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    width: "100px",
                  }}
                >
                  GST %
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    width: "120px",
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "1rem", color: "#1f2937" }}>
                    {item.description}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      color: "#6b7280",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      color: "#6b7280",
                    }}
                  >
                    ${Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      color: "#6b7280",
                    }}
                  >
                    {item.taxPercent}%
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    ${Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ maxWidth: "400px", marginLeft: "auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.75rem 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ color: "#6b7280" }}>Subtotal:</span>
              <span style={{ fontWeight: "600", color: "#1f2937" }}>
                ${Number(invoice.subtotal).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.75rem 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ color: "#6b7280" }}>GST:</span>
              <span style={{ fontWeight: "600", color: "#1f2937" }}>
                ${Number(invoice.taxTotal).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                marginTop: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                Total:
              </span>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#667eea",
                }}
              >
                ${Number(invoice.total).toFixed(2)}
              </span>
            </div>
            {Number(invoice.amountDue) > 0 &&
              Number(invoice.amountDue) !== Number(invoice.total) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "1rem",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    marginTop: "0.5rem",
                    border: "1px solid #fde68a",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: "bold",
                      color: "#92400e",
                    }}
                  >
                    Amount Due:
                  </span>
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: "bold",
                      color: "#92400e",
                    }}
                  >
                    ${Number(invoice.amountDue).toFixed(2)}
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Payment Info */}
        {invoice.company.bankDetails && invoice.company.bankDetails.length > 0 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "1rem",
              }}
            >
              Payment Details
            </h3>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {invoice.company.bankDetails[0].bsb && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#1f2937" }}>BSB:</strong>{" "}
                  {invoice.company.bankDetails[0].bsb}
                </div>
              )}
              {invoice.company.bankDetails[0].accountNumber && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#1f2937" }}>Account:</strong>{" "}
                  {invoice.company.bankDetails[0].accountNumber}
                </div>
              )}
              {invoice.company.bankDetails[0].accountName && (
                <div>
                  <strong style={{ color: "#1f2937" }}>Name:</strong>{" "}
                  {invoice.company.bankDetails[0].accountName}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#667eea",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              marginRight: "1rem",
            }}
          >
            📄 Download PDF
          </button>
          {invoice.status !== "paid" && (
            <button
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              💳 Pay Now
            </button>
          )}
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2rem",
              marginTop: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            {invoice.notes && (
              <div style={{ marginBottom: invoice.terms ? "1.5rem" : "0" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Notes
                </h3>
                <p style={{ color: "#1f2937", lineHeight: "1.6" }}>
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Terms & Conditions
                </h3>
                <p style={{ color: "#1f2937", lineHeight: "1.6" }}>
                  {invoice.terms}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "2rem 0", color: "#9ca3af" }}>
          <p style={{ fontSize: "0.875rem" }}>
            This is a secure invoice from{" "}
            {invoice.company.tradingName || invoice.company.legalName}
          </p>
        </div>
      </div>
    </div>
  );
}
