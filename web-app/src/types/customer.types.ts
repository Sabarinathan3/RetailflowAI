export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  totalPurchases: number;
  creditLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  creditLimit?: number;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CustomerSearchParams {
  page?: number;
  limit?: number;
  search?: string;
}
