import React, { useState, useEffect } from 'react';
import { Invoice, Customer, LineItem, InvoiceStatus, PaymentRecord, AdminSettings, MilestonePayment } from '../types';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  X,
  Printer,
  Download,
  Mail,
  Send,
  IndianRupee,
  Landmark,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { generateDocumentPDF } from '../utils/pdfGenerator';
import { exportInvoicesToExcel } from '../utils/excelExporter';
import WhatsAppShareModal from './WhatsAppShareModal';

interface InvoiceManagementProps {
  invoices: Invoice[];
  customers: Customer[];
  settings: AdminSettings;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onSelectPrint: (doc: { type: 'invoice' | 'quotation'; data: any }) => void;
  activeInvoiceToEdit: Invoice | null;
  onClearActiveInvoiceToEdit: () => void;
}

export default function InvoiceManagement({
  invoices,
  customers,
  settings,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onSelectPrint,
  activeInvoiceToEdit,
  onClearActiveInvoiceToEdit,
}: InvoiceManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, subtotal: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('Unpaid');
  const [invNumber, setInvNumber] = useState('');
  const [formPaidAmount, setFormPaidAmount] = useState(0);
  const [paymentTermsType, setPaymentTermsType] = useState<'Standard' | 'Milestone'>('Standard');
  const [milestones, setMilestones] = useState<MilestonePayment[]>([]);

  // Payment Collection States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payNotes, setPayNotes] = useState('');

  // WhatsApp Share Modal
  const [waShareInvoice, setWaShareInvoice] = useState<Invoice | null>(null);



  // Auto handle incoming edit requests from converted quotations or dashboard selection
  useEffect(() => {
    if (activeInvoiceToEdit) {
      if (activeInvoiceToEdit.id === 'NEW_CONVERTED') {
        // We are creating a new invoice converted from a quote
        setEditingInvoice(null);
        setInvNumber(generateInvoiceNumber());
        setSelectedCustomerId(activeInvoiceToEdit.customerId);
        setDate(activeInvoiceToEdit.date);
        setDueDate(activeInvoiceToEdit.dueDate);
        setItems(activeInvoiceToEdit.items.map((line) => ({ ...line })));
        setNotes(activeInvoiceToEdit.notes || '');
        setStatus('Unpaid');
        setFormPaidAmount(0);
        setIsFormOpen(true);
      } else {
        // Editing an existing invoice
        openEditForm(activeInvoiceToEdit);
      }
      onClearActiveInvoiceToEdit();
    }
  }, [activeInvoiceToEdit]);

  // Generate Invoice Number
  const generateInvoiceNumber = () => {
    const prefix = settings.invoicePrefix || 'INV';
    const numRegex = new RegExp(`^${prefix}-(\\d+)`);
    let maxNum = 0;
    invoices.forEach((inv) => {
      const match = inv.number.match(numRegex);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
  };

  useEffect(() => {
    if (isFormOpen && !editingInvoice && (!activeInvoiceToEdit || activeInvoiceToEdit.id !== 'NEW_CONVERTED')) {
      setInvNumber(generateInvoiceNumber());
      setDate(new Date().toISOString().split('T')[0]);
      const future = new Date();
      future.setDate(future.getDate() + 15); // Net 15 terms
      setDueDate(future.toISOString().split('T')[0]);
    }
  }, [isFormOpen, editingInvoice, settings.invoicePrefix]);

  const createStandard3Milestones = (totalAmount: number): MilestonePayment[] => [
    { id: 'm1', name: 'Milestone 1: 30% Advance Upon Booking', percentage: 30, amount: (totalAmount * 30) / 100, status: 'Pending' },
    { id: 'm2', name: 'Milestone 2: 40% Mid-way Project Delivery', percentage: 40, amount: (totalAmount * 40) / 100, status: 'Pending' },
    { id: 'm3', name: 'Milestone 3: 30% Final Completion & Sign-off', percentage: 30, amount: (totalAmount * 30) / 100, status: 'Pending' },
  ];

  const openCreateForm = () => {
    setEditingInvoice(null);
    setSelectedCustomerId(customers[0]?.id || '');
    setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, subtotal: 0 }]);
    setNotes('');
    setStatus('Unpaid');
    setFormPaidAmount(0);
    setPaymentTermsType('Standard');
    setMilestones([]);
    setIsFormOpen(true);
  };

  const openEditForm = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvNumber(inv.number);
    setSelectedCustomerId(inv.customerId);
    setDate(inv.date);
    setDueDate(inv.dueDate);
    setItems(inv.items.map(item => ({ ...item })));
    setNotes(inv.notes || '');
    setStatus(inv.status);
    setFormPaidAmount(inv.paidAmount || 0);
    setPaymentTermsType(inv.paymentTermsType || 'Standard');
    setMilestones(inv.milestones || []);
    setIsFormOpen(true);
  };

  // Line Item actions
  const handleItemChange = (id: string, field: keyof LineItem, val: string | number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: val };
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? Number(val) : item.quantity;
            const price = field === 'unitPrice' ? Number(val) : item.unitPrice;
            updatedItem.subtotal = qty * price;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, subtotal: 0 }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    const taxRate = 0;
    const taxAmount = 0;
    const grandTotal = subtotal;
    return { subtotal, taxRate, taxAmount, grandTotal };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }

    const { subtotal, taxRate, taxAmount, grandTotal } = calculateTotals();

    const calculatedBalance = Math.max(0, grandTotal - formPaidAmount);

    const invoiceData: Invoice = {
      id: editingInvoice ? editingInvoice.id : `inv-${Date.now()}`,
      number: invNumber,
      customerId: selectedCustomerId,
      date,
      dueDate,
      items: items.filter(item => item.description.trim() !== ''),
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      paidAmount: formPaidAmount,
      balance: calculatedBalance,
      notes,
      status: editingInvoice ? status : 'Unpaid',
      payments: editingInvoice ? editingInvoice.payments : [],
      paymentTermsType,
      milestones: paymentTermsType === 'Milestone' ? (milestones.length > 0 ? milestones : createStandard3Milestones(grandTotal)) : [],
    };

    // Auto-calculate status based on payment details & due date
    if (invoiceData.balance <= 0) {
      invoiceData.status = 'Paid';
      invoiceData.balance = 0;
    } else if (invoiceData.paidAmount > 0) {
      invoiceData.status = 'Partially Paid';
    } else {
      const today = new Date().toISOString().split('T')[0];
      invoiceData.status = invoiceData.dueDate < today ? 'Overdue' : 'Unpaid';
    }

    if (editingInvoice) {
      onUpdateInvoice(invoiceData);
    } else {
      onAddInvoice(invoiceData);
    }
    setIsFormOpen(false);
  };

  // Payment Recording
  const openPaymentModal = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentInvoice(inv);
    setPayAmount(inv.balance);
    setPayNotes('Payment against invoice ' + inv.number);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    if (payAmount <= 0) {
      alert('Amount must be greater than zero.');
      return;
    }

    if (payAmount > paymentInvoice.balance) {
      alert(`Payment exceeds outstanding balance of ₹${paymentInvoice.balance.toFixed(2)}.`);
      return;
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      amount: payAmount,
      date: new Date().toISOString().split('T')[0],
      method: payMethod,
      notes: payNotes,
    };

    const updatedPayments = [...paymentInvoice.payments, newPayment];
    const newPaidAmount = paymentInvoice.paidAmount + payAmount;
    const newBalance = paymentInvoice.grandTotal - newPaidAmount;
    
    let newStatus: InvoiceStatus = 'Partially Paid';
    if (newBalance <= 0) {
      newStatus = 'Paid';
    }

    const updatedInvoice: Invoice = {
      ...paymentInvoice,
      paidAmount: newPaidAmount,
      balance: Math.max(0, newBalance),
      status: newStatus,
      payments: updatedPayments,
    };

    onUpdateInvoice(updatedInvoice);
    setIsPaymentModalOpen(false);
    setPaymentInvoice(null);
    alert(`Success! Payment of ₹${payAmount.toFixed(2)} recorded for ${paymentInvoice.number}.`);
  };

  const handleOpenChannel = (inv: Invoice, method: 'Email' | 'WhatsApp') => {
    const cust = customers.find(c => c.id === inv.customerId);
    if (method === 'WhatsApp') {
      setWaShareInvoice(inv);
    } else {
      const text = `Subject: Invoice ${inv.number}\n\nDear Client,\n\nPlease find the details for invoice ${inv.number}. The total amount is ₹${inv.grandTotal.toFixed(2)}.\n\nBest Regards,\n${settings.companyName}`;
      window.open(`mailto:${cust?.email || ''}?subject=Invoice ${inv.number}&body=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Filters
  const filteredInvoices = invoices.filter((inv) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    const matchesSearch =
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust?.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totals = calculateTotals();

  return (
    <div id="invoice-mgmt-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Invoice Management</h1>
          <p className="text-sm text-slate-500">Generate commercial tax invoices, log business collections, and track account receivables.</p>
        </div>
        {!isFormOpen && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => exportInvoicesToExcel(invoices, customers)}
              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-2.5 rounded-xl transition cursor-pointer shadow-2xs"
              title="Export all invoices to Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={openCreateForm}
              id="new-invoice-btn"
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm cursor-pointer animate-fade-in"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: List View vs. Creation Form */}
      {!isFormOpen ? (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Panel */}
          <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices by number, client, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                        No invoices found. Click "New Invoice" to create your first statement.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const cust = customers.find((c) => c.id === inv.customerId);
                      const statusColors: { [key: string]: string } = {
                        Unpaid: 'bg-blue-50 text-blue-700 border-blue-100',
                        'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-100',
                        Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        Overdue: 'bg-rose-50 text-rose-700 border-rose-100',
                      };

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{inv.number}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{cust?.name || 'Unknown Client'}</div>
                            <div className="text-xs text-slate-400">{cust?.companyName || 'Individual'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">
                            <div>Issued: {inv.date}</div>
                            <div>Due: {inv.dueDate}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                            ₹{inv.grandTotal.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                            {inv.balance > 0 ? (
                              <span className="text-rose-600 font-bold">₹{inv.balance.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-400">₹0.00</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={inv.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as InvoiceStatus;
                                onUpdateInvoice({ ...inv, status: newStatus });
                              }}
                              className={`px-2 py-1 rounded-full text-xxs font-semibold border outline-none cursor-pointer ${statusColors[inv.status] || ''}`}
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Partially Paid">Partially Paid</option>
                              <option value="Paid">Paid</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Collect Payment */}
                              {inv.balance > 0 && (
                                <button
                                  onClick={(e) => openPaymentModal(inv, e)}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition flex items-center gap-0.5 text-xxs font-semibold px-1.5 py-0.5 border border-emerald-200 cursor-pointer"
                                  title="Record Payment Collection"
                                >
                                  <IndianRupee className="w-3 h-3" />
                                  <span>Collect</span>
                                </button>
                              )}

                              {/* Direct PDF Download */}
                              <button
                                onClick={async () => {
                                  try {
                                    const blob = await generateDocumentPDF({ type: 'invoice', data: inv }, customers, settings);
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${inv.number}.pdf`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                  } catch (err) {
                                    alert('Failed to download PDF: ' + String(err));
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {/* Preview / Print */}
                              <button
                                onClick={() => onSelectPrint({ type: 'invoice', data: inv })}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                title="Print / Preview PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Sharing simulations */}
                              <button
                                onClick={() => handleOpenChannel(inv, 'Email')}
                                className="p-1 text-slate-400 hover:text-blue-500 rounded cursor-pointer"
                                title="Send via Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenChannel(inv, 'WhatsApp')}
                                className="p-1 text-slate-400 hover:text-emerald-500 rounded cursor-pointer"
                                title="Send via WhatsApp"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => openEditForm(inv)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                title="Edit Invoice Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(`Delete Invoice ${inv.number}? This cannot be undone.`)) {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Invoice Entry/Edit Form */
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-100 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingInvoice ? `Edit Tax Invoice ${invNumber}` : `Create New Tax Invoice: ${invNumber}`}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Select Customer *</label>
              <select
                value={selectedCustomerId}
                required
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>-- Choose Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyName || 'Individual'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Product / Service Line Items</span>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-end border-b border-slate-50 pb-3 sm:pb-0 sm:border-none">
                  <div className="flex-1 w-full">
                    <label className="block text-3xxs text-slate-400 uppercase tracking-wider mb-0.5 sm:hidden">Description</label>
                    <input
                      type="text"
                      placeholder="Item name / service description..."
                      value={item.description}
                      required
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="block text-3xxs text-slate-400 uppercase tracking-wider mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      required
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-3xxs text-slate-400 uppercase tracking-wider mb-0.5">Unit Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPrice}
                      required
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                    />
                  </div>

                  <div className="w-full sm:w-28 text-right self-center pt-2 sm:pt-0">
                    <span className="block text-3xxs text-slate-400 uppercase tracking-wider mb-1 text-left sm:text-right">Subtotal</span>
                    <span className="text-sm font-semibold text-slate-700">₹{item.subtotal.toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 self-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Item</span>
            </button>
          </div>

          {/* Public Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Public Notes (appears on Invoice)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bank details, payment conditions..."
              className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Payment Terms & Milestone Split */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Payment Terms & Milestones</span>
                <span className="text-xxs text-slate-500">Split invoice payments into project milestones (e.g. 30% Advance, 40% Midway, 30% Final).</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentTermsType('Standard');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paymentTermsType === 'Standard' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentTermsType('Milestone');
                    if (milestones.length === 0) {
                      const grand = calculateTotals().grandTotal;
                      setMilestones(createStandard3Milestones(grand));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paymentTermsType === 'Milestone' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Milestone Terms (30/40/30)
                </button>
              </div>
            </div>

            {paymentTermsType === 'Milestone' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Milestone Schedule (30% / 40% / 30%)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const grand = calculateTotals().grandTotal;
                      setMilestones(createStandard3Milestones(grand));
                    }}
                    className="text-xxs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Reset 30-40-30 Split
                  </button>
                </div>

                <div className="space-y-2">
                  {milestones.map((m, idx) => (
                    <div key={m.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].name = e.target.value;
                            setMilestones(updated);
                          }}
                          className="w-full border border-slate-200 rounded p-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Milestone description..."
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={m.percentage}
                            onChange={(e) => {
                              const pct = parseFloat(e.target.value) || 0;
                              const grand = calculateTotals().grandTotal;
                              const updated = [...milestones];
                              updated[idx].percentage = pct;
                              updated[idx].amount = (grand * pct) / 100;
                              setMilestones(updated);
                            }}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                      </div>
                      <div className="sm:col-span-4 text-right font-bold text-slate-800 font-mono">
                        ₹{(m.amount || (calculateTotals().grandTotal * m.percentage) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>



          {/* Totals Summary */}
          <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row md:justify-between items-end gap-4">
            <p className="text-xxs text-slate-400">All prices calculated according to standard ledger definitions.</p>

            <div className="w-full md:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-700">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1.5 text-sm">
                <span>Grand Total:</span>
                <span className="text-indigo-600 font-mono">₹{totals.grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 border-t border-slate-100 pt-2">
                <span>Paid Amount (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPaidAmount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormPaidAmount(val);
                  }}
                  placeholder="0.00"
                  className="w-28 text-right text-xs border border-slate-200 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1.5 text-sm">
                <span>Balance Due:</span>
                <span className="text-rose-600 font-mono">₹{Math.max(0, totals.grandTotal - formPaidAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
            >
              {editingInvoice ? 'Update Statement' : 'Issue Tax Invoice'}
            </button>
          </div>
        </form>
      )}

      {/* Receive / Record Payment Collection Modal */}
      {isPaymentModalOpen && paymentInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-md font-semibold text-slate-800 flex items-center gap-1.5">
                <Landmark className="w-4.5 h-4.5 text-emerald-600" />
                <span>Collect Payment: {paymentInvoice.number}</span>
              </h3>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentInvoice(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-50 text-xxs text-slate-600 space-y-1">
                <p>Customer: <strong>{customers.find(c => c.id === paymentInvoice.customerId)?.name}</strong></p>
                <p>Outstanding Balance: <strong className="text-rose-600 font-mono">₹{paymentInvoice.balance.toFixed(2)}</strong></p>
                <p>Grand Total Billed: <strong className="font-mono">₹{paymentInvoice.grandTotal.toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash Settlement</option>
                  <option value="Card">Credit/Debit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Collection Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={paymentInvoice.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Receipt Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Bank transaction hash or remarks"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentInvoice(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm cursor-pointer"
                >
                  Commit Collection Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {waShareInvoice && (
        <WhatsAppShareModal
          docType="invoice"
          doc={waShareInvoice}
          customers={customers}
          settings={settings}
          onClose={() => setWaShareInvoice(null)}
        />
      )}
    </div>
  );
}
