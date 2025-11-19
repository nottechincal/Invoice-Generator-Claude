# FEATURES: PAYMENTS, INTEGRATIONS & ENTERPRISE

## 4. PAYMENTS

### 4.1 Payment Gateway Integrations

#### Stripe Integration

**Features:**
- **Payment Methods:** Credit/debit cards, ACH, SEPA, iDEAL, Alipay, WeChat Pay
- **Checkout Experience:**
  - Stripe Checkout (hosted page)
  - Stripe Elements (embedded form)
  - Payment Links (no code required)
- **3D Secure 2:** Automatic Strong Customer Authentication (SCA)
- **Recurring Payments:** Save payment methods for subscriptions
- **Multi-Currency:** 135+ currencies

**Implementation:**
```javascript
// Backend: Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: invoice.total * 100, // cents
  currency: invoice.currency.toLowerCase(),
  metadata: {
    invoice_id: invoice.id,
    invoice_number: invoice.number,
    customer_id: invoice.customer_id
  },
  receipt_email: invoice.customer.email,
  description: `Invoice ${invoice.number}`
});

// Frontend: Confirm payment
const {error} = await stripe.confirmCardPayment(
  clientSecret,
  {payment_method: paymentMethod}
);
```

**Webhook Events:**
- `payment_intent.succeeded` → Mark invoice as paid
- `payment_intent.payment_failed` → Notify customer and user
- `charge.refunded` → Record refund
- `charge.disputed` → Flag for review

**Features:**
- Automatic payment confirmation (no manual reconciliation)
- Refund processing (full or partial)
- Dispute management integration
- Fraud detection (Stripe Radar)
- PCI compliance (Stripe handles card data)

#### PayPal Integration

**Features:**
- **PayPal Checkout:** Redirect to PayPal, return to invoice
- **PayPal Buttons:** Embedded payment button
- **PayPal Credit:** Buy now, pay later option
- **Venmo:** US mobile payments
- **PayPal Business:** Invoice financing options

**Implementation:**
```javascript
// Create PayPal order
paypal.orders.create({
  intent: 'CAPTURE',
  purchase_units: [{
    reference_id: invoice.number,
    amount: {
      currency_code: invoice.currency,
      value: invoice.total.toFixed(2)
    },
    invoice_id: invoice.number,
    description: `Invoice ${invoice.number}`
  }]
});

// Capture payment on approval
paypal.orders.capture(orderId);
```

**Webhook Events:**
- `PAYMENT.CAPTURE.COMPLETED` → Mark invoice as paid
- `PAYMENT.CAPTURE.REFUNDED` → Record refund
- `PAYMENT.CAPTURE.DENIED` → Flag for review

#### Square Integration

**Features:**
- **Square Terminal:** In-person payments (retail, events)
- **Square Online Checkout:** E-commerce integration
- **Square Invoices:** Alternative invoice system (can sync)
- **Cash App Pay:** Instant payment option
- **Afterpay:** Buy now, pay later

**Use Cases:**
- Retail businesses with POS integration
- Service businesses accepting in-person payments
- Mobile payment collection (Square Reader)

#### Generic Payment Gateway Support

**Supported via API:**
- Authorize.Net
- Braintree
- 2Checkout (Verifone)
- Adyen
- Worldpay
- Mollie (Europe)
- Razorpay (India)
- Mercado Pago (Latin America)

**Integration Pattern:**
1. User configures payment gateway (API keys)
2. System generates payment URL with invoice details
3. Customer redirects to gateway, completes payment
4. Webhook received → Payment recorded
5. Customer redirected back to invoice page (paid status)

### 4.2 Real-Time Payment Status

**Payment States:**

```
Invoice Created → Sent → Viewed → Payment Initiated → Payment Processing → Paid

Alternative paths:
→ Partially Paid (split payments)
→ Payment Failed (retry available)
→ Overdue (no payment by due date)
→ Written Off (uncollectible)
→ Refunded (full or partial)
```

**Real-Time Updates:**

**WebSocket Connection:**
```javascript
// Frontend subscribes to invoice updates
const socket = io();
socket.emit('subscribe', `invoice:${invoiceId}`);

socket.on('invoice:payment_received', (data) => {
  // Update UI: Show payment success
  updateInvoiceStatus('paid');
  showNotification('Payment received!');
});

socket.on('invoice:viewed', (data) => {
  // Customer viewed invoice
  showNotification('Customer viewed invoice');
});
```

**Status Tracking Events:**
- Invoice created
- Invoice sent (email)
- Invoice viewed (opened link/PDF)
- Invoice downloaded
- Payment link clicked
- Payment initiated (customer on payment page)
- Payment processing (3D Secure, bank verification)
- Payment succeeded
- Payment failed (with reason)
- Partial payment received
- Full payment received
- Refund initiated
- Refund completed

**Real-Time Dashboard:**
- Live updates without page refresh
- Push notifications (browser, mobile)
- Email notifications (configurable)
- SMS notifications (high-value invoices)

