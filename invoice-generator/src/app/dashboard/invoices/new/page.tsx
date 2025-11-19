"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  companyName: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    customerId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    terms: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxPercent: 0,
      total: 0,
    },
  ]);

  useEffect(() => {
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

    if (session) {
      fetchCustomers();
    }
  }, [session]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxPercent: 0,
        total: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate total
          const subtotal = updated.quantity * updated.unitPrice;
          const tax = (subtotal * updated.taxPercent) / 100;
          updated.total = subtotal + tax;
          return updated;
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = lineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice * item.taxPercent) / 100,
      0
    );
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.customerId) {
      setError("Please select a customer");
      return;
    }

    if (lineItems.some((item) => !item.description || item.unitPrice === 0)) {
      setError("Please fill in all line items");
      return;
    }

    setLoading(true);

    try {
      const totals = calculateTotals();

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxPercent: item.taxPercent,
          })),
          subtotal: totals.subtotal,
          taxTotal: totals.tax,
          total: totals.total,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create invoice");
        return;
      }

      const data = await response.json();
      router.push(`/dashboard/invoices/${data.id}`);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Create New Invoice
        </h1>
        <p style={{ color: '#6b7280' }}>Fill in the details to generate a professional invoice</p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            Invoice Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#1f2937',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName || customer.name} {customer.email && `(${customer.email})`}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  No customers yet.{" "}
                  <a href="/dashboard/customers/new" style={{ color: '#667eea' }}>
                    Add one now
                  </a>
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                    backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                    backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
              Line Items
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#667eea',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Add Item
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                    Description
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', width: '100px' }}>
                    Qty
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', width: '120px' }}>
                    Unit Price
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', width: '100px' }}>
                    Tax %
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', width: '120px' }}>
                    Total
                  </th>
                  <th style={{ padding: '0.75rem', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        placeholder="Item description..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          color: '#1f2937',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          textAlign: 'right',
                          color: '#1f2937',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          textAlign: 'right',
                          color: '#1f2937',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={item.taxPercent}
                        onChange={(e) => updateLineItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.1"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          textAlign: 'right',
                          color: '#1f2937',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                      ${item.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Subtotal:</span>
                <span style={{ fontWeight: '600' }}>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Tax:</span>
                <span style={{ fontWeight: '600' }}>${totals.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Total:</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#667eea' }}>
                  ${totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            Additional Information
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes for the customer..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#1f2937',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Payment terms, late fees, etc..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#1f2937',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#9ca3af' : '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
