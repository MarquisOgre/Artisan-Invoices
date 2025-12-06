# InvoiceFlow - Complete Invoice & Quotation Management System

A comprehensive web application for managing customers, quotations, and invoices with authentication and real-time data persistence using Supabase.

## 🚀 Live Demo

**URL**: https://lovable.dev/projects/1cd2f0e2-2256-4542-8049-6b7b6008cca9

## ✨ Features

### 🔐 Authentication System
- **Secure user authentication** powered by Supabase Auth
- **User registration and login** with email/password
- **Protected routes** - only authenticated users can access the app
- **Session persistence** - stay logged in across browser sessions
- **Default admin account**: `admin@gmail.com` / `123456`

### 👥 Customer Management
- **Add new customers** with comprehensive form validation
- **Customer information**: Name, email, phone, company, address
- **View all customers** in a searchable, sortable table
- **Customer actions**: View details, edit, create documents, send emails, delete
- **Real-time customer statistics** with visual dashboard cards

### 📄 Quotation Management
- **Create detailed quotations** with multiple line items
- **Dynamic item management**: Add/remove items with automatic calculations
- **Quotation statuses**: Save, Sent, Accepted, Rejected, Expired
- **Customer selection** from existing customer database
- **Automatic quotation numbering** with customizable prefixes
- **Date management**: Creation date and validity period
- **Actions available**:
  - View details
  - Edit quotations
  - Download PDF
  - Convert to invoice
  - Send to customer
  - Update status
  - Delete

### 🧾 Invoice Management
- **Create comprehensive invoices** with itemized billing
- **Multiple invoice statuses**: Draft, Sent, Pending, Paid, Overdue
- **Due date tracking** with overdue highlighting
- **Automatic invoice numbering** system
- **Actions available**:
  - View details
  - Edit invoices
  - Download PDF
  - Send payment reminders
  - Mark as paid
  - Delete

### 📊 Dashboard & Analytics
- **Real-time statistics** for revenue, quotations, invoices, and customers
- **Visual indicators** with color-coded status badges
- **Recent activity** showing latest quotations and invoices
- **Quick actions** for creating new records
- **Responsive design** with mobile-friendly interface

### ⚙️ Settings Management
- **Company information** setup with logo upload
- **Invoice customization**: Prefixes, terms, notes, currency
- **Notification settings** for payments and reminders
- **Favicon upload** capability
- **Branding customization** options

### 🛡️ Data Security & Validation
- **Row Level Security (RLS)** - users only see their own data
- **Form validation** - prevent saving incomplete records
- **Real-time data synchronization** with Supabase
- **Secure data storage** with automatic backups

## 🏗️ Technical Architecture

### Frontend Technologies
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with full IntelliSense
- **Vite** - Lightning-fast development and build tool
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **shadcn/ui** - Beautiful, accessible UI components
- **React Router** - Client-side routing with protected routes

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Real-time subscriptions** - Live data updates across clients
- **Auto-generated API** - RESTful and GraphQL endpoints
- **Row Level Security** - Database-level security policies
- **Authentication** - Built-in user management with JWT tokens

### Database Schema
```sql
-- Users have profiles with role-based access
profiles (id, email, full_name, role, created_at, updated_at)

-- Customers belong to authenticated users
customers (id, user_id, name, email, phone, company, address, created_at, updated_at)

-- Quotations with automatic numbering
quotations (id, user_id, customer_id, quotation_number, amount, status, date, valid_until, items, notes, created_at, updated_at)

-- Invoices with payment tracking
invoices (id, user_id, customer_id, quotation_id, invoice_number, amount, status, date, due_date, items, notes, created_at, updated_at)
```

## 🎯 Key Functionality

### Customer Workflow
1. **Add Customer** → Fill form with validation → Save to database
2. **View Customers** → Search/filter → Perform actions
3. **Customer Actions** → View/Edit/Delete/Create documents

### Quotation Workflow
1. **Create Quotation** → Select customer → Add items → Calculate total → Save
2. **Send to Customer** → Update status to "Sent"
3. **Track Response** → Update to "Accepted" or "Rejected"
4. **Convert to Invoice** → Automatically create invoice from quotation

### Invoice Workflow
1. **Create Invoice** → Select customer → Add items → Set due date → Save
2. **Send to Customer** → Track delivery status
3. **Payment Tracking** → Send reminders → Mark as paid
4. **Overdue Management** → Automatic status updates

### Form Validation Rules
- **Customer Name**: Required field
- **Email**: Valid email format when provided
- **Quotation/Invoice Items**: At least one valid item required
- **Item Validation**: Description, quantity > 0, rate > 0
- **Customer Selection**: Required for all quotations and invoices
- **Date Validation**: Logical date ranges and constraints

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Modern web browser

### Installation & Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Authentication Setup
1. Navigate to the application
2. Use default admin account: `admin@gmail.com` / `123456`
3. Or register a new account
4. Start creating customers, quotations, and invoices

### Environment Configuration
- **Supabase URL**: Pre-configured in the project
- **Authentication**: Email/password enabled
- **Database**: Automatic schema migration on deployment
- **Storage**: Ready for file uploads (logos, documents)

## 📱 Responsive Design

- **Mobile-first approach** with touch-friendly interfaces
- **Responsive tables** with horizontal scrolling on mobile
- **Collapsible sidebar** for navigation on smaller screens
- **Optimized forms** with proper input types for mobile keyboards
- **Touch-friendly buttons** with appropriate sizing

## 🔧 Customization Options

### Branding
- Upload company logo in Settings
- Customize favicon
- Set company information
- Configure invoice/quotation prefixes

### Business Logic
- Modify default terms and conditions
- Adjust automatic numbering sequences
- Customize status workflows
- Set payment terms and due dates

### UI Theming
- Tailwind CSS configuration
- Color scheme customization
- Component styling via shadcn/ui
- Dark/light mode support

## 🚀 Deployment

### Via Lovable Platform
1. Open [Lovable Project](https://lovable.dev/projects/1cd2f0e2-2256-4542-8049-6b7b6008cca9)
2. Click **Share → Publish**
3. Your app will be live with automatic SSL and CDN

### Custom Domain Setup
1. Navigate to **Project > Settings > Domains**
2. Click **Connect Domain**
3. Follow DNS configuration instructions
4. SSL certificate automatically provisioned

### Manual Deployment
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag-and-drop build folder or connect repo
- **AWS S3 + CloudFront**: Static site hosting with CDN

## 🛠️ Development Notes

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── forms/           # Form components
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── integrations/        # Supabase integration
└── lib/                 # Utility functions
```

### State Management
- **React hooks** for local component state
- **Custom hooks** for data fetching and business logic
- **Supabase realtime** for live data synchronization
- **Context API** for authentication state

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Component-driven development**

## 📄 License

This project is created with Lovable and is available under the MIT License.

## 🤝 Support

For technical support or feature requests:
- Visit the [Lovable Documentation](https://docs.lovable.dev/)
- Join the [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Check the [Troubleshooting Guide](https://docs.lovable.dev/tips-tricks/troubleshooting)

---

**Built with ❤️ using Lovable - The AI-powered web development platform**
