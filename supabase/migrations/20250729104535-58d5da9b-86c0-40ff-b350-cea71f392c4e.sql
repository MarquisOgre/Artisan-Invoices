-- Add new fields to customers table
ALTER TABLE public.customers 
ADD COLUMN gst_number TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT,
ADD COLUMN pincode TEXT;