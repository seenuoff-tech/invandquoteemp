import React, { useState } from 'react';
import { LeaveRequest, Employee } from '../types';
import { Calendar, Plus, CheckCircle2, XCircle, Clock, Filter, User, AlertCircle, FileText } from 'lucide-react';

interface Props {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  currentUser: Employee | null;
  onAddLeaveRequest: (req: LeaveRequest) => void;
  onUpdateLeaveStatus: (id: string, status: 'Approved' | 'Rejected') => void;
  onDeleteLeaveRequest: (id: string) => void;
}

export default function LeaveApprovalManagement({
  leaveRequests,
  employees,
  currentUser,
  onAddLeaveRequest,
  onUpdateLeaveStatus,
  onDeleteLeaveRequest,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  const [formData, setFormData] = useState({
    employeeId: currentUser?.id || '',
    leaveType: 'Casual Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const isAdmin = currentUser?.role === 'Admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEmp = employees.find((emp) => emp.id === formData.employeeId) || currentUser;
    if (!selectedEmp) {
      alert('Please select an employee');
      return;
    }

    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddLeaveRequest(newReq);
    setIsModalOpen(false);
    setFormData({
      employeeId: currentUser?.id || '',
      leaveType: 'Casual Leave',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
    });
  };

  const filteredRequests = leaveRequests.filter((r) => {
    if (filterStatus === 'All') return true;
    return r.status === filterStatus;
  });

  const pendingCount = leaveRequests.filter((r) => r.status === 'Pending').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leave Approval & Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Apply for leave, track request statuses, and manage manager approvals.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0439C5] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Requests</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Approved Leaves</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Rejected Leaves</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase">Filter Status:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Leave Type</th>
              <th className="py-3.5 px-4">Dates</th>
              <th className="py-3.5 px-4">Reason</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Actions / Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Calendar className="w-8 h-8 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No Leave Requests Found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                        {req.employeeName.charAt(0)}
                      </div>
                      <span>{req.employeeName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-3xxs font-bold">
                      {req.leaveType}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-3xxs">
                    {req.startDate} to {req.endDate}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={req.reason}>
                    {req.reason || '-'}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {req.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {req.status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                    {req.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xxs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {isAdmin && req.status === 'Pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onUpdateLeaveStatus(req.id, 'Approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-3xxs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => onUpdateLeaveStatus(req.id, 'Rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-3xxs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-3xxs text-slate-400 font-medium">
                        {req.status === 'Pending' ? 'Awaiting Admin' : 'Decision Finalized'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>Apply for Leave</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Employee</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Other">Other / Emergency</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0439C5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide reason for leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
