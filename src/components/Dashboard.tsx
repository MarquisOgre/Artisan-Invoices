import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ReceiptIndianRupee, 
  Users, 
  IndianRupee,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  BarChart3,
  TrendingDown
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  quotations: any[];
  invoices: any[];
  customers: any[];
  expenses?: any[];
  onCreateQuotation: () => void;
  onCreateInvoice: () => void;
  onCreateCustomer: () => void;
  onViewQuotations: () => void;
  onViewInvoices: () => void;
}

const Dashboard = ({ quotations, invoices, customers, expenses = [], onCreateQuotation, onCreateInvoice, onCreateCustomer, onViewQuotations, onViewInvoices }: DashboardProps) => {
  const { isAdmin } = useUserRole();
  
  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + (i.total_amount || i.subtotal || 0), 0);

  const totalInvoiced = invoices
    .filter(i => i.status === "unpaid" || i.status === "sent")
    .reduce((sum, i) => sum + (i.total_amount || i.subtotal || 0), 0);
  
  const activeQuotations = quotations.filter(q => q.status !== "invoiced" && q.status !== "rejected").length;

  // Monthly expenses
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const totalExpenses = expenses
    .filter(e => e.month === currentMonth && e.year === currentYear)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Generate monthly data for charts (last 6 months)
  const getMonthlyData = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const monthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.invoice_date);
          return invDate.getMonth() + 1 === month && 
                 invDate.getFullYear() === year && 
                 inv.status === "paid";
        })
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      const monthQuotations = quotations
        .filter(q => {
          const qDate = new Date(q.date);
          return qDate.getMonth() + 1 === month && qDate.getFullYear() === year;
        }).length;
      
      const monthInvoices = invoices
        .filter(inv => {
          const invDate = new Date(inv.invoice_date);
          return invDate.getMonth() + 1 === month && invDate.getFullYear() === year;
        }).length;

      const monthExpenses = expenses
        .filter(e => e.month === month && e.year === year)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      months.push({
        month: monthNames[date.getMonth()],
        revenue: Math.round(monthRevenue),
        quotations: monthQuotations,
        invoices: monthInvoices,
        expenses: Math.round(monthExpenses)
      });
    }
    
    return months;
  };

  const monthlyData = getMonthlyData();

  // Stats WITHOUT UNPAID card
  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      icon: IndianRupee,
      color: "text-success"
    },
    {
      title: "Active Quotation",
      value: activeQuotations.toString(),
      change: `${activeQuotations}`,
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Invoiced - Unpaid",
      value: `₹${totalInvoiced.toLocaleString()}`,
      change: "+8",
      icon: ReceiptIndianRupee,
      color: "text-primary"
    },
    {
      title: "Total Customers",
      value: customers.length.toString(),
      change: "+5",
      icon: Users,
      color: "text-muted-foreground"
    },
    {
      title: "Monthly Expenses",
      value: `₹${totalExpenses.toLocaleString()}`,
      change: "This month",
      icon: IndianRupee,
      color: "text-warning"
    }
  ];

  const recentQuotations = quotations.slice(0, 3).map(q => ({
    id: q.quotation_number || q.id,
    customer: customers.find(c => c.id === q.customer_id)?.name || "Unknown Customer", 
    amount: `₹${(q.amount || 0).toLocaleString()}`,
    status: q.status,
    date: q.date
  }));

  const recentInvoices = invoices.slice(0, 3).map(i => ({
    id: i.invoice_number || i.id,
    customer: i.customer_name || "Unknown Customer",
    amount: `₹${(i.total_amount || i.subtotal || 0).toLocaleString()}`,
    status: i.status,
    date: i.invoice_date
  }));

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'unpaid';
    const variants: Record<string, any> = {
      sent: { variant: "outline", label: "Sent" },
      accepted: { variant: "default", label: "Accepted" },
      invoiced: { variant: "default", label: "Invoiced", className: "bg-primary text-primary-foreground" },
      rejected: { variant: "destructive", label: "Rejected" },
      paid: { variant: "default", label: "Paid", className: "bg-success text-success-foreground" },
      unpaid: { variant: "secondary", label: "Unpaid" }
    };
    
    const config = variants[statusLower] || variants.unpaid;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="relative overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in hover-scale border-border/50"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-${stat.color.replace('text-', '')}/20 to-${stat.color.replace('text-', '')}/5`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="animate-fade-in hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-success" />
              Revenue & Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--success))" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="hsl(var(--warning))" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)"
                  strokeWidth={2}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quotations vs Invoices Chart */}
        <Card className="animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Quotations vs Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorQuotations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="quotations" 
                  fill="url(#colorQuotations)" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="invoices" 
                  fill="url(#colorInvoices)" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Quotations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuotations.map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{quotation.id}</p>
                    <p className="text-sm text-muted-foreground">{quotation.customer}</p>
                    <p className="text-xs text-muted-foreground">{quotation.date}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-semibold">{quotation.amount}</p>
                    {getStatusBadge(quotation.status)}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={onViewQuotations}>
                <Eye className="mr-2 h-4 w-4" />
                View All Quotations
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ReceiptIndianRupee className="mr-2 h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                    <p className="text-xs text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-semibold">{invoice.amount}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={onViewInvoices}>
                <Eye className="mr-2 h-4 w-4" />
                View All Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-20 flex-col space-y-2" onClick={onCreateQuotation}>
                <FileText className="h-6 w-6" />
                <span>Create Quotation</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline" onClick={onCreateInvoice}>
                <ReceiptIndianRupee className="h-6 w-6" />
                <span>Create Invoice</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline" onClick={onCreateCustomer}>
                <Users className="h-6 w-6" />
                <span>Add Customer</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
