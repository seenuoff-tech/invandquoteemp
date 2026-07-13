import React, { useState } from 'react';
import { Invoice, Customer, Quotation } from '../types';
import { Search, Filter, Calendar, Users, FileText, CheckCircle, HelpCircle, RefreshCw } from 'lucide-react';

interface FilterSystemProps {
  invoices: Invoice[];
  customers: Customer[];
}

export default function FilterSystem({ invoices, customers }: FilterSystemProps) {
  // Filter Fields State
  const [filterMonth, setFilterMonth] = useState<string>('All'); // '01' - '12'
  const [filterYear, setFilterYear] = useState<string>('All');  // '2025', '2026'
  const [filterCustomer, setFilterCustomer] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const months = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' },
  ];

  const years = ['2025', '2026', '2027'];

  // Presets
  const applyPresetJune2026Payments = () => {
    setFilterMonth('06');
    setFilterYear('2026');
    setFilterCustomer('All');
    setFilterStatus('All');
    setStartDate('');
    setEndDate('');
  };

  const applyPresetUnpaid2025 = () => {
    setFilterMonth('All');
    setFilterYear('2025');
    setFilterCustomer('All');
    setFilterStatus('Unpaid');
    setStartDate('');
    setEndDate('');
  };

  const resetFilters = () => {
    setFilterMonth('All');
    setFilterYear('All');
    setFilterCustomer('All');
    setFilterStatus('All');
    setStartDate('');
    setEndDate('');
  };

  // Perform filtering
  const filteredInvoices = invoices.filter((inv) => {
    // 1. Customer
    if (filterCustomer !== 'All' && inv.customerId !== filterCustomer) {
      return false;
    }

    // 2. Status
    if (filterStatus !== 'All' && inv.status !== filterStatus) {
      return false;
    }

    // 3. Date-based parsing
    const invYear = inv.date.split('-')[0];  // 'YYYY'
    const invMonth = inv.date.split('-')[1]; // 'MM'

    // Year Filter
    if (filterYear !== 'All' && invYear !== filterYear) {
      return false;
    }

    // Month Filter
    if (filterMonth !== 'All' && invMonth !== filterMonth) {
      return false;
    }

    // Custom Date Range
    if (startDate && inv.date < startDate) {
      return false;
    }
    if (endDate && inv.date > endDate) {
      return false;
    }

    return true;
  });

  // Calculate metrics for filtered invoices
  let filteredTotalBilled = 0;
  let filteredTotalPaid = 0;
  let filteredTotalBalance = 0;

  filteredInvoices.forEach((inv) => {
    filteredTotalBilled += inv.grandTotal;
    filteredTotalPaid += inv.paidAmount;
    filteredTotalBalance += inv.balance;
  });

  // Calculate Customer-wise Revenue breakdowns based on active filters
  const customerRevenue: { [key: string]: { name: string; billed: number; paid: number; pending: number } } = {};
  filteredInvoices.forEach((inv) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    const name = cust?.name || 'Unknown Client';
    const comp = cust?.companyName ? ` (${cust.companyName})` : '';
    const label = `${name}${comp}`;

    if (!customerRevenue[inv.customerId]) {
      customerRevenue[inv.customerId] = { name: label, billed: 0, paid: 0, pending: 0 };
    }
    customerRevenue[inv.customerId].billed += inv.grandTotal;
    customerRevenue[inv.customerId].paid += inv.paidAmount;
    customerRevenue[inv.customerId].pending += inv.balance;
  });

  return (
    <div id="filter-system-container" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Advanced Filter & Query Explorer</h1>
          <p className="text-sm text-slate-500">Run complex database queries, segment invoices, and review customer-wise metrics.</p>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-lg font-semibold hover:bg-indigo-100/60 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>

      {/* Quick Presets Panel */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap items-center gap-2.5 text-xs">
        <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Quick Filter Presets:</span>
        </span>
        <button
          onClick={applyPresetJune2026Payments}
          className="bg-white border border-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          Show June 2026 Payments
        </button>
        <button
          onClick={applyPresetUnpaid2025}
          className="bg-white border border-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          Show Unpaid Invoices in 2025
        </button>
      </div>

      {/* Filter Builder Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Month */}
        <div>
          <label className="block text-3xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Filter By Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
          >
            <option value="All">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="block text-3xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Filter By Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
          >
            <option value="All">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div>
          <label className="block text-3xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Filter By Customer</label>
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
          >
            <option value="All">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-3xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Custom Range */}
        <div className="md:col-span-2">
          <label className="block text-3xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Custom Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-3xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Custom End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2"
          />
        </div>
      </div>

      {/* Aggregates Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xxs text-center">
          <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Filtered Billed</p>
          <p className="text-lg font-bold text-slate-800 mt-1">₹{filteredTotalBilled.toFixed(2)}</p>
          <p className="text-3xxs text-slate-400">Sum of matched invoices</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xxs text-center">
          <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider text-emerald-600">Total Filtered Collected</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">₹{filteredTotalPaid.toFixed(2)}</p>
          <p className="text-3xxs text-slate-400">Sum of matched payments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xxs text-center">
          <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider text-rose-600">Total Filtered Receivable</p>
          <p className="text-lg font-bold text-rose-600 mt-1">₹{filteredTotalBalance.toFixed(2)}</p>
          <p className="text-3xxs text-slate-400">Sum of matched outstanding balances</p>
        </div>
      </div>

      {/* Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* matching invoices list */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Matching Invoices ({filteredInvoices.length})</span>
            </h3>
            <span className="text-3xxs text-slate-400 font-mono">Ledger output</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="py-2">Invoice No</th>
                  <th className="py-2">Client / Date</th>
                  <th className="py-2 text-right">Grand Total</th>
                  <th className="py-2 text-right">Outstanding</th>
                  <th className="py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No invoices found matching the current query filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const cust = customers.find((c) => c.id === inv.customerId);
                    const statusColors: { [key: string]: string } = {
                      Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-100',
                      Unpaid: 'bg-blue-50 text-blue-700 border-blue-100',
                      Overdue: 'bg-rose-50 text-rose-700 border-rose-100',
                    };
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 font-bold text-slate-800">{inv.number}</td>
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-700">{cust?.name || 'Unknown'}</div>
                          <div className="text-3xxs text-slate-400">{inv.date}</div>
                        </td>
                        <td className="py-2.5 text-right font-medium text-slate-700">
                          ₹{inv.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-600">
                          ₹{inv.balance.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-3xxs font-bold border ${statusColors[inv.status] || ''}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer-wise breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 lg:col-span-1">
          <div className="border-b border-slate-50 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Customer-Wise Revenue</span>
            </h3>
            <p className="text-3xxs text-slate-400">Billed vs. Paid distribution per client based on active filters.</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.keys(customerRevenue).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">No client revenue metrics to report.</div>
            ) : (
              Object.values(customerRevenue).map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="font-semibold text-slate-800 text-xxs truncate uppercase tracking-wider">{item.name}</div>
                  <div className="grid grid-cols-3 gap-1 text-center text-3xxs">
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <div className="text-slate-400">Billed</div>
                      <div className="font-bold text-slate-700">₹{item.billed.toFixed(2)}</div>
                    </div>
                    <div className="bg-emerald-50/55 p-1.5 rounded border border-emerald-100/30">
                      <div className="text-emerald-600">Collected</div>
                      <div className="font-bold text-emerald-700">₹{item.paid.toFixed(2)}</div>
                    </div>
                    <div className="bg-rose-50/55 p-1.5 rounded border border-rose-100/30">
                      <div className="text-rose-600">Pending</div>
                      <div className="font-bold text-rose-700">₹{item.pending.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
