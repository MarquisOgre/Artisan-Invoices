import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";

const StatsCards = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "$24,500",
      change: "+12.5%",
      icon: DollarSign,
      description: "From 45 invoices this month",
    },
    {
      title: "Unpaid Invoices",
      value: "8",
      change: "-2",
      icon: Clock,
      description: "Worth $5,200 awaiting payment",
    },
    {
      title: "Paid Invoices",
      value: "37",
      change: "+15",
      icon: CheckCircle,
      description: "Completed this month",
    },
    {
      title: "Active Clients",
      value: "23",
      change: "+3",
      icon: Users,
      description: "Currently working with",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary-solid" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className={`font-medium ${
                  stat.change.includes('+') ? 'text-success-foreground' : 'text-muted-foreground'
                }`}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;