**Customer Payment Experience:**
1. Click "Pay Now" on invoice
2. Redirect to payment page (hosted or embedded)
3. Enter payment details
4. Submit payment
5. Real-time status: "Processing payment..."
6. Success: "Payment received! Redirecting..."
7. Email receipt sent immediately
8. Invoice status updated to "Paid" in user dashboard

### 4.3 Partial Payments

**Use Cases:**
- Customer pays in installments
- Deposit + final payment structure
- Cash flow constraints (pay what you can)
- Dispute resolution (agreed partial payment)

**Partial Payment Configuration:**

**Per Invoice Settings:**
- Allow partial payments: Yes/No
- Minimum payment amount: $100 or 25%
- Maximum installments: 3 payments
- Payment plan required: Yes/No

**Payment Plan Creation:**
```json
{
  "invoice_id": "uuid",
  "total_amount": 10000.00,
  "installments": [
    {
      "number": 1,
      "amount": 5000.00,
      "due_date": "2025-02-01",
      "status": "paid",
      "paid_date": "2025-02-01"
    },
    {
      "number": 2,
      "amount": 3000.00,
      "due_date": "2025-03-01",
      "status": "pending"
    },
    {
      "number": 3,
      "amount": 2000.00,
      "due_date": "2025-04-01",
      "status": "pending"
    }
  ]
}
```

**Partial Payment Features:**

1. **Payment Allocation:**
   - Apply to oldest charges first
   - Apply to principal vs interest/fees
   - Custom allocation rules

2. **Payment Tracking:**
   - Running balance display: "Paid $5,000 of $10,000 (50%)"
   - Payment history table (date, amount, method, balance)
   - Visual progress bar

3. **Reminders:**
   - Send reminders for upcoming installments
   - Adjust reminder tone based on payment history
   - Offer flexible payment if installment missed

4. **Invoice Status:**
   - "Partially Paid" badge
   - Distinct color coding (yellow vs green for full payment)
   - Show remaining balance prominently

**Customer Portal:**
- View payment plan schedule
- Make installment payment (one-click)
- View payment history
- Request payment plan modification

### 4.4 Auto-Reconciliation

**Purpose:** Automatically match bank deposits to invoices without manual effort

**Reconciliation Process:**

**Step 1: Import Bank Transactions**
- Manual CSV upload (bank statement)
- API integration (Plaid, Yodlee, Tink)
- Accounting system sync (Xero, QuickBooks)

**Step 2: Intelligent Matching**

**Exact Match (95% confidence):**
- Amount exactly matches invoice total
- Bank reference contains invoice number
- Payment date within expected range (±7 days of due date)
- Customer name matches

**Fuzzy Match (70-95% confidence):**
- Amount matches within $0.50 (rounding, fees)
- Partial reference match (INV-001 vs INV-0001)
- Customer name variation (ACME Corp vs ACME Corporation)
- Multiple invoices totaling deposit amount

**Manual Review (<70% confidence):**
- Amount doesn't match any invoice
- Multiple possible matches
- Unknown customer

**Matching Algorithm:**
```python
def match_transaction(transaction, invoices):
    scores = []

    for invoice in invoices:
        score = 0

        # Amount match (50 points)
        if abs(transaction.amount - invoice.total) < 0.01:
            score += 50
        elif abs(transaction.amount - invoice.total) < 1.00:
            score += 40

        # Reference match (30 points)
        if invoice.number in transaction.reference:
            score += 30
        elif fuzzy_match(invoice.number, transaction.reference) > 0.8:
            score += 20

        # Customer match (20 points)
        if invoice.customer.name in transaction.payer_name:
            score += 20
        elif fuzzy_match(invoice.customer.name, transaction.payer_name) > 0.8:
            score += 10

        scores.append((invoice, score))

    # Return best match if score > 70
    best_match = max(scores, key=lambda x: x[1])
    return best_match if best_match[1] > 70 else None
```

**Auto-Reconciliation Actions:**

1. **Exact Match → Auto-mark as Paid**
   - Update invoice status
   - Record payment details (date, amount, method)
   - Send payment confirmation email
   - Trigger accounting sync
   - Notify user

2. **Fuzzy Match → Suggest Match**
   - Show suggested match with confidence score
   - User approves with one click
   - Learn from user corrections (improve algorithm)

3. **No Match → Manual Review Queue**
   - Flag transaction for review
   - Provide likely matches for user selection
   - Option to create new invoice or record as overpayment

**Multi-Invoice Payments:**
- Detect when single payment covers multiple invoices
- Automatically allocate payment across invoices
- Handle overpayment (apply to customer credit)

**Payment Method Detection:**
- Bank transfer (ACH, wire, SEPA)
- Check (reference = check number)
- Credit card (gateway integration)
- Cash (manual entry)
- PayPal, Stripe (automatic via webhook)

