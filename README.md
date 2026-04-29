# MailFlow — Email Outreach Platform

A modular, live email outreach tool built with React + Supabase + Brevo.

---

## 🚀 Deployment Steps (Zero Coding Required)

### Step 1 — Setup Supabase Database

1. Go to your Supabase project: https://jzytphmoigscthbhefor.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `SUPABASE_SETUP.sql` from this folder
5. Copy all the SQL and paste it into the editor
6. Click **Run** (green button)
7. You should see "Success" — all tables are created ✓

---

### Step 2 — Push to GitHub

1. Go to https://github.com and create a **New Repository** (name it `mailflow`)
2. Make it **Private**
3. Upload all these files to the repo (drag & drop in GitHub UI, or use GitHub Desktop)

---

### Step 3 — Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New Project**
3. Select your `mailflow` repository
4. Framework will auto-detect as **Vite**
5. Click **Deploy**
6. Wait ~2 minutes → Your app is live! ✓

---

### Step 4 — Configure Your App

1. Open your live Vercel URL
2. Go to **Settings** module
3. Enter your **Brevo API Key** (xkeysib-...)
4. Enter your **Sender Email** (verified in Brevo)
5. Enter your **Sender Name**
6. Click **Save Settings**

---

## 📦 Adding New Modules (Auto-Update)

To add a new feature module:

1. Create a new folder: `src/modules/yourmodule/YourModule.jsx`
2. Open `src/moduleRegistry.js`
3. Import your component and add an entry to the `modules` array
4. Push to GitHub → Vercel auto-deploys in ~60 seconds ✓

That's it — the sidebar, routing, and settings panel update automatically.

---

## 📋 Excel Upload Format

Your Excel file must have these columns (column names are flexible):

| Column | Required | Accepted Names |
|--------|----------|----------------|
| Name | ✅ Yes | Name, Full Name |
| Email | ✅ Yes | Email, Email ID, Email Address |
| Website | Optional | Website, URL, Site |
| Phone | Optional | Phone, Phone Number, Mobile, Contact |

Download a template from the Contacts page.

---

## 🔧 Tech Stack

- **Frontend**: React 18 + Vite
- **Hosting**: Vercel (auto-deploy from GitHub)
- **Database**: Supabase (PostgreSQL)
- **Email**: Brevo API
- **Excel**: SheetJS

---

## 📊 Tracking

Open tracking works via a 1×1 pixel image embedded in each email.
When a recipient opens the email, their email client loads the pixel → logged in Supabase.

> Note: Some email clients block tracking pixels (Gmail sometimes, Outlook often).
> This is standard behaviour across all email marketing tools.
