import { Customer, Quotation, Invoice, AdminSettings, AppNotification } from '../types';

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'John Doe',
    companyName: 'Acme Corporation',
    mobile: '+1 (555) 123-4567',
    email: 'john@acme.com',
    billingAddress: '123 Business Rd, Suite 100, Metropolis, NY 10001',
    shippingAddress: '123 Business Rd, Suite 100, Metropolis, NY 10001',
    notes: 'Premium client. Always pays on time.',
    createdAt: '2025-10-15'
  },
  {
    id: 'cust-2',
    name: 'Sarah Jenkins',
    companyName: 'Starlight Media',
    mobile: '+1 (555) 987-6543',
    email: 'sarah@starlight.io',
    billingAddress: '456 Creative Way, Studio B, Los Angeles, CA 90028',
    shippingAddress: '456 Creative Way, Studio B, Los Angeles, CA 90028',
    notes: 'Requires detailed line-item breakdowns.',
    createdAt: '2026-01-20'
  },
  {
    id: 'cust-3',
    name: 'Rajesh Patel',
    companyName: 'Apex Retailers',
    mobile: '+91 98765 43210',
    email: 'rajesh@apexretail.in',
    billingAddress: '78 Commercial St, Bangalore, KA 560001',
    shippingAddress: ' Warehouse B, 12 Industrial Area, Bangalore, KA 560099',
    notes: 'Prefers payments via UPI/GPay.',
    createdAt: '2026-03-05'
  },
  {
    id: 'cust-4',
    name: 'Emily Wong',
    companyName: 'Nova Consulting',
    mobile: '+65 8123 4567',
    email: 'emily@nova.sg',
    billingAddress: '10 Collyer Quay, #12-05, Singapore 049315',
    shippingAddress: '10 Collyer Quay, #12-05, Singapore 049315',
    notes: 'Consultancy contract renewal due next month.',
    createdAt: '2026-04-12'
  }
];

export const defaultSettings: AdminSettings = {
  companyName: 'Skenetic Digital',
  logoUrl: '/logo.png',
  address: '77 Innovation Blvd, Tech Park, Austin, TX 78701',
  phone: '+1 (555) 800-VRTX',
  email: 'finance@skeneticdigital.com',
  bankName: 'Silicon Valley Trust',
  bankAccount: '987654321098',
  bankIfsc: 'SVT0001234',
  upiId: 'skenetic@svt',
  gpayNumber: '9876543210',
  invoicePrefix: 'INV',
  quotationPrefix: 'QUO'
};

