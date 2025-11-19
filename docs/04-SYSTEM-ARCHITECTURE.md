# SYSTEM ARCHITECTURE - ENTERPRISE INVOICE GENERATOR

## 1. ARCHITECTURE OVERVIEW

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile Web (PWA)  │  API Clients  │  Webhooks      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              CDN LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  CloudFront / Cloudflare (Static Assets, PDFs, Images)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Application Load Balancer (ALB) - SSL Termination, WAF                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────┐
│      APPLICATION LAYER              │ │       API GATEWAY               │
├─────────────────────────────────────┤ ├─────────────────────────────────┤
│  Next.js App Servers (10+ nodes)    │ │  Kong / AWS API Gateway         │
│  - SSR (Server-Side Rendering)      │ │  - Rate Limiting                │
│  - API Routes                       │ │  - Authentication               │
│  - Session Management               │ │  - Request Validation           │
└─────────────────────────────────────┘ └─────────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MICROSERVICES LAYER                              │
├──────────────────┬──────────────────┬──────────────────┬────────────────┤
│  Invoice Service │  Payment Service │  Customer Service│  Notification  │
│  - Create        │  - Process       │  - CRUD          │  Service       │
│  - Update        │  - Reconcile     │  - Sync CRM      │  - Email       │
│  - Calculate     │  - Refund        │  - Validation    │  - SMS         │
│  - Version       │  - Gateway API   │  - Deduplication │  - Push        │
└──────────────────┴──────────────────┴──────────────────┴────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────┐ ┌─────────────┐ ┌───────────────────────┐
│   PDF Service           │ │ Integration │ │   Analytics Service   │
│   - Template Rendering  │ │ Service     │ │   - Data Aggregation  │
│   - Puppeteer Pool      │ │ - Xero      │ │   - Reporting         │
│   - S3 Upload           │ │ - QuickBooks│ │   - Dashboards        │
└─────────────────────────┘ │ - MYOB      │ └───────────────────────┘
                            │ - Webhooks  │
                            └─────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────┐
│       MESSAGE QUEUE LAYER           │ │       CACHING LAYER             │
├─────────────────────────────────────┤ ├─────────────────────────────────┤
│  RabbitMQ / AWS SQS                 │ │  Redis Cluster                  │
│  - PDF Generation Queue             │ │  - Session Store                │
│  - Email Queue                      │ │  - Query Cache                  │
│  - Payment Processing Queue         │ │  - Rate Limiting                │
│  - Webhook Queue                    │ │  - Temporary Data               │
└─────────────────────────────────────┘ └─────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────┐
│       DATA LAYER                    │ │     OBJECT STORAGE              │
├─────────────────────────────────────┤ ├─────────────────────────────────┤
│  PostgreSQL 14 (Primary)            │ │  Amazon S3 / MinIO              │
│  - Multi-tenant data                │ │  - PDF Documents                │
│  - Transactional data               │ │  - Images (logos, attachments)  │
│  PostgreSQL (Read Replicas x3)      │ │  - Backups                      │
│  - Reporting queries                │ │  - Audit Log Archives           │
│  Elasticsearch                      │ └─────────────────────────────────┘
│  - Full-text search                 │
│  - Analytics                        │
└─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Stripe  │  PayPal  │  SendGrid  │  Twilio  │  Xero  │  QuickBooks     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture Decision: Monolith vs Microservices

**Recommended: Modular Monolith → Microservices Evolution**

**Phase 1: Modular Monolith (MVP - 12 months)**
- Single codebase with clear module boundaries
- Shared database with logical separation
- Faster development velocity
- Simpler deployment and operations
- Lower infrastructure costs
- Suitable for 0-10,000 users

**Module Structure:**
```
/src
  /modules
    /invoices
      /controllers
      /services
      /models
      /routes
    /payments
    /customers
    /notifications
    /pdf
    /integrations
```

**Phase 2: Selective Extraction (12-24 months)**
- Extract high-load services first:
  1. **PDF Generation Service** (CPU-intensive, can benefit from dedicated scaling)
  2. **Notification Service** (high volume, independent scaling)
  3. **Payment Service** (security isolation, PCI compliance)
- Keep core business logic in monolith
- Event-driven communication (RabbitMQ, Kafka)

**Phase 3: Full Microservices (24+ months)**
- Complete service decomposition
- API Gateway for routing
- Service mesh for inter-service communication
- Distributed tracing (Jaeger, Zipkin)