**Reconciliation Reports:**
- Unmatched transactions
- Duplicate payments
- Overpayments
- Short payments (underpayment)
- Reconciliation accuracy rate

**Bank Feed Integration:**

**Plaid Integration (US, Canada, Europe):**
- Connect bank account (OAuth)
- Daily automatic sync
- Transaction categorization
- Real-time balance updates

**Yodlee Integration (Global):**
- Support for 17,000+ financial institutions
- Historical transaction import (90 days)
- Account aggregation

**Features:**
- Automatic daily reconciliation (run at 2am)
- Manual reconciliation trigger
- Bulk reconciliation (match all, review exceptions)
- Reconciliation audit trail
- Undo reconciliation (if incorrect)

## 5. INTEGRATIONS

### 5.1 Accounting Software Integration

#### Xero Integration

**Sync Scope:**
- **Invoices:** Bi-directional sync
  - Created in app → Created in Xero
  - Created in Xero → Imported to app
  - Updated in either → Synced to other
- **Payments:** Auto-sync when payment received
- **Customers:** Sync contact records
- **Products/Services:** Sync item library
- **Tax Rates:** Pull from Xero tax settings
- **Bank Transactions:** Sync for reconciliation

**Implementation:**
```javascript
// OAuth 2.0 connection
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: ['https://app.invoiceapp.com/integrations/xero/callback'],
  scopes: ['accounting.transactions', 'accounting.contacts', 'accounting.settings']
});

// Create invoice in Xero
await xero.accountingApi.createInvoices(tenantId, {
  invoices: [{
    type: 'ACCREC', // Accounts Receivable
    contact: { contactID: customer.xero_id },
    date: invoice.date,
    dueDate: invoice.due_date,
    invoiceNumber: invoice.number,
    reference: invoice.reference,
    lineItems: invoice.line_items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unit_price,
      taxType: item.tax_code,
      accountCode: item.account_code
    })),
    status: 'AUTHORISED'
  }]
});
```

**Sync Frequency:**
- Real-time for critical events (invoice created, payment received)
- Batch sync every 15 minutes for updates
- Manual sync button for immediate refresh

**Conflict Resolution:**
- Last write wins (with timestamp comparison)
- User prompt for manual conflicts
- Sync log for audit trail

**Xero-Specific Features:**
- Multi-currency support
- Tracking categories (departments, projects)
- Branding themes
- Credit notes and refunds
- Prepayments and overpayments
- Bank reconciliation

#### QuickBooks Online Integration

**Sync Scope:**
- Invoices (Sales receipts, invoices)
- Payments
- Customers
- Products/Services
- Sales tax rates
- Accounts

**Implementation:**
```javascript
// QuickBooks OAuth 2.0
const qbo = new QuickBooks({
  clientId: process.env.QBO_CLIENT_ID,
  clientSecret: process.env.QBO_CLIENT_SECRET,
  environment: 'production',
  redirectUri: 'https://app.invoiceapp.com/integrations/qbo/callback'
});

// Create invoice
qbo.createInvoice({
  CustomerRef: { value: customer.qbo_id },
  DocNumber: invoice.number,
  TxnDate: invoice.date,
  DueDate: invoice.due_date,
  Line: invoice.line_items.map(item => ({
    DetailType: 'SalesItemLineDetail',
    Amount: item.total,
    SalesItemLineDetail: {
      ItemRef: { value: item.qbo_item_id },
      Qty: item.quantity,
      UnitPrice: item.unit_price,
      TaxCodeRef: { value: item.tax_code }
    }
  }))
}, (err, invoice) => {
  // Handle response
});
```

**QuickBooks-Specific Features:**
- Class tracking (departments, locations)
- Sales tax automation (AvaTax integration)
- Payment terms mapping
- Custom fields
- Recurring invoices sync
- Estimates to invoices

#### MYOB Integration (Australia, New Zealand)

**Editions Supported:**
- MYOB AccountRight (desktop + cloud)
- MYOB Essentials (cloud)
- MYOB BusinessLite

**Sync Scope:**
- Sales invoices
- Customer payments
- Customer cards
- Inventory items
- Tax codes (GST, PST)

**MYOB-Specific Features:**
- Activity slip integration
- PAYG withholding tax
- BAS preparation support
- Australian business number (ABN) lookup

**Implementation:**
- API Key authentication (MYOB AccountRight API)
- OAuth for cloud editions
- Webhook support for real-time updates

### 5.2 REST API

**API Design Principles:**
- RESTful architecture
- JSON request/response
- OAuth 2.0 authentication
- Rate limiting (1000 requests/hour, tiered by plan)
- Versioning (v1, v2 in URL path)
- HATEOAS (hypermedia links)
- Pagination (cursor-based)
- Filtering, sorting, searching
- Partial responses (field selection)

**Authentication:**

