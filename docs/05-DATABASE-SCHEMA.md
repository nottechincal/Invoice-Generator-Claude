# DATABASE SCHEMA - ENTERPRISE INVOICE GENERATOR

## 1. ENTITY RELATIONSHIP DIAGRAM (ER DIAGRAM)

```
┌─────────────────────┐
│      tenants        │
│─────────────────────│
│ id (PK)             │
│ name                │
│ subdomain           │
│ custom_domain       │
│ plan                │
│ status              │
│ max_users           │
│ max_invoices        │
│ features (JSONB)    │
│ settings (JSONB)    │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           │
  ┌────────┼────────────────────────────────────────────────────┐
  │        │                                                     │
  ▼        ▼                                                     ▼
┌──────────────────┐  ┌──────────────────────┐   ┌────────────────────────┐
│      users       │  │     companies        │   │    audit_logs          │
│──────────────────│  │──────────────────────│   │────────────────────────│
│ id (PK)          │  │ id (PK)              │   │ id (PK)                │
│ tenant_id (FK)   │  │ tenant_id (FK)       │   │ tenant_id (FK)         │
│ email            │  │ legal_name           │   │ event_type             │
│ password_hash    │  │ trading_name         │   │ actor_id (FK)          │
│ first_name       │  │ tax_number           │   │ resource_type          │
│ last_name        │  │ logo_url             │   │ resource_id            │
│ role             │  │ website              │   │ action                 │
│ status           │  │ email                │   │ metadata (JSONB)       │
│ last_login       │  │ phone                │   │ ip_address             │
│ created_at       │  │ addresses (JSONB)    │   │ created_at             │
└────────┬─────────┘  │ bank_details (JSONB) │   └────────────────────────┘
         │            │ settings (JSONB)     │
         │            │ created_at           │
         │            └──────────┬───────────┘
         │                       │
         │ 1:N                   │ 1:N
         │                       │
         │       ┌───────────────┼───────────────────────────┐
         │       │               │                           │
         ▼       ▼               ▼                           ▼
┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│     customers       │  │     tax_profiles     │  │     templates        │
│─────────────────────│  │──────────────────────│  │──────────────────────│
│ id (PK)             │  │ id (PK)              │  │ id (PK)              │
│ tenant_id (FK)      │  │ tenant_id (FK)       │  │ tenant_id (FK)       │
│ company_id (FK)     │  │ company_id (FK)      │  │ company_id (FK)      │
│ name                │  │ name                 │  │ name                 │
│ company_name        │  │ type                 │  │ description          │
│ email               │  │ rate                 │  │ html_content         │
│ phone               │  │ compound             │  │ css_content          │
│ tax_number          │  │ inclusive            │  │ is_default           │
│ billing_address     │  │ applies_to           │  │ preview_url          │
│ shipping_address    │  │ jurisdiction         │  │ created_at           │
│ payment_terms       │  │ created_at           │  │ updated_at           │
│ currency            │  └──────────────────────┘  └──────────────────────┘
│ credit_limit        │
│ notes               │
│ status              │
│ created_by (FK)     │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           invoices                                      │
│─────────────────────────────────────────────────────────────────────────│
│ id (PK)                                                                 │
│ tenant_id (FK)                                                          │
│ company_id (FK)                                                         │
│ customer_id (FK)                                                        │
│ number                                                                  │
│ status (draft, sent, viewed, partial, paid, overdue, void, cancelled)  │
│ issue_date                                                              │
│ due_date                                                                │
│ currency                                                                │
│ exchange_rate                                                           │
│ subtotal                                                                │
│ tax_total                                                               │
│ discount_total                                                          │
│ total                                                                   │
│ amount_paid                                                             │
│ amount_due                                                              │
│ notes                                                                   │
│ terms                                                                   │
│ reference                                                               │
│ po_number                                                               │
│ template_id (FK)                                                        │
│ pdf_url                                                                 │
│ public_token                                                            │
│ sent_at                                                                 │
│ viewed_at                                                               │
│ paid_at                                                                 │
│ voided_at                                                               │
│ version                                                                 │
│ created_by (FK)                                                         │
│ created_at                                                              │
│ updated_at                                                              │
└──────────┬────────────────────────────────────────┬─────────────────────┘
           │                                        │
           │ 1:N                                    │ 1:N
           │                                        │
           ▼                                        ▼
┌────────────────────────┐               ┌─────────────────────────┐
│    invoice_items       │               │    invoice_versions     │
│────────────────────────│               │─────────────────────────│
│ id (PK)                │               │ id (PK)                 │
│ invoice_id (FK)        │               │ invoice_id (FK)         │
│ product_id (FK)        │               │ version                 │
│ description            │               │ change_type             │
│ quantity               │               │ reason                  │
│ unit                   │               │ snapshot (JSONB)        │
│ unit_price             │               │ diff (JSONB)            │
│ discount_percent       │               │ created_by (FK)         │
│ discount_amount        │               │ created_at              │
│ tax_profile_id (FK)    │               └─────────────────────────┘
│ tax_percent            │
│ tax_amount             │               ┌─────────────────────────┐
│ subtotal               │               │    recurring_invoices   │
│ total                  │               │─────────────────────────│
│ sort_order             │               │ id (PK)                 │
│ created_at             │               │ template_invoice_id (FK)│
│ updated_at             │               │ frequency               │
└────────────────────────┘               │ interval                │
                                         │ start_date              │
                                         │ end_date                │
┌────────────────────────┐               │ next_invoice_date       │
│      products          │               │ occurrences_limit       │
│────────────────────────│               │ occurrences_count       │
│ id (PK)                │               │ auto_send               │
│ tenant_id (FK)         │               │ status                  │
│ company_id (FK)        │               │ created_at              │
│ name                   │               └─────────────────────────┘
│ description            │
│ sku                    │
│ unit_price             │
│ unit                   │
│ tax_profile_id (FK)    │
│ account_code           │
│ category               │
│ is_active              │
│ created_at             │
│ updated_at             │
└────────────────────────┘
           ▲
           │ 1:N
           │
┌──────────┴──────────────────────────────────────────────────────────────┐
│                           payments                                      │
│─────────────────────────────────────────────────────────────────────────│
│ id (PK)                                                                 │
│ tenant_id (FK)                                                          │
│ invoice_id (FK)                                                         │
│ customer_id (FK)                                                        │
│ payment_number                                                          │
│ amount                                                                  │
│ currency                                                                │
│ payment_method (card, bank_transfer, cash, check, paypal, stripe, etc) │
│ reference                                                               │
│ transaction_id                                                          │
│ gateway                                                                 │
│ gateway_response (JSONB)                                                │
│ status (pending, processing, succeeded, failed, refunded)               │
│ payment_date                                                            │
│ notes                                                                   │
│ created_by (FK)                                                         │
│ created_at                                                              │
│ updated_at                                                              │
└──────────┬──────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────┐
│      refunds            │
│─────────────────────────│
│ id (PK)                 │
│ payment_id (FK)         │
│ amount                  │
│ reason                  │
│ refund_date             │
│ gateway_refund_id       │
│ created_by (FK)         │
│ created_at              │
└─────────────────────────┘


┌─────────────────────────┐          ┌─────────────────────────┐
│   payment_reminders     │          │      notifications      │
│─────────────────────────│          │─────────────────────────│
│ id (PK)                 │          │ id (PK)                 │
│ invoice_id (FK)         │          │ tenant_id (FK)          │
│ reminder_type           │          │ type                    │
│ scheduled_date          │          │ channel                 │
│ sent_date               │          │ recipient               │
│ status                  │          │ subject                 │
│ created_at              │          │ body                    │
└─────────────────────────┘          │ metadata (JSONB)        │
                                     │ status                  │
                                     │ sent_at                 │
┌─────────────────────────┐          │ created_at              │
│    integrations         │          └─────────────────────────┘
│─────────────────────────│
│ id (PK)                 │
│ tenant_id (FK)          │          ┌─────────────────────────┐
│ company_id (FK)         │          │       webhooks          │
│ provider                │          │─────────────────────────│
│ status                  │          │ id (PK)                 │
│ credentials (encrypted) │          │ tenant_id (FK)          │
│ settings (JSONB)        │          │ url                     │
│ last_sync_at            │          │ events (ARRAY)          │
│ sync_status             │          │ secret                  │
│ error_message           │          │ active                  │
│ created_at              │          │ created_at              │
│ updated_at              │          │ updated_at              │
└─────────────────────────┘          └──────────┬──────────────┘
                                                │
                                                │ 1:N
                                                │
                                                ▼
                                     ┌─────────────────────────┐
                                     │   webhook_deliveries    │
                                     │─────────────────────────│
                                     │ id (PK)                 │
                                     │ webhook_id (FK)         │
                                     │ event_type              │
                                     │ payload (JSONB)         │
                                     │ response_code           │
                                     │ response_body           │
                                     │ attempt_count           │
                                     │ delivered_at            │
                                     │ created_at              │
                                     └─────────────────────────┘
```

