import { useState } from 'react';
import { Invoice, Customer } from '../types';
import { Clock, CheckCircle, Calendar, ArrowDownRight, ArrowUpRight, IndianRupee, Filter } from 'lucide-react';

interface PaymentTrackingProps {
  invoices: Invoice[];
  customers: Customer[];
}

export default function PaymentTracking({ invoices, customers }: PaymentTrackingProps) {
  const now = new Date();
  const currentTodayStr = now.toISOString().split('T')[0];
  
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));

  const filterMonthStr = `${selectedYear}-${selectedMonth}`; // e.g. "2026-08"
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const selectedMonthName = `${monthNames[parseInt(selectedMonth, 10) - 1]} ${selectedYear}`;

  // 1. Upcoming Payments: Invoices with status !== 'Paid' where due date is >= today, or status 'Unpaid'/'Partially Paid' and due date hasn't been breached.
  const upcomingInvoices = invoices.filter((inv) => {
    return inv.status !== 'Paid' && inv.status !== 'Overdue' && inv.dueDate >= currentTodayStr;
  });

  // Calculate days left relative to current today
  const getDaysLeft = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date(currentTodayStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  // 2. Completed Payments: Fully paid invoices.
  const completedInvoices = invoices.filter((inv) => inv.status === 'Paid');

  // Gather all payments that occurred in the filtered month/year across ALL invoices
  const filteredMonthPayments: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    date: string;
    method: string;
  }> = [];

  let totalReceivedFilteredMonth = 0;
  let pendingAmountOverall = 0;

  invoices.forEach((inv) => {
    // Collect all outstanding balance
    pendingAmountOverall += inv.balance;

    const cust = customers.find((c) => c.id === inv.customerId);

    if (inv.payments && inv.payments.length > 0) {
      inv.payments.forEach((p) => {
        if (p.date && p.date.startsWith(filterMonthStr)) {
          totalReceivedFilteredMonth += p.amount;
          filteredMonthPayments.push({
            id: p.id,
            invoiceNumber: inv.number,
            customerName: cust?.name || 'Unknown Client',
            amount: p.amount,
            date: p.date,
            method: p.method,
          });
        }
      });
    } else if (inv.paidAmount > 0 && inv.date && inv.date.startsWith(filterMonthStr)) {
      // Fallback: If paidAmount > 0 but payments log array is empty or lacks dates
      totalReceivedFilteredMonth += inv.paidAmount;
      filteredMonthPayments.push({
        id: `pay-${inv.id}`,
        invoiceNumber: inv.number,
        customerName: cust?.name || 'Unknown Client',
        amount: inv.paidAmount,
        date: inv.date,
        method: 'Bank Transfer',
      });
    }
  });

  const numPaymentsFilteredMonth = filteredMonthPayments.length;

  return (
    <div id="payment-tracking-container" className="space-y-6">
      {/* Header with Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Payment & Collection Tracking</h1>
          <p className="text-sm text-slate-500">Track incoming invoices, verify bank receipt settlements, and audit collections by month & year.</p>
        </div>

        {/* Month & Year Filter Bar */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <Filter className="w-4 h-4 text-indigo-500 ml-1" />
          <span className="text-xs font-bold text-slate-600">Filter:</span>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
        </div>
      </div>

      {/* Metrics Row for Filtered Month Payments */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Calendar className="w-4.5 h-4.5 text-indigo-500" />
            <span>{selectedMonthName} Collection Summary</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Received ({selectedMonthName})</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">₹{totalReceivedFilteredMonth.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-full text-emerald-500">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Number of Payments Recd</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{numPaymentsFilteredMonth}</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-full text-indigo-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Pending Balance</p>
              <p className="text-xl font-extrabold text-rose-600 mt-1">₹{pendingAmountOverall.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-rose-50 rounded-full text-rose-500">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ledger 1: Upcoming Payments */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xxs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Upcoming Receivables</span>
            </h3>
            <span className="text-xxs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
              {upcomingInvoices.length} Invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="py-2">Invoice No</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2 text-right">Amount Due</th>
                  <th className="py-2 text-center">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcomingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      No upcoming invoices. All due dates are cleared or overdue.
                    </td>
                  </tr>
                ) : (
                  upcomingInvoices.map((inv) => {
                    const cust = customers.find((c) => c.id === inv.customerId);
                    const daysLeft = getDaysLeft(inv.dueDate);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 font-semibold text-slate-800">{inv.number}</td>
                        <td className="py-2.5">
                          <div className="font-medium text-slate-700">{cust?.name || 'Unknown'}</div>
                          <div className="text-3xxs text-slate-400">{cust?.companyName}</div>
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-700">
                          ₹{inv.balance.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-3xxs font-bold ${
                            daysLeft <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {daysLeft} days left
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

        {/* Ledger 2: Completed Payments (Fully Paid) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xxs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Completed Settlements</span>
            </h3>
            <span className="text-xxs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
              {completedInvoices.length} Fully Paid
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="py-2">Invoice No</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2 text-right">Settled Amount</th>
                  <th className="py-2 text-center">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {completedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      No fully paid invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  completedInvoices.map((inv) => {
                    const cust = customers.find((c) => c.id === inv.customerId);
                    // Get the last payment method used
                    const method = inv.payments[inv.payments.length - 1]?.method || 'Bank Transfer';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 font-semibold text-slate-800">{inv.number}</td>
                        <td className="py-2.5">
                          <div className="font-medium text-slate-700">{cust?.name || 'Unknown'}</div>
                          <div className="text-3xxs text-slate-400">{cust?.companyName}</div>
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">
                          ₹{inv.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center text-slate-500 font-medium">
                          {method}
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

      {/* Ledger 3: Received Payments Log */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xxs">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>{selectedMonthName} Received Payments Log</span>
          </h3>
          <span className="text-xxs text-slate-400 font-medium">Real-time collections</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="py-2">Receipt Date</th>
                <th className="py-2">Invoice Ref</th>
                <th className="py-2">Payer / Client</th>
                <th className="py-2">Settlement Channel</th>
                <th className="py-2 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMonthPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No payment collections logged during {selectedMonthName}.
                  </td>
                </tr>
              ) : (
                filteredMonthPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 font-medium text-slate-600">{p.date}</td>
                    <td className="py-2.5 font-bold text-slate-800">{p.invoiceNumber}</td>
                    <td className="py-2.5 text-slate-700 font-medium">{p.customerName}</td>
                    <td className="py-2.5 text-slate-500">{p.method}</td>
                    <td className="py-2.5 text-right font-extrabold text-emerald-600">
                      +₹{p.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