### Technology Stack Recommendation

**Frontend:**
- **Framework:** Next.js 14+ (React)
- **Language:** TypeScript
- **State Management:** Zustand / Redux Toolkit
- **UI Components:** Tailwind CSS + Shadcn UI
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query)
- **Charts:** Recharts / Chart.js
- **PDF Preview:** React-PDF
- **Rich Text:** Tiptap / Lexical

**Backend:**
- **Framework:** Next.js API Routes (initially) → NestJS (microservices)
- **Language:** TypeScript (Node.js)
- **Alternative:** Python FastAPI (if team preference)
- **API Style:** REST (primary), GraphQL (optional for complex queries)
- **Validation:** Zod / Yup / Joi
- **ORM:** Prisma (TypeScript) / TypeORM / Drizzle
- **Authentication:** NextAuth.js / Passport.js + JWT

**Database:**
- **Primary:** PostgreSQL 14+
  - ACID compliance (critical for financial data)
  - JSON support (flexible schemas)
  - Full-text search (pg_trgm, ts_vector)
  - Table partitioning (scale to 100M+ records)
- **Read Replicas:** PostgreSQL streaming replication
- **Search:** Elasticsearch (optional, for advanced search)
- **Time-Series:** TimescaleDB (PostgreSQL extension for analytics)

**Caching:**
- **In-Memory Cache:** Redis 7+
  - Session storage
  - Query result caching
  - Rate limiting (Token Bucket)
  - Pub/Sub for real-time features
- **CDN Cache:** CloudFront / Cloudflare
  - Static assets (30-day cache)
  - PDFs (7-day cache)
  - API responses (optional, short TTL)

**Message Queue:**
- **Option 1:** RabbitMQ (self-hosted or CloudAMQP)
  - Battle-tested, reliable
  - Support for complex routing
  - Dead Letter Queues (DLQ)
- **Option 2:** AWS SQS + SNS (managed)
  - Fully managed, auto-scaling
  - Pay-per-use pricing
  - Integration with AWS ecosystem

**Object Storage:**
- **Option 1:** Amazon S3 (recommended)
  - 99.999999999% durability
  - Versioning, lifecycle policies
  - CloudFront integration
- **Option 2:** MinIO (self-hosted, S3-compatible)
  - Lower cost for high-volume
  - Data residency control
  - Kubernetes native

**PDF Generation:**
- **Puppeteer** (headless Chrome)
  - Pros: Excellent CSS support, renders like browser
  - Cons: Memory-intensive, slower
  - Use Case: Complex templates, charts
- **wkhtmltopdf** (lightweight alternative)
  - Pros: Faster, lower memory
  - Cons: Limited CSS support
  - Use Case: Simple text invoices
- **PDFKit** (programmatic generation)
  - Pros: Full control, smallest file sizes
  - Cons: Steeper learning curve
  - Use Case: Standardized templates

**Deployment:**
- **Containers:** Docker
- **Orchestration:** Kubernetes (EKS, GKE, AKS)
- **Alternative (simpler):** AWS ECS / Fargate
- **CI/CD:** GitHub Actions / GitLab CI / CircleCI
- **Infrastructure as Code:** Terraform / Pulumi
- **Secrets Management:** AWS Secrets Manager / HashiCorp Vault

## 2. FRONTEND ARCHITECTURE

### Next.js Application Structure

```
/invoice-generator-frontend
├── /public
│   ├── /fonts
│   ├── /images
│   └── /static
├── /src
│   ├── /app                    # Next.js 13+ App Router
│   │   ├── /api                # API routes
│   │   │   ├── /auth
│   │   │   ├── /invoices
│   │   │   └── /webhooks
│   │   ├── /dashboard          # Main app pages
│   │   ├── /invoices
│   │   │   ├── /new
│   │   │   ├── /[id]
│   │   │   └── /[id]/edit
│   │   ├── /customers
│   │   ├── /payments
│   │   ├── /reports
│   │   ├── /settings
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── /components
│   │   ├── /ui                 # Reusable UI components
│   │   ├── /forms
│   │   ├── /invoice
│   │   ├── /dashboard
│   │   └── /shared
│   ├── /lib
│   │   ├── /api                # API client functions
│   │   ├── /hooks              # Custom React hooks
│   │   ├── /utils              # Utility functions
│   │   ├── /validation         # Zod schemas
│   │   └── /constants
│   ├── /store                  # State management
│   │   ├── /slices
│   │   └── store.ts
│   ├── /types                  # TypeScript types
│   └── /styles
│       └── globals.css
├── /tests
│   ├── /unit
│   ├── /integration
│   └── /e2e
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Key Frontend Patterns

**1. Server-Side Rendering (SSR) for SEO and Performance**
```typescript
// app/invoices/[id]/page.tsx
export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = await getInvoice(params.id); // Server-side data fetch

  return (
    <InvoiceDetail invoice={invoice} />
  );
}
```

**2. Client Components for Interactivity**
```typescript
'use client';

