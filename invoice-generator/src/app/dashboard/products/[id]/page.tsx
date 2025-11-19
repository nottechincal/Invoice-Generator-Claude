"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ProductDetail {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  unit: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    unitPrice: "",
    unit: "unit",
    category: "",
    isActive: true,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          setFormData({
            name: data.name || "",
            description: data.description || "",
            sku: data.sku || "",
            unitPrice: data.unitPrice?.toString() || "",
            unit: data.unit || "unit",
            category: data.category || "",
            isActive: data.isActive ?? true,
          });
        } else {
          setError("Product not found");
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (session && params.id) {
      fetchProduct();
    }
  }, [session, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          unitPrice: parseFloat(formData.unitPrice),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update product");
        return;
      }

      router.push("/dashboard/products");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <p style={{ color: '#6b7280' }}>Loading product...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          {error || "Product not found"}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          The product you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/dashboard/products">
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
            Back to Products
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Edit Product
        </h1>
        <p style={{ color: '#6b7280' }}>Update product details</p>
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
        {/* Product Details */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            Product Details
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
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
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  SKU / Item Code
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
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
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Unit Price *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>$</span>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => updateField('unitPrice', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2rem',
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
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => updateField('unit', e.target.value)}
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
                  <option value="unit">Unit</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="item">Item</option>
                  <option value="service">Service</option>
                  <option value="kg">Kilogram</option>
                  <option value="lb">Pound</option>
                  <option value="box">Box</option>
                  <option value="piece">Piece</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                  Active (available for invoicing)
                </span>
              </label>
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
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: saving ? '#9ca3af' : '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