```bash
# OAuth 2.0 flow
POST https://api.invoiceapp.com/oauth/token
{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}

# Use token in requests
GET https://api.invoiceapp.com/v1/invoices
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Core API Endpoints:**

**Invoices:**
```
GET    /v1/invoices              # List invoices
POST   /v1/invoices              # Create invoice
GET    /v1/invoices/{id}         # Get invoice
PUT    /v1/invoices/{id}         # Update invoice
DELETE /v1/invoices/{id}         # Delete invoice (draft only)
POST   /v1/invoices/{id}/send    # Send invoice
POST   /v1/invoices/{id}/void    # Void invoice
GET    /v1/invoices/{id}/pdf     # Download PDF
```

**Customers:**
```
GET    /v1/customers             # List customers
POST   /v1/customers             # Create customer
GET    /v1/customers/{id}        # Get customer
PUT    /v1/customers/{id}        # Update customer
DELETE /v1/customers/{id}        # Delete customer
GET    /v1/customers/{id}/invoices # Customer's invoices
```

**Payments:**
```
GET    /v1/payments              # List payments
POST   /v1/payments              # Record payment
GET    /v1/payments/{id}         # Get payment
DELETE /v1/payments/{id}         # Delete payment
POST   /v1/payments/{id}/refund  # Refund payment
```

**Products:**
```
GET    /v1/products              # List products
POST   /v1/products              # Create product
GET    /v1/products/{id}         # Get product
PUT    /v1/products/{id}         # Update product
DELETE /v1/products/{id}         # Delete product
```

**Reports:**
```
GET    /v1/reports/aging         # Accounts receivable aging
GET    /v1/reports/sales         # Sales report
GET    /v1/reports/tax           # Tax report
GET    /v1/reports/payments      # Payment report
```

**Example Request/Response:**

```bash
# Create invoice
POST /v1/invoices
Content-Type: application/json

{
  "customer_id": "cust_abc123",
  "issue_date": "2025-01-15",
  "due_date": "2025-02-14",
  "currency": "USD",
  "line_items": [
    {
      "description": "Web Development",
      "quantity": 40,
      "unit_price": 150.00,
      "tax_rate": 10
    }
  ],
  "notes": "Payment due within 30 days"
}

# Response
{
  "id": "inv_xyz789",
  "number": "INV-2025-001",
  "status": "draft",
  "customer": {
    "id": "cust_abc123",
    "name": "ACME Corporation",
    "email": "billing@acme.com"
  },
  "issue_date": "2025-01-15",
  "due_date": "2025-02-14",
  "currency": "USD",
  "line_items": [...],
  "subtotal": 6000.00,
  "tax": 600.00,
  "total": 6600.00,
  "amount_due": 6600.00,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "links": {
    "self": "/v1/invoices/inv_xyz789",
    "pdf": "/v1/invoices/inv_xyz789/pdf",
    "public": "https://app.invoiceapp.com/i/abc123"
  }
}
```

**API Features:**
- Comprehensive error responses (with error codes)
- Idempotency keys (prevent duplicate requests)
- Webhook subscriptions
- Sandbox environment for testing
- API client libraries (JavaScript, Python, PHP, Ruby, Go)
- Interactive API documentation (Swagger/OpenAPI)
- Postman collection

### 5.3 Webhooks

**Purpose:** Real-time event notifications to external systems

**Supported Events:**

**Invoice Events:**
- `invoice.created`
- `invoice.updated`
- `invoice.deleted`
- `invoice.sent`
- `invoice.viewed`
- `invoice.paid`
- `invoice.partially_paid`
- `invoice.overdue`
- `invoice.voided`
- `invoice.refunded`

**Payment Events:**
- `payment.created`
- `payment.succeeded`
- `payment.failed`
- `payment.refunded`

**Customer Events:**
- `customer.created`
- `customer.updated`
- `customer.deleted`

**Webhook Configuration:**

```json
{
  "url": "https://yourapp.com/webhooks/invoices",
  "events": ["invoice.paid", "invoice.overdue"],
  "secret": "whsec_abc123...",
  "active": true,
  "description": "Production webhook for order fulfillment"
}
```

**Webhook Payload:**

```json
{
  "id": "evt_abc123",
  "type": "invoice.paid",
  "created": 1642348800,
  "data": {
    "object": {
      "id": "inv_xyz789",
      "number": "INV-2025-001",
      "customer_id": "cust_abc123",
      "total": 6600.00,
      "amount_paid": 6600.00,
      "status": "paid",
      "paid_at": "2025-01-20T14:23:45Z"
    }
  }
}
```

**Webhook Security:**

**Signature Verification:**
```javascript
// Server receives webhook
const signature = req.headers['x-webhook-signature'];
const timestamp = req.headers['x-webhook-timestamp'];
const body = req.body;

// Verify signature
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${JSON.stringify(body)}`)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}

// Verify timestamp (prevent replay attacks)
const currentTime = Math.floor(Date.now() / 1000);
if (Math.abs(currentTime - timestamp) > 300) { // 5 min tolerance
  throw new Error('Webhook timestamp too old');
}
```

