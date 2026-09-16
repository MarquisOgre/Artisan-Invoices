import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Package,
  LogOut,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

// Keep both global navigation bars visible while the page content scrolls.
const HEADER_HEIGHT = 72;
const FOOTER_HEIGHT = 48;

const Layout = ({ children, currentPage, onPageChange }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [quoInvoicesOpen, setQuoInvoicesOpen] = useState(false);
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const standaloneNavigation = [
    { name: "Dashboard", icon: BarChart3, key: "dashboard" },
    { name: "Customers", icon: Users, key: "customers", adminOnly: true },
    { name: "Expenses", icon: Receipt, key: "expense-register" },
  ];

  const stockItems = [
    { name: "Stock Reg", icon: Package, key: "stock-register" },
    { name: "Inward", icon: ArrowDownToLine, key: "inward-register" },
    { name: "Outward", icon: ArrowUpFromLine, key: "outward-register" },
  ];

  const quoInvoicesItems = [
    { name: "Quotations", icon: FileText, key: "quotations" },
    { name: "Invoices", icon: Receipt, key: "invoices" },
  ];

  const filteredStandaloneNav = standaloneNavigation.filter(item => !item.adminOnly || isAdmin);
  const isStockActive = stockItems.some(item => item.key === currentPage);
  const isQuoInvoicesActive = quoInvoicesItems.some(item => item.key === currentPage);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Fixed Header Navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-sm py-3"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="w-full h-full px-2.5">
          <div className="flex items-center h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/logo.png" alt="Company Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-lg sm:text-xl font-bold text-primary">ARTISAN</h1>
            </div>

            <nav className="hidden md:flex items-center space-x-1 ml-auto">
              <Button
                variant={currentPage === "dashboard" ? "default" : "ghost"}
                className="flex items-center gap-2"
                onClick={() => onPageChange("dashboard")}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>

              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={isQuoInvoicesActive ? "default" : "ghost"}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Quotations / Invoices
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {quoInvoicesItems.map((item) => (
                      <DropdownMenuItem
                        key={item.key}
                        onClick={() => onPageChange(item.key)}
                        className={currentPage === item.key ? "bg-muted" : ""}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isAdmin && (
                <Button
                  variant={currentPage === "customers" ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => onPageChange("customers")}
                >
                  <Users className="h-4 w-4" />
                  Customers
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isStockActive ? "default" : "ghost"}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Stock
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {stockItems.map((item) => (
                    <DropdownMenuItem
                      key={item.key}
                      onClick={() => onPageChange(item.key)}
                      className={currentPage === item.key ? "bg-muted" : ""}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={currentPage === "expense-register" ? "default" : "ghost"}
                className="flex items-center gap-2"
                onClick={() => onPageChange("expense-register")}
              >
                <Receipt className="h-4 w-4" />
                Expenses
              </Button>

              {isAdmin && (
                <Button
                  variant={currentPage === "settings" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onPageChange("settings")}
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </nav>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden ml-auto"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 z-50 border-t bg-card shadow-lg">
            <div className="px-4 py-2 space-y-1">
              <Button
                variant={currentPage === "dashboard" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  onPageChange("dashboard");
                  setMobileMenuOpen(false);
                }}
              >
                <BarChart3 className="mr-3 h-4 w-4" />
                Dashboard
              </Button>

              {isAdmin && (
                <Collapsible open={quoInvoicesOpen} onOpenChange={setQuoInvoicesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isQuoInvoicesActive ? "default" : "ghost"}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center">
                        <FileText className="mr-3 h-4 w-4" />
                        Quotations / Invoices
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${quoInvoicesOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-1">
                    {quoInvoicesItems.map((item) => (
                      <Button
                        key={item.key}
                        variant={currentPage === item.key ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          onPageChange(item.key);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {isAdmin && (
                <Button
                  variant={currentPage === "customers" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    onPageChange("customers");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Users className="mr-3 h-4 w-4" />
                  Customers
                </Button>
              )}

              <Collapsible open={stockOpen} onOpenChange={setStockOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isStockActive ? "default" : "ghost"}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center">
                      <Package className="mr-3 h-4 w-4" />
                      Stock
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${stockOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1">
                  {stockItems.map((item) => (
                    <Button
                      key={item.key}
                      variant={currentPage === item.key ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        onPageChange(item.key);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Button
                variant={currentPage === "expense-register" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  onPageChange("expense-register");
                  setMobileMenuOpen(false);
                }}
              >
                <Receipt className="mr-3 h-4 w-4" />
                Expenses
              </Button>

              {isAdmin && (
                <Button
                  variant={currentPage === "settings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    onPageChange("settings");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Scrollable page area. The padding reserves space for both fixed bars. */}
      <div
        className="h-screen flex flex-col"
        style={{ paddingTop: HEADER_HEIGHT, paddingBottom: FOOTER_HEIGHT }}
      >
        <main className="flex-1 min-h-0 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Compact Fixed Footer */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-300 border-t z-50"
        style={{ height: FOOTER_HEIGHT }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
          <p className="text-xs sm:text-sm select-none">
            &copy; {new Date().getFullYear()} Dexorzo Creations. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
