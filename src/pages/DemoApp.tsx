import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Users, Package, ArrowDownToLine, ArrowUpFromLine, Settings, Plus, Search, IndianRupee } from "lucide-react";

const DEMO_CUSTOMERS = [
  { id: "c1", name: "Sri Lakshmi Textiles", email: "accounts@sltextiles.com", phone: "+91 98765 43210", company: "Sri Lakshmi Textiles", city: "Hyderabad", state: "Telangana", gst_no: "36ABCDE1234F1Z5" },
  { id: "c2", name: "Metro Fashion Hub", email: "info@metrofashion.in", phone: "+91 91234 56789", company: "Metro Fashion Hub", city: "Secunderabad", state: "Telangana", gst_no: "36FGHIJ5678K1Z2" },
  { id: "c3", name: "Classic Garments", email: "billing@classicgarments.in", phone: "+91 99887 66554", company: "Classic Garments", city: "Warangal", state: "Telangana", gst_no: "36KLMNO9012P1Z7" },
  { id: "c4", name: "Urban Style Store", email: "urbanstyle@example.com", phone: "+91 90000 11223", company: "Urban Style Store", city: "Hyderabad", state: "Telangana", gst_no: "36QRSTU3456V1Z9" },
  { id: "c5", name: "Fashion Point", email: "accounts@fashionpoint.in", phone: "+91 95555 44332", company: "Fashion Point", city: "Medchal", state: "Telangana", gst_no: "36WXYZA7890B1Z3" },
];

const DEMO_INVOICES = [
  { id: "i1", invoice_number: "INV-026", customer_id: "c1", customer_name: "Sri Lakshmi Textiles", subtotal: 118000, gst_amount: 21240, discount: 0, total_amount: 139240, invoice_date: "2026-09-12", due_date: "2026-10-12", status: "paid", items: [{ description: "Premium Cotton Shirts", quantity: 200, rate: 590 }], user_id: "demo" },
  { id: "i2", invoice_number: "INV-025", customer_id: "c2", customer_name: "Metro Fashion Hub", subtotal: 82500, gst_amount: 14850, discount: 2500, total_amount: 94850, invoice_date: "2026-09-09", due_date: "2026-10-09", status: "unpaid", items: [{ description: "Formal Shirts", quantity: 150, rate: 550 }], user_id: "demo" },
  { id: "i3", invoice_number: "INV-024", customer_id: "c3", customer_name: "Classic Garments", subtotal: 64000, gst_amount: 11520, discount: 0, total_amount: 75520, invoice_date: "2026-09-04", due_date: "2026-10-04", status: "paid", items: [{ description: "Casual Shirts", quantity: 160, rate: 400 }], user_id: "demo" },
  { id: "i4", invoice_number: "INV-023", customer_id: "c4", customer_name: "Urban Style Store", subtotal: 47500, gst_amount: 8550, discount: 1000, total_amount: 55050, invoice_date: "2026-08-27", due_date: "2026-09-27", status: "sent", items: [{ description: "Designer Shirts", quantity: 95, rate: 500 }], user_id: "demo" },
  { id: "i5", invoice_number: "INV-022", customer_id: "c5", customer_name: "Fashion Point", subtotal: 39000, gst_amount: 7020, discount: 0, total_amount: 46020, invoice_date: "2026-08-19", due_date: "2026-09-19", status: "paid", items: [{ description: "Oxford Shirts", quantity: 100, rate: 390 }], user_id: "demo" },
];

