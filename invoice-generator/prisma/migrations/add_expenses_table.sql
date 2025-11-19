-- Add expenses table for expense tracking
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  expense_number TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  vendor TEXT,
  payment_method TEXT,
  receipt_url TEXT,
  billable BOOLEAN DEFAULT FALSE,
  customer_id TEXT,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_expenses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT unique_expense_number UNIQUE (tenant_id, expense_number)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_customer ON expenses(customer_id);

-- Add time entries table for time tracking
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  customer_id TEXT,
  project_name TEXT,
  task_description TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  hourly_rate DECIMAL(15, 2),
  billable BOOLEAN DEFAULT TRUE,
  invoiced BOOLEAN DEFAULT FALSE,
  invoice_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_time_entries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_time_entries_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_time_entries_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- Add indexes for time entries
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant ON time_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_customer ON time_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(billable, invoiced);