export function InvoiceForm() {
  const [lineItems, setLineItems] = useState([]);
  // Interactive invoice creation
}
```

**3. API Routes for Backend Logic**
```typescript
// app/api/invoices/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const session = await getSession();

  // Validate
  const validated = invoiceSchema.parse(body);

  // Create invoice
  const invoice = await db.invoice.create({
    data: {
      ...validated,
      userId: session.user.id
    }
  });

  return Response.json(invoice, { status: 201 });
}
```

**4. Optimistic UI Updates**
```typescript
const mutation = useMutation({
  mutationFn: (invoice) => api.invoices.create(invoice),
  onMutate: async (newInvoice) => {
    // Optimistically update cache
    queryClient.setQueryData(['invoices'], (old) => [...old, newInvoice]);
  },
  onError: (err, newInvoice, context) => {
    // Rollback on error
    queryClient.setQueryData(['invoices'], context.previousInvoices);
  }
});
```

**5. Real-Time Updates with WebSockets**
```typescript
useEffect(() => {
  const socket = io();

  socket.on(`invoice:${invoiceId}:updated`, (data) => {
    queryClient.invalidateQueries(['invoice', invoiceId]);
  });

  return () => socket.disconnect();
}, [invoiceId]);
```

## 3. BACKEND ARCHITECTURE

### NestJS Microservices Structure (Phase 2)

```
/invoice-generator-backend
├── /apps
│   ├── /api-gateway          # Main API entry point
│   ├── /invoice-service
│   ├── /payment-service
│   ├── /customer-service
│   ├── /notification-service
│   └── /pdf-service
├── /libs                      # Shared libraries
│   ├── /common
│   │   ├── /decorators
│   │   ├── /filters
│   │   ├── /guards
│   │   ├── /interceptors
│   │   └── /pipes
│   ├── /database
│   │   ├── /entities
│   │   └── /repositories
│   └── /events                # Event definitions
├── /config
├── /migrations
└── package.json
```

### Invoice Service (Example)

```
/apps/invoice-service
├── /src
│   ├── /dto                   # Data Transfer Objects
│   │   ├── create-invoice.dto.ts
│   │   ├── update-invoice.dto.ts
│   │   └── invoice-response.dto.ts
│   ├── /entities
│   │   ├── invoice.entity.ts
│   │   ├── line-item.entity.ts
│   │   └── invoice-version.entity.ts
│   ├── /services
│   │   ├── invoice.service.ts
│   │   ├── invoice-calculation.service.ts
│   │   ├── invoice-numbering.service.ts
│   │   └── invoice-versioning.service.ts
│   ├── /controllers
│   │   └── invoice.controller.ts
│   ├── /events
│   │   ├── invoice-created.event.ts
│   │   └── invoice-paid.event.ts
│   ├── /repositories
│   │   └── invoice.repository.ts
│   ├── invoice.module.ts
│   └── main.ts
└── test
```

### Service Communication Patterns

**Synchronous (REST/gRPC):**
```typescript
// API Gateway → Invoice Service
const invoice = await this.httpService.post('http://invoice-service/api/invoices', data);

// gRPC alternative (faster)
const invoice = await this.invoiceClient.createInvoice(data).toPromise();
```

**Asynchronous (Event-Driven):**
```typescript
// Invoice Service emits event
this.eventBus.publish(new InvoiceCreatedEvent(invoice));

// Notification Service listens
@EventsHandler(InvoiceCreatedEvent)
export class InvoiceCreatedHandler {
  async handle(event: InvoiceCreatedEvent) {
    await this.emailService.sendInvoiceEmail(event.invoice);
  }
}
```

## 4. DATABASE ARCHITECTURE

### PostgreSQL Configuration

**Primary Database (Write):**
```yaml
# postgresql.conf optimizations
shared_buffers = 4GB                  # 25% of system RAM
effective_cache_size = 12GB           # 75% of system RAM
work_mem = 64MB                       # Per query operation
maintenance_work_mem = 512MB          # For VACUUM, CREATE INDEX
max_connections = 200

