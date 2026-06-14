export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export type Role = "ADMIN" | "STAFF";
export type ProductStatus = "IN_STOCK" | "ON_REQUEST" | "UNAVAILABLE";
export type PaymentMethod = "CASH" | "TRANSFER" | "MERCADOPAGO";
export type CustomerOrderStatus = "PENDING" | "DELIVERED" | "CANCELLED";
export type OrderItemStatus = "RESERVED" | "PENDING" | "DELIVERED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface ProductSize {
  id: string;
  productId: string;
  size: string;
  stock: number;
  purchasePrice?: string | null;
  salePrice?: string | null;
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  colorway: string;
  description?: string;
  status: ProductStatus;
  purchasePrice: string;
  salePrice: string;
  images: string[];
  categoryId?: string | null;
  qualityId?: string | null;
  category?: ProductCategory | null;
  quality?: ProductQuality | null;
  sizes: ProductSize[];
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  instagram?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  salePrice: string;
  purchasePrice: string;
  paymentMethod: PaymentMethod;
  saleSourceId?: string | null;
  saleSource?: SaleSource | null;
  soldAt: string;
  notes?: string;
  productSize: ProductSize & { product: Product };
  client: Client;
  user: { name: string };
}

export type PurchaseOrderStatus = "PENDING" | "RECEIVED" | "CANCELLED";

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  purchaseOrders?: PurchaseOrder[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId?: string;
  product?: Product;
  size: string;
  quantity: number;
  unitCost: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplier: Supplier;
  status: PurchaseOrderStatus;
  notes?: string;
  orderedAt: string;
  receivedAt?: string;
  items: PurchaseOrderItem[];
}

export interface CustomerOrderItem {
  id: string;
  customerOrderId: string;
  productSizeId: string | null;
  productId: string;
  size: string;
  salePrice: string;
  status: OrderItemStatus;
  createdAt: string;
  product: Product;
  productSize?: ProductSize | null;
}

export interface CustomerOrder {
  id: string;
  clientId: string;
  status: CustomerOrderStatus;
  notes?: string;
  createdAt: string;
  client: Client;
  items: CustomerOrderItem[];
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductQuality {
  id: string;
  name: string;
  createdAt: string;
}

export interface SaleSource {
  id: string;
  name: string;
  createdAt: string;
}

export type AuditModule = "SALES" | "PRODUCTS" | "ORDERS" | "PURCHASE_ORDERS" | "USERS" | "CLIENTS" | "SUPPLIERS";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "DELIVER" | "CANCEL" | "RECEIVE" | "RESERVE" | "DEACTIVATE";

export interface AuditLog {
  id: string;
  userId: string | null;
  module: AuditModule;
  action: AuditAction;
  entityId: string | null;
  description: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

export interface PendingItem {
  id: string;
  productId: string;
  size: string;
  salePrice: string;
  status: OrderItemStatus;
  createdAt: string;
  product: Product;
  customerOrder: CustomerOrder & { client: Client };
}

export interface ProfitReport {
  totalSales: number;
  totalRevenue: string;
  totalCost: string;
  totalProfit: string;
  margin: string;
}
