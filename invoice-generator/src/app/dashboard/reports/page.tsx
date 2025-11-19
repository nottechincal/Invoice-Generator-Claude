"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ReportsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidInvoices: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    customersCount: 0,
    avgInvoiceValue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalRevenue: parseFloat(data.totalRevenue?.replace(/[$,]/g, '') || '0'),
            paidInvoices: data.paidInvoices || 0,
            pendingAmount: parseFloat(data.pendingAmount?.replace(/[$,]/g, '') || '0'),
            overdueAmount: parseFloat(data.overdueAmount?.replace(/[$,]/g, '') || '0'),
            customersCount: data.customersCount || 0,
            avgInvoiceValue: parseFloat(data.totalRevenue?.replace(/[$,]/g, '') || '0') / (data.paidInvoices || 1),
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  const reportCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      description: "All-time revenue from paid invoices",
      icon: "💰",
      color: "#10b981"
    },
    {
      title: "Outstanding",
      value: `$${stats.pendingAmount.toFixed(2)}`,
      description: "Pending invoice payments",
      icon: "⏳",
      color: "#f59e0b"
    },
    {
      title: "Overdue",
      value: `$${stats.overdueAmount.toFixed(2)}`,
      description: "Past due invoices",
      icon: "⚠️",
      color: "#ef4444"
    },
    {
      title: "Paid Invoices",
      value: stats.paidInvoices.toString(),
      description: "Successfully completed invoices",
      icon: "✅",
      color: "#8b5cf6"
    },
    {
      title: "Active Customers",
      value: stats.customersCount.toString(),
      description: "Total customer count",
      icon: "👥",
      color: "#667eea"
    },
    {
      title: "Average Invoice",
      value: `$${stats.avgInvoiceValue.toFixed(2)}`,
      description: "Mean invoice value",
      icon: "📊",
      color: "#ec4899"
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Reports & Analytics
        </h1>
        <p style={{ color: '#6b7280' }}>
          Business performance insights
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {reportCards.map((card, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${card.color}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {card.title}
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {card.value}
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
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
          Revenue Breakdown
        </h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div>
              <p style={{ fontWeight: '600', color: '#1f2937' }}>Collected Revenue</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Payments received</p>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              ${stats.totalRevenue.toFixed(2)}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div>
              <p style={{ fontWeight: '600', color: '#1f2937' }}>Pending Revenue</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Awaiting payment</p>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#f59e0b'
            }}>
              ${stats.pendingAmount.toFixed(2)}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div>
              <p style={{ fontWeight: '600', color: '#1f2937' }}>Overdue Revenue</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Past due date</p>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#ef4444'
            }}>
              ${stats.overdueAmount.toFixed(2)}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#ede9fe',
            borderRadius: '8px',
            border: '2px solid #667eea'
          }}>
            <div>
              <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.125rem' }}>Total Expected Revenue</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Collected + Pending</p>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#667eea'
            }}>
              ${(stats.totalRevenue + stats.pendingAmount).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
          Quick Insights
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Collection Rate
            </h3>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.totalRevenue && (stats.totalRevenue + stats.pendingAmount) > 0 ? (stats.totalRevenue / (stats.totalRevenue + stats.pendingAmount) * 100) : 0}%`,
                height: '100%',
                backgroundColor: '#10b981',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {stats.totalRevenue && (stats.totalRevenue + stats.pendingAmount) > 0
                ? ((stats.totalRevenue / (stats.totalRevenue + stats.pendingAmount) * 100)).toFixed(1)
                : 0}% of invoices collected
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Average Payment Time
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>
              ~24
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              days on average
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
