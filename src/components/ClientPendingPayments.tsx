import React, { useState, useMemo } from 'react';
import { Invoice, Customer, ManualPendingEntry } from '../types';
import { Lock, AlertCircle, Search, IndianRupee, MessageCircle, FileText, CheckCircle2, Clock, Users, ArrowUpRight, ShieldCheck, Plus, Trash2, Download } from 'lucide-react';
import { exportClientPendingsToExcel } from '../utils/excelExporter';

interface ClientPendingPaymentsProps {
  invoices: Invoice[];
  customers: Customer[];
  manualPendings: ManualPendingEntry[];
  onAddManualPending: (entry: ManualPendingEntry) => void;
  onDeleteManualPending: (id: string) => void;
  pendingPaymentsPin: string;
}

export default function ClientPendingPayments({
  invoices,
  customers,
  manualPendings = [],
  onAddManualPending,
  onDeleteManualPending,
  pendingPaymentsPin = '2025',
}: ClientPendingPaymentsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Manual Pending Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    customerId: '',
    clientName: '',
    mobile: '',
    totalAmount: 0,
    paidAmount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Today string for overdue checking
  const todayStr = new Date().toISOString().split('T')[0];

  // Handle PIN Submission
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === pendingPaymentsPin) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Handle Manual Entry Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFormData.clientName.trim()) {
      alert('Please provide a Client Name.');
      return;
    }
    const balance = Math.max(0, manualFormData.totalAmount - manualFormData.paidAmount);
    const newEntry: ManualPendingEntry = {
      id: `man-pend-${Date.now()}`,
      customerId: manualFormData.customerId || undefined,
      clientName: manualFormData.clientName,
      mobile: manualFormData.mobile,
      totalAmount: Number(manualFormData.totalAmount),
      paidAmount: Number(manualFormData.paidAmount),
      balanceAmount: balance,
      dueDate: manualFormData.dueDate,
      notes: manualFormData.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };
    onAddManualPending(newEntry);
    setIsManualModalOpen(false);
    setManualFormData({
      customerId: '',
      clientName: '',
      mobile: '',
      totalAmount: 0,
      paidAmount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  // Group invoices AND manual pendings per customer & compute metrics
  const clientPendingData = useMemo(() => {
    const customerMap = new Map<string, {
      customer: Customer;
      invoices: Invoice[];
      manualEntries: ManualPendingEntry[];
      totalInvoiced: number;
      totalPaid: number;
      pendingBalance: number;
      unpaidCount: number;
      overdueCount: number;
      overdueBalance: number;
    }>();

    // Initialize existing customers
    customers.forEach((c) => {
      customerMap.set(c.id, {
        customer: c,
        invoices: [],
        manualEntries: [],
        totalInvoiced: 0,
        totalPaid: 0,
        pendingBalance: 0,
        unpaidCount: 0,
        overdueCount: 0,
        overdueBalance: 0,
      });
    });

    // Populate with invoice data
    invoices.forEach((inv) => {
      let entry = customerMap.get(inv.customerId);
      if (!entry) {
        const fallbackCustomer: Customer = {
          id: inv.customerId,
          name: `Client #${inv.customerId.slice(-4)}`,
          companyName: '',
          mobile: '',
          email: '',
          billingAddress: '',
          shippingAddress: '',
          createdAt: inv.date,
        };
        entry = {
          customer: fallbackCustomer,
          invoices: [],
          manualEntries: [],
          totalInvoiced: 0,
          totalPaid: 0,
          pendingBalance: 0,
          unpaidCount: 0,
          overdueCount: 0,
          overdueBalance: 0,
        };
        customerMap.set(inv.customerId, entry);
      }

      entry.invoices.push(inv);
      entry.totalInvoiced += inv.grandTotal;
      entry.totalPaid += inv.paidAmount;
      const bal = inv.balance > 0 ? inv.balance : (inv.grandTotal - inv.paidAmount);
      
      if (inv.status !== 'Paid' && bal > 0) {
        entry.pendingBalance += bal;
        entry.unpaidCount += 1;

        if (inv.dueDate < todayStr || inv.status === 'Overdue') {
          entry.overdueCount += 1;
          entry.overdueBalance += bal;
        }
      }
    });

    // Populate with manual pendings data
    manualPendings.forEach((m) => {
      const key = m.customerId || `manual-${m.clientName.toLowerCase().trim()}`;
      let entry = customerMap.get(key);
      if (!entry) {
        const manualCustomer: Customer = {
          id: key,
          name: m.clientName,
          companyName: 'Manual Ledger Record',
          mobile: m.mobile || '',
          email: '',
          billingAddress: '',
          shippingAddress: '',
          createdAt: m.createdAt,
        };
        entry = {
          customer: manualCustomer,
          invoices: [],
          manualEntries: [],
          totalInvoiced: 0,
          totalPaid: 0,
          pendingBalance: 0,
          unpaidCount: 0,
          overdueCount: 0,
          overdueBalance: 0,
        };
        customerMap.set(key, entry);
      }

      entry.manualEntries.push(m);
      entry.totalInvoiced += m.totalAmount;
      entry.totalPaid += m.paidAmount;
      if (m.balanceAmount > 0) {
        entry.pendingBalance += m.balanceAmount;
        entry.unpaidCount += 1;

        if (m.dueDate && m.dueDate < todayStr) {
          entry.overdueCount += 1;
          entry.overdueBalance += m.balanceAmount;
        }
      }
    });

    const list = Array.from(customerMap.values()).filter((item) => item.pendingBalance > 0);
    list.sort((a, b) => b.pendingBalance - a.pendingBalance);

    return list;
  }, [invoices, customers, manualPendings, todayStr]);

  // High-level Overall Totals
  const overallTotals = useMemo(() => {
    let totalPending = 0;
    let totalOverdue = 0;
    let overdueInvoiceCount = 0;
    let totalUnpaidInvoices = 0;

    clientPendingData.forEach((item) => {
      totalPending += item.pendingBalance;
      totalOverdue += item.overdueBalance;
      overdueInvoiceCount += item.overdueCount;
      totalUnpaidInvoices += item.unpaidCount;
    });

    return {
      totalPending,
      clientsWithPending: clientPendingData.length,
      totalOverdue,
      overdueInvoiceCount,
      totalUnpaidInvoices,
    };
  }, [clientPendingData]);

  // Filtered Client Pending Data based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clientPendingData;
    const term = searchTerm.toLowerCase();
    return clientPendingData.filter((item) => 
      item.customer.name.toLowerCase().includes(term) ||
      item.customer.companyName?.toLowerCase().includes(term) ||
      item.customer.mobile?.includes(term)
    );
  }, [clientPendingData, searchTerm]);

  // WhatsApp Reminder Generator
  const sendWhatsAppReminder = (customer: Customer, pendingBalance: number, overdueInvoicesCount: number) => {
    if (!customer.mobile) {
      alert('No mobile number available for this client.');
      return;
    }
    const cleanPhone = customer.mobile.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `Hello ${customer.name},\n\nThis is a friendly reminder regarding your pending payment of ₹${pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.` +
      (overdueInvoicesCount > 0 ? `\n\n⚠️ You have ${overdueInvoicesCount} overdue invoice(s).` : '') +
      `\n\nKindly request you to settle the outstanding balance at your earliest convenience. Thank you!\n\nRegards,\nAccounts Team`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodedMsg}`, '_blank');
  };

  // If NOT authenticated, render Security PIN Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">Security Authorization Required</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter the security PIN to access the <span className="font-semibold text-slate-700">Client Pending Payments</span> confidential ledger.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter Security PIN"
                className={`w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 rounded-xl border ${
                  pinError ? 'border-rose-500 bg-rose-50/50 text-rose-700' : 'border-slate-200 focus:border-[#0439C5]'
                } focus:outline-none transition shadow-inner`}
                autoFocus
              />
              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs font-semibold mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid Security PIN. Please try again.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#0439C5] hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Unlock Pending Payments</span>
            </button>
          </form>

          <p className="text-3xxs text-slate-400">
            Default Security PIN is <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">2025</code>. Can be updated in Admin Settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Client Pending Payments</h1>
            <span className="bg-emerald-50 text-emerald-700 text-3xxs font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> PIN Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time client-wise outstanding balance tracking, manual ledger entries, and WhatsApp payment reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportClientPendingsToExcel(invoices, customers, manualPendings)}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
            title="Export all client pending balances to Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export to Excel</span>
          </button>

          {/* Add Manual Entry Button */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="bg-[#0439C5] hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Entry</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pending Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pending Balance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            ₹{overallTotals.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-3xxs text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Outstanding receivables from clients
          </p>
        </div>

        {/* Clients with Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clients with Dues</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{overallTotals.clientsWithPending}</p>
          <p className="text-3xxs text-blue-600 font-semibold mt-1">
            {overallTotals.totalUnpaidInvoices} pending invoice/manual entry(s)
          </p>
        </div>

        {/* Total Overdue Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Balance</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-3">
            ₹{overallTotals.totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-3xxs text-rose-600 font-semibold mt-1">
            {overallTotals.overdueInvoiceCount} overdue record(s) breach due date
          </p>
        </div>

        {/* Active Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manual Entries</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{manualPendings.length}</p>
          <p className="text-3xxs text-emerald-600 font-semibold mt-1">
            Manually logged payment balance records
          </p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-5">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, company, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5] focus:bg-white transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
            Showing <span className="font-bold text-slate-800">{filteredClients.length}</span> client(s) with pending balances
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Client / Company</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Unpaid Records</th>
                <th className="py-3 px-4 text-right">Total Payment</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="font-bold text-slate-700 text-sm">No Pending Client Payments Found</p>
                      <p className="text-xs text-slate-400">All clients have paid their invoices or no clients match your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((item) => {
                  const hasOverdue = item.overdueCount > 0;
                  return (
                    <tr key={item.customer.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-bold text-slate-800">{item.customer.name}</div>
                        {item.customer.companyName && (
                          <div className="text-3xxs text-slate-400">{item.customer.companyName}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-mono text-3xxs text-slate-700">{item.customer.mobile || 'No Mobile'}</div>
                        <div className="text-3xxs text-slate-400 truncate max-w-40">{item.customer.email || 'No Email'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {item.unpaidCount} Pending
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        ₹{item.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                        ₹{item.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                        ₹{item.pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {hasOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> {item.overdueCount} Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedCustomer(item.customer)}
                            className="p-1.5 text-slate-600 hover:text-[#0439C5] bg-slate-100 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="View Breakdown"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => sendWhatsAppReminder(item.customer, item.pendingBalance, item.overdueCount)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                            title="Send WhatsApp Payment Reminder"
                          >
                            <MessageCircle className="w-4 h-4" />
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

      {/* Manual Pending Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>Manual Pending Entry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Record a custom client payment balance</p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Existing Client (Optional)</label>
                <select
                  value={manualFormData.customerId}
                  onChange={(e) => {
                    const custId = e.target.value;
                    const found = customers.find((c) => c.id === custId);
                    setManualFormData((prev) => ({
                      ...prev,
                      customerId: custId,
                      clientName: found ? found.name : prev.clientName,
                      mobile: found ? found.mobile : prev.mobile,
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                >
                  <option value="">-- Choose Existing Client or Enter Below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Enterprises"
                  value={manualFormData.clientName}
                  onChange={(e) => setManualFormData({ ...manualFormData, clientName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile / WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={manualFormData.mobile}
                  onChange={(e) => setManualFormData({ ...manualFormData, mobile: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Payment (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="10000"
                    value={manualFormData.totalAmount || ''}
                    onChange={(e) => setManualFormData({ ...manualFormData, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2000"
                    value={manualFormData.paidAmount || ''}
                    onChange={(e) => setManualFormData({ ...manualFormData, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase">Calculated Balance:</span>
                <span className="text-sm font-black text-rose-600">
                  ₹{Math.max(0, manualFormData.totalAmount - manualFormData.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={manualFormData.dueDate}
                  onChange={(e) => setManualFormData({ ...manualFormData, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Particulars</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or contract notes..."
                  value={manualFormData.notes}
                  onChange={(e) => setManualFormData({ ...manualFormData, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0439C5] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Manual Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Invoice Breakdown Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>{selectedCustomer.name}</span>
                  {selectedCustomer.companyName && (
                    <span className="text-xs font-normal text-slate-300">({selectedCustomer.companyName})</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Pending Invoice & Manual Entry Ledger Breakdown</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoices & Manual Records</h4>

              <div className="space-y-3">
                {/* System Invoices */}
                {invoices
                  .filter(
                    (inv) =>
                      inv.customerId === selectedCustomer.id &&
                      (inv.status !== 'Paid' || inv.balance > 0)
                  )
                  .map((inv) => {
                    const isOverdue = inv.dueDate < todayStr || inv.status === 'Overdue';
                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 text-sm">{inv.number}</span>
                            <span className="bg-blue-50 text-blue-700 text-3xxs font-bold px-2 py-0.5 rounded-full border border-blue-200">Invoice</span>
                            {isOverdue && (
                              <span className="bg-rose-50 text-rose-700 text-3xxs font-bold px-2 py-0.5 rounded-full border border-rose-200">Overdue</span>
                            )}
                          </div>
                          <div className="text-3xxs text-slate-500 mt-1 flex items-center gap-3">
                            <span>Issue Date: <strong>{inv.date}</strong></span>
                            <span>Due Date: <strong className={isOverdue ? 'text-rose-600 font-bold' : ''}>{inv.dueDate}</strong></span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xxs text-slate-400">Total: ₹{inv.grandTotal.toFixed(2)} | Paid: ₹{inv.paidAmount.toFixed(2)}</div>
                          <div className="text-sm font-black text-rose-600">Balance: ₹{inv.balance.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}

                {/* Manual Pending Records */}
                {manualPendings
                  .filter(
                    (m) =>
                      m.customerId === selectedCustomer.id ||
                      m.clientName.toLowerCase().trim() === selectedCustomer.name.toLowerCase().trim()
                  )
                  .map((m) => {
                    const isOverdue = m.dueDate && m.dueDate < todayStr;
                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:border-amber-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 text-sm">MANUAL RECORD</span>
                            <span className="bg-amber-100 text-amber-800 text-3xxs font-bold px-2 py-0.5 rounded-full border border-amber-300">Manual Entry</span>
                            {isOverdue && (
                              <span className="bg-rose-50 text-rose-700 text-3xxs font-bold px-2 py-0.5 rounded-full border border-rose-200">Overdue</span>
                            )}
                          </div>
                          {m.notes && <p className="text-xs text-slate-600 mt-1 italic">{m.notes}</p>}
                          <div className="text-3xxs text-slate-500 mt-1 flex items-center gap-3">
                            <span>Created: <strong>{m.createdAt}</strong></span>
                            {m.dueDate && <span>Due Date: <strong className={isOverdue ? 'text-rose-600 font-bold' : ''}>{m.dueDate}</strong></span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-3xxs text-slate-400">Total: ₹{m.totalAmount.toFixed(2)} | Paid: ₹{m.paidAmount.toFixed(2)}</div>
                            <div className="text-sm font-black text-rose-600">Balance: ₹{m.balanceAmount.toFixed(2)}</div>
                          </div>

                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this manual pending entry?')) {
                                onDeleteManualPending(m.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                            title="Delete Manual Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Click WhatsApp Reminder on table row to send alert.</span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