**Webhook Reliability:**
- Retry logic: 3 attempts (immediate, 1min, 5min, 30min)
- Exponential backoff
- Failure notifications
- Webhook log (last 30 days)
- Manual retry button
- Pause/disable webhooks
- Test webhook button (send sample event)

**Webhook Use Cases:**
1. **Order Fulfillment:** Invoice paid → Trigger shipment
2. **CRM Updates:** Invoice created → Create deal in CRM
3. **Slack Notifications:** Invoice overdue → Alert in Slack
4. **Analytics:** All events → Send to data warehouse
5. **Automation:** Invoice paid → Generate receipt, send thank you email

### 5.4 Zapier & Make (Integromat) Integration

#### Zapier Integration

**Triggers (Start automation when...):**
- New invoice created
- Invoice sent to customer
- Invoice paid
- Invoice overdue
- Payment received
- New customer added

**Actions (Do this...):**
- Create invoice
- Send invoice
- Create customer
- Record payment
- Update invoice
- Void invoice

**Zapier Use Case Examples:**

1. **Google Sheets → Invoice:**
   - Trigger: New row in Google Sheets
   - Action: Create invoice from row data
   - Use case: Bulk invoice generation from spreadsheet

2. **Email → Invoice:**
   - Trigger: New email with label "Invoice Request"
   - Action: Parse email, create invoice
   - Use case: Customer requests via email

3. **Invoice Paid → Email:**
   - Trigger: Invoice marked as paid
   - Action: Send thank you email via Gmail
   - Use case: Customer appreciation

4. **Invoice Overdue → Slack:**
   - Trigger: Invoice becomes overdue
   - Action: Post message in Slack channel
   - Use case: Team notification

5. **Stripe Payment → Invoice:**
   - Trigger: New Stripe payment
   - Action: Auto-create receipt invoice
   - Use case: E-commerce reconciliation

#### Make (Integromat) Integration

**Make Features:**
- Visual automation builder
- Complex multi-step workflows
- Data transformation
- Conditional logic
- Error handling
- Scheduled scenarios

**Make Modules:**
- Watch Invoices (trigger)
- Create Invoice
- Update Invoice
- Get Invoice
- Search Invoices
- Delete Invoice
- Send Invoice
- Record Payment
- Generate Report

**Make Scenario Example:**

```
Trigger: New form submission (Typeform)
↓
Module 1: Create Customer (if not exists)
↓
Module 2: Create Invoice
↓
Module 3: Send Invoice via Email
↓
Module 4: Create Google Drive Folder
↓
Module 5: Save PDF to Google Drive
↓
Module 6: Post to Slack
```

**Advanced Features:**
- Bulk operations (process 100+ invoices)
- Data aggregation (sum all invoices for report)
- Filters (only process invoices > $1000)
- Routers (different actions based on conditions)
- Iterator (process array of items)

### 5.5 Additional Integration Opportunities

**CRM Integrations:**
- Salesforce
- HubSpot
- Pipedrive
- Zoho CRM
- Microsoft Dynamics 365

**Project Management:**
- Asana (time tracking → invoice)
- Trello (card → invoice)
- Monday.com
- Jira (project → invoice)

**Time Tracking:**
- Toggl (billable hours → invoice)
- Harvest
- Clockify
- Everhour

**E-commerce:**
- Shopify (order → invoice)
- WooCommerce
- Magento
- BigCommerce

**Communication:**
- Slack (notifications)
- Microsoft Teams
- Discord
- Telegram Bot

**Storage:**
- Google Drive (save PDFs)
- Dropbox
- OneDrive
- Box

**Tax Compliance:**
- Avalara (sales tax calculation)
- TaxJar
- Vertex

## 6. ENTERPRISE CAPABILITIES

### 6.1 Multi-Tenant Architecture

**Tenant Isolation Models:**

**1. Database-per-Tenant (Maximum Isolation):**
- Each tenant has separate database
- Complete data isolation
- Easy to scale (shard by tenant)
- Backup/restore per tenant
- Regulatory compliance (data residency)
- Higher infrastructure cost

**2. Schema-per-Tenant (Shared Database):**
- Tenants share database server, separate schemas
- Good isolation with shared infrastructure
- Easier tenant provisioning
- Cost effective

**3. Shared Schema (Row-Level Isolation):**
- All tenants in same database/schema
- tenant_id column on every table
- Row-level security (RLS) policies
- Most cost-effective
- Requires careful implementation

**Recommended Approach: Hybrid**
- Shared schema for SME/Mid-Market (1-1000 tenants per database)
- Database-per-tenant for Enterprise (100+ users, compliance requirements)

