import React, { useState } from 'react';
import { TimeLog, Employee, Task } from '../types';
import { Clock, Plus, Edit2, Trash2 } from 'lucide-react';

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
  
  const [formData, setFormData] = useState<Partial<TimeLog>>({
    employeeId: '',
    taskId: '',
    startTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Time Tracking</h2>
          <p className="text-sm text-slate-500">Log and monitor hours spent on tasks.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Log Time
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Employee</th>
              <th className="px-6 py-4 font-semibold">Task</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Duration</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {timeLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No time logs yet. Start tracking work!</p>
                </td>
              </tr>
            ) : (
              timeLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {getEmployeeName(log.employeeId)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">{getTaskTitle(log.taskId)}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{log.notes}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    <div>{new Date(log.startTime).toLocaleString()}</div>
                    <div className="text-slate-400">to {new Date(log.endTime).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold">
                      {formatDuration(log.durationMinutes)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenEdit(log)} className="text-indigo-600 hover:text-indigo-900 p-2">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(log.id)} className="text-rose-600 hover:text-rose-900 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {editingLog ? 'Edit Time Log' : 'Add Time Log'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
                  <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="" disabled>Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Task</label>
                  <select required value={formData.taskId} onChange={e => setFormData({...formData, taskId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="" disabled>Select Task</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                  <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                  <input required type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="What did you work on?" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Time Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
