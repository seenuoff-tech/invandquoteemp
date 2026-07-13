import React, { useState } from 'react';
import { Invoice, Customer } from '../types';
import { FileText, Download, Printer, BarChart2, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface ReportsProps {
  invoices: Invoice[];
  customers: Customer[];
}

type ReportType = 'monthly' | 'pending' | 'customer' | 'yearly';

export default function Reports({ invoices, customers }: ReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('monthly');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // --- Dynamic Report Calculations ---

  // 1. Monthly Revenue Report: Groups payments received by month
  const getMonthlyRevenueReport = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const reportData = monthNames.map((name, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const targetMonthKey = `${selectedYear}-${monthNum}`;

      let totalCollected = 0;
      let paymentCount = 0;

      invoices.forEach((inv) => {
        inv.payments.forEach((p) => {
          if (p.date.startsWith(targetMonthKey)) {
            totalCollected += p.amount;
            paymentCount++;
          }
        });
      });

      return {
        month: name,
        key: targetMonthKey,
        collected: totalCollected,
        volume: paymentCount,
      };
    }).filter(row => row.collected > 0 || row.volume > 0); // show only months with activity

    return reportData;
  };

  // 2. Pending Payment Report: Gathers all invoices that are unpaid or overdue
  const getPendingPaymentsReport = () => {
    return invoices
      .filter((inv) => inv.balance > 0)
      .map((inv) => {
        const cust = customers.find((c) => c.id === inv.customerId);
        return {
          invoiceNo: inv.number,
          client: cust?.name || 'Unknown',
          company: cust?.companyName || 'Individual',
          dueDate: inv.dueDate,
          totalAmount: inv.grandTotal,
          balance: inv.balance,
          status: inv.status,
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  };

  // 3. Customer-wise Sales Report: Billed, Collected, and Balance per Customer
  const getCustomerSalesReport = () => {
    return customers.map((c) => {
      const custInvoices = invoices.filter((inv) => inv.customerId === c.id);
      
      let totalBilled = 0;
      let totalCollected = 0;
      let totalPending = 0;

      custInvoices.forEach((inv) => {
        totalBilled += inv.grandTotal;
        totalCollected += inv.paidAmount;
        totalPending += inv.balance;
      });

      return {
        customerName: c.name,
        company: c.companyName || 'Individual',
        invoiceCount: custInvoices.length,
        billed: totalBilled,
        collected: totalCollected,
        pending: totalPending,
      };
    }).filter(row => row.invoiceCount > 0);
  };

  // 4. Yearly Report: Aggregates figures on a yearly basis
  const getYearlyReport = () => {
    const years = ['2025', '2026', '2027'];
    return years.map((yr) => {
      let billed = 0;
      let collected = 0;
      let outstanding = 0;
      let invoiceCount = 0;

      invoices.forEach((inv) => {
        if (inv.date.startsWith(yr)) {
          invoiceCount++;
          billed += inv.grandTotal;
          collected += inv.paidAmount;
          outstanding += inv.balance;
        }
      });

      return {
        year: yr,
        invoiceCount,
        billed,
        collected,
        outstanding,
      };
    }).filter(row => row.invoiceCount > 0);
  };

  // --- CSV Export Generation Function ---
  const handleExportCSV = (reportType: ReportType) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    if (reportType === 'monthly') {
      filename = `Monthly_Revenue_Report_${selectedYear}.csv`;
      headers = ['Month', 'Collections Received (INR)', 'Receipts Count'];
      rows = getMonthlyRevenueReport().map(row => [row.month, row.collected.toFixed(2), row.volume]);
    } else if (reportType === 'pending') {
      filename = 'Outstanding_Receivables_Report.csv';
      headers = ['Invoice Number', 'Customer', 'Company', 'Due Date', 'Total Amount (INR)', 'Pending Balance (INR)', 'Status'];
      rows = getPendingPaymentsReport().map(row => [
        row.invoiceNo,
        row.client,
        row.company,
        row.dueDate,
        row.totalAmount.toFixed(2),
        row.balance.toFixed(2),
        row.status
      ]);
    } else if (reportType === 'customer') {
      filename = 'Customer_Sales_Ledger.csv';
      headers = ['Customer Name', 'Company Name', 'Invoices Issued', 'Total Billed (INR)', 'Total Collected (INR)', 'Total Outstanding (INR)'];
      rows = getCustomerSalesReport().map(row => [
        row.customerName,
        row.company,
        row.invoiceCount,
        row.billed.toFixed(2),
        row.collected.toFixed(2),
        row.pending.toFixed(2)
      ]);
    } else if (reportType === 'yearly') {
      filename = 'Yearly_Accounts_Summary.csv';
      headers = ['Year', 'Invoices Count', 'Billed Revenue (INR)', 'Collected Revenue (INR)', 'Outstanding Receivable (INR)'];
      rows = getYearlyReport().map(row => [
        row.year,
        row.invoiceCount,
        row.billed.toFixed(2),
        row.collected.toFixed(2),
        row.outstanding.toFixed(2)
      ]);
    }

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="reports-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Financial Reports</h1>
          <p className="text-sm text-slate-500">Analyze monthly trends, audit pending payment balances, and compile annual accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV(activeReport)}
            className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV(activeReport)}
            className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Print Report Statement"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reports Navigation Bar */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 rounded-lg max-w-xl">
        <button
          onClick={() => setActiveReport('monthly')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
            activeReport === 'monthly' ? 'bg-white text-slate-800 shadow-xxs border border-slate-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Monthly Revenue
        </button>
        <button
          onClick={() => setActiveReport('pending')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
            activeReport === 'pending' ? 'bg-white text-slate-800 shadow-xxs border border-slate-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Payments
        </button>
        <button
          onClick={() => setActiveReport('customer')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
            activeReport === 'customer' ? 'bg-white text-slate-800 shadow-xxs border border-slate-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Sales
        </button>
        <button
          onClick={() => setActiveReport('yearly')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
            activeReport === 'yearly' ? 'bg-white text-slate-800 shadow-xxs border border-slate-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Yearly Summary
        </button>
      </div>

      {/* Report Controls (Year Selector for Monthly Report) */}
      {activeReport === 'monthly' && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-100 w-fit">
          <span className="text-xs text-slate-500 font-medium">Select Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs border border-slate-200 rounded p-1.5 bg-white font-medium"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      )}

      {/* Active Report Table Content */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xxs print:border-none print:shadow-none p-6 space-y-6">
        {/* Report Document Title Block (Aesthetic Print Header) */}
        <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
          <h2 className="text-md font-bold uppercase tracking-wider text-slate-800">
            {activeReport === 'monthly' && `Monthly Revenue Report - ${selectedYear}`}
            {activeReport === 'pending' && 'Outstanding Account Receivables Ledger'}
            {activeReport === 'customer' && 'Customer-Wise Accounts & Billings Report'}
            {activeReport === 'yearly' && 'Annual Business Revenue Summary'}
          </h2>
          <p className="text-3xxs text-slate-400 font-medium">Vertex Solutions Ltd | Austin HQ | Generated on June 24, 2026</p>
        </div>

        {/* 1. Monthly Revenue Table */}
        {activeReport === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5">Billing Month</th>
                  <th className="py-2.5 text-center">Receipts Count</th>
                  <th className="py-2.5 text-right">Total Revenue Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {getMonthlyRevenueReport().length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-400">
                      No collections logged for Year {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  getMonthlyRevenueReport().map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-semibold text-slate-800">{row.month} {selectedYear}</td>
                      <td className="py-3 text-center text-slate-500 font-mono">{row.volume}</td>
                      <td className="py-3 text-right font-extrabold text-emerald-600 font-mono">
                        +₹{row.collected.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Outstanding Receivables Table */}
        {activeReport === 'pending' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5">Invoice No</th>
                  <th className="py-2.5">Customer Name</th>
                  <th className="py-2.5">Payment Due Date</th>
                  <th className="py-2.5 text-right">Billed Amount</th>
                  <th className="py-2.5 text-right">Balance Outstanding</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {getPendingPaymentsReport().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Zero pending balances found. Outstanding accounts are fully settled!
                    </td>
                  </tr>
                ) : (
                  getPendingPaymentsReport().map((row) => (
                    <tr key={row.invoiceNo} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-bold text-slate-800">{row.invoiceNo}</td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-700">{row.client}</div>
                        <div className="text-3xxs text-slate-400">{row.company}</div>
                      </td>
                      <td className="py-3 text-slate-500">{row.dueDate}</td>
                      <td className="py-3 text-right text-slate-600 font-mono">₹{row.totalAmount.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-rose-600 font-mono">₹{row.balance.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-3xxs font-bold uppercase ${
                          row.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Customer-Wise Sales Table */}
        {activeReport === 'customer' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5">Customer Name</th>
                  <th className="py-2.5 text-center">Invoices Count</th>
                  <th className="py-2.5 text-right">Total Billed</th>
                  <th className="py-2.5 text-right">Total Collected</th>
                  <th className="py-2.5 text-right">Pending Receivable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {getCustomerSalesReport().length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No invoices issued yet. Client account statistics are empty.
                    </td>
                  </tr>
                ) : (
                  getCustomerSalesReport().map((row) => (
                    <tr key={row.customerName} className="hover:bg-slate-50/50 transition">
                      <td className="py-3">
                        <div className="font-bold text-slate-800">{row.customerName}</div>
                        <div className="text-3xxs text-slate-400">{row.company}</div>
                      </td>
                      <td className="py-3 text-center text-slate-500 font-mono">{row.invoiceCount}</td>
                      <td className="py-3 text-right font-semibold text-slate-700 font-mono">₹{row.billed.toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold text-emerald-600 font-mono">₹{row.collected.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-rose-600 font-mono">₹{row.pending.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Yearly Accounts Summary Table */}
        {activeReport === 'yearly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5">Financial Year</th>
                  <th className="py-2.5 text-center">Billed Count</th>
                  <th className="py-2.5 text-right">Total Billed Sales</th>
                  <th className="py-2.5 text-right">Revenue Collections</th>
                  <th className="py-2.5 text-right">Outstanding Ledger Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {getYearlyReport().map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 font-bold text-slate-800 text-sm">FY {row.year}</td>
                    <td className="py-3.5 text-center text-slate-500 font-mono">{row.invoiceCount} invoices</td>
                    <td className="py-3.5 text-right font-bold text-slate-700 font-mono">₹{row.billed.toFixed(2)}</td>
                    <td className="py-3.5 text-right font-bold text-emerald-600 font-mono">₹{row.collected.toFixed(2)}</td>
                    <td className="py-3.5 text-right font-bold text-rose-600 font-mono">₹{row.outstanding.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