**Tenant Data Model:**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE, -- acme.invoiceapp.com
  custom_domain VARCHAR(255), -- invoices.acme.com
  plan VARCHAR(50) NOT NULL, -- starter, professional, enterprise
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
  max_users INT,
  max_invoices INT,
  features JSONB, -- {"white_label": true, "api_access": true}
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

**Tenant Provisioning:**
1. User signs up → Create tenant
2. Subdomain assigned (acme.invoiceapp.com)
3. Database/schema created (if isolated model)
4. Default settings applied
5. Welcome email with onboarding
6. Trial period starts (14 days)

**Tenant Features by Plan:**

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Users | 1-3 | 10 | Unlimited |
| Invoices/month | 100 | 1,000 | Unlimited |
| API Access | ✗ | ✓ | ✓ |
| Custom Domain | ✗ | ✓ | ✓ |
| White Label | ✗ | ✗ | ✓ |
| SSO | ✗ | ✗ | ✓ |
| SLA | 99.5% | 99.9% | 99.95% |
| Support | Email | Email+Chat | 24/7 Phone |

### 6.2 Role-Based Access Control (RBAC)

**Predefined Roles:**

**1. Owner (Super Admin):**
- Full system access
- Billing management
- User management
- Delete organization
- Cannot be removed (must transfer ownership)

**2. Administrator:**
- User management (add/remove users, assign roles)
- Company settings (branding, templates, integrations)
- View all invoices, customers, payments
- Cannot access billing

**3. Accountant:**
- View all invoices and payments
- Reconcile payments
- Generate financial reports
- Cannot create/edit customers
- Cannot delete invoices

**4. Sales/Finance Manager:**
- Create, edit, send invoices
- View own and team's invoices
- Create customers
- Basic reporting
- Cannot delete invoices (can void)

**5. Team Member:**
- Create draft invoices
- View own invoices only
- Cannot send invoices (requires approval)
- Cannot access settings

**6. Viewer (Auditor):**
- Read-only access
- View all invoices, customers, reports
- Cannot create, edit, or delete anything

**Permission Matrix:**

| Action | Owner | Admin | Accountant | Manager | Team Member | Viewer |
|--------|-------|-------|------------|---------|-------------|--------|
| Create invoice | ✓ | ✓ | ✗ | ✓ | ✓ (draft) | ✗ |
| Edit invoice | ✓ | ✓ | ✗ | ✓ (own) | ✓ (own draft) | ✗ |
| Delete invoice | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Void invoice | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Send invoice | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Record payment | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Refund payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View reports | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Manage billing | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Custom Roles (Enterprise):**
- Define custom permissions
- Clone existing role and modify
- Assign multiple roles per user
- Role hierarchy (inherit permissions)

**Granular Permissions:**
- invoice.create
- invoice.read.all / invoice.read.own
- invoice.update.all / invoice.update.own
- invoice.delete
- invoice.send
- invoice.void
- payment.create
- payment.read
- payment.refund
- customer.create
- customer.update
- customer.delete
- report.view
- settings.manage
- user.manage
- billing.manage

**Resource-Level Permissions:**
```json
{
  "user_id": "uuid",
  "role": "manager",
  "permissions": {
    "invoices": {
      "read": "all",
      "create": true,
      "update": "own",
      "delete": false,
      "send": "own"
    },
    "customers": {
      "read": "all",
      "create": true,
      "update": "own",
      "delete": false
    },
    "reports": ["aging", "sales"],
    "settings": []
  },
  "restrictions": {
    "max_invoice_amount": 10000, // Cannot create invoice > $10k
    "requires_approval_above": 5000, // Invoices > $5k need approval
    "can_approve_own": false
  }
}
```

**Approval Workflows (Enterprise):**
```
Team Member creates invoice ($8,000)
↓
Invoice status: Pending Approval (amount > $5,000)
↓
Notification sent to Manager
↓
Manager reviews and approves
↓
Invoice status: Approved, ready to send
```

### 6.3 Single Sign-On (SSO)

**Supported Protocols:**

**1. SAML 2.0 (Security Assertion Markup Language):**
- Enterprise standard
- Works with: Okta, OneLogin, Azure AD, Google Workspace, Ping Identity
- SP-initiated and IdP-initiated flows

**SAML Configuration:**
```xml
<!-- Service Provider (SP) Metadata -->
<EntityDescriptor entityID="https://app.invoiceapp.com/saml/metadata">
  <SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">

    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>

    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="https://app.invoiceapp.com/saml/acs"
      index="0"
      isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>
```

**2. OAuth 2.0 / OpenID Connect:**
- Modern standard
- Works with: Google, Microsoft, GitHub, Keycloak
- Mobile-friendly

**OIDC Configuration:**
```javascript
const issuer = 'https://accounts.google.com';
const client = new Issuer({
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  redirect_uris: ['https://app.invoiceapp.com/auth/callback'],
  response_types: ['code'],
  grant_types: ['authorization_code'],
  scopes: ['openid', 'email', 'profile']
});
```

**SSO Features:**

