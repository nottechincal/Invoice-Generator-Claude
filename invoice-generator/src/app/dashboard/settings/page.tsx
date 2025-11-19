"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [companyData, setCompanyData] = useState({
    legalName: "",
    tradingName: "",
    taxNumber: "",
    email: "",
    phone: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    invoiceNumberPrefix: "",
    defaultPaymentTerms: 30,
    defaultCurrency: "USD",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch("/api/company");
        if (response.ok) {
          const data = await response.json();
          setCompanyData({
            legalName: data.legalName || "",
            tradingName: data.tradingName || "",
            taxNumber: data.taxNumber || "",
            email: data.email || "",
            phone: data.phone || "",
            website: data.website || "",
            address: data.addresses?.[0] || {
              street: "",
              city: "",
              state: "",
              postalCode: "",
              country: "",
            },
            invoiceNumberPrefix: data.invoiceNumberPrefix || "",
            defaultPaymentTerms: data.defaultPaymentTerms || 30,
            defaultCurrency: data.defaultCurrency || "USD",
          });
        }
      } catch (error) {
        console.error("Failed to fetch company:", error);
      }
    };

    if (session) {
      fetchCompany();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update settings");
        return;
      }

      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Settings
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage your company profile and preferences
        </p>
      </div>

      {success && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #6ee7b7',
          color: '#065f46',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          {success}
        </div>
      )}

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
        {/* Company Information */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            Company Information
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Legal Name
              </label>
              <input
                type="text"
                value={companyData.legalName}
                onChange={(e) => updateField('legalName', e.target.value)}
                placeholder="Acme Corporation Inc."
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Trading Name
                </label>
                <input
                  type="text"
                  value={companyData.tradingName}
                  onChange={(e) => updateField('tradingName', e.target.value)}
                  placeholder="Acme Corp"
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
                  Tax Number
                </label>
                <input
                  type="text"
                  value={companyData.taxNumber}
                  onChange={(e) => updateField('taxNumber', e.target.value)}
                  placeholder="12-3456789"
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
                  Email
                </label>
                <input
                  type="email"
                  value={companyData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="billing@company.com"
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
                  Phone
                </label>
                <input
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Website
              </label>
              <input
                type="url"
                value={companyData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.company.com"
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

        {/* Address */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            Company Address
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Street Address
              </label>
              <input
                type="text"
                value={companyData.address.street}
                onChange={(e) => updateAddress('street', e.target.value)}
                placeholder="123 Business Street"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  City
                </label>
                <input
                  type="text"
                  value={companyData.address.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  placeholder="New York"
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
                  State/Province
                </label>
                <input
                  type="text"
                  value={companyData.address.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  placeholder="NY"
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
                  Postal Code
                </label>
                <input
                  type="text"
                  value={companyData.address.postalCode}
                  onChange={(e) => updateAddress('postalCode', e.target.value)}
                  placeholder="10001"
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
                  Country
                </label>
                <input
                  type="text"
                  value={companyData.address.country}
                  onChange={(e) => updateAddress('country', e.target.value)}
                  placeholder="United States"
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

        {/* Invoice Defaults */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            Invoice Defaults
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Invoice Prefix
              </label>
              <input
                type="text"
                value={companyData.invoiceNumberPrefix}
                onChange={(e) => updateField('invoiceNumberPrefix', e.target.value)}
                placeholder="INV-"
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
                Payment Terms (days)
              </label>
              <input
                type="number"
                value={companyData.defaultPaymentTerms}
                onChange={(e) => updateField('defaultPaymentTerms', parseInt(e.target.value) || 0)}
                min="0"
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
                Default Currency
              </label>
              <select
                value={companyData.defaultCurrency}
                onChange={(e) => updateField('defaultCurrency', e.target.value)}
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
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: loading ? '#9ca3af' : '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
