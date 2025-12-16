import { supabase } from '@/integrations/supabase/client';

export type Role = 'admin' | 'tenant';

export interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyStatus = 'vacant' | 'occupied';

export interface PropertyTenantSummary {
  id: string;
  full_name: string;
  email: string;
  status: string;
}

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  monthly_rent: number;
}

export interface DbProperty {
  id: string;
  name: string;
  address: string;
  type: string;
  monthly_rent: number;
  status: PropertyStatus;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyWithTenants = DbProperty & {
  tenants: PropertyTenantSummary[];
};

export interface DbTenant {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  property: PropertySummary | null;
  lease_start: string | null;
  lease_end: string | null;
  status: string;
  deposit: number | null;
  monthly_rent: number;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'overdue';

export interface DbPayment {
  id: string;
  tenant_id: string;
  property_id: string | null;
  amount: number;
  month: string;
  due_date: string;
  paid_date: string | null;
  status: PaymentStatus;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tenant?: Pick<DbTenant, 'id' | 'full_name' | 'email'> & { property?: Pick<PropertySummary, 'name'> };
  property?: Pick<PropertySummary, 'id' | 'name'> | null;
}

export interface DbPolicy {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: string;
  property_id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  created_at: string;
  updated_at: string;
  property?: Pick<DbProperty, 'id' | 'name'> | null;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  profile?: Pick<DbProfile, 'id' | 'full_name' | 'email' | 'role'> | null;
}

export interface DbTaxRecord {
  id: string;
  month: string;
  year: number;
  total_revenue: number;
  total_utilities: number;
  electricity: number;
  water: number;
  gas: number;
  maintenance: number;
  other_expenses: number;
  net_income: number;
  tax_rate: number;
  tax_amount: number;
  created_at: string;
  updated_at: string;
}

const propertySelect = `
  id,
  name,
  address,
  type,
  monthly_rent,
  status,
  image_url,
  created_at,
  updated_at,
  tenants:tenants ( id, full_name, email, status )
`;

const tenantSelect = `
  id,
  user_id,
  full_name,
  email,
  phone,
  lease_start,
  lease_end,
  status,
  deposit,
  monthly_rent,
  created_at,
  updated_at,
  property:properties ( id, name, address, monthly_rent )
`;

const paymentSelect = `
  id,
  tenant_id,
  property_id,
  amount,
  month,
  due_date,
  paid_date,
  status,
  payment_method,
  notes,
  created_at,
  updated_at,
  tenant:tenants ( id, full_name, email, property:properties ( name ) ),
  property:properties ( id, name )
`;

const expenseSelect = `
  id,
  property_id,
  category,
  description,
  amount,
  expense_date,
  created_at,
  updated_at,
  property:properties ( id, name )
`;

const notificationSelect = `
  id,
  user_id,
  title,
  message,
  type,
  read,
  created_at,
  profile:profiles ( id, full_name, email, role )
`;

const parseNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number.parseFloat(value);
};

const parseNullableNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const mapProperty = (property: any): PropertyWithTenants => ({
  id: property.id,
  name: property.name,
  address: property.address,
  type: property.type,
  monthly_rent: parseNumber(property.monthly_rent),
  status: property.status,
  image_url: property.image_url ?? null,
  created_at: property.created_at,
  updated_at: property.updated_at,
  tenants: (property.tenants ?? []).map((tenant: any) => ({
    id: tenant.id,
    full_name: tenant.full_name,
    email: tenant.email,
    status: tenant.status ?? 'active',
  })),
});

const mapTenant = (tenant: any): DbTenant => ({
  id: tenant.id,
  user_id: tenant.user_id ?? null,
  full_name: tenant.full_name,
  email: tenant.email,
  phone: tenant.phone ?? null,
  lease_start: tenant.lease_start ?? null,
  lease_end: tenant.lease_end ?? null,
  status: tenant.status,
  deposit: parseNullableNumber(tenant.deposit),
  monthly_rent: parseNumber(tenant.monthly_rent ?? tenant.property?.monthly_rent ?? 0),
  created_at: tenant.created_at,
  updated_at: tenant.updated_at,
  property: tenant.property
    ? {
        id: tenant.property.id,
        name: tenant.property.name,
        address: tenant.property.address,
        monthly_rent: parseNumber(tenant.property.monthly_rent),
      }
    : null,
});

const mapPayment = (payment: any): DbPayment => ({
  id: payment.id,
  tenant_id: payment.tenant_id,
  property_id: payment.property_id ?? null,
  amount: parseNumber(payment.amount),
  month: payment.month,
  due_date: payment.due_date,
  paid_date: payment.paid_date ?? null,
  status: payment.status,
  payment_method: payment.payment_method ?? null,
  notes: payment.notes ?? null,
  created_at: payment.created_at,
  updated_at: payment.updated_at,
  tenant: payment.tenant
    ? {
        id: payment.tenant.id,
        full_name: payment.tenant.full_name,
        email: payment.tenant.email,
        property: payment.tenant.property ?? undefined,
      }
    : undefined,
  property: payment.property
    ? {
        id: payment.property.id,
        name: payment.property.name,
      }
    : null,
});

const mapExpense = (expense: any): DbExpense => ({
  id: expense.id,
  property_id: expense.property_id,
  category: expense.category,
  description: expense.description ?? null,
  amount: parseNumber(expense.amount),
  expense_date: expense.expense_date,
  created_at: expense.created_at,
  updated_at: expense.updated_at,
  property: expense.property
    ? {
        id: expense.property.id,
        name: expense.property.name,
      }
    : null,
});

const mapNotification = (notification: any): DbNotification => ({
  id: notification.id,
  user_id: notification.user_id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  read: notification.read ?? false,
  created_at: notification.created_at,
  profile: notification.profile
    ? {
        id: notification.profile.id,
        full_name: notification.profile.full_name,
        email: notification.profile.email,
        role: notification.profile.role,
      }
    : null,
});

const mapTaxRecord = (record: any): DbTaxRecord => ({
  id: record.id,
  month: record.month,
  year: record.year,
  total_revenue: parseNumber(record.total_revenue),
  total_utilities: parseNumber(record.total_utilities),
  electricity: parseNumber(record.electricity),
  water: parseNumber(record.water),
  gas: parseNumber(record.gas),
  maintenance: parseNumber(record.maintenance),
  other_expenses: parseNumber(record.other_expenses),
  net_income: parseNumber(record.net_income),
  tax_rate: parseNumber(record.tax_rate),
  tax_amount: parseNumber(record.tax_amount),
  created_at: record.created_at,
  updated_at: record.updated_at,
});

const firstOrThrow = <T>(rows: T[] | null | undefined, message: string): T => {
  if (!rows || rows.length === 0) {
    throw new Error(message);
  }
  return rows[0];
};

export type PropertyCreateInput = {
  name: string;
  address: string;
  type: string;
  monthly_rent: number;
  status?: PropertyStatus;
  image_url?: string | null;
};

export type PropertyUpdateInput = Partial<Omit<PropertyCreateInput, 'monthly_rent'>> & {
  monthly_rent?: number;
};

export const propertyService = {
  async list(): Promise<PropertyWithTenants[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(propertySelect)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProperty);
  },

