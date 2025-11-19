"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Quote {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  metadata: {
    isQuote: boolean;
    status: string;
    expiryDate?: string;
    convertedToInvoiceId?: string;
  };
  customer: {
    id: string;
    name: string;
    companyName?: string;
    email?: string;
  };
}

export default function QuotesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [session]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch("/api/quotes");
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async (id: string) => {
    if (!confirm("Convert this quote to an invoice?")) return;

    try {
      setConverting(id);
      const response = await fetch(`/api/quotes/${id}/convert`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to convert quote");
      }

      const result = await response.json();
      alert(
        `Quote converted successfully! Invoice ${result.invoice.number} created.`
      );

      // Navigate to the new invoice
      router.push(`/dashboard/invoices/${result.invoice.id}`);
    } catch (error) {
      alert(
        `Failed to convert quote: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setConverting(null);
      fetchQuotes();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" };
      case "pending":
        return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
      case "declined":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
      case "expired":
        return { bg: "#e5e7eb", text: "#374151", border: "#9ca3af" };
      default:
        return { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" };
    }
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <p style={{ color: "#6b7280" }}>Loading quotes...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            Quotes & Estimates
          </h1>
          <p style={{ color: "#6b7280" }}>
            Create quotes for customers before invoicing
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <button
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#667eea",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            + Create Quote
          </button>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            No Quotes Yet
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "1.5rem",
              maxWidth: "500px",
              margin: "0 auto 1.5rem",
            }}
          >
            Create quotes to present pricing to customers before creating
            invoices. Perfect for project estimates and proposals.
          </p>
          <Link href="/dashboard/quotes/new">
            <button
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#667eea",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Create Your First Quote
            </button>
          </Link>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden",
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
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Quote #
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Customer
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "right",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const expired = isExpired(quote.metadata.expiryDate);
                const quoteStatus = expired
                  ? "expired"
                  : quote.metadata.status || "pending";
                const statusColors = getStatusColor(quoteStatus);

                return (
                  <tr
                    key={quote.id}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#667eea",
                          cursor: "pointer",
                        }}
                      >
                        {quote.number}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          fontWeight: "500",
                          color: "#1f2937",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {quote.customer.companyName || quote.customer.name}
                      </div>
                      {quote.customer.email && (
                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          {quote.customer.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {new Date(quote.issueDate).toLocaleDateString()}
                      {quote.metadata.expiryDate && (
                        <div style={{ fontSize: "0.75rem" }}>
                          Expires: {new Date(quote.metadata.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      ${Number(quote.total).toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          border: `1px solid ${statusColors.border}`,
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          textTransform: "capitalize",
                        }}
                      >
                        {quoteStatus}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {!quote.metadata.convertedToInvoiceId && !expired && (
                        <button
                          onClick={() => handleConvertToInvoice(quote.id)}
                          disabled={converting === quote.id}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor:
                              converting === quote.id ? "#9ca3af" : "#10b981",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            cursor:
                              converting === quote.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {converting === quote.id
                            ? "Converting..."
                            : "Convert to Invoice"}
                        </button>
                      )}
                      {quote.metadata.convertedToInvoiceId && (
                        <Link
                          href={`/dashboard/invoices/${quote.metadata.convertedToInvoiceId}`}
                        >
                          <button
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#ffffff",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              color: "#374151",
                              cursor: "pointer",
                            }}
                          >
                            View Invoice
                          </button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Card */}
      <div
        style={{
          backgroundColor: "#eff6ff",
          borderRadius: "12px",
          padding: "1.5rem",
          marginTop: "2rem",
          border: "1px solid #bfdbfe",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#1e40af",
            marginBottom: "0.75rem",
          }}
        >
          💡 How Quotes Work
        </h3>
        <ul
          style={{
            fontSize: "0.875rem",
            color: "#1e40af",
            lineHeight: "1.6",
            margin: 0,
            paddingLeft: "1.5rem",
          }}
        >
          <li>Create quotes to present pricing before invoicing</li>
          <li>Set expiry dates to create urgency</li>
          <li>Convert accepted quotes to invoices with one click</li>
          <li>
            Track quote status: pending, accepted, declined, or expired
          </li>
          <li>Perfect for project proposals and estimates</li>
        </ul>
      </div>
    </div>
  );
}
