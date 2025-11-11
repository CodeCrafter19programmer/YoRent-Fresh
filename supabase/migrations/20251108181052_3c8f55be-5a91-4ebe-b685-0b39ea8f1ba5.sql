-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'tenant');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'vacant',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  lease_start DATE,
  lease_end DATE,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  month TEXT NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'unpaid',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create utilities_expenses table
CREATE TABLE public.utilities_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  electricity DECIMAL(10,2) DEFAULT 0,
  water DECIMAL(10,2) DEFAULT 0,
  gas DECIMAL(10,2) DEFAULT 0,
  maintenance DECIMAL(10,2) DEFAULT 0,
  other DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tax_records table for tax accountability
CREATE TABLE public.tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_utilities DECIMAL(10,2) NOT NULL DEFAULT 0,
  electricity DECIMAL(10,2) NOT NULL DEFAULT 0,
  water DECIMAL(10,2) NOT NULL DEFAULT 0,
  gas DECIMAL(10,2) NOT NULL DEFAULT 0,
  maintenance DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.utilities_expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tax_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically generate monthly tax records
CREATE OR REPLACE FUNCTION public.generate_monthly_tax_record(
  _month TEXT,
  _year INTEGER,
  _tax_rate DECIMAL DEFAULT 25.0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record_id UUID;
  _total_revenue DECIMAL := 0;
  _total_utilities DECIMAL := 0;
  _electricity DECIMAL := 0;
  _water DECIMAL := 0;
  _gas DECIMAL := 0;
  _maintenance DECIMAL := 0;
  _other_expenses DECIMAL := 0;
  _net_income DECIMAL := 0;
  _tax_amount DECIMAL := 0;
BEGIN
  -- Calculate total revenue from paid payments for the month
  SELECT COALESCE(SUM(amount), 0) INTO _total_revenue
  FROM payments
  WHERE status = 'paid'
  AND month ILIKE '%' || _month || '%' || _year || '%';

  -- Calculate total utilities for the month
  SELECT 
    COALESCE(SUM(electricity + water + gas + maintenance + other), 0),
    COALESCE(SUM(electricity), 0),
    COALESCE(SUM(water), 0),
    COALESCE(SUM(gas), 0),
    COALESCE(SUM(maintenance), 0),
    COALESCE(SUM(other), 0)
  INTO _total_utilities, _electricity, _water, _gas, _maintenance, _other_expenses
  FROM utilities_expenses
  WHERE month ILIKE '%' || _month || '%' || _year || '%';

  -- Calculate net income and tax
  _net_income := _total_revenue - _total_utilities;
  _tax_amount := _net_income * (_tax_rate / 100);

  -- Insert or update tax record
  INSERT INTO tax_records (
    month, year, total_revenue, total_utilities, electricity, water, gas,
    maintenance, other_expenses, net_income, tax_rate, tax_amount
  )
  VALUES (
    _month, _year, _total_revenue, _total_utilities, _electricity, _water, _gas,
    _maintenance, _other_expenses, _net_income, _tax_rate, _tax_amount
  )
  ON CONFLICT (month, year)
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_utilities = EXCLUDED.total_utilities,
    electricity = EXCLUDED.electricity,
    water = EXCLUDED.water,
    gas = EXCLUDED.gas,
    maintenance = EXCLUDED.maintenance,
    other_expenses = EXCLUDED.other_expenses,
    net_income = EXCLUDED.net_income,
    tax_rate = EXCLUDED.tax_rate,
    tax_amount = EXCLUDED.tax_amount,
    updated_at = NOW()
  RETURNING id INTO _record_id;

  RETURN _record_id;
END;
$$;

-- Function to update tax records when payments change
CREATE OR REPLACE FUNCTION public.update_tax_records_on_payment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _month_year TEXT[];
  _month TEXT;
  _year INTEGER;
  _should_update BOOLEAN := FALSE;
BEGIN
  -- Decide if this event should trigger a recalculation
  IF TG_OP = 'INSERT' AND NEW.status = 'paid' THEN
    _should_update := TRUE;
  ELSIF TG_OP = 'UPDATE' AND (
    (NEW.status = 'paid' AND OLD.status <> 'paid') OR
    (NEW.status <> 'paid' AND OLD.status = 'paid')
  ) THEN
    _should_update := TRUE;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'paid' THEN
    _should_update := TRUE;
  END IF;

  IF NOT _should_update THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Extract month and year from the relevant row
  IF TG_OP = 'DELETE' THEN
    _month_year := string_to_array(OLD.month, ' ');
  ELSE
    _month_year := string_to_array(NEW.month, ' ');
  END IF;

  IF array_length(_month_year, 1) >= 2 THEN
    _month := _month_year[1];
    _year := _month_year[2]::INTEGER;
    PERFORM public.generate_monthly_tax_record(_month, _year);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to update tax records when payments change
CREATE TRIGGER update_tax_records_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tax_records_on_payment_change();

-- Enable realtime for notifications and payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;