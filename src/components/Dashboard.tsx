import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  ReceiptIndianRupee,
  Users,
  ClipboardList,
  IndianRupee,
  TrendingUp,
  Eye,
  BarChart3
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  quotations: any[];
  invoices: any[];
  customers: any[];
  onCreateQuotation: () => void;
  onCreateInvoice: () => void;
  onCreateCustomer: () => void;
  onViewQuotations: () => void;
  onViewInvoices: () => void;
}

const MONTHS = [
  { value: 0, label: "All Months" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const parseDateValue = (value: unknown) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoDate) {
    const parsed = new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const localDate = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (localDate) {
    const parsed = new Date(Number(localDate[3]), Number(localDate[2]) - 1, Number(localDate[1]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizedStatus = (status: unknown) => String(status ?? "").trim().toLowerCase();

const numericAmount = (...values: unknown[]) => {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return 0;
};

const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

const Dashboard = ({ quotations, invoices, customers, onCreateQuotation, onCreateInvoice, onCreateCustomer, onViewQuotations, onViewInvoices }: DashboardProps) => {
  const { isAdmin } = useUserRole();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadOrderCount = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("order_sheets")
          .select("order_date, created_at");
        if (error) throw error;

        const count = (data || []).filter((order: any) => {
          if (selectedMonth === 0) return true;
          const orderDate = parseDateValue(order.order_date || order.created_at);
          return !!orderDate && orderDate.getMonth() + 1 === selectedMonth && orderDate.getFullYear() === selectedYear;
        }).length;

        if (!cancelled) setTotalOrders(count);
      } catch (error) {
        console.error("Error loading dashboard order count:", error);
        if (!cancelled) setTotalOrders(0);
      }
    };

    loadOrderCount();
    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear]);

  const filteredInvoices = invoices.filter(inv => {
    if (selectedMonth === 0) return true;
    const invDate = parseDateValue(inv.invoice_date || inv.date || inv.created_at);
    return !!invDate && invDate.getMonth() + 1 === selectedMonth && invDate.getFullYear() === selectedYear;
  });

  const filteredQuotations = quotations.filter(q => {
    if (selectedMonth === 0) return true;
    const qDate = parseDateValue(q.quotation_date || q.date || q.created_at);
    return !!qDate && qDate.getMonth() + 1 === selectedMonth && qDate.getFullYear() === selectedYear;
  });

  const totalRevenue = filteredInvoices
    .filter(i => normalizedStatus(i.status) === "paid")
    .reduce((sum, i) => sum + numericAmount(i.total_amount, i.subtotal), 0);

  const totalInvoiced = filteredInvoices
    .filter(i => ["unpaid", "sent", "advance"].includes(normalizedStatus(i.status)))
    .reduce((sum, i) => sum + numericAmount(i.total_amount, i.subtotal), 0);

  const activeQuotations = filteredQuotations.filter(q => {
    const status = normalizedStatus(q.status);
    return status !== "invoiced" && status !== "rejected";
  }).length;


  const getMonthlyData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const availableMonths = new Set<string>();

    invoices.forEach(inv => {
      const date = parseDateValue(inv.invoice_date || inv.date || inv.created_at);
      if (date) availableMonths.add(monthKey(date.getFullYear(), date.getMonth() + 1));
    });

    quotations.forEach(q => {
      const date = parseDateValue(q.quotation_date || q.date || q.created_at);
      if (date) availableMonths.add(monthKey(date.getFullYear(), date.getMonth() + 1));
    });

    const anchorMonth = selectedMonth === 0 ? currentDate.getMonth() : selectedMonth - 1;
    const anchorYear = selectedMonth === 0 ? currentDate.getFullYear() : selectedYear;

    let keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(anchorYear, anchorMonth - i, 1);
      keys.push(monthKey(date.getFullYear(), date.getMonth() + 1));
    }

    const populatedInWindow = keys.filter(key => availableMonths.has(key)).length;
    if (availableMonths.size > 0 && populatedInWindow <= 1) {
      const historicalKeys = Array.from(availableMonths).sort().slice(-6);
      if (historicalKeys.length > 0) keys = historicalKeys;
    }

    return keys.map(key => {
      const [yearText, monthText] = key.split('-');
      const year = Number(yearText);
      const month = Number(monthText);

      const monthRevenue = invoices
        .filter(inv => {
          const invDate = parseDateValue(inv.invoice_date || inv.date || inv.created_at);
          return !!invDate && invDate.getMonth() + 1 === month && invDate.getFullYear() === year && normalizedStatus(inv.status) === "paid";
        })
        .reduce((sum, inv) => sum + numericAmount(inv.total_amount, inv.subtotal), 0);

      const monthQuotations = quotations
        .filter(q => {
          const qDate = parseDateValue(q.quotation_date || q.date || q.created_at);
          return !!qDate && qDate.getMonth() + 1 === month && qDate.getFullYear() === year;
        }).length;

      const monthInvoices = invoices
        .filter(inv => {
          const invDate = parseDateValue(inv.invoice_date || inv.date || inv.created_at);
          return !!invDate && invDate.getMonth() + 1 === month && invDate.getFullYear() === year;
        }).length;

      return {
        month: monthNames[month - 1],
        revenue: Math.round(monthRevenue),
        quotations: monthQuotations,
        invoices: monthInvoices,
      };
    });
  };

  const monthlyData = getMonthlyData();

  const stats = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, change: "+12.5%", icon: IndianRupee, color: "text-success" },
    { title: "Active Quotation", value: activeQuotations.toString(), change: `${activeQuotations}`, icon: FileText, color: "text-primary" },
    { title: "Invoiced - Unpaid", value: `₹${totalInvoiced.toLocaleString()}`, change: "+8", icon: ReceiptIndianRupee, color: "text-primary" },
    { title: "Total Customers", value: customers.length.toString(), change: "+5", icon: Users, color: "text-muted-foreground" },
    { title: "Total Orders", value: totalOrders.toLocaleString(), change: "Order forms received", icon: ClipboardList, color: "text-primary" },
  ];

  const recentQuotations = quotations.slice(0, 3).map(q => ({
    id: q.quotation_number || q.id,
    customer: customers.find(c => c.id === q.customer_id)?.name || q.customer_name || "Unknown Customer",
    amount: `₹${numericAmount(q.total_amount, q.subtotal, q.amount).toLocaleString()}`,
    status: q.status,
    date: q.quotation_date || q.date
  }));

  const recentInvoices = invoices.slice(0, 3).map(i => ({
    id: i.invoice_number || i.id,
    customer: i.customer_name || "Unknown Customer",
    amount: `₹${numericAmount(i.total_amount, i.subtotal).toLocaleString()}`,
    status: i.status,
    date: i.invoice_date
  }));

  const getStatusBadge = (status: string) => {
    const statusLower = normalizedStatus(status) || 'unpaid';
    const variants: Record<string, any> = {
      sent: { variant: "outline", label: "Sent" },
      accepted: { variant: "default", label: "Accepted" },
      invoiced: { variant: "default", label: "Invoiced", className: "bg-primary text-primary-foreground" },
      rejected: { variant: "destructive", label: "Rejected" },
      paid: { variant: "default", label: "Paid", className: "bg-success text-success-foreground" },
      unpaid: { variant: "secondary", label: "Unpaid" }
    };
    const config = variants[statusLower] || variants.unpaid;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label htmlFor="month-filter">Month:</Label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(month => <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="year-filter">Year:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{[2023, 2024, 2025, 2026, 2027].map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale border-border/50" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-${stat.color.replace('text-', '')}/20 to-${stat.color.replace('text-', '')}/5`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1"><TrendingUp className="h-3 w-3 mr-1" />{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in hover:shadow-lg transition-shadow">
          <CardHeader><CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-success" />Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '100ms' }}>
          <CardHeader><CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary" />Quotations vs Invoices</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorQuotations" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.95}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.65}/></linearGradient>
                  <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(24 94% 56%)" stopOpacity={0.95}/><stop offset="95%" stopColor="hsl(24 94% 56%)" stopOpacity={0.65}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="quotations" fill="url(#colorQuotations)" radius={[8, 8, 0, 0]} animationDuration={1500} />
                <Bar dataKey="invoices" fill="url(#colorInvoices)" radius={[8, 8, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" />Recent Quotations</CardTitle></CardHeader>
          <CardContent><div className="space-y-4">
            {recentQuotations.map(quotation => <div key={quotation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"><div className="space-y-1"><p className="font-medium">{quotation.id}</p><p className="text-sm text-muted-foreground">{quotation.customer}</p><p className="text-xs text-muted-foreground">{quotation.date}</p></div><div className="text-right space-y-2"><p className="font-semibold">{quotation.amount}</p>{getStatusBadge(quotation.status)}</div></div>)}
            <Button variant="outline" className="w-full" onClick={onViewQuotations}><Eye className="mr-2 h-4 w-4" />View All Quotations</Button>
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center"><ReceiptIndianRupee className="mr-2 h-5 w-5" />Recent Invoices</CardTitle></CardHeader>
          <CardContent><div className="space-y-4">
            {recentInvoices.map(invoice => <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"><div className="space-y-1"><p className="font-medium">{invoice.id}</p><p className="text-sm text-muted-foreground">{invoice.customer}</p><p className="text-xs text-muted-foreground">{invoice.date}</p></div><div className="text-right space-y-2"><p className="font-semibold">{invoice.amount}</p>{getStatusBadge(invoice.status)}</div></div>)}
            <Button variant="outline" className="w-full" onClick={onViewInvoices}><Eye className="mr-2 h-4 w-4" />View All Invoices</Button>
          </div></CardContent>
        </Card>
      </div>

      {isAdmin && <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="h-20 flex-col space-y-2" onClick={onCreateQuotation}><FileText className="h-6 w-6" /><span>Create Quotation</span></Button>
        <Button className="h-20 flex-col space-y-2" variant="outline" onClick={onCreateInvoice}><ReceiptIndianRupee className="h-6 w-6" /><span>Create Invoice</span></Button>
        <Button className="h-20 flex-col space-y-2" variant="outline" onClick={onCreateCustomer}><Users className="h-6 w-6" /><span>Add Customer</span></Button>
      </div></CardContent></Card>}
    </div>
  );
};

export default Dashboard;
