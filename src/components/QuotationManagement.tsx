import React, { useState, useEffect } from 'react';
import { Quotation, Customer, LineItem, QuotationStatus, AdminSettings, MilestonePayment } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  ChevronDown,
  RefreshCw,
  Eye,
  Download,
  FileText,
  Mail,
  Send,
  Printer,
  Calendar,
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

import { generateDocumentPDF } from '../utils/pdfGenerator';
import { exportQuotationsToExcel } from '../utils/excelExporter';
import WhatsAppShareModal from './WhatsAppShareModal';

interface QuotationManagementProps {
  quotations: Quotation[];
  customers: Customer[];
  settings: AdminSettings;
  onAddQuotation: (quotation: Quotation) => void;
  onUpdateQuotation: (quotation: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
  onSelectPrint: (doc: { type: 'invoice' | 'quotation'; data: any }) => void;
}

export default function QuotationManagement({
  quotations,
  customers,
  settings,
  onAddQuotation,
  onUpdateQuotation,
  onDeleteQuotation,
  onConvertToInvoice,
  onSelectPrint,
}: QuotationManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, subtotal: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('Draft');
  const [quoNumber, setQuoNumber] = useState('');
  const [paymentTermsType, setPaymentTermsType] = useState<'Standard' | 'Milestone'>('Standard');
  const [milestones, setMilestones] = useState<MilestonePayment[]>([]);

  // WhatsApp Share Modal
  const [waShareQuotation, setWaShareQuotation] = useState<Quotation | null>(null);

  // Generate Quotation Number
  const generateQuotationNumber = () => {
    const prefix = settings.quotationPrefix || 'QUO';
    // Find highest numeric ID in current quotations
    const numRegex = new RegExp(`^${prefix}-(\\d+)`);
    let maxNum = 0;
    quotations.forEach((q) => {
      const match = q.number.match(numRegex);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
  };

  // Trigger auto-generation on opening create form
  useEffect(() => {
    if (isFormOpen && !editingQuotation) {
      setQuoNumber(generateQuotationNumber());
      setDate(new Date().toISOString().split('T')[0]);
      // set valid until to 30 days from now
      const future = new Date();
      future.setDate(future.getDate() + 30);
      setValidUntil(future.toISOString().split('T')[0]);
    }
  }, [isFormOpen, editingQuotation, settings.quotationPrefix]);

  const createStandard3Milestones = (totalAmount: number): MilestonePayment[] => [
    { id: 'm1', name: 'Milestone 1: 30% Advance Upon Booking', percentage: 30, amount: (totalAmount * 30) / 100, status: 'Pending' },
    { id: 'm2', name: 'Milestone 2: 40% Mid-way Project Delivery', percentage: 40, amount: (totalAmount * 40) / 100, status: 'Pending' },
    { id: 'm3', name: 'Milestone 3: 30% Final Completion & Sign-off', percentage: 30, amount: (totalAmount * 30) / 100, status: 'Pending' },
  ];

  const openCreateForm = () => {
    setEditingQuotation(null);
    setSelectedCustomerId(customers[0]?.id || '');
    setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, subtotal: 0 }]);
    setNotes('');
    setTerms('Valid for 30 days. Standard milestone payment terms apply.');
    setStatus('Draft');
    setPaymentTermsType('Standard');
    setMilestones([]);
    setIsFormOpen(true);
  };

  const openEditForm = (q: Quotation) => {
    setEditingQuotation(q);
    setQuoNumber(q.number);
    setSelectedCustomerId(q.customerId);
    setDate(q.date);
    setValidUntil(q.validUntil);
    setItems(q.items.map(item => ({ ...item })));
    setNotes(q.notes || '');
    setTerms(q.terms || '');
    setStatus(q.status);
    setPaymentTermsType(q.paymentTermsType || 'Standard');
    setMilestones(q.milestones || []);
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

  // Calculate Totals
  const calculateTotals = () => {
    const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    const taxRate = 0;
    const taxAmount = 0;
    const grandTotal = subtotal;
    return { subtotal, taxRate, taxAmount, grandTotal };
  };

  const handleSave = (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }

    const { subtotal, taxRate, taxAmount, grandTotal } = calculateTotals();

    const quoteData: Quotation = {
      id: editingQuotation ? editingQuotation.id : `quo-${Date.now()}`,
      number: quoNumber,
      customerId: selectedCustomerId,
      date,
      validUntil,
      items: items.filter(item => item.description.trim() !== ''),
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      notes,
      terms,
      status: isDraft ? 'Draft' : (editingQuotation ? status : 'Sent'),
      paymentTermsType,
      milestones: paymentTermsType === 'Milestone' ? (milestones.length > 0 ? milestones : createStandard3Milestones(grandTotal)) : [],
    };

    if (editingQuotation) {
      onUpdateQuotation(quoteData);
    } else {
      onAddQuotation(quoteData);
    }
    setIsFormOpen(false);
  };

  const handleDuplicate = (q: Quotation) => {
    const duplicated: Quotation = {
      ...q,
      id: `quo-${Date.now()}`,
      number: generateQuotationNumber(),
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
    };
    onAddQuotation(duplicated);
    alert(`Quotation ${q.number} duplicated as draft ${duplicated.number}`);
  };

  const handleOpenChannel = (q: Quotation, method: 'Email' | 'WhatsApp') => {
    const cust = customers.find(c => c.id === q.customerId);
    if (method === 'WhatsApp') {
      setWaShareQuotation(q);
    } else {
      const text = `Subject: Project Quotation ${q.number}\n\nDear Client,\n\nWe are pleased to submit our commercial proposal ${q.number} for your review. The total proposal grand total is ₹${q.grandTotal.toFixed(2)}.\n\nBest Regards,\n${settings.companyName}`;
      window.open(`mailto:${cust?.email || ''}?subject=Quotation ${q.number}&body=${encodeURIComponent(text)}`, '_blank');
    }
    if (q.status === 'Draft') {
      onUpdateQuotation({ ...q, status: 'Sent' });
    }
  };

  // Filtering
  const filteredQuotations = quotations.filter((q) => {
    const cust = customers.find((c) => c.id === q.customerId);
    const matchesSearch =
      q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totals = calculateTotals();

  return (
    <div id="quotation-mgmt-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Quotation Management</h1>
          <p className="text-sm text-slate-500">Create commercial proposals, generate quotations, and convert them to invoices.</p>
        </div>
        {!isFormOpen && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => exportQuotationsToExcel(quotations, customers)}
              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-2.5 rounded-xl transition cursor-pointer shadow-2xs"
              title="Export all quotations to Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={openCreateForm}
              id="new-quotation-btn"
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm cursor-pointer animate-fade-in"
            >
              <Plus className="w-4 h-4" />
              <span>New Quotation</span>
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
                placeholder="Search quotations by number, client, company..."
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
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Quotations Table */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                    <th className="py-3 px-4">Quote No</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                        No quotations found. Click "New Quotation" to draft your first proposal.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => {
                      const cust = customers.find((c) => c.id === q.customerId);
                      const statusColors: { [key: string]: string } = {
                        Draft: 'bg-slate-100 text-slate-700 border-slate-200',
                        Sent: 'bg-blue-50 text-blue-700 border-blue-100',
                        Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
                        Expired: 'bg-amber-50 text-amber-700 border-amber-100',
                      };

                      return (
                        <tr key={q.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{q.number}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{cust?.name || 'Unknown Client'}</div>
                            <div className="text-xs text-slate-400">{cust?.companyName || 'Individual'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">
                            <div>Issued: {q.date}</div>
                            <div>Valid: {q.validUntil}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                            ₹{q.grandTotal.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold border ${statusColors[q.status] || ''}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Direct PDF Download */}
                              <button
                                onClick={async () => {
                                  try {
                                    const blob = await generateDocumentPDF({ type: 'quotation', data: q }, customers, settings);
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${q.number}.pdf`;
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
                                onClick={() => onSelectPrint({ type: 'quotation', data: q })}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                title="Print / PDF Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Duplicate */}
                              <button
                                onClick={() => handleDuplicate(q)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                title="Duplicate Proposal"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Convert to Invoice */}
                              {q.status === 'Approved' ? (
                                <button
                                  onClick={() => onConvertToInvoice(q)}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition flex items-center gap-0.5 text-xxs font-semibold px-1.5 py-0.5 border border-emerald-200"
                                  title="Convert to Live Invoice"
                                >
                                  <RefreshCw className="w-3 h-3 animate-pulse" />
                                  <span>Invoice</span>
                                </button>
                              ) : q.status === 'Sent' ? (
                                <button
                                  onClick={() => {
                                    onUpdateQuotation({ ...q, status: 'Approved' });
                                    alert(`Quotation ${q.number} marked as Approved. You can now convert it to an invoice.`);
                                  }}
                                  className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition flex items-center gap-0.5 text-xxs font-semibold px-1.5 py-0.5 border border-amber-200"
                                  title="Approve Proposal"
                                >
                                  <span>Approve</span>
                                </button>
                              ) : null}

                              {/* Channels */}
                              <button
                                onClick={() => handleOpenChannel(q, 'Email')}
                                className="p-1 text-slate-400 hover:text-blue-500 rounded"
                                title="Send Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenChannel(q, 'WhatsApp')}
                                className="p-1 text-slate-400 hover:text-emerald-500 rounded"
                                title="Send WhatsApp"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => openEditForm(q)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                title="Edit Quotation"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(`Delete Quotation ${q.number}?`)) {
                                    onDeleteQuotation(q.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 rounded"
                                title="Delete Quotation"
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
        /* Quotation Form (Creation & Editing) */
        <form onSubmit={(e) => handleSave(e, false)} className="bg-white rounded-xl border border-slate-100 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingQuotation ? `Edit Quotation ${quoNumber}` : `Create New Quotation: ${quoNumber}`}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full"
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
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Quotation Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Valid Until *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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

          {/* Terms & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Public Notes (appears on Quote)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for client..."
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Terms & Conditions</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, validity dates..."
                className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Payment Terms & Milestone Split */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Payment Terms & Milestones</span>
                <span className="text-xxs text-slate-500">Split project quotation into milestone payments (30% Advance / 40% Midway / 30% Final).</span>
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

          {editingQuotation && (
            <div className="w-48">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Proposal Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          )}

          {/* Ledger Calculation Breakdown Summary */}
          <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row md:justify-between items-end gap-4">
            <p className="text-xxs text-slate-400">All prices calculated according to Austin finance standard ledger definitions.</p>
            
            <div className="w-full md:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-700">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1.5 text-sm">
                <span>Grand Total:</span>
                <span className="text-indigo-600 font-mono">₹{totals.grandTotal.toFixed(2)}</span>
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
              type="button"
              onClick={(e) => handleSave(e, true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
            >
              {editingQuotation ? 'Update Proposal' : 'Save & Issue Quote'}
            </button>
          </div>
        </form>
      )}

      {/* WhatsApp Share Modal */}
      {waShareQuotation && (
        <WhatsAppShareModal
          docType="quotation"
          doc={waShareQuotation}
          customers={customers}
          settings={settings}
          onClose={() => setWaShareQuotation(null)}
        />
      )}
    </div>
  );
}