const DEMO_QUOTATIONS = [
  { id: "q1", quotation_number: "QUO/2526/018", customer_id: "c1", customer_name: "Sri Lakshmi Textiles", quotation_date: "2026-09-15", date: "2026-09-15", valid_until: "2026-09-30", subtotal: 156000, total_amount: 184080, gst_amount: 28080, discount: 0, status: "sent", items: [{ description: "Premium Cotton Shirts", quantity: 300, rate: 520 }], user_id: "demo" },
  { id: "q2", quotation_number: "QUO/2526/017", customer_id: "c2", customer_name: "Metro Fashion Hub", quotation_date: "2026-09-11", date: "2026-09-11", valid_until: "2026-09-26", subtotal: 97500, total_amount: 115050, gst_amount: 17550, discount: 0, status: "accepted", items: [{ description: "Formal Shirts", quantity: 150, rate: 650 }], user_id: "demo" },
  { id: "q3", quotation_number: "QUO/2526/016", customer_id: "c4", customer_name: "Urban Style Store", quotation_date: "2026-09-06", date: "2026-09-06", valid_until: "2026-09-21", subtotal: 72000, total_amount: 84960, gst_amount: 12960, discount: 0, status: "sent", items: [{ description: "Designer Shirts", quantity: 120, rate: 600 }], user_id: "demo" },
  { id: "q4", quotation_number: "QUO/2526/015", customer_id: "c5", customer_name: "Fashion Point", quotation_date: "2026-08-29", date: "2026-08-29", valid_until: "2026-09-13", subtotal: 54000, total_amount: 63720, gst_amount: 9720, discount: 0, status: "invoiced", items: [{ description: "Oxford Shirts", quantity: 120, rate: 450 }], user_id: "demo" },
];

const DEMO_EXPENSES = [
  { id: "e1", description: "Fabric & Raw Material", category: "Purchases", amount: 28500, month: 9, year: 2026 },
  { id: "e2", description: "Transport & Delivery", category: "Logistics", amount: 8600, month: 9, year: 2026 },
  { id: "e3", description: "Electricity & Utilities", category: "Utilities", amount: 7400, month: 9, year: 2026 },
  { id: "e4", description: "Packaging Materials", category: "Operations", amount: 5200, month: 9, year: 2026 },
];

