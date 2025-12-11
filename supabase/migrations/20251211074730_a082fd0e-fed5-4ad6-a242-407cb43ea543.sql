-- Create inward_register table
CREATE TABLE public.inward_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  from_party TEXT,
  entry_date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create outward_register table
CREATE TABLE public.outward_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  to_party TEXT,
  entry_date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inward_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outward_register ENABLE ROW LEVEL SECURITY;

-- RLS policies for inward_register
CREATE POLICY "Authenticated users can view all inward entries"
ON public.inward_register FOR SELECT USING (true);

CREATE POLICY "Users can insert their own inward entries"
ON public.inward_register FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inward entries"
ON public.inward_register FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inward entries"
ON public.inward_register FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for outward_register
CREATE POLICY "Authenticated users can view all outward entries"
ON public.outward_register FOR SELECT USING (true);

CREATE POLICY "Users can insert their own outward entries"
ON public.outward_register FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outward entries"
ON public.outward_register FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outward entries"
ON public.outward_register FOR DELETE USING (auth.uid() = user_id);