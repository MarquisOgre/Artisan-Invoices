-- Add tax_mode column to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS tax_mode text DEFAULT 'exclusive';

-- Add complimentary column to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS complimentary boolean DEFAULT false;

-- Add tax_mode column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_mode text DEFAULT 'exclusive';

-- Add complimentary column to invoices table  
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS complimentary boolean DEFAULT false;