export const initialQuotations: Quotation[] = [
  {
    id: 'quo-1',
    number: 'QUO-0001',
    customerId: 'cust-1',
    date: '2026-06-10',
    validUntil: '2026-07-10',
    items: [
      { id: 'item-1', description: 'Cloud Infrastructure Setup & Configuration', quantity: 1, unitPrice: 2500, subtotal: 2500 },
      { id: 'item-2', description: 'Enterprise Security Audit', quantity: 1, unitPrice: 1500, subtotal: 1500 }
    ],
    subtotal: 4000,
    taxRate: 18,
    taxAmount: 720,
    grandTotal: 4720,
    notes: 'Includes 3 months of complimentary support.',
    terms: 'Valid for 30 days. 50% advance upon approval.',
    status: 'Approved'
  },
  {
    id: 'quo-2',
    number: 'QUO-0002',
    customerId: 'cust-2',
    date: '2026-06-18',
    validUntil: '2026-07-18',
    items: [
      { id: 'item-3', description: 'Video Production & Editing Services', quantity: 3, unitPrice: 1200, subtotal: 3600 },
      { id: 'item-4', description: 'Motion Graphics Design', quantity: 10, unitPrice: 150, subtotal: 1500 }
    ],
    subtotal: 5100,
    taxRate: 18,
    taxAmount: 918,
    grandTotal: 6018,
    notes: 'Revision cycles limited to three rounds.',
    terms: 'Payment schedule: 40% upfront, 60% on delivery.',
    status: 'Sent'
  },
  {
    id: 'quo-3',
    number: 'QUO-0003',
    customerId: 'cust-3',
    date: '2026-05-15',
    validUntil: '2026-06-15',
    items: [
      { id: 'item-5', description: 'Inventory Management Software License', quantity: 5, unitPrice: 800, subtotal: 4000 }
    ],
    subtotal: 4000,
    taxRate: 18,
    taxAmount: 720,
    grandTotal: 4720,
    notes: 'Licensing is perpetual for local servers.',
    terms: '100% advance payment.',
    status: 'Expired'
  },
  {
    id: 'quo-4',
    number: 'QUO-0004',
    customerId: 'cust-4',
    date: '2026-06-22',
    validUntil: '2026-07-22',
    items: [
      { id: 'item-6', description: 'Strategic Business Consulting - Retainer', quantity: 2, unitPrice: 2000, subtotal: 4000 }
    ],
    subtotal: 4000,
    taxRate: 18,
    taxAmount: 720,
    grandTotal: 4720,
    notes: 'Monthly retainer contract.',
    terms: 'Invoiced monthly on the 1st.',
    status: 'Draft'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    number: 'INV-0001',
    quotationId: 'quo-1',
    customerId: 'cust-1',
    date: '2026-06-12',
    dueDate: '2026-06-27', // Due in 3 days relative to June 24, 2026
    items: [
      { id: 'item-1', description: 'Cloud Infrastructure Setup & Configuration', quantity: 1, unitPrice: 2500, subtotal: 2500 },
      { id: 'item-2', description: 'Enterprise Security Audit', quantity: 1, unitPrice: 1500, subtotal: 1500 }
    ],
    subtotal: 4000,
    taxRate: 18,
    taxAmount: 720,
    grandTotal: 4720,
    paidAmount: 2000,
    balance: 2720,
    notes: 'First installment paid.',
    status: 'Partially Paid',
    payments: [
      { id: 'pay-1', amount: 2000, date: '2026-06-13', method: 'Bank Transfer', notes: 'Initial deposit' }
    ]
  },
  {
    id: 'inv-2',
    number: 'INV-0002',
    customerId: 'cust-3',
    date: '2026-06-01',
    dueDate: '2026-06-15', // Overdue relative to June 24, 2026
    items: [
      { id: 'item-5', description: 'Inventory Management Software License - Setup Fee', quantity: 1, unitPrice: 1500, subtotal: 1500 }
    ],
    subtotal: 1500,
    taxRate: 18,
    taxAmount: 270,
    grandTotal: 1770,
    paidAmount: 0,
    balance: 1770,
    notes: 'Please expedite payment.',
    status: 'Overdue',
    payments: []
  },
  {
    id: 'inv-3',
    number: 'INV-0003',
    customerId: 'cust-4',
    date: '2026-06-05',
    dueDate: '2026-06-20', // Paid in full
    items: [
      { id: 'item-7', description: 'Strategic Business Consulting - Phase 1', quantity: 1, unitPrice: 3000, subtotal: 3000 }
    ],
    subtotal: 3000,
    taxRate: 18,
    taxAmount: 540,
    grandTotal: 3540,
    paidAmount: 3540,
    balance: 0,
    notes: 'Thank you for your business.',
    status: 'Paid',
    payments: [
      { id: 'pay-2', amount: 3540, date: '2026-06-10', method: 'UPI', notes: 'Full payment' }
    ]
  },
  {
    id: 'inv-4',
    number: 'INV-0004',
    customerId: 'cust-2',
    date: '2026-06-22',
    dueDate: '2026-07-07', // Due in future
    items: [
      { id: 'item-3', description: 'Video Production Services', quantity: 1, unitPrice: 1200, subtotal: 1200 }
    ],
    subtotal: 1200,
    taxRate: 18,
    taxAmount: 216,
    grandTotal: 1416,
    paidAmount: 0,
    balance: 1416,
    status: 'Unpaid',
    payments: []
  },
  {
    id: 'inv-5',
    number: 'INV-0005',
    customerId: 'cust-1',
    date: '2026-05-10',
    dueDate: '2026-05-25', // Paid in full previous month
    items: [
      { id: 'item-8', description: 'Routine Server Maintenance Retainer', quantity: 1, unitPrice: 1000, subtotal: 1000 }
    ],
    subtotal: 1000,
    taxRate: 18,
    taxAmount: 180,
    grandTotal: 1180,
    paidAmount: 1180,
    balance: 0,
    status: 'Paid',
    payments: [
      { id: 'pay-3', amount: 1180, date: '2026-05-12', method: 'Bank Transfer', notes: 'Monthly retainer' }
    ]
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Payment Due in 3 Days',
    message: 'Invoice INV-0001 for Acme Corporation has an upcoming due date of 2026-06-27 (Pending: ₹2,720.00).',
    type: 'info',
    date: '2026-06-24',
    read: false,
    invoiceId: 'inv-1'
  },
  {
    id: 'notif-2',
    title: 'Overdue Payment Alert',
    message: 'Invoice INV-0002 for Apex Retailers (₹1,770.00) was due on 2026-06-15 and is now overdue by 9 days.',
    type: 'warning',
    date: '2026-06-16',
    read: false,
    invoiceId: 'inv-2'
  },
  {
    id: 'notif-3',
    title: 'Quotation Approved',
    message: 'Quotation QUO-0001 was approved by Acme Corporation and is ready for conversion.',
    type: 'success',
    date: '2026-06-11',
    read: true,
    quotationId: 'quo-1'
  },
  {
    id: 'notif-4',
    title: 'Invoice Created Confirmation',
    message: 'Invoice INV-0004 for Starlight Media (₹1,416.00) has been created.',
    type: 'success',
    date: '2026-06-22',
    read: true,
    invoiceId: 'inv-4'
  }
];
