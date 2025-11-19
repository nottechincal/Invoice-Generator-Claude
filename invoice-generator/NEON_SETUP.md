# Neon Database Setup Guide

## ✅ Step 1: Run the SQL Schema in Neon

1. Go to https://console.neon.tech
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Copy the entire contents of `neon-setup.sql` file
5. Paste it into the SQL Editor
6. Click **Run** to execute the script
7. You should see: `✅ Database setup complete! 12 tables created successfully.`

---

## 🔧 Step 2: Update DATABASE_URL in Vercel

### The Correct Connection String

Neon gave you a psql command, but you only need the connection string inside the quotes.

**Use this exact value in Vercel:**

```
postgresql://neondb_owner:npg_m3gTD0SBnxpJ@ep-ancient-recipe-a7tcdjek-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

⚠️ **Important Notes:**
- DO NOT include `psql` or the quotes
- I removed `&channel_binding=require` because it can cause issues with Prisma
- This is the **pooler** connection string (best for Vercel serverless)

### Update in Vercel

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL` and click **"Edit"**
4. **Delete the old value completely**
5. Paste the connection string above (no quotes, no spaces)
6. Select all 3 environments: **Production**, **Preview**, **Development**
7. Click **"Save"**

---

## 🚀 Step 3: Redeploy on Vercel

1. Go to Vercel Dashboard → **Deployments**
2. Click on the latest deployment
3. Click the **three dots (•••)** → **"Redeploy"**
4. **IMPORTANT:** Uncheck "Use existing Build Cache"
5. Click **"Redeploy"**
6. Wait 2-3 minutes for the build to complete

---

## 🧪 Step 4: Test the Signup

1. Go to your deployed app URL
2. Navigate to `/auth/signup`
3. Fill in the signup form:
   - Company Name: Test Company
   - First Name: John
   - Last Name: Doe
   - Email: test@example.com
   - Password: test1234 (min 8 chars)
4. Click **"Create Account"**

**Expected result:** You should be redirected to `/auth/login?registered=true`

---

## ✅ Verification Checklist

Before testing signup, make sure:

- [ ] SQL schema has been run in Neon SQL Editor (12 tables created)
- [ ] DATABASE_URL in Vercel is updated with the correct pooler connection
- [ ] DATABASE_URL does NOT have `psql` or quotes around it
- [ ] DATABASE_URL does NOT have `&channel_binding=require`
- [ ] All 3 environments (Production, Preview, Development) have the same DATABASE_URL
- [ ] Vercel has been redeployed WITHOUT build cache
- [ ] Build completed successfully (no errors in build logs)

---

## 🔍 Testing Database Connection

After redeployment, you can verify the database connection by checking the Vercel build logs:

1. Go to your latest deployment
2. Click on **"Building"** or **"View Build Logs"**
3. Look for Prisma messages - should see "Prisma schema loaded" without errors

---

## ⚠️ Troubleshooting

### Error: "Can't reach database server"

**Solution:** Make sure you're using the **pooler** connection string:
- Should contain `pooler.ap-southeast-2.aws.neon.tech`
- Should have port in the URL (it's included automatically)
- Should NOT have `channel_binding=require`

### Error: "relation 'tenants' does not exist"

**Solution:** You haven't run the SQL schema yet:
1. Go to Neon SQL Editor
2. Run the entire `neon-setup.sql` file
3. Verify 12 tables were created

### Build succeeds but signup fails

**Solution:** Check the Vercel function logs:
1. Go to Vercel Dashboard → **Logs**
2. Try to sign up
3. Look for error messages in the logs
4. Most common issue: DATABASE_URL not updated in all environments

---

## 📊 Database Tables Created

The SQL script creates these 12 tables:

1. **tenants** - Multi-tenant isolation
2. **users** - User accounts
3. **companies** - Company profiles
4. **tax_profiles** - Tax configuration
5. **customers** - Customer records
6. **invoices** - Invoice documents
7. **invoice_items** - Line items on invoices
8. **invoice_versions** - Version history
9. **products** - Product catalog
10. **payments** - Payment records
11. **audit_logs** - Audit trail
12. **integrations** - Third-party integrations

---

## 🎯 Quick Start Summary

1. **Run SQL in Neon:** Open SQL Editor → Paste `neon-setup.sql` → Run
2. **Update Vercel:** Settings → Environment Variables → DATABASE_URL → Paste connection string → Save
3. **Redeploy:** Deployments → Latest → Redeploy (no cache)
4. **Test:** Visit `/auth/signup` → Create account

---

## 🔗 Your Database Details

**Database:** neondb
**User:** neondb_owner
**Host:** ep-ancient-recipe-a7tcdjek-pooler.ap-southeast-2.aws.neon.tech
**Region:** ap-southeast-2 (Sydney, Australia)
**Connection Type:** Pooler (optimized for serverless)

---

## 💡 Why We Switched from Supabase to Neon

1. **No pausing:** Neon free tier doesn't pause databases after inactivity
2. **Better pooling:** Neon's pooler is optimized for serverless platforms like Vercel
3. **Simpler connection:** No need for special pgbouncer parameters
4. **Better performance:** Lower latency for serverless functions

---

**Ready to test? Follow the steps above and your Invoice Generator should be live!**
