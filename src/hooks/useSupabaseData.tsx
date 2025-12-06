import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string | null;
  customer?: Customer | null;
  date: string;
  valid_until: string | null;
  amount: number;
  subtotal: number;
  tax_amount: number;
  tax_type: string | null;
  status: string;
  items: any[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  gst_no?: string;
  city?: string;
  state?: string;
  pincode?: string;
  shirt_size?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_company?: string;
  customer_gst_no?: string;
  customer_city?: string;
  customer_state?: string;
  customer_pincode?: string;
  subtotal: number;
  tax_amount: number;
  tax_rate?: number;
  total_amount: number;
  invoice_date: string;
  due_date?: string;
  paid_date?: string;
  status: string;
  items: any[];
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  customer_name: string;
  invoice_id?: string;
  notes?: string;
  created_at: string;
  user_id?: string;
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch customers
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch quotations with customer data
      const { data: quotationsData } = await supabase
        .from("quotations")
        .select(`
          *,
          customer:customer_id(*)
        `)
        .order("created_at", { ascending: false });

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      setCustomers(customersData || []);
      setInvoices((invoicesData || []).map(i => ({
        ...i,
        items: Array.isArray(i.items) ? i.items : []
      })));
      setQuotations((quotationsData || []).map(q => ({
        ...q,
        items: Array.isArray(q.items) ? q.items : []
      })));
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Realtime subscription for customers
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomers(prev => {
              // Check if customer already exists to prevent duplicates
              const exists = prev.some(c => c.id === payload.new.id);
              if (exists) return prev;
              return [payload.new as Customer, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setCustomers(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new as Customer : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Realtime subscription for invoices
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInvoices(prev => {
              // Check if invoice already exists to prevent duplicates
              const exists = prev.some(i => i.id === payload.new.id);
              if (exists) return prev;
              const newInvoice = {
                ...payload.new,
                items: Array.isArray(payload.new.items) ? payload.new.items : []
              } as Invoice;
              return [newInvoice, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setInvoices(prev => 
              prev.map(i => i.id === payload.new.id ? {
                ...payload.new,
                items: Array.isArray(payload.new.items) ? payload.new.items : []
              } as Invoice : i)
            );
          } else if (payload.eventType === 'DELETE') {
            setInvoices(prev => prev.filter(i => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Realtime subscription for quotations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('quotations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotations'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch the quotation with customer data
            const { data } = await supabase
              .from('quotations')
              .select('*, customer:customer_id(*)')
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const quotation = {
                ...data,
                items: Array.isArray(data.items) ? data.items : []
              } as Quotation;

              if (payload.eventType === 'INSERT') {
                setQuotations(prev => {
                  // Check if quotation already exists to prevent duplicates
                  const exists = prev.some(q => q.id === data.id);
                  if (exists) return prev;
                  return [quotation, ...prev];
                });
              } else {
                setQuotations(prev => 
                  prev.map(q => q.id === data.id ? quotation : q)
                );
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setQuotations(prev => prev.filter(q => q.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Realtime subscription for stock_register
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_register'
        },
        () => {
          // Refresh all data when stock changes to ensure consistency
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addCustomer = async (customerData: Omit<Customer, "id" | "created_at" | "updated_at">) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add customers.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("customers")
      .insert([{ ...customerData, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setCustomers(prev => [data, ...prev]);
      return data;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add customer.",
        variant: "destructive",
      });
    }
    return null;
  };

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "invoice_number" | "created_at" | "updated_at">, invoicePrefix: string = "INV-") => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create invoices.",
        variant: "destructive",
      });
      return null;
    }

    // Generate invoice number
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true });

    const invoiceNumber = `${invoicePrefix}${String((count || 0) + 1).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from("invoices")
      .insert([{ 
        ...invoiceData, 
        invoice_number: invoiceNumber,
        user_id: user.id
      }])
      .select()
      .single();

    if (!error && data) {
      const processedData = {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      };
      setInvoices(prev => [processedData, ...prev]);
      
      // Update stock register with sales from invoice
      const currentDate = new Date(data.invoice_date);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      for (const item of processedData.items) {
        const invoiceItem = item as any;
        if (invoiceItem.description && invoiceItem.shirt_size && invoiceItem.quantity) {
          // Fetch existing stock entry
      const { data: existingStock } = await supabase
            .from("stock_register")
            .select("*")
            .eq("product_name", invoiceItem.description)
            .eq("size", invoiceItem.shirt_size)
            .eq("month", month)
            .eq("year", year)
            .maybeSingle();
          
          if (existingStock) {
            // Update existing entry
            const newSales = existingStock.sales + invoiceItem.quantity;
            const newClosingStock = existingStock.opening_stock + existingStock.production - newSales;
            
            await supabase
              .from("stock_register")
              .update({ 
                sales: newSales,
                closing_stock: newClosingStock
              })
              .eq("id", existingStock.id);
          } else {
            // Create new entry with sales
            await supabase
              .from("stock_register")
              .insert([{
                user_id: user.id,
                product_name: invoiceItem.description,
                size: invoiceItem.shirt_size,
                month: month,
                year: year,
                opening_stock: 0,
                production: 0,
                sales: invoiceItem.quantity,
                closing_stock: -invoiceItem.quantity
              }]);
          }
        }
      }
      
      return processedData;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice.",
        variant: "destructive",
      });
    }
    return null;
  };

  const updateInvoice = async (invoiceId: string, invoiceData: Partial<Invoice>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update invoices.",
        variant: "destructive",
      });
      return null;
    }

      const { data, error } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", invoiceId)
        .select()
        .single();

    if (!error && data) {
      const processedData = {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      };
      setInvoices(prev => prev.map(i => i.id === invoiceId ? processedData : i));
      return processedData;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice.",
        variant: "destructive",
      });
    }
    return null;
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete invoices.",
        variant: "destructive",
      });
      return false;
    }

      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

    if (!error) {
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      return true;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice.",
        variant: "destructive",
      });
    }
    return false;
  };

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update customers.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("customers")
      .update(customerData)
      .eq("id", customerId)
      .select()
      .single();

    if (!error && data) {
      setCustomers(prev => prev.map(c => c.id === customerId ? data : c));
      return data;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer.",
        variant: "destructive",
      });
    }
    return null;
  };

  const deleteCustomer = async (customerId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete customers.",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (!error) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      return true;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer.",
        variant: "destructive",
      });
    }
    return false;
  };

  const addPayment = async (paymentData: Omit<Payment, "id" | "created_at">) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to record payments.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("payments")
      .insert([{ ...paymentData, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setPayments(prev => [data, ...prev]);
      return data;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment.",
        variant: "destructive",
      });
    }
    return null;
  };

  const addQuotation = async (quotationData: Omit<Quotation, "id" | "quotation_number" | "created_at" | "updated_at">, quotationPrefix?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create quotations.",
        variant: "destructive",
      });
      return null;
    }

    // Generate quotation number with prefix from settings
      const { count } = await supabase
        .from("quotations")
        .select("*", { count: "exact", head: true });

    const prefix = quotationPrefix || "QUO/2526/";
    const quotationNumber = `${prefix}${String((count || 0) + 1).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from("quotations")
      .insert([{ 
        ...quotationData, 
        quotation_number: quotationNumber,
        user_id: user.id
      }])
      .select(`
        *,
        customer:customer_id(*)
      `)
      .single();

    if (!error && data) {
      const processedData = {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      };
      setQuotations(prev => [processedData, ...prev]);
      return processedData;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation.",
        variant: "destructive",
      });
    }
    return null;
  };

  const updateQuotation = async (quotationId: string, quotationData: Partial<Quotation>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update quotations.",
        variant: "destructive",
      });
      return null;
    }

      const { data, error } = await supabase
        .from("quotations")
        .update(quotationData)
        .eq("id", quotationId)
        .select(`
          *,
          customer:customer_id(*)
        `)
        .single();

    if (!error && data) {
      const processedData = {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      };
      setQuotations(prev => prev.map(q => q.id === quotationId ? processedData : q));
      return processedData;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation.",
        variant: "destructive",
      });
    }
    return null;
  };

  const deleteQuotation = async (quotationId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete quotations.",
        variant: "destructive",
      });
      return false;
    }

      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", quotationId);

    if (!error) {
      setQuotations(prev => prev.filter(q => q.id !== quotationId));
      return true;
    }
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quotation.",
        variant: "destructive",
      });
    }
    return false;
  };

  const addStockEntry = async (stockData: any) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add stock entries.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("stock_register")
      .insert([{ ...stockData, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add stock entry.",
        variant: "destructive",
      });
    }
    return data;
  };

  const updateStockEntry = async (stockId: string, stockData: any) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update stock entries.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("stock_register")
      .update(stockData)
      .eq("id", stockId)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock entry.",
        variant: "destructive",
      });
    }
    return data;
  };

  const fetchStockRegister = async (month: number, year: number) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("stock_register")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch stock register.",
        variant: "destructive",
      });
      return [];
    }
    return data || [];
  };

  const deleteStockEntry = async (stockId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete stock entries.",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("stock_register")
      .delete()
      .eq("id", stockId);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete stock entry.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return {
    customers,
    invoices,
    quotations,
    payments,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    addPayment,
    addStockEntry,
    updateStockEntry,
    fetchStockRegister,
    deleteStockEntry,
    refreshData: fetchData
  };
};