**Just-in-Time (JIT) Provisioning:**
- Auto-create user account on first SSO login
- Map SAML/OIDC attributes to user fields
- Assign default role based on group membership
- No manual user creation required

**Attribute Mapping:**
```json
{
  "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
  "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
  "role": "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  "department": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department"
}
```

**Group-Based Role Assignment:**
```
SAML Group: "Finance Team" → App Role: "Accountant"
SAML Group: "Sales Team" → App Role: "Manager"
SAML Group: "Executives" → App Role: "Administrator"
```

**SSO Enforcement:**
- Require SSO for all users (disable password login)
- Allow mixed mode (SSO + password)
- Grace period (7 days to complete SSO setup)

**Session Management:**
- Session timeout: 8 hours (configurable)
- Remember me: 30 days
- Single Logout (SLO) support
- Concurrent session limit (max 3 devices)

**Security Features:**
- Enforce MFA at IdP level
- IP whitelisting (only allow SSO from office IPs)
- Session monitoring (active sessions dashboard)
- Anomaly detection (login from unusual location)

### 6.4 Audit Logs

**Purpose:** Complete, immutable record of all system activity for security, compliance, and troubleshooting

**Logged Events:**

**User Actions:**
- Login/Logout (success, failure, IP, user agent)
- User created, updated, deleted
- Role changed
- Permission granted/revoked
- Password changed, reset
- MFA enabled/disabled
- API key created, revoked

**Invoice Actions:**
- Invoice created, updated, deleted
- Invoice sent
- Invoice viewed (who, when, IP)
- Invoice downloaded
- Invoice paid
- Invoice voided, refunded
- Invoice exported

**Payment Actions:**
- Payment recorded
- Payment method updated
- Refund processed
- Payment disputed

**System Actions:**
- Settings changed
- Integration connected/disconnected
- Webhook created, updated, failed
- Report generated, exported
- Data imported, exported
- Backup created

**Audit Log Schema:**
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- 'invoice.created', 'user.login'
  actor_type VARCHAR(50) NOT NULL, -- 'user', 'api_key', 'system'
  actor_id UUID, -- user_id or api_key_id
  actor_name VARCHAR(255), -- human-readable
  resource_type VARCHAR(100), -- 'invoice', 'customer', 'payment'
  resource_id UUID,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view'
  status VARCHAR(50) DEFAULT 'success', -- 'success', 'failure', 'partial'
  metadata JSONB, -- event-specific data
  changes JSONB, -- before/after state
  ip_address INET,
  user_agent TEXT,
  request_id UUID, -- trace back to application logs
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_audit_tenant_created (tenant_id, created_at DESC),
  INDEX idx_audit_actor (actor_id),
  INDEX idx_audit_resource (resource_type, resource_id),
  INDEX idx_audit_event_type (event_type)
);

-- Partition by month for performance
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Audit Log Entry Example:**
```json
{
  "id": 123456789,
  "tenant_id": "uuid",
  "event_type": "invoice.updated",
  "actor_type": "user",
  "actor_id": "user_uuid",
  "actor_name": "John Doe (john@acme.com)",
  "resource_type": "invoice",
  "resource_id": "inv_uuid",
  "action": "update",
  "status": "success",
  "metadata": {
    "invoice_number": "INV-2025-001",
    "customer_name": "ACME Corp",
    "reason": "Customer requested quantity change"
  },
  "changes": {
    "line_items[0].quantity": {
      "old": 10,
      "new": 12
    },
    "total": {
      "old": 1000.00,
      "new": 1200.00
    }
  },
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0...",
  "request_id": "req_abc123",
  "created_at": "2025-01-15T14:30:25.123Z"
}
```

**Audit Log Features:**

**1. Search & Filter:**
- By user
- By resource (invoice, customer, payment)
- By action (create, update, delete)
- By date range
- By IP address
- By status (success, failure)
- Full-text search in metadata

**2. Export:**
- CSV export
- JSON export
- PDF report
- Scheduled exports (daily/weekly/monthly)
- Email delivery
- Push to SIEM (Splunk, ELK, Datadog)

**3. Retention:**
- Minimum: 7 years (compliance requirement)
- Archive to cold storage after 1 year
- Automatic deletion prohibited (immutable)

**4. Security:**
- Append-only (no updates or deletes)
- Cryptographic hash chain (tamper detection)
- Separate database (isolation from main app)
- Restricted access (admin + auditor roles only)

**5. Real-Time Monitoring:**
- Dashboard: Recent activity stream
- Alerts: Suspicious activity (e.g., mass deletion, unusual IP)
- Webhooks: Send events to external SIEM

**Compliance Use Cases:**
- **SOX:** Prove who approved financial transactions
- **GDPR:** Demonstrate when user data was accessed/modified
- **HIPAA:** Track access to sensitive customer data
- **SOC 2:** Evidence of access controls and monitoring
- **Forensics:** Investigate security incidents

