import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, MoreHorizontal } from "lucide-react";

const RecentInvoices = () => {
  const invoices = [
    {
      id: "INV-001",
      client: "Acme Corp",
      project: "Website Redesign",
      amount: "$4,500",
      status: "paid",
      date: "2024-01-15",
      dueDate: "2024-01-30",
    },
    {
      id: "INV-002", 
      client: "TechStart LLC",
      project: "E-commerce Platform",
      amount: "$8,200",
      status: "unpaid",
      date: "2024-01-12",
      dueDate: "2024-01-27",
    },
    {
      id: "INV-003",
      client: "Creative Agency",
      project: "Portfolio Website",
      amount: "$2,800",
      status: "sent",
      date: "2024-01-08",
      dueDate: "2024-01-23",
    },
    {
      id: "INV-004",
      client: "Local Business",
      project: "Business Website",
      amount: "$1,900",
      status: "unpaid",
      date: "2024-01-20",
      dueDate: "2024-02-04",
    },
    {
      id: "INV-005",
      client: "Startup Inc",
      project: "Landing Page",
      amount: "$1,200",
      status: "paid",
      date: "2024-01-18",
      dueDate: "2024-02-02",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success text-success-foreground';
      case 'unpaid':
        return 'bg-warning text-warning-foreground';
      case 'sent':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="font-medium text-foreground">{invoice.id}</div>
                  <div className="text-sm text-muted-foreground">{invoice.client}</div>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-foreground">{invoice.project}</div>
                  <div className="text-xs text-muted-foreground">Due: {invoice.dueDate}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-foreground">{invoice.amount}</div>
                  <div className="text-xs text-muted-foreground">{invoice.date}</div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <Button variant="outline" className="w-full">
            View All Invoices
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentInvoices;