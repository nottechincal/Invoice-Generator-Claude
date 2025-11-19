"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Expense {
  id: string;
  expense_number: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  vendor?: string;
  payment_method?: string;
  billable: boolean;
  customer_name?: string;
  customer_company_name?: string;
  tax_amount: number;
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "office",
    description: "",
    vendor: "",
    paymentMethod: "card",
    billable: false,
    customerId: "",
    taxAmount: "",
    notes: "",
    receiptData: "",
  });

  useEffect(() => {
    fetchExpenses();
    fetchCustomers();
  }, [session]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses");
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          receiptData: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : 0,
          customerId: formData.customerId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create expense");
      }

      setShowAddModal(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        category: "office",
        description: "",
        vendor: "",
        paymentMethod: "card",
        billable: false,
        customerId: "",
        taxAmount: "",
        notes: "",
        receiptData: "",
      });

      fetchExpenses();
      alert("Expense added successfully!");
    } catch (error) {
      alert("Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { value: "office", label: "Office Supplies", icon: "📎" },
    { value: "travel", label: "Travel", icon: "✈️" },
    { value: "meals", label: "Meals & Entertainment", icon: "🍽️" },
    { value: "software", label: "Software/Subscriptions", icon: "💻" },
    { value: "utilities", label: "Utilities", icon: "⚡" },
    { value: "marketing", label: "Marketing", icon: "📢" },
    { value: "professional", label: "Professional Services", icon: "👔" },
    { value: "equipment", label: "Equipment", icon: "🔧" },
    { value: "other", label: "Other", icon: "📦" },
  ];

  const filteredExpenses = expenses.filter((expense) => {
    if (filter === "all") return true;
    if (filter === "billable") return expense.billable;
    if (filter === "non-billable") return !expense.billable;
    return expense.category === filter;
  });

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );
  const billableExpenses = expenses
    .filter((e) => e.billable)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

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
        <p style={{ color: "#6b7280" }}>Loading expenses...</p>
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
            Expenses
          </h1>
          <p style={{ color: "#6b7280" }}>
            Track business expenses and receipts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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
          + Add Expense
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Total Expenses
          </p>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginTop: "0.5rem",
            }}
          >
            ${totalExpenses.toFixed(2)}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Billable Expenses
          </p>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#10b981",
              marginTop: "0.5rem",
            }}
          >
            ${billableExpenses.toFixed(2)}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Total Entries
          </p>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginTop: "0.5rem",
            }}
          >
            {expenses.length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "billable", label: "Billable" },
            { key: "non-billable", label: "Non-Billable" },
            ...categories.map((c) => ({ key: c.value, label: c.label })),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: filter === tab.key ? "#ede9fe" : "transparent",
                color: filter === tab.key ? "#667eea" : "#6b7280",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💰</div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            No Expenses Yet
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Start tracking your business expenses
          </p>
          <button
            onClick={() => setShowAddModal(true)}
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
            Add Your First Expense
          </button>
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
                  Description
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
                  Category
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
                  Vendor
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
                  Amount
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Billable
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => {
                const category = categories.find(
                  (c) => c.value === expense.category
                );
                return (
                  <tr
                    key={expense.id}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{ fontWeight: "500", color: "#1f2937" }}
                      >
                        {expense.description}
                      </div>
                      {expense.customer_name && (
                        <div
                          style={{ fontSize: "0.875rem", color: "#6b7280" }}
                        >
                          {expense.customer_company_name ||
                            expense.customer_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      <span style={{ marginRight: "0.5rem" }}>
                        {category?.icon}
                      </span>
                      {category?.label}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {expense.vendor || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#1f2937",
                      }}
                    >
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      {expense.billable ? (
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            backgroundColor: "#d1fae5",
                            color: "#065f46",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          Yes
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2rem",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "1.5rem",
              }}
            >
              Add Expense
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      required
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      color: "#1f2937",
                      backgroundColor: "#ffffff",
                      outline: "none",
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    required
                    placeholder="What was this expense for?"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      color: "#1f2937",
                      backgroundColor: "#ffffff",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vendor: e.target.value,
                        }))
                      }
                      placeholder="Who did you pay?"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    >
                      <option value="card">Credit Card</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.billable}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          billable: e.target.checked,
                        }))
                      }
                      style={{ marginRight: "0.5rem" }}
                    />
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                      }}
                    >
                      Billable to customer
                    </span>
                  </label>
                </div>

                {formData.billable && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Customer
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerId: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        color: "#1f2937",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    >
                      <option value="">Select customer...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.companyName || customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Receipt/Attachment
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      color: "#1f2937",
                      backgroundColor: "#ffffff",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                    marginTop: "1rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#374151",
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: submitting ? "#9ca3af" : "#667eea",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Adding..." : "Add Expense"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