### 6.5 SLA Requirements

**Service Level Agreements by Tier:**

**Starter Plan:**
- **Uptime:** 99.5% monthly (≤ 3.6 hours downtime/month)
- **Response Time (p95):** <1000ms
- **Support:** Email, 48-hour response
- **Maintenance Windows:** Announced 48 hours in advance
- **Backup:** Daily, 7-day retention
- **Credits:** No SLA credits

**Professional Plan:**
- **Uptime:** 99.9% monthly (≤ 43 minutes downtime/month)
- **Response Time (p95):** <500ms
- **Support:** Email + Chat, 8-hour response
- **Maintenance Windows:** Announced 1 week in advance, off-peak only
- **Backup:** Daily, 30-day retention + point-in-time restore
- **Credits:** 10% monthly fee per 0.1% below SLA

**Enterprise Plan:**
- **Uptime:** 99.95% monthly (≤ 21 minutes downtime/month)
- **Response Time (p95):** <200ms
- **Support:** 24/7 phone + dedicated account manager
- **Maintenance Windows:** Announced 2 weeks in advance, customer-approved timing
- **Backup:** Hourly, 90-day retention + multi-region replication
- **Credits:** 25% monthly fee per 0.1% below SLA + custom remediation

**SLA Exclusions (Force Majeure):**
- DDoS attacks (beyond our mitigation capacity)
- Customer's infrastructure (e.g., internet connection, browser issues)
- Third-party service failures (payment gateways, email providers)
- Natural disasters, war, terrorism
- Scheduled maintenance (within announced windows)

**SLA Monitoring:**
- Public status page (status.invoiceapp.com)
- Real-time uptime monitoring (Pingdom, UptimeRobot)
- Incident communication (email, SMS, status page updates)
- Post-mortem reports (published within 48 hours of incidents)

### 6.6 Monitoring & Observability

**Monitoring Stack:**

**1. Application Performance Monitoring (APM):**
- Tool: New Relic / Datadog / Elastic APM
- Metrics:
  - Response time (p50, p95, p99)
  - Error rate
  - Throughput (requests/second)
  - Apdex score (user satisfaction)
  - Database query performance
  - External service latency (Stripe, email providers)

**2. Infrastructure Monitoring:**
- Tool: Prometheus + Grafana / CloudWatch
- Metrics:
  - CPU utilization
  - Memory usage
  - Disk I/O
  - Network traffic
  - Container health (Kubernetes pods)
  - Database connections
  - Queue depth (RabbitMQ)

**3. Log Aggregation:**
- Tool: ELK Stack (Elasticsearch, Logstash, Kibana) / Splunk
- Logs:
  - Application logs (info, warning, error)
  - Access logs (nginx, API gateway)
  - Audit logs
  - Security logs (authentication, authorization failures)

**4. Real User Monitoring (RUM):**
- Tool: Google Analytics, Sentry, LogRocket
- Metrics:
  - Page load time
  - Time to interactive
  - Core Web Vitals (LCP, FID, CLS)
  - User journey analytics
  - Error tracking (frontend JavaScript errors)

**5. Synthetic Monitoring:**
- Tool: Pingdom, Uptime Robot, Synthetics (New Relic)
- Checks:
  - HTTP endpoint availability (every 1 minute)
  - Multi-step user flows (create invoice, make payment)
  - Global availability (test from 10+ regions)
  - SSL certificate expiry
  - DNS resolution

**Alerting:**

**Alert Channels:**
- PagerDuty (critical, on-call rotation)
- Slack (warnings, team notifications)
- Email (non-urgent)
- SMS (critical only)

**Alert Rules:**

**Critical (Page immediately):**
- Uptime < 99.5% in last 5 minutes
- Error rate > 5% in last 5 minutes
- Response time p95 > 3 seconds
- Database unavailable
- Payment processing failures > 10/minute
- Disk usage > 90%

**Warning (Notify team):**
- Error rate > 1% in last 15 minutes
- Response time p95 > 1 second
- Queue depth > 1000 messages
- Memory usage > 80%
- Unusual traffic spike (2x normal)

**Info (Log only):**
- Deployment completed
- Scheduled job completed
- Weekly backup completed

**Dashboards:**

**Executive Dashboard:**
- Key metrics (users, invoices, revenue)
- System uptime (30-day trend)
- Critical alerts count
- Customer satisfaction (NPS)

**Operations Dashboard:**
- Real-time request rate
- Error rate by endpoint
- Response time distribution
- Infrastructure health (CPU, memory, disk)
- Recent deployments

**Business Dashboard:**
- Invoices created (today, week, month)
- Payment success rate
- Average invoice value
- Top customers
- Revenue trends

**On-Call Procedures:**
- 24/7 on-call rotation (follow-the-sun)
- Escalation path (L1 → L2 → Engineering Manager → CTO)
- Incident response playbooks
- Post-mortem process (RCA within 48 hours)
