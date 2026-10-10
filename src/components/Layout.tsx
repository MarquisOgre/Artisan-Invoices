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
  LogOut,
  ClipboardList,
  Layers3,
} from "lucide-react";
import {
} from "@/components/ui/dropdown-menu";
import {
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
  const { signOut } = useAuth();
  const { isAdmin, canManage } = useUserRole();

  const standaloneNavigation = [
    { name: "Dashboard", icon: BarChart3, key: "dashboard" },
    { name: "Customers", icon: Users, key: "customers", adminOnly: true },
  ];

  const quoInvoicesItems = [
    { name: "Quotations", icon: FileText, key: "quotations" },
    { name: "Invoices", icon: Receipt, key: "invoices" },
  ];

  const filteredStandaloneNav = standaloneNavigation.filter(item => !item.adminOnly || isAdmin);

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
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Header Logo"
                className="object-contain"
                style={{
                  // Use a single square sizing box; object-contain preserves the image's
                  // original aspect ratio and prevents stretching or cropping.
                  width: "180px",
                  height: "64px",
                  maxWidth: "min(240px, 35vw)",
                  maxHeight: "64px",
                  flexShrink: 0,
                }}
              />
            </div>

            <nav className="hidden md:flex items-center space-x-1 ml-auto">
              {canManage && (
                <Button
                  variant={currentPage === "dashboard" ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => onPageChange("dashboard")}
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              )}

              {canManage && quoInvoicesItems.map((item) => (
                <Button
                  key={item.key}
                  variant={currentPage === item.key ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => onPageChange(item.key)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              ))}

              {canManage && (
                <Button
                  variant={currentPage === "customers" ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => onPageChange("customers")}
                >
                  <Users className="h-4 w-4" />
                  Customers
                </Button>
              )}

              <Button
                variant={currentPage === "order-sheet" || currentPage === "new-order-sheet" || currentPage === "edit-order-sheet" ? "default" : "ghost"}
                className="flex items-center gap-2"
                onClick={() => onPageChange("order-sheet")}
              >
                <ClipboardList className="h-4 w-4" />
                Order Forms
              </Button>

              {canManage && (
                <Button
                  variant={currentPage === "fabrics" ? "default" : "ghost"}
                  className="flex items-center gap-2"
                  onClick={() => onPageChange("fabrics")}
                >
                  <Layers3 className="h-4 w-4" />
                  Fabrics
                </Button>
              )}

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
              {canManage && (
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
              )}

              {canManage && quoInvoicesItems.map((item) => (
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

              {canManage && (
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

              <Button
                variant={currentPage === "order-sheet" || currentPage === "new-order-sheet" || currentPage === "edit-order-sheet" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  onPageChange("order-sheet");
                  setMobileMenuOpen(false);
                }}
              >
                <ClipboardList className="mr-3 h-4 w-4" />
                Order Forms
              </Button>

              {canManage && (
                <Button
                  variant={currentPage === "fabrics" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    onPageChange("fabrics");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Layers3 className="mr-3 h-4 w-4" />
                  Fabrics
                </Button>
              )}

              {canManage && (
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
          <p className="text-xs sm:text-sm select-none text-center">
            &copy; {new Date().getFullYear()} All rights reserved.
            Developed With <span className="text-red-500">❤️</span> by Avantro Technologies.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
