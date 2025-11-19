# API SPECIFICATION - ENTERPRISE INVOICE GENERATOR

## 1. API OVERVIEW

**Base URL:** `https://api.invoiceapp.com/v1`

**Protocol:** HTTPS only (TLS 1.3+)

**Format:** JSON (Request & Response)

**Authentication:** OAuth 2.0 Bearer Token / API Key

**Versioning:** URL path (`/v1`, `/v2`)

**Rate Limiting:**
- **Starter:** 100 requests/minute
- **Professional:** 1,000 requests/minute
- **Enterprise:** 10,000 requests/minute (custom limits available)

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1642348800
```

## 2. AUTHENTICATION

### 2.1 OAuth 2.0 (Recommended)

**Step 1: Authorization Code Grant**
```http
GET /oauth/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://yourapp.com/callback&
  scope=invoices:read invoices:write payments:read&
  state=random_state_string
```

**Step 2: Exchange Code for Token**
```http
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "AUTH_CODE_FROM_STEP_1",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "https://yourapp.com/callback"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200a1b2c3...",
  "scope": "invoices:read invoices:write payments:read"
}
```

**Step 3: Refresh Token**
```http
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "def50200a1b2c3...",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

### 2.2 API Key Authentication

**Generate API Key:**
```http
POST /v1/api-keys
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Production Server",
  "scopes": ["invoices:read", "invoices:write"],
  "expires_at": "2026-01-15T00:00:00Z"
}
```

**Response:**
```json
{
  "id": "ak_abc123",
  "name": "Production Server",
  "key": "sk_live_1234567890abcdef",
  "scopes": ["invoices:read", "invoices:write"],
  "created_at": "2025-01-15T10:30:00Z",
  "expires_at": "2026-01-15T00:00:00Z"
}
```

**Using API Key:**
```http
GET /v1/invoices
Authorization: Bearer sk_live_1234567890abcdef
```

### 2.3 Scopes

| Scope | Description |
|-------|-------------|
| `invoices:read` | Read invoice data |
| `invoices:write` | Create, update, delete invoices |
| `invoices:send` | Send invoices to customers |
| `customers:read` | Read customer data |
| `customers:write` | Create, update, delete customers |
| `payments:read` | Read payment data |
| `payments:write` | Record payments, refunds |
| `products:read` | Read product catalog |
| `products:write` | Manage product catalog |
| `reports:read` | Access reports and analytics |
| `settings:write` | Manage account settings |
| `webhooks:manage` | Create and manage webhooks |

## 3. STANDARD REQUEST/RESPONSE PATTERNS

### 3.1 Request Headers

```http
GET /v1/invoices/inv_123
Host: api.invoiceapp.com
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Idempotency-Key: unique-key-for-this-request
```

**Required Headers:**
- `Authorization`: Bearer token or API key
- `Content-Type`: `application/json` (for POST/PUT/PATCH)
- `Accept`: `application/json`

**Optional Headers:**
- `X-Request-ID`: Unique request ID for tracing (auto-generated if not provided)
- `X-Idempotency-Key`: Prevents duplicate requests (POST/PUT/PATCH)

### 3.2 Success Response Format

