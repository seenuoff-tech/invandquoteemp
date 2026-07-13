export interface Customer {
  id: string;
  name: string;
  companyName: string;
  mobile: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired';

export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  date: string;
  validUntil: string;
  items: LineItem[];
  subtotal: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  status: QuotationStatus;
}

export type InvoiceStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: string; // 'Bank Transfer' | 'UPI' | 'Cash' | 'Card'
  notes?: string;
}

export interface Invoice {
  id: string;
  number: string;
  quotationId?: string; // if converted
  customerId: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  status: InvoiceStatus;
  payments: PaymentRecord[];
}

export interface AdminSettings {
  companyName: string;
  logoUrl?: string;

  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  upiId: string;
  gpayNumber: string;
  invoicePrefix: string;
  quotationPrefix: string;

}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  read: boolean;
  invoiceId?: string;
  quotationId?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  createdAt: string;
  username?: string;
  password?: string;
  permissions?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  employeeId: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  dueDate: string;
  createdAt: string;
}

export interface TimeLog {
  id: string;
  employeeId: string;
  taskId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  organizerId: string;
  attendees: string[]; // array of employee IDs
}