# Write-Ahead Log (WAL)
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Query Performance
random_page_cost = 1.1                # For SSD storage
effective_io_concurrency = 200

# Replication
wal_level = replica
max_wal_senders = 5
```

**Read Replicas (3x for geographic distribution):**
- US-East (primary region)
- EU-West (European customers)
- AP-Southeast (Asia-Pacific customers)

**Replication Configuration:**
```yaml
# Streaming replication (synchronous for critical data)
synchronous_commit = on
synchronous_standby_names = 'replica1'

# Asynchronous for read-heavy replicas
hot_standby = on
hot_standby_feedback = on
```

### Database Connection Pooling

**PgBouncer Configuration:**
```ini
[databases]
invoicedb = host=localhost port=5432 dbname=invoicedb

[pgbouncer]
pool_mode = transaction              # Connection per transaction
max_client_conn = 1000                # Max client connections
default_pool_size = 25                # Connections per user/database
reserve_pool_size = 5                 # Emergency pool
server_idle_timeout = 600             # Close idle server connections
```

**Application-Level Pooling (Prisma):**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
  // Connection pool settings
  connection_limit: 10,               // Per app instance
  pool_timeout: 20,                   // Seconds
});
```

### Database Partitioning Strategy

**Invoice Table Partitioning (by date):**
```sql
-- Parent table
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  issue_date DATE NOT NULL,
  -- other columns...
) PARTITION BY RANGE (issue_date);

-- Partitions (quarterly)
CREATE TABLE invoices_2025_q1 PARTITION OF invoices
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE invoices_2025_q2 PARTITION OF invoices
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

-- Automatically create partitions (pg_partman extension)
SELECT create_parent('public.invoices', 'issue_date', 'native', 'quarterly');
```

**Benefits:**
- Faster queries (only scan relevant partitions)
- Efficient archiving (detach old partitions)
- Parallel query execution across partitions
- Easier maintenance (VACUUM, ANALYZE per partition)

### Indexing Strategy

**Invoice Table Indexes:**
```sql
-- Primary key (clustered)
CREATE UNIQUE INDEX idx_invoices_pkey ON invoices(id);

-- Tenant isolation (most common filter)
CREATE INDEX idx_invoices_tenant_date ON invoices(tenant_id, issue_date DESC);

-- Invoice number lookup (unique per tenant)
CREATE UNIQUE INDEX idx_invoices_number ON invoices(tenant_id, number);

-- Customer invoice history
CREATE INDEX idx_invoices_customer ON invoices(customer_id, issue_date DESC);

-- Payment status queries
CREATE INDEX idx_invoices_status ON invoices(status) WHERE status IN ('unpaid', 'overdue');

-- Full-text search (invoice content)
CREATE INDEX idx_invoices_search ON invoices USING GIN(to_tsvector('english', notes || ' ' || reference));

-- Partial index for drafts (less than 5% of data)
CREATE INDEX idx_invoices_drafts ON invoices(tenant_id, created_at) WHERE status = 'draft';
```

**Index Maintenance:**
```sql
-- Reindex monthly (automated job)
REINDEX INDEX CONCURRENTLY idx_invoices_tenant_date;

-- Analyze statistics weekly
ANALYZE invoices;

-- Vacuum regularly (autovacuum enabled)
VACUUM ANALYZE invoices;
```

## 5. CACHING LAYER

### Redis Architecture

**Cluster Configuration (Multi-Node):**
```yaml
# 6 nodes (3 masters + 3 replicas)
cluster-enabled yes
cluster-node-timeout 5000
cluster-replica-validity-factor 0
cluster-migration-barrier 1

# Memory settings
maxmemory 4gb
maxmemory-policy allkeys-lru         # Evict least recently used

# Persistence (for session data)
save 900 1                            # Save if 1 key changed in 15min
save 300 10                           # Save if 10 keys changed in 5min
appendonly yes                        # AOF for durability
```

**Cache Patterns:**

