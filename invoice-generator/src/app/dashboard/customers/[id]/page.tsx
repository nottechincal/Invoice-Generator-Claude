"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface CustomerDetail {
  id: string;
  customerType: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  taxNumber?: string;
  billingAddress?: any;
  balance: number;
  status: string;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
        } else {
          setError("Customer not found");
        }
      } catch (error) {
        console.error("Failed to fetch customer:", error);
        setError("Failed to load customer");
      } finally {
        setLoading(false);
      }
    };

    if (session && params.id) {
      fetchCustomer();
    }
  }, [session, params.id]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <p style={{ color: '#6b7280' }}>Loading customer...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          {error || "Customer not found"}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          The customer you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/dashboard/customers">
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
            Back to Customers
          </button>
        </Link>
      </div>
    );
  }

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
            {customer.companyName || customer.name}
          </h1>
          <p style={{ color: '#6b7280' }}>
            Customer details and activity
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href={`/dashboard/customers/${customer.id}/edit`}>
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
              Edit
            </button>
          </Link>
        </div>
      </div>

      {/* Customer Details Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
          Contact Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                Type
              </label>
              <p style={{ fontSize: '1rem', color: '#1f2937', textTransform: 'capitalize' }}>
                {customer.customerType}
              </p>
            </div>

            {customer.companyName && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                  Company Name
                </label>
                <p style={{ fontSize: '1rem', color: '#1f2937' }}>
                  {customer.companyName}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                Contact Name
              </label>
              <p style={{ fontSize: '1rem', color: '#1f2937' }}>
                {customer.name}
              </p>
            </div>

            {customer.email && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                  Email
                </label>
                <p style={{ fontSize: '1rem', color: '#1f2937' }}>
                  <a href={`mailto:${customer.email}`} style={{ color: '#667eea', textDecoration: 'none' }}>
                    {customer.email}
                  </a>
                </p>
              </div>
            )}
          </div>

          <div>
            {customer.phone && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                  Phone
                </label>
                <p style={{ fontSize: '1rem', color: '#1f2937' }}>
                  {customer.phone}
                </p>
              </div>
            )}

            {customer.mobile && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                  Mobile
                </label>
                <p style={{ fontSize: '1rem', color: '#1f2937' }}>
                  {customer.mobile}
                </p>
              </div>
            )}

            {customer.taxNumber && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                  {customer.customerType === 'business' ? 'ABN' : 'TFN'}
                </label>
                <p style={{ fontSize: '1rem', color: '#1f2937' }}>
                  {customer.taxNumber}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                Status
              </label>
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                backgroundColor: customer.status === 'active' ? '#d1fae5' : '#fee2e2',
                color: customer.status === 'active' ? '#065f46' : '#991b1b',
                border: `1px solid ${customer.status === 'active' ? '#6ee7b7' : '#fca5a5'}`,
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {customer.status}
              </span>
            </div>
          </div>
        </div>

        {customer.billingAddress && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Billing Address
            </h3>
            <p style={{ fontSize: '1rem', color: '#1f2937', lineHeight: '1.6' }}>
              {customer.billingAddress.street && <>{customer.billingAddress.street}<br /></>}
              {customer.billingAddress.city && <>{customer.billingAddress.city} </>}
              {customer.billingAddress.state && <>{customer.billingAddress.state} </>}
              {customer.billingAddress.postalCode && <>{customer.billingAddress.postalCode}<br /></>}
              {customer.billingAddress.country && <>{customer.billingAddress.country}</>}
            </p>
          </div>
        )}
      </div>

      {/* Balance Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
          Account Balance
        </h2>
        <div style={{
          padding: '1.5rem',
          backgroundColor: Number(customer.balance) > 0 ? '#fef3c7' : '#d1fae5',
          borderRadius: '8px',
          border: `1px solid ${Number(customer.balance) > 0 ? '#fde68a' : '#6ee7b7'}`
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Outstanding Balance
          </p>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: Number(customer.balance) > 0 ? '#92400e' : '#065f46'
          }}>
            ${Number(customer.balance || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href={`/dashboard/invoices/new?customer=${customer.id}`}>
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Create Invoice
            </button>
          </Link>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            color: '#374151',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            View Invoices
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
            Delete Customer
          </button>
        </div>
      </div>
    </div>
  );
}