  async create(payload: PropertyCreateInput): Promise<PropertyWithTenants> {
    const insertPayload = {
      name: payload.name,
      address: payload.address,
      type: payload.type,
      monthly_rent: payload.monthly_rent,
      status: payload.status ?? 'vacant',
      image_url: payload.image_url ?? null,
    };

    const { data, error } = await supabase
      .from('properties')
      .insert(insertPayload)
      .select(propertySelect);

    if (error) throw new Error(error.message);
    return mapProperty(firstOrThrow(data, 'Failed to create property.'));
  },

  async update(id: string, payload: PropertyUpdateInput): Promise<PropertyWithTenants> {
    const { data, error } = await supabase
      .from('properties')
      .update({
        ...payload,
        image_url: payload.image_url ?? null,
      })
      .eq('id', id)
      .select(propertySelect);

    if (error) throw new Error(error.message);
    return mapProperty(firstOrThrow(data, 'Failed to update property.'));
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async markOccupied(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'occupied' })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async markVacant(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'vacant' })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const tenantService = {
  async list(): Promise<DbTenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select(tenantSelect)
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTenant);
  },

  async listActive(): Promise<DbTenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select(tenantSelect)
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTenant);
  },

  async getByUserId(userId: string): Promise<DbTenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select(tenantSelect)
      .eq('user_id', userId)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;
    return mapTenant(data[0]);
  },

  async update(id: string, payload: Partial<Omit<DbTenant, 'id' | 'created_at' | 'updated_at' | 'property'>>) {
    const { error } = await supabase
      .from('tenants')
      .update({
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone ?? null,
        lease_start: payload.lease_start ?? null,
        lease_end: payload.lease_end ?? null,
        status: payload.status,
        deposit: payload.deposit ?? null,
        monthly_rent: payload.monthly_rent,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async assignToProperty(tenantId: string, propertyId: string): Promise<void> {
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ property_id: propertyId, status: 'active' })
      .eq('id', tenantId);

    if (tenantError) throw new Error(tenantError.message);

    const { error: propertyError } = await supabase
      .from('properties')
      .update({ status: 'occupied' })
      .eq('id', propertyId);

    if (propertyError) throw new Error(propertyError.message);
  },

  async getPayments(tenantId: string): Promise<DbPayment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(paymentSelect)
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPayment);
  },
};

export type PaymentCreateInput = {
  tenant_id: string;
  property_id?: string | null;
  amount: number;
  month: string;
  due_date: string;
  paid_date?: string | null;
  status: PaymentStatus;
  payment_method?: string | null;
  notes?: string | null;
};

export type PaymentUpdateInput = Partial<PaymentCreateInput>;

