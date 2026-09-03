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

export interface MilestonePayment {
  id: string;
  name: string; // e.g. "Milestone 1: 30% Advance Upon Booking"
  percentage: number; // e.g. 30
  amount: number; // e.g. 3000
  dueDate?: string;
  status: 'Pending' | 'Paid';
  paidDate?: string;
}

export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  date: string;
  validUntil: string;
  items: LineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  status: QuotationStatus;
  paymentTermsType?: 'Standard' | 'Milestone';
  milestones?: MilestonePayment[];
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
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  status: InvoiceStatus;
  payments: PaymentRecord[];
  paymentTermsType?: 'Standard' | 'Milestone';
  milestones?: MilestonePayment[];
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
  gpayQrUrl?: string;
  invoicePrefix: string;
  quotationPrefix: string;

  leadsPin?: string;
  accountsPin?: string;
  pendingPaymentsPin?: string;
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
  status: 'To Do' | 'In Progress' | 'Completed' | 'Overdue';
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

export type LeadStatus = 'New' | 'Contacted' | 'Converted';

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  notes?: string;
  status: LeadStatus;
  createdAt: string;
}

export interface AccountEntry {
  id: string;
  type: 'income' | 'expense';
  date: string;
  category: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface ManualPendingEntry {
  id: string;
  customerId?: string;
  clientName: string;
  mobile?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string; // 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Other'
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  clockIn: string;
  clockOut?: string;
  durationMinutes?: number;
  date: string;
}

export type SalaryStatus = 'Paid' | 'Unpaid' | 'Partially Paid';

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  salaryAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: SalaryStatus;
  paidDate?: string;
  paymentMethod?: string; // 'Bank Transfer' | 'GPay / UPI' | 'Cash'
  notes?: string;
  createdAt: string;
}
