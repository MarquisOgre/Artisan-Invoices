import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255).optional().or(z.literal("")),
  phone: z.string().trim().regex(/^[0-9+\-\s()]*$/, "Invalid phone number").max(20).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  gst_no: z.string().trim().max(15).optional().or(z.literal("")),
  shirt_size: z.string().trim().max(10).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  pincode: z.string().trim().max(10).optional().or(z.literal(""))
});

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(500),
  shirt_size: z.string().trim().min(1, "Shirt size is required").max(10),
  quantity: z.number().int().positive("Quantity must be positive").max(999999),
  rate: z.number().positive("Rate must be positive").max(99999999),
  amount: z.number().positive().max(99999999)
});

export const invoiceSchema = z.object({
  customer_name: z.string().trim().min(1, "Customer name is required").max(100),
  customer_email: z.string().trim().email("Invalid email").max(255),
  customer_phone: z.string().trim().min(1, "Phone is required").max(20),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  tax_rate: z.number().min(0).max(100).optional()
});

export const quotationItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(500),
  shirt_size: z.string().trim().min(1, "Shirt size is required").max(10),
  quantity: z.number().int().positive("Quantity must be positive").max(999999),
  rate: z.number().positive("Rate must be positive").max(99999999)
});

export const quotationSchema = z.object({
  customer_id: z.string().uuid("Invalid customer selection"),
  date: z.string().min(1, "Date is required"),
  valid_until: z.string().min(1, "Valid until date is required"),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  tax_type: z.string().optional()
});

export const stockRegisterSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required").max(200),
  size: z.string().trim().min(1, "Size is required").max(50),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  opening_stock: z.number().int().min(0).max(9999999),
  production: z.number().int().min(0).max(9999999),
  sales: z.number().int().min(0).max(9999999),
  closing_stock: z.number().int().min(0).max(9999999)
});
