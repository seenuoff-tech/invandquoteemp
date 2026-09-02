import React, { useState, useMemo } from 'react';
import { TimeLog, Employee, Task } from '../types';
import { Clock, Plus, Edit2, Trash2, Calendar, UserCheck, BarChart2 } from 'lucide-react';

interface Props {
  timeLogs: TimeLog[];
  employees: Employee[];
  tasks: Task[];
  onAdd: (t: TimeLog) => void;
  onUpdate: (t: TimeLog) => void;
  onDelete: (id: string) => void;
}

export default function TimeTracking({ timeLogs, employees, tasks, onAdd, onUpdate, onDelete }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  
  // Selected Month & Year for Monthly Working Hours Report
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [formData, setFormData] = useState<Partial<TimeLog>>({
    employeeId: '',
    taskId: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date().toISOString().slice(0, 16),
    durationMinutes: 0,
    notes: ''
  });

  const handleOpenNew = () => {
    setEditingLog(null);
    setFormData({ employeeId: '', taskId: '', startTime: new Date().toISOString().slice(0, 16), endTime: new Date().toISOString().slice(0, 16), durationMinutes: 0, notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TimeLog) => {
    setEditingLog(t);
    setFormData({
      ...t,
      startTime: new Date(t.startTime).toISOString().slice(0, 16),
      endTime: new Date(t.endTime).toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.max(0, Math.floor((e - s) / 60000));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = calculateDuration(formData.startTime!, formData.endTime!);
    if (editingLog) {
      onUpdate({ ...editingLog, ...formData, durationMinutes: duration } as TimeLog);
    } else {
      onAdd({
        ...formData,
        id: `time-${Date.now()}`,
        durationMinutes: duration
      } as TimeLog);
    }
    setIsModalOpen(false);
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';
  const getTaskTitle = (id: string) => tasks.find(t => t.id === id)?.title || 'Unknown Task';

  // Calculate Monthly Working Hours per Employee
  const monthlyWorkingHoursData = useMemo(() => {
    const map = new Map<string, {
      employee: Employee;
      totalMinutes: number;
      datesWorked: Set<string>;
      logsCount: number;
    }>();

    employees.forEach(emp => {
      map.set(emp.id, {
        employee: emp,
        totalMinutes: 0,
        datesWorked: new Set(),
        logsCount: 0,
      });
    });

    timeLogs.forEach(log => {
      const logDateStr = log.startTime ? log.startTime.slice(0, 7) : '';
      if (logDateStr === selectedMonth) {
        let record = map.get(log.employeeId);
        if (!record) {
          const emp: Employee = employees.find(e => e.id === log.employeeId) || { id: log.employeeId, name: 'Unknown', role: 'Staff', email: '', phone: '', status: 'Active', createdAt: '' };
          record = { employee: emp, totalMinutes: 0, datesWorked: new Set(), logsCount: 0 };
          map.set(log.employeeId, record);
        }
        record.totalMinutes += (log.durationMinutes || 0);
        record.logsCount += 1;
        if (log.startTime) {
          record.datesWorked.add(log.startTime.slice(0, 10));
        }
      }
    });

    return Array.from(map.values());
  }, [timeLogs, employees, selectedMonth]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Time Tracking & Working Hours</h2>
          <p className="text-xs text-slate-500">Log task durations and audit monthly working hours per employee.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-[#0439C5] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Log Time
        </button>
      </div>

      {/* Monthly Working Hours Report Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#0439C5]" />
            <h3 className="font-bold text-base text-slate-800">Employee Monthly Working Hours Summary</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0439C5]"
            />
          </div>
        </div>

        {/* Working Hours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyWorkingHoursData.map(({ employee, totalMinutes, datesWorked, logsCount }) => {
            const hours = (totalMinutes / 60).toFixed(1);
            const days = datesWorked.size;
            const avgHoursPerDay = days > 0 ? (totalMinutes / 60 / days).toFixed(1) : '0';

            return (
              <div key={employee.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0439C5] text-white font-extrabold text-xs flex items-center justify-center">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{employee.name}</h4>
                      <p className="text-3xxs text-slate-400 font-medium">{employee.role}</p>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-3xxs font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                    {hours} Hours
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div>
                    <span className="text-3xxs font-bold text-slate-400 uppercase">Total Hours</span>
                    <p className="text-xs font-black text-slate-800">{hours} hrs</p>
                  </div>
                  <div>
                    <span className="text-3xxs font-bold text-slate-400 uppercase">Days Present</span>
                    <p className="text-xs font-black text-emerald-600">{days} days</p>
                  </div>
                  <div>
                    <span className="text-3xxs font-bold text-slate-400 uppercase">Avg / Day</span>
                    <p className="text-xs font-black text-indigo-600">{avgHoursPerDay} hrs</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Time Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden space-y-3 p-5">
        <h3 className="font-bold text-sm text-slate-800">Detailed Time Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-xs">No time logs recorded yet.</p>
                  </td>
                </tr>
              ) : (
                timeLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {getEmployeeName(log.employeeId)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-700">{getTaskTitle(log.taskId)}</div>
                      {log.notes && <div className="text-3xxs text-slate-400 truncate max-w-[200px]">{log.notes}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-3xxs">
                      <div>{new Date(log.startTime).toLocaleString()}</div>
                      <div className="text-slate-400">to {new Date(log.endTime).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-3xxs">
                        {formatDuration(log.durationMinutes)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => handleOpenEdit(log)} className="text-indigo-600 hover:text-indigo-900 p-1.5">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(log.id)} className="text-rose-600 hover:text-rose-900 p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="font-bold text-sm">
                {editingLog ? 'Edit Time Log' : 'Add Time Log'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee</label>
                  <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0439C5] outline-none">
                    <option value="" disabled>Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task</label>
                  <select required value={formData.taskId} onChange={e => setFormData({...formData, taskId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0439C5] outline-none">
                    <option value="" disabled>Select Task</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0439C5] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input required type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0439C5] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0439C5] outline-none" placeholder="What did you work on?" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-[#0439C5] hover:bg-blue-700 rounded-xl shadow-md">Save Time Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