**1. Cache-Aside (Lazy Loading):**
```typescript
async function getInvoice(id: string) {
  // Try cache first
  const cached = await redis.get(`invoice:${id}`);
  if (cached) return JSON.parse(cached);

  // Cache miss → fetch from DB
  const invoice = await db.invoice.findUnique({ where: { id } });

  // Store in cache (1 hour TTL)
  await redis.setex(`invoice:${id}`, 3600, JSON.stringify(invoice));

  return invoice;
}
```

**2. Write-Through Cache:**
```typescript
async function updateInvoice(id: string, data: any) {
  // Update database
  const invoice = await db.invoice.update({ where: { id }, data });

  // Update cache
  await redis.setex(`invoice:${id}`, 3600, JSON.stringify(invoice));

  return invoice;
}
```

**3. Cache Invalidation:**
```typescript
async function deleteInvoice(id: string) {
  await db.invoice.delete({ where: { id } });

  // Invalidate cache
  await redis.del(`invoice:${id}`);

  // Invalidate related caches
  await redis.del(`customer:${customerId}:invoices`);
}
```

**Cache Key Patterns:**
- `invoice:{id}` - Single invoice
- `customer:{id}:invoices` - Customer's invoice list
- `tenant:{id}:stats` - Dashboard statistics
- `user:{id}:session` - User session
- `template:{id}` - Invoice template
- `rate_limit:{ip}:{endpoint}` - Rate limiting

**Cache TTLs:**
- Invoice: 1 hour
- Customer: 30 minutes
- Template: 24 hours (rarely changes)
- Dashboard stats: 5 minutes
- Session: 8 hours
- Rate limit: 1 minute (sliding window)

## 6. MESSAGE QUEUE ARCHITECTURE

### RabbitMQ Setup

**Exchange Types:**

**1. Topic Exchange (Flexible Routing):**
```
Exchange: invoice.events
Routing Keys:
  - invoice.created
  - invoice.updated
  - invoice.paid
  - payment.received
```

**2. Fanout Exchange (Broadcast):**
```
Exchange: notifications
Bindings:
  - email.queue
  - sms.queue
  - push.queue
  - webhook.queue
```

**Queue Configuration:**
```typescript
// PDF Generation Queue
await channel.assertQueue('pdf.generate', {
  durable: true,                      // Persist queue to disk
  messageTtl: 600000,                 // 10 min message expiry
  maxLength: 10000,                   // Max queue size
  deadLetterExchange: 'dlx',          // Failed messages
  deadLetterRoutingKey: 'pdf.failed'
});

// Consumer with prefetch (process 5 at a time)
channel.prefetch(5);
channel.consume('pdf.generate', async (msg) => {
  const invoice = JSON.parse(msg.content.toString());

  try {
    await generatePDF(invoice);
    channel.ack(msg);                 // Success
  } catch (error) {
    channel.nack(msg, false, false);  // Failed, send to DLQ
  }
});
```

**Priority Queue (Urgent Invoices):**
```typescript
await channel.assertQueue('pdf.generate', {
  maxPriority: 10,                    // Priority 0-10
  durable: true
});

// Send high-priority message
channel.sendToQueue('pdf.generate', Buffer.from(JSON.stringify(invoice)), {
  priority: 8                         // Urgent invoice
});
```

**Retry Logic with Exponential Backoff:**
```typescript
const maxRetries = 3;
const retryCount = msg.properties.headers['x-retry-count'] || 0;

if (retryCount < maxRetries) {
  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s

  setTimeout(() => {
    channel.sendToQueue('pdf.generate', msg.content, {
      headers: { 'x-retry-count': retryCount + 1 }
    });
    channel.ack(msg);
  }, delay);
} else {
  // Max retries exceeded → DLQ
  channel.nack(msg, false, false);
}
```

## 7. SECURITY LAYERS

### Defense in Depth

**Layer 1: Network Security**
- VPC (Virtual Private Cloud) with private subnets
- Security groups (firewall rules)
- Network ACLs
- DDoS protection (AWS Shield, Cloudflare)
- WAF (Web Application Firewall) rules:
  - SQL injection prevention
  - XSS prevention
  - Rate limiting by IP
  - Geo-blocking (if needed)

**Layer 2: Application Security**
- HTTPS only (TLS 1.3)
- HSTS (HTTP Strict Transport Security)
- Content Security Policy (CSP)
- CORS (Cross-Origin Resource Sharing) whitelist
- Input validation (Zod schemas)
- Output encoding (prevent XSS)
- SQL injection prevention (parameterized queries)

