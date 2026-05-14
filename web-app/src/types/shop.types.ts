export interface Shop {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logoUrl: string | null;
  taxEnabled: boolean;
  defaultTaxRate: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  isActive: boolean;
  featureFlags: Record<string, boolean> | null;
  createdAt: string;
  updatedAt: string;
}
