"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/invoices", label: "Invoices", icon: "📄" },
    { href: "/dashboard/customers", label: "Customers", icon: "👥" },
    { href: "/dashboard/products", label: "Products", icon: "📦" },
    { href: "/dashboard/payments", label: "Payments", icon: "💳" },
    { href: "/dashboard/reports", label: "Reports", icon: "📈" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0
        }}>
          {/* Logo */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Invoice Pro
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1.5rem',
                    margin: '0.125rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive ? '#667eea' : '#4b5563',
                    backgroundColor: isActive ? '#ede9fe' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ marginRight: '0.75rem', fontSize: '1.25rem' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                marginRight: '0.75rem'
              }}>
                {session.user.name?.charAt(0) || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                  {session.user.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {session.user.role}
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: '260px',
          minHeight: '100vh'
        }}>
          {/* Header */}
          <header style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '1.5rem 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                  {session.user.tenantName}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#92400e'
                }}>
                  14 days trial remaining
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div style={{ padding: '2rem' }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