## 2. TABLE DEFINITIONS

### 2.1 Core Tables

#### tenants

Multi-tenant isolation table - each customer organization is a tenant.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE NOT NULL,  -- e.g., 'acme' for acme.invoiceapp.com
  custom_domain VARCHAR(255),              -- e.g., 'invoices.acme.com'
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',  -- starter, professional, enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, trial, suspended, cancelled
  max_users INT,
  max_invoices INT,
  features JSONB DEFAULT '{}',             -- {"api_access": true, "white_label": false}
  settings JSONB DEFAULT '{}',             -- tenant-specific settings
  trial_ends_at TIMESTAMPTZ,
  subscription_id VARCHAR(255),            -- Stripe subscription ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_subdomain CHECK (subdomain ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_plan CHECK (plan IN ('starter', 'professional', 'enterprise')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'trial', 'suspended', 'cancelled'))
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_status ON tenants(status);
```

**Sample Data:**
```sql
INSERT INTO tenants (name, subdomain, plan, status, max_users, max_invoices, features) VALUES
('ACME Corporation', 'acme', 'enterprise', 'active', NULL, NULL, '{"api_access": true, "white_label": true, "sso": true}'),
('Small Business Inc', 'smallbiz', 'professional', 'active', 10, 1000, '{"api_access": true, "white_label": false}'),
('Freelance Design', 'jdoe', 'starter', 'trial', 3, 100, '{"api_access": false, "white_label": false}');
```

#### users

User accounts within each tenant.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),              -- NULL for SSO-only users
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'team_member',  -- owner, admin, accountant, manager, team_member, viewer
  permissions JSONB DEFAULT '{}',          -- Custom permissions for enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'active',     -- active, inactive, suspended
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),                 -- TOTP secret (encrypted)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'accountant', 'manager', 'team_member', 'viewer')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended')),
  UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(tenant_id, role);
```

