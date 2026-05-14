# 🛍️ RetailFlow AI

> A modern, multi-tenant SaaS platform for comprehensive retail management, POS billing, and intelligent analytics.

RetailFlow AI is a robust, production-grade retail management system designed to streamline operations for shops of all sizes. From point-of-sale (POS) billing and multi-branch inventory synchronization to supplier management and AI-driven analytics, RetailFlow AI provides everything needed to run a retail business efficiently.

---

## 🌟 Key Features

- **🏢 Multi-Tenant Architecture:** Seamlessly manage multiple shops, branches, and warehouses from a single centralized platform.
- **🛒 Advanced POS & Billing:** Fast, reliable billing with support for barcode scanning, GST/tax calculations, discounts, and multiple payment modes (Cash, UPI, Card, Credit).
- **📦 Inventory Management:** Real-time stock tracking, low-stock alerts, batch management, expiry tracking, and multi-branch stock transfers.
- **📒 Credit Ledger (Udhaar):** Built-in customer and supplier credit management system to track outstanding balances, partial payments, and due dates.
- **🚚 Supplier & Purchase Orders:** End-to-end procurement workflow from drafting purchase orders to receiving inventory.
- **🤖 AI & Analytics:** Smart predictions, demand forecasting, shelf-scan intelligence, and comprehensive daily sales analytics snapshots.
- **👥 Role-Based Access Control (RBAC):** Granular permissions for Owners, Managers, Cashiers, and an overarching Admin Management System.
- **🔔 Real-time Notifications:** Alerts for low stock, overdue payments, and system events via a priority-based notification engine.

---

## 💻 Tech Stack

### Frontend (Web App)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + UI components
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Routing:** React Router v7
- **Forms & Validation:** React Hook Form + Zod
- **Charts:** Recharts
- **PDFs & Exports:** jsPDF, react-csv, xlsx

### Backend (API Server)
- **Framework:** Node.js + Express (TypeScript)
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Caching & Queues:** Redis + BullMQ
- **Authentication:** JWT (Access & Refresh Tokens)
- **Validation:** Zod
- **PDF Generation:** PDFKit
- **Task Scheduling:** Node-cron
- **Security:** Helmet, express-rate-limit, CORS

---

## 📂 Project Structure

RetailFlow AI is structured as a monorepo containing two main packages:

```text
RetailFlowAI/
├── api-server/       # Node.js/Express backend API
│   ├── prisma/       # Prisma schema and migrations
│   ├── src/          # API routes, controllers, and services
│   └── package.json  # Backend dependencies
│
└── web-app/          # React/Vite frontend application
    ├── src/          # React components, pages, and store
    ├── public/       # Static assets
    └── package.json  # Frontend dependencies
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/) (for caching and job queues)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/RetailFlowAI.git
cd RetailFlowAI
```

### 2. Setup Backend (`api-server`)

```bash
cd api-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, JWT_SECRET, etc.

# Run database migrations and generate Prisma client
npm run db:generate
npm run db:push

# (Optional) Seed the database
npm run db:seed

# Start the development server
npm run dev
```

### 3. Setup Frontend (`web-app`)

```bash
cd ../web-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env to point VITE_API_URL to your backend (e.g., http://localhost:5000)

# Start the development server
npm run dev
```

---

## 📜 Available Scripts

### API Server
- `npm run dev`: Starts the backend server in watch mode using `tsx`.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the built production server.
- `npm run db:studio`: Opens Prisma Studio to view and manage database records.
- `npm run test`: Runs the test suite using Jest.

### Web App
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint for code formatting and quality.

---

## 🔒 Security & Performance

- **Rate Limiting:** Protects API endpoints from brute-force and DDoS attacks.
- **Helmet:** Secures Express apps by setting various HTTP headers.
- **Bcrypt:** Strong password hashing for user security.
- **Redis Queues:** Offloads heavy tasks (like PDF generation and notifications) to background workers using BullMQ.
- **Role-Based Access:** Secures endpoints with robust permission checks to ensure that cashiers, managers, and owners only access what they need.

---

## 📄 License

This project is licensed under the MIT License.
