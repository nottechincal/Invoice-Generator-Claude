# Supabase Database Setup Guide

## 🔍 Step 1: Check if Your Database is Paused

Supabase **free tier databases pause after 1 week of inactivity**.

1. Go to https://supabase.com/dashboard
2. Select your project: `qjmiwchkagphrvryfdog`
3. Look for a banner that says **"Database paused"**
4. If paused, click **"Resume"** or **"Restore"**
5. Wait 1-2 minutes for database to start

---

## 🔧 Step 2: Get the Correct Connection Strings

### Option A: Connection Pooler (RECOMMENDED for Vercel)

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **"Transaction"** mode
4. Copy the URI

**Format:**
```
postgresql://postgres.qjmiwchkagphrvryfdog:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Your connection string (with your password):**
```
postgresql://postgres.qjmiwchkagphrvryfdog:hkS0xazl2uctn94z@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

> **Note:** Replace `us-west-1` with your actual region shown in Supabase dashboard

---

### Option B: Direct Connection (with SSL)

If pooler doesn't work, use direct connection with SSL:

```
postgresql://postgres.qjmiwchkagphrvryfdog:hkS0xazl2uctn94z@db.qjmiwchkagphrvryfdog.supabase.co:5432/postgres?sslmode=require
```

---

## 📝 Step 3: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL` and click **"Edit"**
4. **Delete the old value completely**
5. Paste the **Transaction Pooler** connection string (Option A above)
6. Select all 3 environments: Production, Preview, Development
7. Click **"Save"**

---

## 🧪 Step 4: Test the Connection

### Test in Supabase SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query:

```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
```

**Expected result:** Should show `12` (the number of tables we created)

If you get 0 tables, the database was reset when it paused. You'll need to re-run the SQL schema from earlier.

---

## 🚀 Step 5: Redeploy on Vercel

1. Go to Vercel Dashboard → **Deployments**
2. Click latest deployment → **three dots (•••)** → **"Redeploy"**
3. **Uncheck** "Use existing Build Cache"
4. Click **"Redeploy"**
5. Wait 2 minutes
6. Try signup again!

---

## ⚠️ Common Issues & Solutions

### Issue: "Can't reach database server"

**Possible causes:**
1. ✅ **Database is paused** → Resume it in Supabase dashboard
2. ✅ **Missing SSL mode** → Add `?sslmode=require` to direct connection
3. ✅ **Wrong region** → Check pooler URL in Supabase for correct region
4. ✅ **Old environment variable** → Delete and recreate in Vercel

### Issue: "Connection timed out"

**Solution:** Use Connection Pooler (Transaction mode) instead of direct connection

### Issue: Tables don't exist (COUNT returns 0)

**Solution:** Database was paused and reset. Re-run the SQL schema:
1. Go to Supabase SQL Editor
2. Re-run the entire CREATE TABLE script from earlier

---

## ✅ Verification Checklist

Before testing signup:

- [ ] Database is **NOT paused** in Supabase
- [ ] Can run SQL queries in Supabase SQL Editor
- [ ] 12 tables exist in database
- [ ] DATABASE_URL in Vercel uses **Transaction Pooler** format
- [ ] DATABASE_URL has your password: `hkS0xazl2uctn94z`
- [ ] Vercel has been redeployed (without cache)

---

## 🎯 Quick Fix Summary

**If your database was paused:**

1. Resume database in Supabase
2. Check if tables still exist (run `SELECT COUNT(*)` query)
3. If no tables, re-run the SQL schema
4. Use this DATABASE_URL in Vercel:
   ```
   postgresql://postgres.qjmiwchkagphrvryfdog:hkS0xazl2uctn94z@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. Redeploy Vercel (no cache)
6. Test signup!

---

**Need the SQL schema again?** It's in the earlier conversation or you can check the Prisma schema and regenerate it.
