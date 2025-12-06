import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxNumber: string;
  logo: string;
  favicon?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  accountHolderName?: string;
  branchAddress?: string;
  swiftCode?: string;
}

export interface InvoiceSettings {
  prefix: string;
  quotationPrefix: string;
  defaultTerms: string;
  defaultNotes: string;
  currency: string;
  termsAndConditions: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  paymentReminders: boolean;
  reminderDays: number;
}

export const useSettings = () => {
  const { toast } = useToast();
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "Artisan Apparels",
    email: "info@artisanapparels.com",
    phone: "+91 85006 06000",
    address: "HIG 9A, APHB Colony, Adoni, Kurnool District, Pincode - 518301",
    website: "www.artisanapparels.com",
    taxNumber: "37AGDPR6197G1ZW",
    logo: "https://i.ibb.co/p6NHDnrb/Logo-IAM-Ratan.png",
    bankName: "HDFC BANK",
    accountNumber: "9998019993333",
    routingNumber: "",
    accountHolderName: "ARTISAN APPARELS",
    branchAddress: "ADONI",
    swiftCode: "HDFC0001933"
  });

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    prefix: "INV/2526/",
    quotationPrefix: "QUO/2526/",
    defaultTerms: "Payment is due within 30 days of invoice date.",
    defaultNotes: "Thank you for your business!",
    currency: "INR",
    termsAndConditions: ""
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: false,
    paymentReminders: false,
    reminderDays: 3
  });

  const [loading, setLoading] = useState(true);

  // Fetch settings from database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch all three setting types
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          data.forEach((setting: any) => {
            if (setting.setting_type === 'company' && setting.setting_data) {
              setCompanySettings(setting.setting_data as CompanySettings);
            } else if (setting.setting_type === 'invoice' && setting.setting_data) {
              setInvoiceSettings(setting.setting_data as InvoiceSettings);
            } else if (setting.setting_type === 'notification' && setting.setting_data) {
              setNotificationSettings(setting.setting_data as NotificationSettings);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveCompanySettings = async (settings: CompanySettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Check if setting exists
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('setting_type', 'company')
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from('settings')
          .update({
            setting_data: settings as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            setting_type: 'company',
            setting_data: settings as any
          });
        error = result.error;
      }

      if (error) throw error;

      setCompanySettings(settings);
      toast({
        title: "Settings Saved",
        description: "Company settings have been saved successfully."
      });
      return true;
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Error",
        description: "Failed to save company settings.",
        variant: "destructive"
      });
      return false;
    }
  };

  const saveInvoiceSettings = async (settings: InvoiceSettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Check if setting exists
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('setting_type', 'invoice')
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from('settings')
          .update({
            setting_data: settings as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            setting_type: 'invoice',
            setting_data: settings as any
          });
        error = result.error;
      }

      if (error) throw error;

      setInvoiceSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Invoice settings have been saved successfully."
      });
      return true;
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice settings.",
        variant: "destructive"
      });
      return false;
    }
  };

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Check if setting exists
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('setting_type', 'notification')
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from('settings')
          .update({
            setting_data: settings as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            setting_type: 'notification',
            setting_data: settings as any
          });
        error = result.error;
      }

      if (error) throw error;

      setNotificationSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Notification settings have been saved successfully."
      });
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    companySettings,
    invoiceSettings,
    notificationSettings,
    loading,
    setCompanySettings,
    setInvoiceSettings,
    setNotificationSettings,
    saveCompanySettings,
    saveInvoiceSettings,
    saveNotificationSettings
  };
};
