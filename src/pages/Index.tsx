import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import InvoiceList from "@/components/InvoiceList";
import CustomerList from "@/components/CustomerList";
import Settings from "@/pages/Settings";
import CustomerForm from "@/components/forms/CustomerForm";
import InvoiceForm from "@/components/forms/InvoiceForm";
import InvoiceDetails from "@/components/InvoiceDetails";
import QuotationForm from "@/components/forms/QuotationForm";
import QuotationList from "@/components/QuotationList";
import QuotationDetails from "@/components/QuotationDetails";
import OrderSheetForm from "@/components/forms/OrderSheetForm";
import OrderSheetList from "@/components/OrderSheetList";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);

  const path = location.pathname;
  const routePage =
    path === "/" ? "dashboard" :
    path === "/dashboard" ? "dashboard" :
    path === "/customers" ? "customers" :
    path === "/customers/new" ? "customer-form" :
    path === "/invoices" ? "invoices" :
    path === "/invoices/new" ? "invoice-form" :
    path === "/quotations" ? "quotations" :
    path === "/quotations/new" ? "quotation-form" :
    path === "/order-forms" ? "order-sheet" :
    path === "/order-forms/new" ? "new-order-sheet" :
    path === "/settings" ? "settings" :
    path.startsWith("/customers/") ? "customer-form" :
    path.match(/^\/invoices\/[^/]+\/edit$/) ? "invoice-edit-form" :
    path.startsWith("/invoices/") ? "invoice-detail" :
    path.match(/^\/quotations\/[^/]+\/edit$/) ? "quotation-edit-form" :
    path.startsWith("/quotations/") ? "quotation-detail" :
    "dashboard";
  const { toast } = useToast();
  const { companySettings, invoiceSettings } = useSettings();
  const {
    customers,
    invoices,
    quotations,
    addCustomer,
    updateCustomer,
    addInvoice,
    updateInvoice,
    addQuotation,
    updateQuotation,
    deleteCustomer,
    deleteInvoice,
    deleteQuotation
  } = useSupabaseData();

  // The URL is the source of truth for navigation so every page has a
  // bookmarkable, refresh-safe address.
  useEffect(() => {
    if (roleLoading) return;
    if (path === "/") {
      navigate("/dashboard", { replace: true });
      return;
    }
    setCurrentPage(routePage);
  }, [roleLoading, routePage, path]);

  useEffect(() => {
    const customerMatch = path.match(/^\/customers\/([^/]+)(?:\/edit)?$/);
    const invoiceMatch = path.match(/^\/invoices\/([^/]+)$/);
    const invoiceEditMatch = path.match(/^\/invoices\/([^/]+)\/edit$/);
    const quotationMatch = path.match(/^\/quotations\/([^/]+)$/);
    const quotationEditMatch = path.match(/^\/quotations\/([^/]+)\/edit$/);

    if (customerMatch && !path.endsWith("/edit")) {
      const customer = customers.find(c => c.id === customerMatch[1]);
      if (customer) handleViewCustomer(customer.id);
    }
    if (customerMatch && path.endsWith("/edit")) {
      const customer = customers.find(c => c.id === customerMatch[1]);
      if (customer) setEditingCustomer(customer);
    }
    if (invoiceEditMatch) {
      const invoice = invoices.find(i => i.id === invoiceEditMatch[1] || i.invoice_number === invoiceEditMatch[1]);
      if (invoice) setEditingInvoice(invoice);
    }
    if (invoiceMatch) {
      const invoice = invoices.find(i => i.id === invoiceMatch[1] || i.invoice_number === invoiceMatch[1]);
      if (invoice) setViewingInvoice(invoice);
    }
    if (quotationEditMatch) {
      const quotation = quotations.find(q => q.id === quotationEditMatch[1] || q.quotation_number === quotationEditMatch[1]);
      if (quotation) setEditingQuotation(quotation);
    }
    if (quotationMatch) {
      const quotation = quotations.find(q => q.id === quotationMatch[1] || q.quotation_number === quotationMatch[1]);
      if (quotation) setViewingQuotation(quotation);
    }
  }, [path, customers, invoices, quotations]);

  const handlePageChange = (page: string) => {
    const routes: Record<string, string> = {
      dashboard: "/dashboard",
      customers: "/customers",
      "customer-form": editingCustomer ? `/customers/${editingCustomer.id}/edit` : "/customers/new",
      invoices: "/invoices",
      "invoice-form": "/invoices/new",
      quotations: "/quotations",
      "quotation-form": "/quotations/new",
      "order-sheet": "/order-forms",
      "new-order-sheet": "/order-forms/new",
      settings: "/settings",
    };

    if (page === "new-invoice") {
      handleCreateInvoice();
      return;
    }
    if (page === "new-quotation") {
      handleCreateQuotation();
      return;
    }
    if (page === "new-customer") {
      handleCreateCustomer();
      return;
    }

    const nextPath = routes[page];
    if (nextPath) navigate(nextPath);
    else setCurrentPage(page);
  };

  const handleCreateQuotation = () => {
    if (customers.length === 0) {
      toast({
        title: "No customers available",
        description: "Please add a customer first before creating a quotation.",
        variant: "destructive"
      });
      return;
    }
    navigate("/quotations/new");
  };

  const handleCreateInvoice = () => {
    if (customers.length === 0) {
      toast({
        title: "No customers available",
        description: "Please add a customer first before creating an invoice.",
        variant: "destructive"
      });
      return;
    }
    navigate("/invoices/new");
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    navigate(editingCustomer ? `/customers/${editingCustomer.id}/edit` : "/customers/new");
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleViewInvoice = (id: string) => {
    const invoice = invoices.find(i => i.id === id || i.invoice_number === id);
    if (invoice) {
      setViewingInvoice(invoice);
    }
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleViewCustomer = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      toast({
        title: "Customer Details",
        description: `${customer.name} - ${customer.email || 'No email'}`
      });
    }
  };

  const handleSubmitCustomer = async (customerData: any) => {
    if (editingCustomer) {
      // Update existing customer
      const updatedCustomer = await updateCustomer(editingCustomer.id, customerData);
      if (updatedCustomer) {
        toast({
          title: "Customer updated",
          description: `${updatedCustomer.name} has been updated.`
        });
        navigate("/customers");
      }
    } else {
      // Create new customer
      const newCustomer = await addCustomer(customerData);
      if (newCustomer) {
        toast({
          title: "Customer added",
          description: `${newCustomer.name} has been added to your customer list.`
        });
        navigate("/customers");
      }
    }
  };

  const handleSubmitInvoice = async (invoiceData: any) => {
    try {
      const newInvoice = await addInvoice(invoiceData, invoiceSettings.prefix);
      if (newInvoice) {
        toast({
          title: "Invoice created",
          description: `Invoice ${newInvoice.invoice_number} has been created.`
        });
        navigate("/invoices");
      } else {
        throw new Error("Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const updatedInvoice = await updateInvoice(invoiceId, {
        status: "paid",
        paid_date: currentDate
      });
      if (updatedInvoice) {
        toast({
          title: "Invoice marked as paid",
          description: "The invoice has been marked as paid."
        });
      } else {
        throw new Error("Failed to update invoice");
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-invoice-reminder", {
        body: { invoiceId }
      });

      if (error) throw error;

      toast({
        title: "Reminder sent",
        description: "Payment reminder has been sent to the customer."
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder. Please check if customer email is set.",
        variant: "destructive"
      });
    }
  };

  const handleViewQuotation = (id: string) => {
    const quotation = quotations.find(q => q.id === id || q.quotation_number === id);
    if (quotation) {
      setViewingQuotation(quotation);
    }
  };

  const handleEditQuotation = (quotation: any) => {
    setEditingQuotation(quotation);
    navigate(`/quotations/${quotation.id}/edit`);
  };

  const handleSubmitQuotation = async (quotationData: any) => {
    try {
      const newQuotation = await addQuotation(quotationData, invoiceSettings.quotationPrefix);
      if (newQuotation) {
        toast({
          title: "Quotation created",
          description: `Quotation ${newQuotation.quotation_number} has been created.`
        });
        navigate("/quotations");
      } else {
        throw new Error("Failed to create quotation");
      }
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: "Failed to create quotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsAccepted = async (quotationId: string) => {
    try {
      const updatedQuotation = await updateQuotation(quotationId, { status: "accepted" });
      if (updatedQuotation) {
        toast({
          title: "Quotation accepted",
          description: "The quotation has been marked as accepted."
        });
      } else {
        throw new Error("Failed to update quotation");
      }
    } catch (error) {
      console.error("Error accepting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to accept quotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendQuotationToCustomer = async (id: string) => {
    const updatedQuotation = await updateQuotation(id, { status: "sent" });
    if (updatedQuotation) {
      toast({
        title: "Status Updated",
        description: `Quotation ${updatedQuotation.quotation_number} has been marked as sent. Note: This only updates the status - email functionality coming soon.`
      });
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard 
            quotations={quotations} 
            invoices={invoices} 
            customers={customers}
            onCreateQuotation={handleCreateQuotation}
            onCreateInvoice={handleCreateInvoice}
            onCreateCustomer={handleCreateCustomer}
            onViewQuotations={() => navigate("/quotations")}
            onViewInvoices={() => navigate("/invoices")}
          />
        );
      case "invoices":
        return (
          <InvoiceList 
            invoices={invoices}
            onCreateNew={handleCreateInvoice}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onDelete={deleteInvoice}
            onMarkAsPaid={handleMarkAsPaid}
            onSendReminder={handleSendReminder}
            onSendToCustomer={handleSendQuotationToCustomer}
          />
        );
      case "customers":
        return (
          <CustomerList 
            customers={customers}
            onCreateNew={handleCreateCustomer}
            onViewCustomer={handleViewCustomer}
            onEditCustomer={handleEditCustomer}
            onDelete={deleteCustomer}
          />
        );
      case "customer-form":
        return (
          <CustomerForm 
            onSubmit={handleSubmitCustomer}
            onCancel={() => navigate("/customers")}
            initialData={editingCustomer}
            mode={editingCustomer ? 'edit' : 'create'}
          />
        );
      case "invoice-form":
        return (
          <InvoiceForm 
            customers={customers}
            onSubmit={handleSubmitInvoice}
            onCancel={() => navigate("/invoices")}
          />
        );
      case "invoice-edit-form":
        return (
          <InvoiceForm 
            customers={customers}
            onSubmit={async (data) => {
              if (editingInvoice) {
                const updatedInvoice = await updateInvoice(editingInvoice.id, data);
                if (updatedInvoice) {
                  toast({
                    title: "Invoice updated",
                    description: "Invoice has been updated successfully."
                  });
                  setEditingInvoice(null);
                  navigate("/invoices");
                }
              }
            }}
            onCancel={() => navigate("/invoices")}
            initialData={editingInvoice}
            mode="edit"
          />
        );
      case "order-sheet":
        return (
          <OrderSheetList onCreateNew={() => navigate("/order-forms/new")} />
        );
      case "new-order-sheet":
        return (
          <OrderSheetForm
            customers={customers}
            onSaved={() => {
              navigate("/order-forms");
            }}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return (
          <Dashboard 
            quotations={quotations} 
            invoices={invoices} 
            customers={customers}
            onCreateQuotation={handleCreateQuotation}
            onCreateInvoice={handleCreateInvoice}
            onCreateCustomer={handleCreateCustomer}
            onViewQuotations={() => navigate("/quotations")}
            onViewInvoices={() => navigate("/invoices")}
          />
        );
      case "quotations":
        return (
          <QuotationList 
            quotations={quotations}
            onCreateNew={handleCreateQuotation}
            onViewQuotation={handleViewQuotation}
            onEditQuotation={handleEditQuotation}
            onDelete={deleteQuotation}
            onQuotationToInvoice={async (quotationId) => {
              const quotation = quotations.find(q => q.id === quotationId);
              if (!quotation) return;

              // Check if quotation is already converted to invoice
              if (quotation.status === "invoiced") {
                toast({
                  title: "Already Converted",
                  description: "This quotation has already been converted to an invoice.",
                  variant: "destructive"
                });
                return;
              }

              const customer = customers.find(c => c.id === quotation.customer_id);
              if (!customer) {
                toast({
                  title: "Error",
                  description: "Customer not found for this quotation.",
                  variant: "destructive"
                });
                return;
              }

              // Calculate due date (10 days from invoice date)
              const invoiceDate = new Date();
              const dueDate = new Date(invoiceDate);
              dueDate.setDate(dueDate.getDate() + 10);

              const invoiceData = {
                customer_name: customer.name,
                customer_email: customer.email || "",
                customer_phone: customer.phone || "",
                customer_address: customer.address || "",
                customer_company: customer.company || "",
                customer_gst_no: customer.gst_no || "",
                customer_city: customer.city || "",
                customer_state: customer.state || "",
                customer_pincode: customer.pincode || "",
                subtotal: quotation.subtotal,
                gst_amount: quotation.gst_amount || 0,
                discount: quotation.discount || 0,
                total_amount: quotation.total_amount,
                tax_type: (quotation as any).tax_type || 'IGST_18',
                tax_mode: (quotation as any).tax_mode || 'exclusive',
                invoice_date: invoiceDate.toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0],
                status: "unpaid",
                items: quotation.items,
                notes: quotation.notes || ""
              };

              const newInvoice = await addInvoice(invoiceData, invoiceSettings.prefix);
              if (newInvoice) {
                // Update quotation status to "invoiced"
                await updateQuotation(quotationId, { status: "invoiced" });
                
                toast({
                  title: "Invoice created",
                  description: `Invoice ${newInvoice.invoice_number} has been created from quotation ${quotation.quotation_number}.`
                });
                navigate("/invoices");
              }
            }}
            onUpdateStatus={async (quotationId, status) => {
              const updated = await updateQuotation(quotationId, { status });
              if (updated) {
                toast({
                  title: "Status updated",
                  description: `Quotation status updated to ${status}.`
                });
              }
            }}
            onSendToCustomer={handleSendQuotationToCustomer}
          />
        );
      case "quotation-form":
        return (
          <QuotationForm 
            customers={customers}
            onSubmit={handleSubmitQuotation}
            onCancel={() => navigate("/quotations")}
          />
        );
      case "quotation-edit-form":
        return (
          <QuotationForm 
            customers={customers}
            onSubmit={async (data) => {
              if (editingQuotation) {
                const updatedQuotation = await updateQuotation(editingQuotation.id, data);
                if (updatedQuotation) {
                  toast({
                    title: "Quotation updated",
                    description: "Quotation has been updated successfully."
                  });
                  setEditingQuotation(null);
                  navigate("/quotations");
                }
              }
            }}
            onCancel={() => navigate("/quotations")}
            initialData={editingQuotation}
            mode="edit"
          />
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
      
      {/* Modals */}
      {viewingInvoice && (
        <InvoiceDetails
          invoice={viewingInvoice}
          isOpen={!!viewingInvoice}
          onClose={() => { setViewingInvoice(null); navigate("/invoices"); }}
        />
      )}
      
      {viewingQuotation && (
        <QuotationDetails
          quotation={viewingQuotation}
          isOpen={!!viewingQuotation}
          onClose={() => { setViewingQuotation(null); navigate("/quotations"); }}
        />
      )}
    </Layout>
  );
};

export default Index;