**Layer 3: Authentication & Authorization**
- Multi-factor authentication (TOTP, SMS, email)
- Password requirements (12+ chars, complexity)
- Password hashing (bcrypt, argon2)
- JWT with short expiry (15 min access, 7 day refresh)
- OAuth 2.0 / SAML for SSO
- API key rotation (90 days)
- Session fixation prevention

**Layer 4: Data Security**
- Encryption at rest (AES-256)
  - Database encryption (Transparent Data Encryption)
  - S3 bucket encryption (SSE-S3 or SSE-KMS)
- Encryption in transit (TLS 1.3)
- PII data masking in logs
- Database-level encryption for sensitive fields
- Key management (AWS KMS, HashiCorp Vault)

**Layer 5: Monitoring & Detection**
- Intrusion detection system (IDS)
- Log analysis (SIEM)
- Anomaly detection (unusual login patterns)
- Security scanning (OWASP ZAP, Burp Suite)
- Dependency vulnerability scanning (Snyk, Dependabot)
- Penetration testing (quarterly)

### Authentication Flow

```
┌─────────┐                ┌──────────────┐              ┌──────────┐
│ Client  │                │  API Gateway │              │  Auth    │
│         │                │              │              │  Service │
└────┬────┘                └──────┬───────┘              └────┬─────┘
     │                            │                           │
     │  1. Login Request          │                           │
     │  (email, password)         │                           │
     ├───────────────────────────>│                           │
     │                            │  2. Verify Credentials    │
     │                            ├──────────────────────────>│
     │                            │                           │
     │                            │  3. Return User + Token   │
     │                            │<──────────────────────────┤
     │  4. JWT Access Token       │                           │
     │  + Refresh Token           │                           │
     │<───────────────────────────┤                           │
     │                            │                           │
     │  5. API Request            │                           │
     │  (Authorization: Bearer)   │                           │
     ├───────────────────────────>│                           │
     │                            │  6. Validate JWT          │
     │                            ├──────────────────────────>│
     │                            │  7. Token Valid           │
     │                            │<──────────────────────────┤
     │                            │                           │
     │                            │  8. Process Request       │
     │                            │     (Business Logic)      │
     │  9. Response               │                           │
     │<───────────────────────────┤                           │
     │                            │                           │
```

### Data Encryption

**Database Column Encryption (for PII):**
```typescript
// Encrypt before storing
const encryptedEmail = await encrypt(email, process.env.ENCRYPTION_KEY);
await db.customer.create({
  data: {
    email: encryptedEmail,
    // other fields
  }
});

// Decrypt when retrieving
const customer = await db.customer.findUnique({ where: { id } });
const decryptedEmail = await decrypt(customer.email, process.env.ENCRYPTION_KEY);
```

**Encryption Utility:**
```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

export function encrypt(text: string, key: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decrypt(encryptedData: any, key: string) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

## 8. LOAD BALANCING & SCALING STRATEGY

### Horizontal Scaling (Recommended)

**Auto-Scaling Configuration (Kubernetes HPA):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: invoice-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: invoice-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70      # Scale up at 70% CPU
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80      # Scale up at 80% memory
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: 1000          # Scale up at 1000 req/s per pod
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50                   # Scale up 50% at a time
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10                   # Scale down slowly (10%)
        periodSeconds: 60
```

**Load Balancer Configuration (ALB):**
```yaml
# Application Load Balancer
Health Check:
  Path: /health
  Interval: 30s
  Timeout: 5s
  Healthy Threshold: 2
  Unhealthy Threshold: 3

# Routing Rules
Rules:
  - Path: /api/*
    Target: API Server Pool
  - Path: /assets/*
    Target: CDN
  - Path: /*
    Target: Next.js App Pool

# Connection Settings
Idle Timeout: 60s
Deregistration Delay: 30s        # Graceful shutdown time
```

### Database Scaling

**Read/Write Splitting:**
```typescript
// Write operations → Primary
const writeClient = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_PRIMARY_URL } }
});

// Read operations → Replica
const readClient = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_REPLICA_URL } }
});

// Usage
async function getInvoice(id: string) {
  return readClient.invoice.findUnique({ where: { id } });
}

async function createInvoice(data: any) {
  return writeClient.invoice.create({ data });
}
```

**Connection Pool per Instance:**
```
Application Servers: 20 instances
Connection Pool per Instance: 10
Total Connections: 200
Database max_connections: 250 (50 buffer for admin)
```