#### companies

Multiple business entities within a tenant (e.g., subsidiaries, franchises).

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  legal_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),               -- DBA (Doing Business As)
  tax_number VARCHAR(100),                 -- ABN, VAT, EIN, GST number
  registration_number VARCHAR(100),
  logo_url VARCHAR(500),
  website VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  addresses JSONB DEFAULT '[]',            -- Array of addresses: [{type, street, city, state, postal_code, country}]
  bank_details JSONB DEFAULT '[]',         -- Array of bank accounts (encrypted)
  settings JSONB DEFAULT '{}',             -- Company-specific settings
  invoice_number_prefix VARCHAR(20),
  invoice_number_next INT DEFAULT 1,
  default_payment_terms INT DEFAULT 30,    -- Net 30
  default_currency VARCHAR(3) DEFAULT 'USD',
  default_tax_profile_id UUID,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_default_tax_profile FOREIGN KEY (default_tax_profile_id) REFERENCES tax_profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_companies_tax_number ON companies(tenant_id, tax_number);
CREATE UNIQUE INDEX idx_companies_default ON companies(tenant_id) WHERE is_default = TRUE;

-- Ensure only one default company per tenant
CREATE OR REPLACE FUNCTION ensure_one_default_company()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE companies SET is_default = FALSE
    WHERE tenant_id = NEW.tenant_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_one_default_company