const DEMO_STOCK = [
  { product_name: "Premium Cotton Shirts", size: "40", opening_stock: 420, production: 250, sales: 200, closing_stock: 470 },
  { product_name: "Formal Shirts", size: "42", opening_stock: 300, production: 180, sales: 150, closing_stock: 330 },
  { product_name: "Casual Shirts", size: "40", opening_stock: 250, production: 150, sales: 160, closing_stock: 240 },
  { product_name: "Designer Shirts", size: "44", opening_stock: 180, production: 100, sales: 95, closing_stock: 185 },
  { product_name: "Oxford Shirts", size: "42", opening_stock: 210, production: 120, sales: 100, closing_stock: 230 },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const DemoTable = ({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto rounded-lg border">
    <table className="w-full text-sm">
      <thead className="bg-muted/50">
        <tr>{headers.map((h) => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>{rows.map((row, i) => <tr key={i} className="border-t hover:bg-muted/30">{row.map((cell, j) => <td key={j} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const PageHeader = ({ title, description, icon: Icon, action }: { title: string; description: string; icon: any; action?: string }) => (
  <div className="flex items-center justify-between gap-4 mb-6">
    <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div><div><h2 className="text-2xl font-bold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div></div>
    {action && <Button><Plus className="mr-2 h-4 w-4" />{action}</Button>}
  </div>
);

const DemoApp = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [query, setQuery] = useState("");

  const filteredCustomers = useMemo(() => DEMO_CUSTOMERS.filter(c => `${c.name} ${c.company} ${c.phone}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredInvoices = useMemo(() => DEMO_INVOICES.filter(i => `${i.invoice_number} ${i.customer_name}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredQuotations = useMemo(() => DEMO_QUOTATIONS.filter(q => `${q.quotation_number} ${q.customer_name}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const renderPage = () => {
    if (currentPage === "dashboard") {
      return <Dashboard quotations={DEMO_QUOTATIONS} invoices={DEMO_INVOICES} customers={DEMO_CUSTOMERS as any} expenses={DEMO_EXPENSES} onCreateQuotation={() => setCurrentPage("quotations")} onCreateInvoice={() => setCurrentPage("invoices")} onCreateCustomer={() => setCurrentPage("customers")} onViewQuotations={() => setCurrentPage("quotations")} onViewInvoices={() => setCurrentPage("invoices")} />;
    }

    if (currentPage === "customers") return <Card><CardHeader><PageHeader title="Customers" description="Manage your customer database" icon={Users} action="Add Customer" /></CardHeader><CardContent><div className="flex items-center gap-2 mb-4 max-w-sm"><Search className="h-4 w-4 text-muted-foreground" /><input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Search customers..." value={query} onChange={e => setQuery(e.target.value)} /></div><DemoTable headers={["Customer", "Company", "Phone", "Location", "GST No."]} rows={filteredCustomers.map(c => [<span className="font-medium">{c.name}</span>, c.company, c.phone, `${c.city}, ${c.state}`, c.gst_no])} /></CardContent></Card>;

    if (currentPage === "invoices") return <Card><CardHeader><PageHeader title="Invoices" description="Create, manage and track invoices" icon={Receipt} action="New Invoice" /></CardHeader><CardContent><div className="flex items-center gap-2 mb-4 max-w-sm"><Search className="h-4 w-4 text-muted-foreground" /><input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Search invoices..." value={query} onChange={e => setQuery(e.target.value)} /></div><DemoTable headers={["Invoice", "Customer", "Date", "Due Date", "Amount", "Status"]} rows={filteredInvoices.map(i => [<span className="font-semibold">{i.invoice_number}</span>, i.customer_name, i.invoice_date, i.due_date, money(i.total_amount), <Badge variant={i.status === "paid" ? "default" : "secondary"}>{i.status}</Badge>])} /></CardContent></Card>;

    if (currentPage === "quotations") return <Card><CardHeader><PageHeader title="Quotations" description="Prepare and track customer quotations" icon={FileText} action="New Quotation" /></CardHeader><CardContent><div className="flex items-center gap-2 mb-4 max-w-sm"><Search className="h-4 w-4 text-muted-foreground" /><input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Search quotations..." value={query} onChange={e => setQuery(e.target.value)} /></div><DemoTable headers={["Quotation", "Customer", "Date", "Valid Until", "Amount", "Status"]} rows={filteredQuotations.map(q => [<span className="font-semibold">{q.quotation_number}</span>, q.customer_name, q.quotation_date, q.valid_until, money(q.total_amount), <Badge variant={q.status === "accepted" ? "default" : "outline"}>{q.status}</Badge>])} /></CardContent></Card>;

    if (["stock-register", "inward-register", "outward-register"].includes(currentPage)) {
      const title = currentPage === "stock-register" ? "Stock Register" : currentPage === "inward-register" ? "Inward Register" : "Outward Register";
      const Icon = currentPage === "stock-register" ? Package : currentPage === "inward-register" ? ArrowDownToLine : ArrowUpFromLine;
      return <Card><CardHeader><PageHeader title={title} description="Monitor inventory movement and stock levels" icon={Icon} action={currentPage === "stock-register" ? "Add Stock" : "New Entry"} /></CardHeader><CardContent><DemoTable headers={["Product", "Size", "Opening", "Production", "Sales", "Closing"]} rows={DEMO_STOCK.map(s => [<span className="font-medium">{s.product_name}</span>, s.size, s.opening_stock, s.production, s.sales, <span className="font-bold text-primary">{s.closing_stock}</span>])} /></CardContent></Card>;
    }

    if (currentPage === "expense-register") return <Card><CardHeader><PageHeader title="Expenses" description="Track business expenses and operating costs" icon={IndianRupee} action="Add Expense" /></CardHeader><CardContent><DemoTable headers={["Description", "Category", "Month", "Amount"]} rows={DEMO_EXPENSES.map(e => [<span className="font-medium">{e.description}</span>, e.category, "September 2026", <span className="font-semibold">{money(e.amount)}</span>])} /></CardContent></Card>;

    return <Card><CardHeader><PageHeader title="Settings" description="Company and invoice configuration" icon={Settings} /></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="rounded-lg border p-5"><h3 className="font-semibold mb-2">Company Profile</h3><p className="text-sm text-muted-foreground">ARTISAN</p><p className="text-sm text-muted-foreground">Hyderabad, Telangana</p></div><div className="rounded-lg border p-5"><h3 className="font-semibold mb-2">Invoice Settings</h3><p className="text-sm text-muted-foreground">Invoice prefix: INV-</p><p className="text-sm text-muted-foreground">Quotation prefix: QUO/2526/</p></div></div></CardContent></Card>;
  };

  return <Layout currentPage={currentPage} onPageChange={setCurrentPage}>{renderPage()}</Layout>;
};

export default DemoApp;
