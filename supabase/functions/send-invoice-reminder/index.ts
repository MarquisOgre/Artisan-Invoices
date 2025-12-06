import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceReminderRequest {
  invoiceId?: string; // Optional - for manual reminders
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId } = await req.json() as InvoiceReminderRequest;

    console.log("Processing invoice reminders...", { invoiceId });

    // If specific invoice ID provided, send reminder for that invoice only
    if (invoiceId) {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error("Invoice not found");
      }

      // Get user settings
      const { data: settings } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", invoice.user_id)
        .eq("setting_type", "notification")
        .single();

      const notificationSettings = settings?.setting_data || {};
      
      // Get company settings for from email
      const { data: companySettings } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", invoice.user_id)
        .eq("setting_type", "company")
        .single();

      const companyData = companySettings?.setting_data || {};

      await sendReminderEmail(invoice, companyData);

      return new Response(
        JSON.stringify({ success: true, message: "Reminder sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Automated daily check - get all users with notifications enabled
    const { data: allSettings, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("setting_type", "notification");

    if (settingsError) {
      throw settingsError;
    }

    let totalSent = 0;

    for (const setting of allSettings || []) {
      const notificationData = setting.setting_data;
      
      if (!notificationData.enableEmailNotifications) {
        continue;
      }

      const reminderDays = notificationData.reminderDaysBeforeDue || 3;
      const userId = setting.user_id;

      // Get company settings
      const { data: companySettings } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .eq("setting_type", "company")
        .single();

      const companyData = companySettings?.setting_data || {};

      // Calculate target date (due date - reminder days)
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + reminderDays);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Find unpaid invoices due on target date
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date", targetDateStr)
        .in("status", ["unpaid", "sent"]);

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError);
        continue;
      }

      // Send reminder for each invoice
      for (const invoice of invoices || []) {
        try {
          await sendReminderEmail(invoice, companyData);
          totalSent++;
          console.log(`Reminder sent for invoice ${invoice.invoice_number}`);
        } catch (error) {
          console.error(`Failed to send reminder for invoice ${invoice.invoice_number}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${totalSent} reminder(s)`,
        count: totalSent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function sendReminderEmail(invoice: any, companyData: any) {
  const daysUntilDue = Math.ceil(
    (new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const fromEmail = companyData.email || "onboarding@resend.dev";
  const companyName = companyData.name || "Your Company";

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Payment Reminder</h2>
      <p>Dear ${invoice.customer_name},</p>
      
      <p>This is a friendly reminder that invoice <strong>#${invoice.invoice_number}</strong> is due in <strong>${daysUntilDue} day(s)</strong>.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
        <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${invoice.total_amount.toFixed(2)}</p>
      </div>
      
      <p>Please ensure payment is made by the due date to avoid any late fees.</p>
      
      <p>If you have already made the payment, please disregard this reminder.</p>
      
      <p>Thank you for your business!</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>${companyName}</strong>
      </p>
      
      ${companyData.address ? `<p style="color: #666; font-size: 12px;">${companyData.address}</p>` : ''}
      ${companyData.phone ? `<p style="color: #666; font-size: 12px;">Phone: ${companyData.phone}</p>` : ''}
    </div>
  `;

  if (!invoice.customer_email) {
    throw new Error("Customer email not found");
  }

  const emailResponse = await resend.emails.send({
    from: `${companyName} <${fromEmail}>`,
    to: [invoice.customer_email],
    subject: `Payment Reminder: Invoice #${invoice.invoice_number}`,
    html: emailHtml,
  });

  console.log("Email sent successfully:", emailResponse);
  return emailResponse;
}

serve(handler);