BEFORE INSERT OR UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION ensure_one_default_company();
```

#### customers

Customer/client records.

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_type VARCHAR(50) DEFAULT 'business',  -- business, individual
  name VARCHAR(255) NOT NULL,                    -- Full name or company name
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  tax_number VARCHAR(100),                       -- Customer's tax ID
  tax_exempt BOOLEAN DEFAULT FALSE,
  tax_exemption_cert_url VARCHAR(500),           -- Link to exemption certificate
  billing_address JSONB,                         -- {street, city, state, postal_code, country}
  shipping_address JSONB,
  payment_terms INT DEFAULT 30,                  -- Net days
  preferred_payment_method VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'USD',
  credit_limit DECIMAL(15,2),
  balance DECIMAL(15,2) DEFAULT 0,               -- Running balance
  notes TEXT,
  tags VARCHAR(255)[],                           -- Array of tags for categorization
  custom_fields JSONB DEFAULT '{}',              -- User-defined fields
  status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, inactive, archived
  xero_id VARCHAR(255),                          -- External system IDs
  quickbooks_id VARCHAR(255),
  myob_id VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_customer_type CHECK (customer_type IN ('business', 'individual')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(tenant_id, name);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
CREATE INDEX idx_customers_search ON customers USING GIN(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(email, ''))
);
```

### 2.2 Invoice Tables

#### invoices

Main invoice table - partitioned by issue_date for performance.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  number VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  invoice_type VARCHAR(50) DEFAULT 'standard',   -- standard, recurring, deposit, credit_note
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(15,6) DEFAULT 1.0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_type VARCHAR(20),                     -- percent, fixed
  discount_value DECIMAL(15,2),
  discount_total DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(15,2) DEFAULT 0,
  surcharges JSONB DEFAULT '[]',                 -- [{name, amount, taxable}]
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  footer TEXT,
  reference VARCHAR(255),
  po_number VARCHAR(100),
  template_id UUID REFERENCES templates(id),
  pdf_url VARCHAR(500),
  pdf_generated_at TIMESTAMPTZ,
  public_token VARCHAR(64) UNIQUE,               -- For shareable public links
  public_link_expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  version INT NOT NULL DEFAULT 1,
  parent_invoice_id UUID REFERENCES invoices(id), -- For amended invoices
  recurring_invoice_id UUID REFERENCES recurring_invoices(id),
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',                   -- Additional data (project_id, etc.)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'cancelled')),
  CONSTRAINT valid_invoice_type CHECK (invoice_type IN ('standard', 'recurring', 'deposit', 'credit_note', 'proforma')),
  CONSTRAINT valid_amounts CHECK (total = subtotal - discount_total + tax_total + shipping_cost),
  CONSTRAINT valid_due_date CHECK (due_date >= issue_date),
  UNIQUE (tenant_id, company_id, number)
) PARTITION BY RANGE (issue_date);

-- Create partitions (quarterly for 2025-2027)
CREATE TABLE invoices_2025_q1 PARTITION OF invoices FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE invoices_2025_q2 PARTITION OF invoices FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE invoices_2025_q3 PARTITION OF invoices FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE invoices_2025_q4 PARTITION OF invoices FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
-- ... continue for future quarters

