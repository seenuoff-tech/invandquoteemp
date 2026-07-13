import { Invoice, Customer } from '../types';
import { Clock, CheckCircle, Calendar, ArrowDownRight, ArrowUpRight, IndianRupee, ListFilter } from 'lucide-react';

interface PaymentTrackingProps {
  invoices: Invoice[];
  customers: Customer[];
}

export default function PaymentTracking({ invoices, customers }: PaymentTrackingProps) {
  const currentTodayStr = '2026-06-24'; // System baseline date
  const currentMonthStr = '2026-06';   // June 2026

  // 1. Upcoming Payments: Invoices with status !== 'Paid' where due date is >= today, or status 'Unpaid'/'Partially Paid' and due date hasn't been breached.
  // Wait, let's look at the requirement: "Show invoices with due date not reached and unpaid."
  const upcomingInvoices = invoices.filter((inv) => {
    return inv.status !== 'Paid' && inv.status !== 'Overdue' && inv.dueDate >= currentTodayStr;
  });

  // Calculate days left relative to June 24, 2026
  const getDaysLeft = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date(currentTodayStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  // 2. Completed Payments: Fully paid invoices.
  const completedInvoices = invoices.filter((inv) => inv.status === 'Paid');

  // Gather all payments that occurred in the current month (June 2026) across ALL invoices
  const thisMonthPayments: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    date: string;
    method: string;
  }> = [];

  let totalReceivedThisMonth = 0;
  let pendingAmountOverall = 0;

  invoices.forEach((inv) => {
    // Collect all outstanding balance
    pendingAmountOverall += inv.balance;

    const cust = customers.find((c) => c.id === inv.customerId);
    inv.payments.forEach((p) => {
      if (p.date.startsWith(currentMonthStr)) {
        totalReceivedThisMonth += p.amount;
        thisMonthPayments.push({
          id: p.id,
          invoiceNumber: inv.number,
          customerName: cust?.name || 'Unknown Client',
          amount: p.amount,
          date: p.date,
          method: p.method,
        });
      }
    });
  });

  const numPaymentsThisMonth = thisMonthPayments.length;

  return (
    <div id="payment-tracking-container" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Payment & Collection Tracking</h1>
        <p className="text-sm text-slate-500">Track incoming invoices, verify bank receipt settlements, and audit this month's collections.</p>
      </div>

      {/* Metrics Row for This Month Payments */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm border-b border-slate-200/60 pb-2">
          <Calendar className="w-4.5 h-4.5 text-indigo-500" />
          <span>June 2026 Collection Summary</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Received (This Month)</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">₹{totalReceivedThisMonth.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-full text-emerald-500">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Number of Payments Recd</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{numPaymentsThisMonth}</p>
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

      {/* Ledger 3: June 2026 Collection Log */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xxs">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>June 2026 Received Payments Log</span>
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
              {thisMonthPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No payment collections logged during this month of June 2026.
                  </td>
                </tr>
              ) : (
                thisMonthPayments.map((p) => (
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
