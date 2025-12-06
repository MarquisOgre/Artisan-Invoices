import { Button } from "@/components/ui/button";
import { PlusCircle, User, Settings } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const Header = () => {
  const { isAdmin } = useUserRole();
  
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-solid to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">WA</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Website Artisan</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-primary-solid font-medium">Dashboard</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Invoices</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Clients</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Reports</a>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="default" className="bg-primary-solid hover:bg-primary-solid/90 text-primary-solid-foreground">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
            
            {isAdmin && (
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            )}
            
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;