-- Indexes
CREATE INDEX idx_invoices_tenant_date ON invoices(tenant_id, issue_date DESC);
CREATE INDEX idx_invoices_number ON invoices(tenant_id, company_id, number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id, issue_date DESC);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status) WHERE status IN ('draft', 'sent', 'overdue');
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status IN ('sent', 'partial', 'overdue');
CREATE INDEX idx_invoices_public_token ON invoices(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX idx_invoices_search ON invoices USING GIN(
  to_tsvector('english', coalesce(number, '') || ' ' || coalesce(reference, '') || ' ' || coalesce(po_number, ''))
);
```

#### invoice_items

Line items for invoices.

```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'unit',               -- unit, hour, day, month, kg, etc.
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,               -- quantity * unit_price - discount
  tax_profile_id UUID REFERENCES tax_profiles(id),
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,                  -- subtotal + tax_amount
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',                   -- {project_id, time_entry_ids, etc.}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_unit_price CHECK (unit_price >= 0)
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id, sort_order);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
```

#### invoice_versions

Version history for invoices (audit trail).

```sql
CREATE TABLE invoice_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  version INT NOT NULL,
  change_type VARCHAR(50) NOT NULL,              -- created, updated, amended, voided
  reason TEXT,
  snapshot JSONB NOT NULL,                       -- Complete invoice state at this version
  diff JSONB,                                    -- Changes from previous version
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_change_type CHECK (change_type IN ('created', 'updated', 'amended', 'sent', 'paid', 'voided', 'cancelled')),
  UNIQUE (invoice_id, version)
);

CREATE INDEX idx_invoice_versions_invoice ON invoice_versions(invoice_id, version DESC);
CREATE INDEX idx_invoice_versions_created_at ON invoice_versions(created_at DESC);
```

#### recurring_invoices

Configuration for recurring invoices.

```sql
CREATE TABLE recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  frequency VARCHAR(50) NOT NULL,                -- daily, weekly, monthly, quarterly, annually, custom
  interval INT DEFAULT 1,                        -- Every X days/weeks/months
  start_date DATE NOT NULL,
  end_date DATE,                                 -- NULL for indefinite
  next_invoice_date DATE NOT NULL,
  occurrences_limit INT,                         -- Max number of invoices (NULL for unlimited)
  occurrences_count INT DEFAULT 0,               -- Invoices generated so far
  day_of_month INT,                              -- For monthly (1-31)
  day_of_week INT,                               -- For weekly (0=Sun, 6=Sat)
  auto_send BOOLEAN DEFAULT FALSE,
  send_time TIME DEFAULT '09:00:00',
  status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, paused, completed, cancelled
  last_generated_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  CONSTRAINT valid_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6))
);

CREATE INDEX idx_recurring_invoices_tenant ON recurring_invoices(tenant_id);
CREATE INDEX idx_recurring_invoices_next_date ON recurring_invoices(next_invoice_date) WHERE status = 'active';
CREATE INDEX idx_recurring_invoices_status ON recurring_invoices(status);
```

### 2.3 Payment Tables

#### payments

Payment records linked to invoices.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,  -- NULL for unapplied payments
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  payment_number VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(15,6) DEFAULT 1.0,
  payment_method VARCHAR(50) NOT NULL,           -- card, bank_transfer, cash, check, paypal, stripe, square, other
  payment_date DATE NOT NULL,
  reference VARCHAR(255),                        -- Check number, transaction ID, etc.
  transaction_id VARCHAR(255),                   -- Gateway transaction ID
  gateway VARCHAR(50),                           -- stripe, paypal, square, etc.
  gateway_response JSONB,                        -- Full gateway response
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded
  failure_reason TEXT,
  notes TEXT,
  bank_account_id VARCHAR(255),                  -- For reconciliation
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES users(id),
  deposit_to_account VARCHAR(100),               -- Accounting system account code
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('card', 'bank_transfer', 'ach', 'wire', 'cash', 'check', 'paypal', 'stripe', 'square', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')),
  UNIQUE (tenant_id, payment_number)
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway ON payments(gateway, transaction_id);
CREATE INDEX idx_payments_reconciled ON payments(reconciled) WHERE reconciled = FALSE;
```

#### refunds