### Caching Strategy for Scale

**Multi-Level Cache:**

**L1: Application Cache (In-Memory)**
```typescript
// Node.js in-memory cache (per instance)
const cache = new Map();

function get(key: string) {
  return cache.get(key);
}

function set(key: string, value: any, ttl: number) {
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttl);
}
```

**L2: Redis Cache (Shared)**
```typescript
// Shared across all instances
const cachedInvoice = await redis.get(`invoice:${id}`);
```

**L3: CDN Cache (Global)**
```
CloudFront caches PDFs globally (edge locations)
```

**Cache Hit Ratio Target:** >80% for frequently accessed data

## 9. CI/CD PIPELINE DESIGN

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:unit

      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb

      - name: E2E tests
        run: npm run test:e2e

      - name: Code coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ghcr.io/yourorg/invoice-api:${{ github.sha }}
            ghcr.io/yourorg/invoice-api:latest
          cache-from: type=registry,ref=ghcr.io/yourorg/invoice-api:buildcache
          cache-to: type=registry,ref=ghcr.io/yourorg/invoice-api:buildcache,mode=max

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging (Kubernetes)
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/staging/deployment.yaml
            k8s/staging/service.yaml
          images: ghcr.io/yourorg/invoice-api:${{ github.sha }}
          kubectl-version: 'latest'

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production (Blue-Green)
        run: |
          # Deploy to green environment
          kubectl apply -f k8s/production/deployment-green.yaml

          # Health check
          kubectl rollout status deployment/invoice-api-green

          # Switch traffic (update service selector)
          kubectl patch service invoice-api -p '{"spec":{"selector":{"version":"green"}}}'

          # Keep blue as rollback option for 1 hour
          sleep 3600

          # Delete old blue deployment
          kubectl delete deployment invoice-api-blue
```

### Deployment Strategies

**1. Blue-Green Deployment (Zero Downtime):**
```
Production (Blue): v1.5 (100% traffic)
                    ↓
Deploy Green: v1.6 (0% traffic)
                    ↓
Health Check & Smoke Tests
                    ↓
Switch Traffic: Blue→Green (instant cutover)
                    ↓
Monitor for 1 hour
                    ↓
Shutdown Blue (or keep for rollback)
```

**2. Canary Deployment (Gradual Rollout):**
```
v1.5: 100% traffic
  ↓
v1.6: Deploy canary (5% traffic)
  ↓ Monitor metrics for 30 min
v1.6: Increase to 25%
  ↓ Monitor for 30 min
v1.6: Increase to 50%
  ↓ Monitor for 30 min
v1.6: 100% traffic
```

## 10. INFRASTRUCTURE DEPLOYMENT

### Kubernetes Deployment Configuration

**API Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: invoice-api
  namespace: production
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 3
      maxUnavailable: 1
  selector:
    matchLabels:
      app: invoice-api
  template:
    metadata:
      labels:
        app: invoice-api
        version: v1.6.0
    spec:
      containers:
      - name: api
        image: ghcr.io/yourorg/invoice-api:v1.6.0
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]  # Graceful shutdown
      affinity:
        podAntiAffinity:                              # Spread across nodes
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - invoice-api
              topologyKey: kubernetes.io/hostname
```

**Service (Load Balancer):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: invoice-api
  namespace: production
spec:
  type: LoadBalancer
  selector:
    app: invoice-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  sessionAffinity: None              # Stateless, no sticky sessions
```

### Terraform Infrastructure (AWS Example)

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "invoice-generator-vpc"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "invoice-generator-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier        = "invoice-generator-db"
  engine            = "postgres"
  engine_version    = "14.9"
  instance_class    = "db.r6g.2xlarge"
  allocated_storage = 500
  storage_type      = "gp3"
  storage_encrypted = true

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  performance_insights_enabled = true
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "invoice-generator-redis"
  replication_group_description = "Redis cluster for caching"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.r6g.large"
  num_cache_clusters         = 3
  port                       = 6379

  automatic_failover_enabled = true
  multi_az_enabled          = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

# S3 Bucket (PDF Storage)
resource "aws_s3_bucket" "pdfs" {
  bucket = "invoice-generator-pdfs-prod"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    enabled = true

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}
```

This architecture provides a solid foundation for a scalable, secure, and maintainable enterprise invoice generator system!
