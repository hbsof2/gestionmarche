# CLAUDE.md — منصة تسيير الصفقات وإدارة الموارد

## 🏗️ Project Overview
A web platform for managing procurement deals (Marchés Publics) and resource management, designed for suppliers who deliver goods to contracting authorities and their branches.

## 🧱 Tech Stack
| Layer      | Technology         | Hosting     |
|------------|--------------------|-------------|
| Frontend   | Next.js + Tailwind | Netlify     |
| Backend    | Node.js + Express  | Railway     |
| Database   | PostgreSQL         | Supabase    |
| Storage    | Supabase Storage   | Supabase    |

## 📁 Project Structure

```
project-root/
├── frontend/                    # Next.js application
│   ├── public/
│   │   └── assets/              # Static assets (logos, icons)
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── layout.js        # Root layout (RTL + Arabic)
│   │   │   ├── page.js          # Main dashboard
│   │   │   └── login/
│   │   │       └── page.js      # Login page
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx          # Right sidebar (sections)
│   │   │   │   ├── TopBar.jsx           # Top bar (section services)
│   │   │   │   └── MainLayout.jsx       # Main layout wrapper
│   │   │   ├── raw-materials/           # المواد الأولية
│   │   │   ├── contracting-authority/   # المصلحة المتعاقدة
│   │   │   ├── authority-branches/      # فروع المصلحة المتعاقدة
│   │   │   ├── contractor/              # المتعامل المتعاقد
│   │   │   ├── deals/                   # الصفقات
│   │   │   ├── receipts/                # الوصولات
│   │   │   ├── invoices/                # الفواتير
│   │   │   ├── users/                   # المستخدمين
│   │   │   └── database-backup/         # حفظ قاعدة المعطيات
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities and helpers
│   │   │   ├── api.js           # API client (Axios)
│   │   │   └── supabase.js      # Supabase client
│   │   └── styles/
│   │       └── globals.css      # Global styles + Tailwind
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
├── backend/                     # Express.js API
│   ├── src/
│   │   ├── server.js            # Entry point
│   │   ├── config/
│   │   │   └── db.js            # PostgreSQL connection
│   │   ├── routes/
│   │   │   ├── rawMaterials.js
│   │   │   ├── contractingAuthority.js
│   │   │   ├── authorityBranches.js
│   │   │   ├── contractor.js
│   │   │   ├── deals.js
│   │   │   ├── receipts.js
│   │   │   ├── invoices.js
│   │   │   ├── users.js
│   │   │   └── backup.js
│   │   ├── controllers/         # Route handlers
│   │   ├── models/              # Database models
│   │   ├── middleware/
│   │   │   ├── auth.js          # Authentication middleware
│   │   │   └── validation.js    # Input validation
│   │   └── utils/
│   │       └── email.js         # Email service
│   └── package.json
│
├── database/
│   └── migrations/              # SQL migration files
│
├── CLAUDE.md                    # This file
├── .gitignore
└── README.md
```

## 📋 Application Sections

| # | Section (AR)              | Section (EN)            | Route                  | Description                                    |
|---|---------------------------|-------------------------|------------------------|------------------------------------------------|
| 1 | المواد الأولية            | Raw Materials           | /raw-materials         | All raw materials used in deals (food items)    |
| 2 | المصلحة المتعاقدة        | Contracting Authority   | /contracting-authority | The entity the supplier signs the deal with     |
| 3 | فروع المصلحة المتعاقدة   | Authority Branches      | /authority-branches    | Institutions under the contracting authority    |
| 4 | المتعامل المتعاقد        | Contractor              | /contractor            | The supplier (second party in the deal)         |
| 5 | الصفقات                   | Deals                   | /deals                 | View and edit all deals                         |
| 6 | الوصولات                  | Receipts                | /receipts              | Delivery receipts sent with orders              |
| 7 | الفواتير                  | Invoices                | /invoices              | Create and edit invoices                        |
| 8 | المستخدمين                | Users                   | /users                 | Platform user management                        |
| 9 | حفظ قاعدة المعطيات       | Database Backup         | /database-backup       | Backup database and send via email              |

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TopBar: [خدمة 1] [خدمة 2] [خدمة 3] ...        ← section services │
├───────────────────────────────────────────────────┬─────────────────┤
│                                                   │  ┌───────────┐  │
│                                                   │  │ المواد    │  │
│                                                   │  │ الأولية   │  │
│                                                   │  ├───────────┤  │
│                                                   │  │ المصلحة   │  │
│                                                   │  │ المتعاقدة │  │
│                                                   │  ├───────────┤  │
│             Main Content Area                     │  │ فروع     │  │
│                                                   │  │ المصلحة   │  │
│                                                   │  ├───────────┤  │
│                                                   │  │ المتعامل  │  │
│                                                   │  │ المتعاقد  │  │
│                                                   │  ├───────────┤  │
│                                                   │  │ الصفقات   │  │
│                                                   │  ├───────────┤  │
│                                                   │  │ الوصولات  │  │
│                                                   │  ├───────────┤  │
│                                                   │  │ الفواتير  │  │
│                                                   │  ├───────────┤  │
│                                                   │  │المستخدمين │  │
│                                                   │  ├───────────┤  │
│                                                   │  │ حفظ قاعدة│  │
│                                                   │  │ المعطيات  │  │
│                                                   │  └───────────┘  │
└───────────────────────────────────────────────────┴─────────────────┘
                                                    ↑ Right Sidebar
```

## 🔐 Security Rules
- **NEVER** commit `.env` files or sensitive credentials to GitHub
- All API keys, DB connection strings go in environment variables only
- Use `.env.local` for local development (added to `.gitignore`)

## 🖥️ UI Guidelines
- **Language**: Arabic (UI) / English (code)
- **Direction**: RTL (right-to-left) throughout
- **Styling**: Tailwind CSS only — no inline styles or CSS modules
- **Responsiveness**: All components must use Tailwind responsive prefixes (sm:, md:, lg:)
- **Rule**: Make sure all new UI components are fully responsive for mobile screens using Tailwind CSS responsive prefixes (sm:, md:, lg:) only. Full RTL support must be maintained.

## 🗄️ Database Notes
- Tables will be defined after UI prototyping is complete
- PostgreSQL hosted on Supabase
- Migrations stored in `database/migrations/`

## 📝 Development Workflow
1. Always read this file before making changes
2. Check existing components before creating new ones
3. Test RTL layout on every new component
4. Test mobile responsiveness on every new component
5. Never hardcode sensitive data