export const paymentService = {
  async list(): Promise<DbPayment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(paymentSelect)
      .order('due_date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPayment);
  },

  async create(payload: PaymentCreateInput): Promise<DbPayment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenant_id: payload.tenant_id,
        property_id: payload.property_id ?? null,
        amount: payload.amount,
        month: payload.month,
        due_date: payload.due_date,
        paid_date: payload.paid_date ?? null,
        status: payload.status,
        payment_method: payload.payment_method ?? null,
        notes: payload.notes ?? null,
      })
      .select(paymentSelect);

    if (error) throw new Error(error.message);
    return mapPayment(firstOrThrow(data, 'Failed to create payment.'));
  },

  async update(id: string, payload: PaymentUpdateInput): Promise<DbPayment> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        ...payload,
        property_id: payload.property_id ?? null,
        paid_date: payload.paid_date ?? null,
        payment_method: payload.payment_method ?? null,
        notes: payload.notes ?? null,
      })
      .eq('id', id)
      .select(paymentSelect);

    if (error) throw new Error(error.message);
    return mapPayment(firstOrThrow(data, 'Failed to update payment.'));
  },
};

export type ExpenseCreateInput = {
  property_id: string;
  category: string;
  description?: string | null;
  amount: number;
  expense_date: string;
};

export const expenseService = {
  async list(): Promise<DbExpense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(expenseSelect)
      .order('expense_date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapExpense);
  },

  async create(payload: ExpenseCreateInput): Promise<DbExpense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        property_id: payload.property_id,
        category: payload.category,
        description: payload.description ?? null,
        amount: payload.amount,
        expense_date: payload.expense_date,
      })
      .select(expenseSelect);

    if (error) throw new Error(error.message);
    return mapExpense(firstOrThrow(data, 'Failed to create expense.'));
  },

  async update(id: string, payload: Partial<ExpenseCreateInput>): Promise<DbExpense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...payload,
        description: payload.description ?? null,
      })
      .eq('id', id)
      .select(expenseSelect);

    if (error) throw new Error(error.message);
    return mapExpense(firstOrThrow(data, 'Failed to update expense.'));
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export type PolicyCreateInput = {
  title: string;
  content: string;
  category: string;
  is_active?: boolean;
};

export type PolicyUpdateInput = Partial<PolicyCreateInput>;

export const policyService = {
  async list(): Promise<DbPolicy[]> {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((policy) => ({
      ...policy,
      is_active: Boolean(policy.is_active),
    }));
  },

  async listActive(): Promise<DbPolicy[]> {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(payload: PolicyCreateInput): Promise<DbPolicy> {
    const { data, error } = await supabase
      .from('policies')
      .insert({
        title: payload.title,
        content: payload.content,
        category: payload.category,
        is_active: payload.is_active ?? true,
      })
      .select('*');

    if (error) throw new Error(error.message);
    return firstOrThrow(data, 'Failed to create policy.');
  },

  async update(id: string, payload: PolicyUpdateInput): Promise<DbPolicy> {
    const { data, error } = await supabase
      .from('policies')
      .update(payload)
      .eq('id', id)
      .select('*');

    if (error) throw new Error(error.message);
    return firstOrThrow(data, 'Failed to update policy.');
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('policies').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const notificationService = {
  async create(userId: string, title: string, message: string, type: string): Promise<DbNotification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, title, message, type })
      .select(notificationSelect);

    if (error) throw new Error(error.message);
    return mapNotification(firstOrThrow(data, 'Failed to create notification.'));
  },

  async listForUser(userId: string): Promise<DbNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapNotification);
  },

  async listForAdmin(): Promise<DbNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(notificationSelect)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapNotification);
  },

  async markRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  },
};

export type TaxRecordCreateInput = {
  month: string;
  year: number;
  total_revenue: number;
  total_utilities: number;
  electricity?: number;
  water?: number;
  gas?: number;
  maintenance?: number;
  other_expenses?: number;
  net_income: number;
  tax_rate: number;
  tax_amount: number;
};

export const taxService = {
  async list(year?: number): Promise<DbTaxRecord[]> {
    let query = supabase
      .from('tax_records')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTaxRecord);
  },

  async create(payload: TaxRecordCreateInput): Promise<DbTaxRecord> {
    const { data, error } = await supabase
      .from('tax_records')
      .insert({
        month: payload.month,
        year: payload.year,
        total_revenue: payload.total_revenue,
        total_utilities: payload.total_utilities,
        electricity: payload.electricity ?? 0,
        water: payload.water ?? 0,
        gas: payload.gas ?? 0,
        maintenance: payload.maintenance ?? 0,
        other_expenses: payload.other_expenses ?? 0,
        net_income: payload.net_income,
        tax_rate: payload.tax_rate,
        tax_amount: payload.tax_amount,
      })
      .select('*');

    if (error) throw new Error(error.message);
    return mapTaxRecord(firstOrThrow(data, 'Failed to create tax record.'));
  },

  async update(id: string, payload: Partial<TaxRecordCreateInput>): Promise<DbTaxRecord> {
    const { data, error } = await supabase
      .from('tax_records')
      .update(payload)
      .eq('id', id)
      .select('*');

    if (error) throw new Error(error.message);
    return mapTaxRecord(firstOrThrow(data, 'Failed to update tax record.'));
  },
};
