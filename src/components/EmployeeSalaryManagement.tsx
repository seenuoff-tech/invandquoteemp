import React, { useState, useMemo } from 'react';
import { EmployeeSalary, Employee } from '../types';
import { IndianRupee, Plus, Edit, Trash2, CheckCircle2, Clock, XCircle, Filter, DollarSign, Calendar, CreditCard, Building, User, Download } from 'lucide-react';
import { exportSalariesToExcel } from '../utils/excelExporter';

interface Props {
  salaries: EmployeeSalary[];
  employees: Employee[];
  onAddSalary: (s: EmployeeSalary) => void;
  onUpdateSalary: (s: EmployeeSalary) => void;
  onDeleteSalary: (id: string) => void;
}

export default function EmployeeSalaryManagement({
  salaries,
  employees,
  onAddSalary,
  onUpdateSalary,
  onDeleteSalary,
}: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<EmployeeSalary | null>(null);

  const [formData, setFormData] = useState<Partial<EmployeeSalary>>({
    employeeId: '',
    month: selectedMonth,
    salaryAmount: 0,
    paidAmount: 0,
    status: 'Unpaid',
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  const handleOpenNew = () => {
    setEditingSalary(null);
    const firstEmp = employees[0];
    setFormData({
      employeeId: firstEmp?.id || '',
      employeeName: firstEmp?.name || '',
      month: selectedMonth,
      salaryAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      status: 'Unpaid',
      paidDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: EmployeeSalary) => {
    setEditingSalary(s);
    setFormData({ ...s });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formData.employeeId);
    const empName = emp ? emp.name : (formData.employeeName || 'Unknown');
    const salAmt = Number(formData.salaryAmount) || 0;
    const paidAmt = Number(formData.paidAmount) || 0;
    const balAmt = Math.max(0, salAmt - paidAmt);

    let calculatedStatus: 'Paid' | 'Unpaid' | 'Partially Paid' = 'Unpaid';
    if (paidAmt >= salAmt && salAmt > 0) {
      calculatedStatus = 'Paid';
    } else if (paidAmt > 0) {
      calculatedStatus = 'Partially Paid';
    }

    if (editingSalary) {
      onUpdateSalary({
        ...editingSalary,
        ...formData,
        employeeName: empName,
        salaryAmount: salAmt,
        paidAmount: paidAmt,
        balanceAmount: balAmt,
        status: calculatedStatus,
      } as EmployeeSalary);
    } else {
      const newEntry: EmployeeSalary = {
        id: `sal-${Date.now()}`,
        employeeId: formData.employeeId || emp?.id || `emp-${Date.now()}`,
        employeeName: empName,
        month: formData.month || selectedMonth,
        salaryAmount: salAmt,
        paidAmount: paidAmt,
        balanceAmount: balAmt,
        status: calculatedStatus,
        paidDate: formData.paidDate || new Date().toISOString().split('T')[0],
        paymentMethod: formData.paymentMethod || 'Bank Transfer',
        notes: formData.notes || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddSalary(newEntry);
    }
    setIsModalOpen(false);
  };

  // Filter salaries by selected month
  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => s.month === selectedMonth);
  }, [salaries, selectedMonth]);

  // High level KPI calculations
  const monthTotals = useMemo(() => {
    let totalSalary = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidEmployeesCount = 0;
    let unpaidEmployeesCount = 0;

    filteredSalaries.forEach((s) => {
      totalSalary += s.salaryAmount;
      totalPaid += s.paidAmount;
      totalPending += s.balanceAmount;
      if (s.status === 'Paid') paidEmployeesCount++;
      else unpaidEmployeesCount++;
    });

    return {
      totalSalary,
      totalPaid,
      totalPending,
      paidEmployeesCount,
      unpaidEmployeesCount,
      totalCount: filteredSalaries.length,
    };
  }, [filteredSalaries]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Salary Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track monthly employee salary disbursemets, paid/unpaid status, and payment dates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => exportSalariesToExcel(salaries)}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-2xs"
            title="Export all salary statements to Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Salaries</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="bg-[#0439C5] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record Salary
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Salary Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Total Monthly Salary</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{monthTotals.totalSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-3xxs font-medium text-slate-400">{monthTotals.totalCount} employee record(s)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Total Paid Salaries</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ₹{monthTotals.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-3xxs font-semibold text-emerald-600">{monthTotals.paidEmployeesCount} employee(s) paid</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Pending / Unpaid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Unpaid Balance</span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              ₹{monthTotals.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-3xxs font-semibold text-rose-600">{monthTotals.unpaidEmployeesCount} employee(s) pending</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between pb-2">
          <h3 className="font-bold text-sm text-slate-800">Salary Statements for {selectedMonth}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-right">Base Salary</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Paid Date</th>
                <th className="py-3 px-4 text-center">Payment Method</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IndianRupee className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">No Salary Records for {selectedMonth}</p>
                      <p className="text-xs text-slate-400">Click "Record Salary" to add monthly salary details.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                          {s.employeeName.charAt(0)}
                        </div>
                        <div>
                          <span>{s.employeeName}</span>
                          {s.notes && <p className="text-3xxs text-slate-400 font-normal truncate max-w-40">{s.notes}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 text-3xxs font-bold">{s.month}</td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      ₹{s.salaryAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      ₹{s.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-rose-600">
                      ₹{s.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {s.status === 'Paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      )}
                      {s.status === 'Partially Paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Partially Paid
                        </span>
                      )}
                      {s.status === 'Unpaid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-3xxs text-slate-600">
                      {s.paidDate || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-slate-100 text-slate-700 text-3xxs font-semibold px-2 py-0.5 rounded-md">
                        {s.paymentMethod || 'Bank Transfer'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                          title="Edit Salary Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete salary statement for ${s.employeeName}?`)) {
                              onDeleteSalary(s.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-indigo-400" />
                <span>{editingSalary ? 'Edit Salary Statement' : 'Record Employee Salary'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const found = employees.find((x) => x.id === empId);
                    setFormData((prev) => ({
                      ...prev,
                      employeeId: empId,
                      employeeName: found ? found.name : prev.employeeName,
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                >
                  <option value="" disabled>-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salary Month *</label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salary Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="e.g. 25000"
                    value={formData.salaryAmount || ''}
                    onChange={(e) => setFormData({ ...formData, salaryAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 25000"
                    value={formData.paidAmount || ''}
                    onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={formData.paidDate}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="GPay / UPI">GPay / UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Transaction Reference</label>
                <textarea
                  rows={2}
                  placeholder="e.g. NEFT Reference #9821382"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0439C5] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Salary Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
