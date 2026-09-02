import React, { useState, useMemo } from 'react';
import { AccountEntry } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Wallet, Plus, Download, Search, Trash2, Edit, Calendar, IndianRupee, Lock, AlertCircle, FileText } from 'lucide-react';
import { exportAccountsToExcel } from '../utils/excelExporter';

interface AccountsProps {
  accounts: AccountEntry[];
  onAddAccount: (entry: AccountEntry) => void;
  onUpdateAccount: (entry: AccountEntry) => void;
  onDeleteAccount: (id: string) => void;
  accountsPin: string;
  companyName?: string;
  logoUrl?: string;
}

export default function Accounts({ accounts, onAddAccount, onUpdateAccount, onDeleteAccount, accountsPin, companyName = 'Skenetic Digital', logoUrl = '/logo.png' }: AccountsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'summary'>('income');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [formData, setFormData] = useState<Partial<AccountEntry>>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    description: '',
  });

  const incomeCategories = ['Sales', 'Services', 'Consulting', 'Investment', 'Other'];
  const expenseCategories = ['Rent', 'Salaries', 'Utilities', 'Software', 'Marketing', 'Supplies', 'Travel', 'Other'];

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === accountsPin) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleOpenModal = (type: 'income' | 'expense', entry?: AccountEntry) => {
    if (entry) {
      setFormData(entry);
      setIsEditing(true);
    } else {
      setFormData({
        type,
        date: new Date().toISOString().split('T')[0],
        category: type === 'income' ? incomeCategories[0] : expenseCategories[0],
        amount: 0,
        description: '',
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.date || !formData.type) return;

    if (isEditing && formData.id) {
      onUpdateAccount(formData as AccountEntry);
    } else {
      onAddAccount({
        ...(formData as AccountEntry),
        id: `acc-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(false);
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesType = activeTab === 'summary' ? true : acc.type === activeTab;
      const matchesMonth = acc.date?.startsWith(filterMonth);
      const matchesSearch = (acc.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (acc.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesMonth && matchesSearch;
    });
  }, [accounts, activeTab, filterMonth, searchTerm]);

  const summaryData = useMemo(() => {
    // Group by month
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    accounts.forEach(acc => {
      const month = acc.date?.slice(0, 7) || 'Unknown';
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
      
      if (acc.type === 'income') {
        monthlyData[month].income += Number(acc.amount) || 0;
      } else {
        monthlyData[month].expense += Number(acc.amount) || 0;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense
      }));
  }, [accounts]);

  const currentMonthSummary = useMemo(() => {
    const income = accounts.filter(a => a.type === 'income' && a.date?.startsWith(filterMonth)).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const expense = accounts.filter(a => a.type === 'expense' && a.date?.startsWith(filterMonth)).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    return { income, expense, net: income - expense };
  }, [accounts, filterMonth]);

  const handlePrint = async () => {
    setIsExporting(true);
    // Wait for React to re-render with the report content visible
    await new Promise(r => setTimeout(r, 300));

    const input = document.getElementById('accounts-report');
    if (!input) {
      setIsExporting(false);
      window.print();
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      let cursorY = margin;

      // --- Step 1: Add logo from base64 fetch ---
      try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        // Draw logo centered — max 30mm tall
        const logoMaxH = 20;
        const logoMaxW = 50;
        pdf.addImage(base64, 'PNG', (pdfWidth - logoMaxW) / 2, cursorY, logoMaxW, logoMaxH);
        cursorY += logoMaxH + 3;
      } catch {
        // If logo fails, skip it
      }

      // --- Step 2: Company name ---
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      pdf.text(companyName, pdfWidth / 2, cursorY, { align: 'center' });
      cursorY += 7;

      // --- Step 3: Title ---
      pdf.setFontSize(18);
      pdf.setTextColor(20, 20, 40);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Accounts Report', pdfWidth / 2, cursorY, { align: 'center' });
      cursorY += 7;

      // --- Step 4: Period ---
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Period: ${filterMonth}`, pdfWidth / 2, cursorY, { align: 'center' });
      cursorY += 5;

      // --- Step 5: Divider ---
      pdf.setDrawColor(200, 200, 210);
      pdf.line(margin, cursorY, pdfWidth - margin, cursorY);
      cursorY += 6;

      // --- Step 6: Capture report content with html2canvas ---
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, cursorY, contentWidth, contentHeight);

      pdf.save(`Accounts_Report_${filterMonth}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // --------------------------------------------------
  // PIN LOCK SCREEN
  // --------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in print:hidden">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Accounts Locked</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your 4-digit PIN to access financial records.</p>
          
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setPinError(false);
                }}
                className={`w-full text-center text-2xl tracking-widest py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                  pinError ? 'border-rose-300 focus:ring-rose-200 bg-rose-50' : 'border-slate-200 focus:ring-slate-200'
                }`}
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
              {pinError && (
                <p className="text-rose-500 text-xs mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Incorrect PIN
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pinInput.length !== 4}
              className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Unlock Accounts
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN COMPONENT
  // --------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#0439C5]" />
            Accounts Management
          </h1>
          <p className="text-sm text-slate-500">Track and manage your business income and expenses.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => exportAccountsToExcel(accounts)}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3.5 py-2.5 rounded-lg transition cursor-pointer shadow-2xs"
            title="Export all income and expense ledger to Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export to Excel</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#0439C5] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export as PDF</span>
          </button>
        </div>
      </div>

      <div id="accounts-report">
        {/* PRINT HEADER - Shown during PDF export */}
        {isExporting && (
          <div className="mb-6 bg-white">
            <div className="flex flex-col items-center gap-2 mb-4">
              <img
                src={logoUrl}
                alt="Company Logo"
                crossOrigin="anonymous"
                className="h-20 w-auto object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <p className="text-base font-semibold text-slate-600">{companyName}</p>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 text-center">Accounts Report</h2>
            <p className="text-center text-slate-500">Period: {filterMonth}</p>
            <hr className="my-4 border-slate-200" />
          </div>
        )}

        {/* QUICK STATS - Visible in print */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Income ({filterMonth})</p>
            <p className="text-xl font-bold text-emerald-700">₹{currentMonthSummary.income.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Expense ({filterMonth})</p>
            <p className="text-xl font-bold text-rose-700">₹{currentMonthSummary.expense.toFixed(2)}</p>
          </div>
        </div>
        <div className={`bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4 ${currentMonthSummary.net >= 0 ? 'border-indigo-100' : 'border-orange-100'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${currentMonthSummary.net >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Net Balance ({filterMonth})</p>
            <p className={`text-xl font-bold ${currentMonthSummary.net >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
              ₹{currentMonthSummary.net.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* TABS - Hidden in print */}
      <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 print:hidden mb-6">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'summary' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Monthly Summary
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Toolbar - Hidden in print */}
        {activeTab !== 'summary' && (
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => handleOpenModal(activeTab)}
              className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition shadow-sm cursor-pointer ${
                activeTab === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add {activeTab === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>
        )}

        {/* LIST / TABLE */}
        <div className="overflow-x-auto">
          {activeTab === 'summary' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Month</th>
                  <th className="p-4 text-right">Income</th>
                  <th className="p-4 text-right">Expense</th>
                  <th className="p-4 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">No account data available.</td>
                  </tr>
                ) : (
                  summaryData.map((data) => (
                    <tr key={data.month} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-700">{data.month}</td>
                      <td className="p-4 text-right text-emerald-600 font-medium">₹{Number(data.income).toFixed(2)}</td>
                      <td className="p-4 text-right text-rose-600 font-medium">₹{Number(data.expense).toFixed(2)}</td>
                      <td className={`p-4 text-right font-bold ${data.net >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                        ₹{Number(data.net).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No {activeTab} entries found for {filterMonth}.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-slate-700">{acc.date}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          acc.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {acc.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">{acc.description || '-'}</td>
                      <td className={`p-4 text-right font-bold ${acc.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{Number(acc.amount).toFixed(2)}
                      </td>
                      <td className="p-4 flex items-center justify-center gap-2 print:hidden">
                        <button
                          onClick={() => handleOpenModal(acc.type, acc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this entry?')) {
                              onDeleteAccount(acc.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-fade-in">
            <div className={`p-4 border-b text-white flex items-center gap-2 ${
              formData.type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              <FileText className="w-5 h-5" />
              <h2 className="font-bold text-lg">
                {isEditing ? 'Edit' : 'Add'} {formData.type === 'income' ? 'Income' : 'Expense'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a category</option>
                  {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="Additional notes..."
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-medium rounded-lg transition shadow-sm cursor-pointer ${
                    formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isEditing ? 'Save Changes' : `Save ${formData.type === 'income' ? 'Income' : 'Expense'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