Refund records for payments.

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  reason TEXT,
  refund_date DATE NOT NULL,
  gateway_refund_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_refund_amount CHECK (amount > 0),
  CONSTRAINT valid_refund_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed'))
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_date ON refunds(refund_date DESC);
```

### 2.4 Product & Tax Tables

#### products

Product/service catalog.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  unit_price DECIMAL(15,2) NOT NULL,
  cost_price DECIMAL(15,2),                      -- For profit margin calculation
  unit VARCHAR(50) DEFAULT 'unit',
  tax_profile_id UUID REFERENCES tax_profiles(id),
  account_code VARCHAR(50),                      -- Accounting system reference
  category VARCHAR(100),
  tags VARCHAR(255)[],
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  track_inventory BOOLEAN DEFAULT FALSE,
  inventory_quantity DECIMAL(15,3),
  low_stock_threshold DECIMAL(15,3),
  custom_fields JSONB DEFAULT '{}',
  xero_id VARCHAR(255),
  quickbooks_id VARCHAR(255),
  myob_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_unit_price CHECK (unit_price >= 0),
  UNIQUE (tenant_id, sku)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_name ON products(tenant_id, name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
```

#### tax_profiles

Tax rate configurations.

```sql
CREATE TABLE tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,                     -- VAT, GST, sales_tax, withholding, etc.
  rate DECIMAL(5,2) NOT NULL,
  compound BOOLEAN DEFAULT FALSE,                -- Tax on tax (e.g., Quebec PST on GST)
  inclusive BOOLEAN DEFAULT FALSE,               -- Tax included in price
  applies_to VARCHAR(50) DEFAULT 'all',          -- all, products, services
  jurisdiction VARCHAR(100),                     -- Country, state, region
  tax_authority VARCHAR(255),
  registration_number VARCHAR(100),
  start_date DATE,
  end_date DATE,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  xero_id VARCHAR(255),
  quickbooks_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_tax_type CHECK (type IN ('VAT', 'GST', 'sales_tax', 'PST', 'HST', 'withholding', 'other')),
  CONSTRAINT valid_rate CHECK (rate >= 0 AND rate <= 100),
  CONSTRAINT valid_applies_to CHECK (applies_to IN ('all', 'products', 'services'))
);

CREATE INDEX idx_tax_profiles_tenant ON tax_profiles(tenant_id);
CREATE INDEX idx_tax_profiles_company ON tax_profiles(company_id);
CREATE INDEX idx_tax_profiles_jurisdiction ON tax_profiles(jurisdiction);
CREATE INDEX idx_tax_profiles_active ON tax_profiles(is_active);
```

### 2.5 Template & Notification Tables

#### templates

Invoice template designs.

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  css_content TEXT,
  preview_url VARCHAR(500),
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,               -- Available to all tenants
  category VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_tenant ON templates(tenant_id);
CREATE INDEX idx_templates_company ON templates(company_id);
CREATE INDEX idx_templates_public ON templates(is_public) WHERE is_public = TRUE;
```

#### payment_reminders

Scheduled payment reminder records.

```sql
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,            -- pre_due, on_due, overdue_3d, overdue_7d, overdue_14d, overdue_30d
  scheduled_date TIMESTAMPTZ NOT NULL,
  sent_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, failed, skipped
  channel VARCHAR(50) NOT NULL DEFAULT 'email',  -- email, sms, both
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_reminder_type CHECK (reminder_type IN ('pre_due', 'on_due', 'overdue_3d', 'overdue_7d', 'overdue_14d', 'overdue_30d', 'custom')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  CONSTRAINT valid_channel CHECK (channel IN ('email', 'sms', 'both'))
);

