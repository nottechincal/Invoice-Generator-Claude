"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalRevenue: string;
  pendingAmount: string;
  customersCount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalRevenue: "$0.00",
    pendingAmount: "$0.00",
    customersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  const statCards = [
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      change: "+12.5%",
      positive: true,
      icon: "💰",
      color: "#10b981"
    },
    {
      title: "Pending Amount",
      value: stats.pendingAmount,
      change: "-3.2%",
      positive: false,
      icon: "⏳",
      color: "#f59e0b"
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices.toString(),
      change: "+8 this month",
      positive: true,
      icon: "📄",
      color: "#667eea"
    },
    {
      title: "Customers",
      value: stats.customersCount.toString(),
      change: "+2 new",
      positive: true,
      icon: "👥",
      color: "#ec4899"
    },
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Welcome back, {session?.user.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ fontSize: '1rem', color: '#6b7280' }}>
          Here's what's happening with your invoices today.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((card, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {card.title}
                </p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {loading ? "..." : card.value}
                </p>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: `${card.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {card.icon}
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: card.positive ? '#10b981' : '#ef4444'
            }}>
              <span style={{ marginRight: '0.25rem' }}>
                {card.positive ? '↗' : '↘'}
              </span>
              {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <Link href="/dashboard/invoices/new" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px dashed #667eea',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#5568d3';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#667eea' }}>
                Create Invoice
              </div>
            </div>
          </Link>

          <Link href="/dashboard/customers/new" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px dashed #10b981',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
                Add Customer
              </div>
            </div>
          </Link>

          <Link href="/dashboard/products/new" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px dashed #f59e0b',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d97706';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f59e0b' }}>
                Add Product
              </div>
            </div>
          </Link>

          <Link href="/dashboard/reports" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px dashed #ec4899',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#db2777';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#ec4899' }}>
                View Reports
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          Recent Invoices
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No invoices yet</p>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Get started by creating your first invoice
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
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5568d3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#667eea';
            }}>
              Create First Invoice
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
