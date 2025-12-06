import { useState } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import InvoiceList from "@/components/InvoiceList";
import CustomerList from "@/components/CustomerList";
import Settings from "@/pages/Settings";
import StockRegister from "@/components/StockRegister";
import ExpenseRegister from "@/components/ExpenseRegister";
import CustomerForm from "@/components/forms/CustomerForm";
import InvoiceForm from "@/components/forms/InvoiceForm";
import InvoiceDetails from "@/components/InvoiceDetails";
import QuotationForm from "@/components/forms/QuotationForm";
import QuotationList from "@/components/QuotationList";
import QuotationDetails from "@/components/QuotationDetails";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [expenses, setExpenses] = useState<any[]>([]);
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

  // Load expenses for dashboard
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const { data } = await supabase
          .from('expense_register')
          .select('*');
        if (data) setExpenses(data);
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    };
    loadExpenses();
  }, []);

  const handlePageChange = (page: string) => {
    // Handle direct action pages
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
    
    setCurrentPage(page);
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
    setCurrentPage("quotation-form");
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
    setCurrentPage("invoice-form");
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setCurrentPage("customer-form");
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setCurrentPage("customer-form");
  };

  const handleViewInvoice = (id: string) => {
    const invoice = invoices.find(i => i.id === id || i.invoice_number === id);
    if (invoice) {
      setViewingInvoice(invoice);
    }
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setCurrentPage("invoice-edit-form");
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
        setCurrentPage("customers");
      }
    } else {
      // Create new customer
      const newCustomer = await addCustomer(customerData);
      if (newCustomer) {
        toast({
          title: "Customer added",
          description: `${newCustomer.name} has been added to your customer list.`
        });
        setCurrentPage("customers");
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
        setCurrentPage("invoices");
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
    setCurrentPage("quotation-edit-form");
  };

  const handleSubmitQuotation = async (quotationData: any) => {
    try {
      const newQuotation = await addQuotation(quotationData, invoiceSettings.quotationPrefix);
      if (newQuotation) {
        toast({
          title: "Quotation created",
          description: `Quotation ${newQuotation.quotation_number} has been created.`
        });
        setCurrentPage("quotations");
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
            expenses={expenses}
            onCreateQuotation={handleCreateQuotation}
            onCreateInvoice={handleCreateInvoice}
            onCreateCustomer={handleCreateCustomer}
            onViewQuotations={() => setCurrentPage("quotations")}
            onViewInvoices={() => setCurrentPage("invoices")}
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
            onCancel={() => setCurrentPage("customers")}
            initialData={editingCustomer}
            mode={editingCustomer ? 'edit' : 'create'}
          />
        );
      case "invoice-form":
        return (
          <InvoiceForm 
            customers={customers}
            onSubmit={handleSubmitInvoice}
            onCancel={() => setCurrentPage("invoices")}
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
                  setCurrentPage("invoices");
                }
              }
            }}
            onCancel={() => setCurrentPage("invoices")}
            initialData={editingInvoice}
            mode="edit"
          />
        );
      case "stock-register":
        return <StockRegister />;
      case "expense-register":
        return <ExpenseRegister />;
      case "settings":
        return <Settings />;
      default:
        return (
          <Dashboard 
            quotations={quotations} 
            invoices={invoices} 
            customers={customers}
            expenses={expenses}
            onCreateQuotation={handleCreateQuotation}
            onCreateInvoice={handleCreateInvoice}
            onCreateCustomer={handleCreateCustomer}
            onViewQuotations={() => setCurrentPage("quotations")}
            onViewInvoices={() => setCurrentPage("invoices")}
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
                tax_amount: quotation.tax_amount,
                total_amount: quotation.amount,
                invoice_date: invoiceDate.toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0],
                status: "unpaid",
                items: quotation.items,
                notes: quotation.notes || "",
                tax_type: quotation.tax_type
              };

              const newInvoice = await addInvoice(invoiceData, invoiceSettings.prefix);
              if (newInvoice) {
                // Update quotation status to "invoiced"
                await updateQuotation(quotationId, { status: "invoiced" });
                
                toast({
                  title: "Invoice created",
                  description: `Invoice ${newInvoice.invoice_number} has been created from quotation ${quotation.quotation_number}.`
                });
                setCurrentPage("invoices");
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
            onCancel={() => setCurrentPage("quotations")}
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
                  setCurrentPage("quotations");
                }
              }
            }}
            onCancel={() => setCurrentPage("quotations")}
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
          onClose={() => setViewingInvoice(null)}
        />
      )}
      
      {viewingQuotation && (
        <QuotationDetails
          quotation={viewingQuotation}
          isOpen={!!viewingQuotation}
          onClose={() => setViewingQuotation(null)}
        />
      )}
    </Layout>
  );
};

export default Index;