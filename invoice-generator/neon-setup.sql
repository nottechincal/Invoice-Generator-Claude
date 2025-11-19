-- ============================================================================
-- ENTERPRISE INVOICE GENERATOR - NEON DATABASE SETUP
-- ============================================================================
-- Run this entire script in Neon SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop all tables if they exist (for clean setup)
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_versions CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS tax_profiles CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================================================
-- TENANTS
-- ============================================================================

CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER,
  max_invoices INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  trial_ends_at TIMESTAMPTZ,
  subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'team_member',
  permissions JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================================
-- TAX PROFILES (Created before companies due to FK)
-- ============================================================================

CREATE TABLE tax_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  compound BOOLEAN NOT NULL DEFAULT FALSE,
  inclusive BOOLEAN NOT NULL DEFAULT FALSE,
  applies_to TEXT NOT NULL DEFAULT 'all',
  jurisdiction TEXT,
  tax_authority TEXT,
  registration_number TEXT,
  start_date DATE,
  end_date DATE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_profiles_tenant_id ON tax_profiles(tenant_id);
CREATE INDEX idx_tax_profiles_company_id ON tax_profiles(company_id);
CREATE INDEX idx_tax_profiles_is_active ON tax_profiles(is_active);

-- ============================================================================
-- COMPANIES
-- ============================================================================

CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  tax_number TEXT,
  registration_number TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  addresses JSONB NOT NULL DEFAULT '[]',
  bank_details JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  invoice_number_prefix TEXT,
  invoice_number_next INTEGER NOT NULL DEFAULT 1,
  default_payment_terms INTEGER NOT NULL DEFAULT 30,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  default_tax_profile_id TEXT REFERENCES tax_profiles(id) ON DELETE SET NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX idx_companies_tenant_tax ON companies(tenant_id, tax_number);

-- Add FK from tax_profiles to companies (circular relationship)
ALTER TABLE tax_profiles ADD CONSTRAINT fk_tax_profiles_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_type TEXT NOT NULL DEFAULT 'business',
  name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  tax_number TEXT,
  tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  tax_exemption_cert_url TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  payment_terms INTEGER NOT NULL DEFAULT 30,
  preferred_payment_method TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  credit_limit DECIMAL(15, 2),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  xero_id TEXT,
  quickbooks_id TEXT,
  myob_id TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  invoice_type TEXT NOT NULL DEFAULT 'standard',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(15, 6) NOT NULL DEFAULT 1.0,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_type TEXT,
  discount_value DECIMAL(15, 2),
  discount_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  surcharges JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  footer TEXT,
  reference TEXT,
  po_number TEXT,
  template_id TEXT,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  public_token TEXT UNIQUE,
  public_link_expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_invoice_id TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, company_id, number)
);

CREATE INDEX idx_invoices_tenant_issue_date ON invoices(tenant_id, issue_date);
CREATE INDEX idx_invoices_customer_issue_date ON invoices(customer_id, issue_date);
CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_public_token ON invoices(public_token);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  unit_price DECIMAL(15, 2) NOT NULL,
  cost_price DECIMAL(15, 2),
  unit TEXT NOT NULL DEFAULT 'unit',
  tax_profile_id TEXT REFERENCES tax_profiles(id),
  account_code TEXT,
  category TEXT,
  tags TEXT[],
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  track_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_quantity DECIMAL(15, 3),
  custom_fields JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ============================================================================
-- INVOICE ITEMS
-- ============================================================================

CREATE TABLE invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unit',
  unit_price DECIMAL(15, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15, 2) NOT NULL,
  tax_profile_id TEXT REFERENCES tax_profiles(id),
  tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice_sort ON invoice_items(invoice_id, sort_order);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- ============================================================================
-- INVOICE VERSIONS
-- ============================================================================

CREATE TABLE invoice_versions (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  reason TEXT,
  snapshot JSONB NOT NULL,
  diff JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id, version)
);

CREATE INDEX idx_invoice_versions_invoice_version ON invoice_versions(invoice_id, version);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  payment_number TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(15, 6) NOT NULL DEFAULT 1.0,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  reference TEXT,
  transaction_id TEXT,
  gateway TEXT,
  gateway_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  notes TEXT,
  reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  reconciled_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, payment_number)
);

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  metadata JSONB NOT NULL DEFAULT '{}',
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================

CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id TEXT,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  credentials TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,
  error_message TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_integrations_tenant_id ON integrations(tenant_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete! 12 tables created successfully.';
  RAISE NOTICE '📊 Tables: tenants, users, companies, tax_profiles, customers, invoices, invoice_items, invoice_versions, products, payments, audit_logs, integrations';
END $$;
