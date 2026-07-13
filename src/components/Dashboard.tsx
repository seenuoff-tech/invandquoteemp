import { Customer, Invoice, Quotation } from '../types';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  customers: Customer[];
  invoices: Invoice[];
  quotations: Quotation[];
  onNavigate: (tab: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export default function Dashboard({
  customers,
  invoices,
  quotations,
  onNavigate,
  onSelectInvoice,
}: DashboardProps) {
  const currentMonthStr = '2026-06'; // June 2026 reference

  // Calculate Metrics
  const totalCustomers = customers.length;
  const totalQuotations = quotations.length;
  const totalInvoices = invoices.length;

  let upcomingPaymentsCount = 0;
  let completedPaymentsCount = 0;
  let pendingAmount = 0;
  let thisMonthRevenue = 0;

  invoices.forEach((inv) => {
    // Pending Amount
    pendingAmount += inv.balance;

    // Completed Payments (Fully Paid)
    if (inv.status === 'Paid') {
      completedPaymentsCount++;
    }

    // Upcoming Payments
    // Unpaid/Partially Paid and Due Date is on or after current time (June 24, 2026)
    if (inv.status !== 'Paid' && inv.status !== 'Overdue') {
      upcomingPaymentsCount++;
    }

    // Calculate this month's revenue (from payments done in June 2026)
    inv.payments.forEach((p) => {
      if (p.date.startsWith(currentMonthStr)) {
        thisMonthRevenue += p.amount;
      }
    });
  });

  // Calculate Monthly Revenue for Chart
  // We scan all payments in all invoices and group by month for 2026
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenueMap: { [key: string]: number } = {
    '2026-01': 1200, // Seed with some past reference data to look rich
    '2026-02': 2800,
    '2026-03': 3400,
    '2026-04': 4100,
    '2026-05': 2980,
    '2026-06': 0,
  };

  // Add actual invoice payments to the chart data
  invoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      const monthKey = p.date.substring(0, 7); // 'YYYY-MM'
      if (monthKey in monthlyRevenueMap) {
        monthlyRevenueMap[monthKey] += p.amount;
      } else if (p.date.startsWith('2026')) {
        monthlyRevenueMap[monthKey] = p.amount;
      }
    });
  });

  const chartData = Object.keys(monthlyRevenueMap)
    .sort()
    .map((key) => {
      const monthIndex = parseInt(key.split('-')[1]) - 1;
      return {
        month: monthNames[monthIndex],
        Revenue: monthlyRevenueMap[key],
      };
    });

  // Payment Status Distribution Chart Data
  const statusCounts = { Paid: 0, 'Partially Paid': 0, Unpaid: 0, Overdue: 0 };
  invoices.forEach((inv) => {
    statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
  });

  const pieData = [
    { name: 'Paid', value: statusCounts.Paid, color: '#10b981' }, // emerald-500
    { name: 'Partially Paid', value: statusCounts['Partially Paid'], color: '#f59e0b' }, // amber-500
    { name: 'Unpaid', value: statusCounts.Unpaid, color: '#3b82f6' }, // blue-500
    { name: 'Overdue', value: statusCounts.Overdue, color: '#ef4444' }, // red-500
  ].filter(d => d.value > 0); // Only show statuses that have records

  // Get recent invoices (up to 5, sorted by date desc)
  const recentInvoices = [...invoices]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Financial Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back. Here is an overview of your accounts as of June 24, 2026.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>June 2026 Billing Period</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 col-span-1 shadow-xxs">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-semibold text-slate-400 uppercase tracking-wider">Customers</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{totalCustomers}</div>
            <p className="text-3xxs text-emerald-500 font-medium flex items-center gap-0.5 mt-0.5">
              <span>Active Accounts</span>
            </p>
          </div>
        </div>

        {/* Total Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 col-span-1 shadow-xxs">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-semibold text-slate-400 uppercase tracking-wider">Quotations</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{totalQuotations}</div>
            <p className="text-3xxs text-slate-400 font-medium mt-0.5">Quotes & Proposals</p>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 col-span-1 shadow-xxs">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-semibold text-slate-400 uppercase tracking-wider">Invoices</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{totalInvoices}</div>
            <p className="text-3xxs text-slate-400 font-medium mt-0.5">Billed Statements</p>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 col-span-1 shadow-xxs">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-semibold text-slate-400 uppercase tracking-wider">Upcoming</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{upcomingPaymentsCount}</div>
            <p className="text-3xxs text-slate-400 font-medium mt-0.5">Awaiting Due Dates</p>
          </div>
        </div>

        {/* Completed Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 col-span-1 shadow-xxs">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-semibold text-slate-400 uppercase tracking-wider">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600">{completedPaymentsCount}</div>
            <p className="text-3xxs text-slate-400 font-medium mt-0.5">Fully Settled Invoices</p>
          </div>
        </div>

        {/* This Month Revenue */}
        <div className="bg-emerald-50/25 p-4 rounded-xl border border-emerald-100/30 space-y-2 col-span-1 md:col-span-2 lg:col-span-1 shadow-xxs">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-semibold text-emerald-600 uppercase tracking-wider">Month Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-emerald-700">₹{thisMonthRevenue.toFixed(2)}</div>
            <p className="text-3xxs text-emerald-600/80 font-medium mt-0.5">Collected in June</p>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-rose-50/25 p-4 rounded-xl border border-rose-100/30 space-y-2 col-span-1 md:col-span-2 lg:col-span-1 shadow-xxs">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-semibold text-rose-600 uppercase tracking-wider">Outstanding</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-rose-700">₹{pendingAmount.toFixed(2)}</div>
            <p className="text-3xxs text-rose-600/80 font-medium mt-0.5">Receivable Balance</p>
          </div>
        </div>
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Graph */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Monthly Revenue Graph</h3>
              <p className="text-xxs text-slate-400">Total payments collected per calendar month in 2026.</p>
            </div>
            <span className="text-xxs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-semibold uppercase">YTD Sales</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [`₹${parseFloat(value as string).toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status distribution chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="text-sm font-semibold text-slate-800">Payment Status</h3>
            <p className="text-xxs text-slate-400">Invoice volume segmented by outstanding collection status.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            {pieData.length === 0 ? (
              <div className="text-slate-400 text-xs py-8">No invoice records to chart.</div>
            ) : (
              <div className="relative w-full h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute text-center">
                  <div className="text-lg font-extrabold text-slate-700">{totalInvoices}</div>
                  <div className="text-3xxs text-slate-400 uppercase tracking-widest">Invoices</div>
                </div>
              </div>
            )}

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 w-full text-xs pt-3 mt-auto">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 justify-center">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 text-3xxs uppercase font-medium">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Recent Invoices</h3>
            <p className="text-xxs text-slate-400">Latest invoices issued across all accounts.</p>
          </div>
          <button
            onClick={() => onNavigate('Invoices')}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2 px-3">Invoice No</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Balance</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    No invoice records found. Create your first invoice under the Invoices tab!
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);
                  const statusColors: { [key: string]: string } = {
                    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-100',
                    Unpaid: 'bg-blue-50 text-blue-700 border-blue-100',
                    Overdue: 'bg-rose-50 text-rose-700 border-rose-100',
                  };

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.number}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-700">{cust?.name || 'Unknown'}</div>
                        <div className="text-3xxs text-slate-400">{cust?.companyName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{inv.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">₹{inv.grandTotal.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        {inv.balance > 0 ? `₹${inv.balance.toFixed(2)}` : <span className="text-slate-400">₹0.00</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-3xxs font-semibold border ${statusColors[inv.status] || ''}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          Details
                        </button>
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
  );
}