CREATE INDEX idx_payment_reminders_invoice ON payment_reminders(invoice_id);
CREATE INDEX idx_payment_reminders_scheduled ON payment_reminders(scheduled_date) WHERE status = 'pending';
```

#### notifications

General notification log (email, SMS, push).

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,                     -- invoice_sent, payment_received, reminder, etc.
  channel VARCHAR(50) NOT NULL,                  -- email, sms, push, webhook
  recipient VARCHAR(255) NOT NULL,               -- Email or phone number
  subject VARCHAR(500),
  body TEXT,
  metadata JSONB DEFAULT '{}',                   -- {invoice_id, payment_id, etc.}
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,                         -- For email tracking
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  provider VARCHAR(50),                          -- sendgrid, twilio, etc.
  provider_message_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_channel CHECK (channel IN ('email', 'sms', 'push', 'webhook', 'slack')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'))
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 2.6 Integration Tables

#### integrations

Third-party integration configurations.

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,                 -- xero, quickbooks, myob, stripe, paypal, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  credentials TEXT,                              -- Encrypted JSON with API keys/tokens
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(50),
  sync_direction VARCHAR(50) DEFAULT 'bidirectional',  -- push, pull, bidirectional
  error_message TEXT,
  error_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_provider CHECK (provider IN ('xero', 'quickbooks', 'myob', 'stripe', 'paypal', 'square', 'plaid', 'zapier', 'make')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'disconnected')),
  CONSTRAINT valid_sync_direction CHECK (sync_direction IN ('push', 'pull', 'bidirectional')),
  UNIQUE (tenant_id, provider, company_id)
);

CREATE INDEX idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
```

#### webhooks

Webhook configurations for event notifications.

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  events VARCHAR(100)[] NOT NULL,                -- Array of event types to listen for
  secret VARCHAR(255) NOT NULL,                  -- For signature verification
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_url CHECK (url ~ '^https?://')
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_active ON webhooks(active) WHERE active = TRUE;
```

#### webhook_deliveries

Webhook delivery log for debugging and retry.

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_code INT,
  response_body TEXT,
  response_time_ms INT,
  attempt_count INT DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_response_code CHECK (response_code IS NULL OR (response_code >= 100 AND response_code < 600))
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX idx_webhook_deliveries_failed ON webhook_deliveries(webhook_id) WHERE response_code >= 400;
```

### 2.7 Audit & Security Tables

#### audit_logs

Complete audit trail (referenced in architecture section).

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  actor_type VARCHAR(50) NOT NULL,               -- user, api_key, system
  actor_id UUID,
  actor_name VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id UUID,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'success',
  metadata JSONB DEFAULT '{}',
  changes JSONB,                                 -- Before/after state
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_actor_type CHECK (actor_type IN ('user', 'api_key', 'system', 'webhook')),
  CONSTRAINT valid_action CHECK (action IN ('create', 'read', 'update', 'delete', 'send', 'pay', 'void', 'export')),
  CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'partial'))
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- ... continue

CREATE INDEX idx_audit_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
```

## 3. DATA RELATIONSHIPS SUMMARY

**One-to-Many (1:N):**
- Tenant → Users
- Tenant → Companies
- Tenant → Customers
- Tenant → Invoices
- Company → Invoices
- Customer → Invoices
- Invoice → Invoice Items
- Invoice → Payments
- Invoice → Invoice Versions
- Payment → Refunds

**Many-to-One (N:1):**
- Invoice → Customer
- Invoice → Company
- Invoice → Template
- Invoice Item → Product
- Invoice Item → Tax Profile

**One-to-One (1:1):**
- Invoice → Recurring Invoice (optional)
- Company → Default Tax Profile (optional)

## 4. DATA INTEGRITY CONSTRAINTS

**Referential Integrity:**
- All foreign keys use `REFERENCES` with appropriate `ON DELETE` actions
- `CASCADE`: Delete dependent records (e.g., deleting tenant deletes all its data)
- `RESTRICT`: Prevent deletion if dependencies exist (e.g., can't delete customer with invoices)
- `SET NULL`: Set to NULL on deletion (e.g., deleting product doesn't delete invoice items)

**Business Logic Constraints:**
- Invoice total must equal subtotal - discount + tax + shipping
- Payment amount must be positive
- Due date must be >= issue date
- Tax rate must be 0-100%
- Only one default company/template per tenant

**Unique Constraints:**
- (tenant_id, email) for users
- (tenant_id, company_id, number) for invoices
- (tenant_id, number) for payments
- (tenant_id, subdomain) for tenants

This database schema provides a robust foundation for the enterprise invoice generator with full audit trail, multi-tenancy support, and scalability!
