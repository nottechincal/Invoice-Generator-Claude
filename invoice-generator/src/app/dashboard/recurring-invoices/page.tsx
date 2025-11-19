"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface RecurringInvoice {
  id: string;
  customerId: string;
  customerName: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  nextGenerationDate: string;
  lastGenerated?: string;
  autoSend: boolean;
  isActive: boolean;
  total: number;
  createdAt: string;
}

export default function RecurringInvoicesPage() {
  const { data: session } = useSession();
  const [recurring, setRecurring] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchRecurringInvoices();
  }, [session]);

  const fetchRecurringInvoices = async () => {
    try {
      const response = await fetch("/api/recurring-invoices");
      if (response.ok) {
        const data = await response.json();
        setRecurring(data);
      }
    } catch (error) {
      console.error("Failed to fetch recurring invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNow = async (id: string) => {
    if (!confirm("Generate invoice from this template now?")) return;

    try {
      setGenerating(id);
      const response = await fetch("/api/recurring-invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurringInvoiceId: id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate invoice");
      }

      const result = await response.json();
      alert(
        `Invoice ${result.invoice.number} generated successfully!\\nNext generation: ${new Date(result.nextGenerationDate).toLocaleDateString()}`
      );

      fetchRecurringInvoices();
    } catch (error) {
      alert(
        `Failed to generate invoice: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setGenerating(null);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    };
    return labels[frequency] || frequency;
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
        <p style={{ color: "#6b7280" }}>Loading recurring invoices...</p>
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
            Recurring Invoices
          </h1>
          <p style={{ color: "#6b7280" }}>
            Automate your recurring billing with scheduled invoices
          </p>
        </div>
        <Link href="/dashboard/recurring-invoices/new">
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
            + Create Recurring Invoice
          </button>
        </Link>
      </div>

      {recurring.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔄</div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            No Recurring Invoices Yet
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "1.5rem",
              maxWidth: "500px",
              margin: "0 auto 1.5rem",
            }}
          >
            Set up recurring invoices to automatically bill customers on a
            schedule. Perfect for subscriptions, retainers, and regular services.
          </p>
          <Link href="/dashboard/recurring-invoices/new">
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
              Create Your First Recurring Invoice
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
                  Frequency
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
                  Next Invoice
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
              {recurring.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  <td style={{ padding: "1rem" }}>
                    <div>
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#1f2937",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {item.customerName}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {item.autoSend ? "Auto-send enabled" : "Manual send"}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem", color: "#1f2937" }}>
                    {getFrequencyLabel(item.frequency)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    ${Number(item.total).toFixed(2)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ color: "#1f2937" }}>
                      {new Date(item.nextGenerationDate).toLocaleDateString()}
                    </div>
                    {item.lastGenerated && (
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        Last: {new Date(item.lastGenerated).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        backgroundColor: item.isActive ? "#d1fae5" : "#fee2e2",
                        color: item.isActive ? "#065f46" : "#991b1b",
                        border: `1px solid ${item.isActive ? "#6ee7b7" : "#fca5a5"}`,
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleGenerateNow(item.id)}
                      disabled={generating === item.id || !item.isActive}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor:
                          generating === item.id || !item.isActive
                            ? "#9ca3af"
                            : "#667eea",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor:
                          generating === item.id || !item.isActive
                            ? "not-allowed"
                            : "pointer",
                        marginRight: "0.5rem",
                      }}
                    >
                      {generating === item.id
                        ? "Generating..."
                        : "Generate Now"}
                    </button>
                  </td>
                </tr>
              ))}
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
          💡 How Recurring Invoices Work
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
          <li>
            Set up a template with your customer, line items, and billing
            frequency
          </li>
          <li>
            Invoices are automatically generated based on your schedule (daily,
            weekly, monthly, etc.)
          </li>
          <li>
            Enable auto-send to automatically email invoices to customers
          </li>
          <li>
            Set an end date or leave it open-ended for ongoing subscriptions
          </li>
          <li>Manually generate invoices anytime using the "Generate Now" button</li>
        </ul>
      </div>
    </div>
  );
}