```json
{
  "id": "inv_abc123",
  "object": "invoice",
  "number": "INV-2025-001",
  "status": "sent",
  "customer": {
    "id": "cus_xyz789",
    "name": "ACME Corporation",
    "email": "billing@acme.com"
  },
  "total": 6600.00,
  "currency": "USD",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### 3.3 Error Response Format

```json
{
  "error": {
    "type": "validation_error",
    "code": "invalid_email",
    "message": "The email address provided is invalid",
    "param": "customer.email",
    "doc_url": "https://docs.invoiceapp.com/errors/invalid_email"
  },
  "request_id": "req_550e8400"
}
```

**Error Types:**
- `validation_error`: Invalid request parameters
- `authentication_error`: Invalid or missing authentication
- `authorization_error`: Insufficient permissions
- `not_found_error`: Resource not found
- `rate_limit_error`: Too many requests
- `server_error`: Internal server error
- `conflict_error`: Resource conflict (e.g., duplicate invoice number)

### 3.4 Pagination

**Request:**
```http
GET /v1/invoices?limit=25&cursor=cXVlcnk6NQ==
```

**Response:**
```json
{
  "object": "list",
  "data": [
    { "id": "inv_001", ... },
    { "id": "inv_002", ... }
  ],
  "has_more": true,
  "next_cursor": "cXVlcnk6MzA=",
  "total_count": 1247
}
```

**Pagination Parameters:**
- `limit`: Number of results (default: 25, max: 100)
- `cursor`: Cursor for next page (cursor-based pagination)
- `starting_after`: ID to start after (alternative to cursor)
- `ending_before`: ID to end before

### 3.5 Filtering & Sorting

**Filtering:**
```http
GET /v1/invoices?status=overdue&customer_id=cus_123&created_at[gte]=2025-01-01
```

**Sorting:**
```http
GET /v1/invoices?sort=-created_at,number
```
(Prefix `-` for descending order)

**Searching:**
```http
GET /v1/invoices?search=acme&search_fields=customer.name,number,reference
```

### 3.6 Field Selection (Sparse Fieldsets)

**Request:**
```http
GET /v1/invoices/inv_123?fields=id,number,total,status,customer.name
```

**Response (only requested fields):**
```json
{
  "id": "inv_123",
  "number": "INV-2025-001",
  "total": 6600.00,
  "status": "sent",
  "customer": {
    "name": "ACME Corporation"
  }
}
```

### 3.7 Expansions (Include Related Resources)

**Request:**
```http
GET /v1/invoices/inv_123?expand=customer,line_items,payments
```

**Response:**
```json
{
  "id": "inv_123",
  "customer": {
    "id": "cus_789",
    "name": "ACME Corporation",
    "email": "billing@acme.com",
    "phone": "+1-555-0100"
  },
  "line_items": [
    {
      "id": "li_001",
      "description": "Web Development",
      "quantity": 40,
      "unit_price": 150.00,
      "total": 6000.00
    }
  ],
  "payments": [
    {
      "id": "pay_001",
      "amount": 6600.00,
      "payment_date": "2025-01-20"
    }
  ]
}
```

## 4. API ENDPOINTS

### 4.1 INVOICES

#### 4.1.1 Create Invoice

```http
POST /v1/invoices
```

**Request Body:**
```json
{
  "customer_id": "cus_abc123",
  "issue_date": "2025-01-15",
  "due_date": "2025-02-14",
  "currency": "USD",
  "line_items": [
    {
      "description": "Web Development Services",
      "quantity": 40,
      "unit_price": 150.00,
      "tax_profile_id": "tax_gst_10"
    },
    {
      "product_id": "prod_hosting",
      "quantity": 1
    }
  ],
  "discount_type": "percent",
  "discount_value": 10,
  "notes": "Payment due within 30 days",
  "terms": "Net 30",
  "template_id": "tmpl_modern",
  "auto_send": false
}
```

**Response (201 Created):**
```json
{
  "id": "inv_xyz789",
  "object": "invoice",
  "number": "INV-2025-001",
  "status": "draft",
  "customer": {
    "id": "cus_abc123",
    "name": "ACME Corporation",
    "email": "billing@acme.com"
  },
  "issue_date": "2025-01-15",
  "due_date": "2025-02-14",
  "currency": "USD",
  "line_items": [
    {
      "id": "li_001",
      "description": "Web Development Services",
      "quantity": 40,
      "unit_price": 150.00,
      "subtotal": 6000.00,
      "tax_percent": 10,
      "tax_amount": 600.00,
      "total": 6600.00
    },
    {
      "id": "li_002",
      "product_id": "prod_hosting",
      "description": "Annual Web Hosting",
      "quantity": 1,
      "unit_price": 1200.00,
      "subtotal": 1200.00,
      "tax_percent": 10,
      "tax_amount": 120.00,
      "total": 1320.00
    }
  ],
  "subtotal": 7200.00,
  "discount_type": "percent",
  "discount_value": 10,
  "discount_total": 720.00,
  "tax_total": 648.00,
  "total": 7128.00,
  "amount_paid": 0,
  "amount_due": 7128.00,
  "notes": "Payment due within 30 days",
  "terms": "Net 30",
  "pdf_url": null,
  "public_url": "https://app.invoiceapp.com/i/xyz789abc",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### 4.1.2 Retrieve Invoice

```http
GET /v1/invoices/{invoice_id}
```

**Response (200 OK):**
```json
{
  "id": "inv_xyz789",
  "object": "invoice",
  "number": "INV-2025-001",
  "status": "sent",
  // ... full invoice object
}
```

#### 4.1.3 Update Invoice

```http
PUT /v1/invoices/{invoice_id}
```

**Request Body (partial update):**
```json
{
  "due_date": "2025-02-28",
  "notes": "Updated payment terms - due Feb 28"
}
```

**Response (200 OK):**
```json
{
  "id": "inv_xyz789",
  "number": "INV-2025-001",
  "due_date": "2025-02-28",
  "notes": "Updated payment terms - due Feb 28",
  "version": 2,
  // ... full updated invoice
}
```

#### 4.1.4 List Invoices

```http
GET /v1/invoices
```

**Query Parameters:**
- `customer_id`: Filter by customer
- `status`: Filter by status (draft, sent, paid, overdue, etc.)
- `issue_date[gte]`, `issue_date[lte]`: Date range filters
- `due_date[gte]`, `due_date[lte]`: Due date range
- `search`: Full-text search across invoice fields
- `limit`: Results per page (default: 25, max: 100)
- `cursor`: Pagination cursor

**Example:**
```http
GET /v1/invoices?status=overdue&limit=50&sort=-due_date
```

**Response (200 OK):**
```json
{
  "object": "list",
  "data": [
    {
      "id": "inv_001",
      "number": "INV-2025-001",
      "status": "overdue",
      "total": 7128.00,
      "due_date": "2025-01-10",
      "days_overdue": 10
    },
    // ... more invoices
  ],
  "has_more": true,
  "next_cursor": "cXVlcnk6NTA=",
  "total_count": 247
}
```

#### 4.1.5 Delete Invoice

```http
DELETE /v1/invoices/{invoice_id}
```

**Note:** Only draft invoices can be deleted. Use void for sent invoices.

**Response (204 No Content)**

#### 4.1.6 Send Invoice

```http
POST /v1/invoices/{invoice_id}/send
```

**Request Body:**
```json
{
  "to": ["billing@acme.com"],
  "cc": ["manager@acme.com"],
  "bcc": ["archive@mycompany.com"],
  "subject": "Invoice INV-2025-001 from MyCompany",
  "message": "Please find attached invoice for services rendered.",
  "attach_pdf": true,
  "send_copy_to_self": true
}
```

**Response (200 OK):**
```json
{
  "id": "inv_xyz789",
  "status": "sent",
  "sent_at": "2025-01-15T10:35:00Z",
  "email_status": {
    "sent_to": ["billing@acme.com", "manager@acme.com"],
    "message_id": "msg_abc123"
  }
}
```

#### 4.1.7 Void Invoice

```http
POST /v1/invoices/{invoice_id}/void
```

**Request Body:**
```json
{
  "reason": "Duplicate invoice created in error"
}
```

**Response (200 OK):**
```json
{
  "id": "inv_xyz789",
  "status": "void",
  "voided_at": "2025-01-15T11:00:00Z",
  "void_reason": "Duplicate invoice created in error"
}
```

#### 4.1.8 Download PDF

```http
GET /v1/invoices/{invoice_id}/pdf
```

**Response (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Invoice_INV-2025-001.pdf"

<PDF binary data>
```

#### 4.1.9 Mark as Paid (Quick Payment)

```http
POST /v1/invoices/{invoice_id}/mark-paid
```

**Request Body:**
```json
{
  "payment_date": "2025-01-20",
  "payment_method": "bank_transfer",
  "reference": "Wire transfer confirmation #123456"
}
```

**Response (200 OK):**
```json
{
  "id": "inv_xyz789",
  "status": "paid",
  "paid_at": "2025-01-20",
  "payment": {
    "id": "pay_001",
    "amount": 7128.00,
    "payment_method": "bank_transfer",
    "reference": "Wire transfer confirmation #123456"
  }
}
```

### 4.2 CUSTOMERS

#### 4.2.1 Create Customer

```http
POST /v1/customers
```

**Request Body:**
```json
{
  "name": "ACME Corporation",
  "company_name": "ACME Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-0100",
  "billing_address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "US"
  },
  "payment_terms": 30,
  "currency": "USD",
  "tax_number": "12-3456789"
}
```

**Response (201 Created):**
```json
{
  "id": "cus_abc123",
  "object": "customer",
  "name": "ACME Corporation",
  "company_name": "ACME Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-0100",
  "billing_address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "US"
  },
  "payment_terms": 30,
  "currency": "USD",
  "tax_number": "12-3456789",
  "balance": 0,
  "status": "active",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### 4.2.2 List Customers

```http
GET /v1/customers?status=active&limit=50
```

#### 4.2.3 Retrieve Customer

```http
GET /v1/customers/{customer_id}
```

#### 4.2.4 Update Customer

```http
PUT /v1/customers/{customer_id}
```

#### 4.2.5 Delete Customer

```http
DELETE /v1/customers/{customer_id}
```

**Note:** Cannot delete customer with associated invoices.

#### 4.2.6 Get Customer Invoices

```http
GET /v1/customers/{customer_id}/invoices
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "inv_001",
      "number": "INV-2025-001",
      "total": 7128.00,
      "status": "paid"
    }
  ]
}
```

### 4.3 PAYMENTS

#### 4.3.1 Create Payment

```http
POST /v1/payments
```

**Request Body:**
```json
{
  "invoice_id": "inv_xyz789",
  "amount": 7128.00,
  "currency": "USD",
  "payment_method": "stripe",
  "payment_date": "2025-01-20",
  "transaction_id": "ch_1234567890",
  "gateway": "stripe",
  "notes": "Payment received via Stripe"
}
```

**Response (201 Created):**
```json
{
  "id": "pay_abc123",
  "object": "payment",
  "payment_number": "PAY-2025-001",
  "invoice_id": "inv_xyz789",
  "amount": 7128.00,
  "currency": "USD",
  "payment_method": "stripe",
  "payment_date": "2025-01-20",
  "transaction_id": "ch_1234567890",
  "status": "succeeded",
  "created_at": "2025-01-20T14:30:00Z"
}
```

#### 4.3.2 List Payments

```http
GET /v1/payments?invoice_id=inv_xyz789
```

#### 4.3.3 Refund Payment

```http
POST /v1/payments/{payment_id}/refund
```

**Request Body:**
```json
{
  "amount": 7128.00,
  "reason": "Customer requested refund"
}
```

**Response (200 OK):**
```json
{
  "id": "pay_abc123",
  "status": "refunded",
  "refund": {
    "id": "ref_001",
    "amount": 7128.00,
    "reason": "Customer requested refund",
    "refund_date": "2025-01-21",
    "status": "succeeded"
  }
}
```

### 4.4 PRODUCTS

#### 4.4.1 Create Product

```http
POST /v1/products
```

**Request Body:**
```json
{
  "name": "Web Development Services",
  "description": "Hourly web development services",
  "sku": "WEB-DEV-001",
  "unit_price": 150.00,
  "unit": "hour",
  "tax_profile_id": "tax_gst_10",
  "category": "Services"
}
```

**Response (201 Created):**
```json
{
  "id": "prod_abc123",
  "object": "product",
  "name": "Web Development Services",
  "description": "Hourly web development services",
  "sku": "WEB-DEV-001",
  "unit_price": 150.00,
  "unit": "hour",
  "tax_profile_id": "tax_gst_10",
  "category": "Services",
  "is_active": true,
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### 4.4.2 List Products

```http
GET /v1/products?category=Services&is_active=true
```

### 4.5 REPORTS

#### 4.5.1 Accounts Receivable Aging Report

```http
GET /v1/reports/aging
```

**Query Parameters:**
- `as_of_date`: Report date (default: today)
- `customer_id`: Filter by customer
- `aging_periods`: Comma-separated (default: 30,60,90)

**Response (200 OK):**
```json
{
  "object": "aging_report",
  "as_of_date": "2025-01-20",
  "currency": "USD",
  "aging_periods": [0, 30, 60, 90],
  "summary": {
    "current": 15000.00,
    "1_30_days": 8500.00,
    "31_60_days": 3200.00,
    "61_90_days": 1100.00,
    "over_90_days": 500.00,
    "total_due": 28300.00
  },
  "customers": [
    {
      "customer_id": "cus_001",
      "customer_name": "ACME Corporation",
      "current": 10000.00,
      "1_30_days": 5000.00,
      "31_60_days": 0,
      "61_90_days": 0,
      "over_90_days": 0,
      "total_due": 15000.00
    }
  ]
}
```

#### 4.5.2 Sales Report

```http
GET /v1/reports/sales
```

**Query Parameters:**
- `start_date`, `end_date`: Date range
- `group_by`: day, week, month, quarter, year, customer
- `currency`: Filter by currency

**Response:**
```json
{
  "object": "sales_report",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "currency": "USD",
  "group_by": "week",
  "data": [
    {
      "period": "2025-01-01",
      "period_end": "2025-01-07",
      "invoices_count": 15,
      "total_invoiced": 45000.00,
      "total_paid": 38000.00,
      "total_outstanding": 7000.00
    }
  ],
  "summary": {
    "total_invoiced": 180000.00,
    "total_paid": 152000.00,
    "total_outstanding": 28000.00
  }
}
```

#### 4.5.3 Tax Report

```http
GET /v1/reports/tax?start_date=2025-01-01&end_date=2025-03-31
```

**Response:**
```json
{
  "object": "tax_report",
  "start_date": "2025-01-01",
  "end_date": "2025-03-31",
  "tax_profiles": [
    {
      "tax_profile_id": "tax_gst_10",
      "name": "GST (10%)",
      "type": "GST",
      "rate": 10.00,
      "total_sales": 100000.00,
      "total_tax_collected": 10000.00,
      "invoice_count": 47
    }
  ],
  "summary": {
    "total_sales": 100000.00,
    "total_tax_collected": 10000.00
  }
}
```

### 4.6 WEBHOOKS

#### 4.6.1 Create Webhook

```http
POST /v1/webhooks
```

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/invoices",
  "events": ["invoice.created", "invoice.paid", "payment.received"],
  "description": "Production webhook for order fulfillment"
}
```

**Response (201 Created):**
```json
{
  "id": "wh_abc123",
  "object": "webhook",
  "url": "https://yourapp.com/webhooks/invoices",
  "events": ["invoice.created", "invoice.paid", "payment.received"],
  "secret": "whsec_1234567890abcdef",
  "active": true,
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### 4.6.2 Test Webhook

```http
POST /v1/webhooks/{webhook_id}/test
```

**Response:**
```json
{
  "test_event_id": "evt_test_123",
  "delivery_status": "success",
  "response_code": 200,
  "response_time_ms": 145
}
```

## 5. WEBHOOK EVENTS

### Event Format

```json
{
  "id": "evt_abc123",
  "object": "event",
  "type": "invoice.paid",
  "created": 1642348800,
  "data": {
    "object": {
      "id": "inv_xyz789",
      "number": "INV-2025-001",
      "status": "paid",
      "total": 7128.00,
      "paid_at": "2025-01-20T14:30:00Z"
    },
    "previous_attributes": {
      "status": "sent",
      "amount_paid": 0
    }
  }
}
```

### Supported Events

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

**Payment Events:**
- `payment.created`
- `payment.succeeded`
- `payment.failed`
- `payment.refunded`

**Customer Events:**
- `customer.created`
- `customer.updated`
- `customer.deleted`

### Webhook Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js example
app.post('/webhooks', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  // Process event...

  res.status(200).send('OK');
});
```

## 6. ERROR CODES

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request succeeded, no content returned |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Temporary unavailability |

### Error Response Examples

**Validation Error (422):**
```json
{
  "error": {
    "type": "validation_error",
    "code": "invalid_email",
    "message": "The email address 'not-an-email' is invalid",
    "param": "customer.email",
    "doc_url": "https://docs.invoiceapp.com/errors/invalid_email"
  },
  "request_id": "req_550e8400"
}
```

**Authentication Error (401):**
```json
{
  "error": {
    "type": "authentication_error",
    "code": "invalid_token",
    "message": "The provided authentication token is invalid or expired",
    "doc_url": "https://docs.invoiceapp.com/errors/invalid_token"
  },
  "request_id": "req_550e8401"
}
```

**Rate Limit Error (429):**
```json
{
  "error": {
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded",
    "message": "You have exceeded the rate limit of 1000 requests per minute",
    "retry_after": 45
  },
  "request_id": "req_550e8402"
}
```

**Not Found Error (404):**
```json
{
  "error": {
    "type": "not_found_error",
    "code": "resource_not_found",
    "message": "No invoice found with id 'inv_xyz789'",
    "param": "id",
    "doc_url": "https://docs.invoiceapp.com/errors/resource_not_found"
  },
  "request_id": "req_550e8403"
}
```

## 7. IDEMPOTENCY

Prevent duplicate requests by including an idempotency key:

```http
POST /v1/invoices
X-Idempotency-Key: unique-key-12345
Content-Type: application/json

{
  "customer_id": "cus_abc123",
  "total": 1000.00
}
```

**Behavior:**
- First request with key: Processes normally
- Subsequent requests with same key within 24 hours: Returns cached response (200 OK)
- Key expires after 24 hours

## 8. VERSIONING

**Current Version:** v1

**URL Structure:**
```
https://api.invoiceapp.com/v1/invoices
```

**Version Migration:**
- New API versions announced 6 months in advance
- Old versions supported for 12 months after new version release
- Version-specific changes documented in migration guides

## 9. SDK & CLIENT LIBRARIES

**Official Libraries:**

**JavaScript/TypeScript:**
```bash
npm install @invoiceapp/sdk
```

```javascript
import InvoiceApp from '@invoiceapp/sdk';

const client = new InvoiceApp({
  apiKey: 'sk_live_1234567890'
});

const invoice = await client.invoices.create({
  customer_id: 'cus_abc123',
  total: 1000.00
});
```

**Python:**
```bash
pip install invoiceapp-python
```

```python
import invoiceapp

invoiceapp.api_key = 'sk_live_1234567890'

invoice = invoiceapp.Invoice.create(
  customer_id='cus_abc123',
  total=1000.00
)
```

**PHP:**
```bash
composer require invoiceapp/invoiceapp-php
```

**Ruby:**
```bash
gem install invoiceapp
```

**Go:**
```bash
go get github.com/invoiceapp/invoiceapp-go
```

## 10. POSTMAN COLLECTION

Download the complete Postman collection:
```
https://api.invoiceapp.com/postman/collection.json
```

Import into Postman for interactive API testing with pre-configured requests and environments.

## 11. OPENAPI SPECIFICATION

OpenAPI 3.0 specification available at:
```
https://api.invoiceapp.com/openapi.yaml
https://api.invoiceapp.com/openapi.json
```

Use with tools like Swagger UI, Redoc, or code generators.

---

This comprehensive API specification provides everything needed to integrate with the Enterprise Invoice Generator system!
