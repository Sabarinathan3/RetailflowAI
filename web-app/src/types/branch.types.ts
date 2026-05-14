export interface Branch {
  id: string;
  shopId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
