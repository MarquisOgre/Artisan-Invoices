import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, FileText, Calculator, Download, Settings } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const QuickActions = () => {
  const { isAdmin } = useUserRole();
  
  const actions = [
    {
      title: "Create Invoice",
      description: "Generate a new invoice for a client",
      icon: PlusCircle,
      color: "bg-primary-solid hover:bg-primary-solid/90 text-primary-solid-foreground",
    },
    {
      title: "Add Client",
      description: "Register a new client",
      icon: Users,
      color: "bg-accent hover:bg-accent/80 text-accent-foreground",
    },
    {
      title: "View Templates",
      description: "Manage invoice templates",  
      icon: FileText,
      color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    },
    {
      title: "Expense Tracker",
      description: "Log business expenses",
      icon: Calculator,
      color: "bg-warning hover:bg-warning/80 text-warning-foreground",
    },
    {
      title: "Export Data",
      description: "Download reports and backups",
      icon: Download,
      color: "bg-muted hover:bg-muted/80 text-muted-foreground",
    },
    {
      title: "Settings",
      description: "Configure your account",
      icon: Settings,
      color: "bg-card hover:bg-accent text-card-foreground border border-border",
      adminOnly: true,
    },
  ];

  // Filter actions based on role
  const visibleActions = actions.filter(action => !action.adminOnly || isAdmin);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className={`${action.color} h-auto p-4 justify-start space-x-3`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;