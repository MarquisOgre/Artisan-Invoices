import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { Upload, Settings as SettingsIcon, Building, Bell, Trash2 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { UserManagement } from "@/components/UserManagement";
import { UserList } from "@/components/UserList";

const Settings = () => {
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const {
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
  } = useSettings();
  
  const { customers, invoices, deleteCustomer, deleteInvoice } = useSupabaseData();

  if (loading || roleLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  if (!isAdmin) {
    return <div className="p-6">You do not have permission to access this page.</div>;
  }

  const handleCompanyChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleInvoiceChange = (field: string, value: string) => {
    setInvoiceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean | number) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCompany = async () => {
    await saveCompanySettings(companySettings);
  };

  const handleSaveInvoice = async () => {
    await saveInvoiceSettings(invoiceSettings);
  };

  const handleSaveNotifications = async () => {
    await saveNotificationSettings(notificationSettings);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanySettings(prev => ({ ...prev, logo: e.target?.result as string }));
        toast({
          title: "Logo Uploaded",
          description: "Your company logo has been uploaded."
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const faviconData = e.target?.result as string;
        // Save favicon to company settings
        const updatedSettings = { ...companySettings, favicon: faviconData };
        setCompanySettings(updatedSettings);
        await saveCompanySettings(updatedSettings);
        toast({
          title: "Favicon Uploaded",
          description: "Your favicon has been saved to settings."
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteItems = async () => {
    try {
      // Find and delete specific items
      const invToDelete = invoices.filter(i => i.invoice_number === "INV-001" || i.invoice_number === "INV-002");
      const custToDelete = customers.filter(c => c.name === "Acme Corporation");

      // Delete invoices
      for (const inv of invToDelete) {
        await deleteInvoice(inv.id);
      }

      // Delete customers
      for (const cust of custToDelete) {
        await deleteCustomer(cust.id);
      }

      toast({
        title: "Items Deleted",
        description: "Selected invoices and customers have been deleted."
      });
    } catch (error) {
      console.error("Error deleting items:", error);
      toast({
        title: "Error",
        description: "Failed to delete some items. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading || roleLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  if (!isAdmin) {
    return <div className="p-6">You do not have permission to access this page.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* User Management - Admin Only */}
      <UserManagement />

      {/* User List - Admin Only */}
      <UserList />

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companySettings.name}
                onChange={(e) => handleCompanyChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companySettings.email}
                onChange={(e) => handleCompanyChange("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={companySettings.phone}
                onChange={(e) => handleCompanyChange("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="companyWebsite">Website</Label>
              <Input
                id="companyWebsite"
                value={companySettings.website}
                onChange={(e) => handleCompanyChange("website", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="taxNumber">GST Number</Label>
              <Input
                id="taxNumber"
                value={companySettings.taxNumber}
                onChange={(e) => handleCompanyChange("taxNumber", e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              value={companySettings.address}
              onChange={(e) => handleCompanyChange("address", e.target.value)}
              rows={3}
            />
          </div>

          {/* Bank Details Section */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={companySettings.bankName || ""}
                  onChange={(e) => handleCompanyChange("bankName", e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={companySettings.accountNumber || ""}
                  onChange={(e) => handleCompanyChange("accountNumber", e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="routingNumber">IFSC Code / Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={companySettings.routingNumber || ""}
                  onChange={(e) => handleCompanyChange("routingNumber", e.target.value)}
                  placeholder="Enter IFSC/routing number"
                />
              </div>
              <div>
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={companySettings.accountHolderName || ""}
                  onChange={(e) => handleCompanyChange("accountHolderName", e.target.value)}
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <Label htmlFor="branchAddress">Branch Address</Label>
                <Input
                  id="branchAddress"
                  value={companySettings.branchAddress || ""}
                  onChange={(e) => handleCompanyChange("branchAddress", e.target.value)}
                  placeholder="Enter branch address"
                />
              </div>
              <div>
                <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                <Input
                  id="swiftCode"
                  value={companySettings.swiftCode || ""}
                  onChange={(e) => handleCompanyChange("swiftCode", e.target.value)}
                  placeholder="Enter SWIFT code"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center space-x-4">
              {companySettings.logo && (
                <img src={companySettings.logo} alt="Company Logo" className="h-16 w-16 object-contain border rounded" />
              )}
              <Button
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="favicon">Favicon</Label>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById('favicon-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Favicon
              </Button>
              <input
                id="favicon-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFaviconUpload}
              />
              <span className="text-sm text-muted-foreground">Upload PNG/JPG file (ICO not supported)</span>
            </div>
          </div>

          <Button onClick={handleSaveCompany}>Save Company Information</Button>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice & Quotation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                value={invoiceSettings.prefix}
                onChange={(e) => handleInvoiceChange("prefix", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quotationPrefix">Quotation Prefix</Label>
              <Input
                id="quotationPrefix"
                value={invoiceSettings.quotationPrefix}
                onChange={(e) => handleInvoiceChange("quotationPrefix", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={invoiceSettings.currency}
                onChange={(e) => handleInvoiceChange("currency", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="defaultNotes">Default Notes</Label>
            <Textarea
              id="defaultNotes"
              value={invoiceSettings.defaultNotes}
              onChange={(e) => handleInvoiceChange("defaultNotes", e.target.value)}
              rows={2}
              placeholder="These notes will be printed at the bottom of quotations and invoices"
            />
          </div>

          <div>
            <Label htmlFor="termsAndConditions">Terms and Conditions (Optional)</Label>
            <Textarea
              id="termsAndConditions"
              value={invoiceSettings.termsAndConditions}
              onChange={(e) => handleInvoiceChange("termsAndConditions", e.target.value)}
              rows={4}
              placeholder="Enter terms and conditions to be printed at the bottom of invoices and quotations"
            />
          </div>

          <Button onClick={handleSaveInvoice}>Save Invoice Settings</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications when invoices are paid</p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Payment Reminders</Label>
              <p className="text-sm text-muted-foreground">Automatically send payment reminders</p>
            </div>
            <Switch
              checked={notificationSettings.paymentReminders}
              onCheckedChange={(checked) => handleNotificationChange("paymentReminders", checked)}
            />
          </div>

          {notificationSettings.paymentReminders && (
            <div>
              <Label htmlFor="reminderDays">Reminder Days Before Due Date</Label>
              <Input
                id="reminderDays"
                type="number"
                min="1"
                max="30"
                value={notificationSettings.reminderDays}
                onChange={(e) => handleNotificationChange("reminderDays", parseInt(e.target.value))}
                className="w-24 mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Send reminders {notificationSettings.reminderDays} days before invoice due date
              </p>
            </div>
          )}

          <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Quick Delete Test Data</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Delete QUO-001, INV-001, INV-002, and Acme Corporation test data
            </p>
            <Button 
              onClick={handleDeleteItems}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Test Data
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default Settings;