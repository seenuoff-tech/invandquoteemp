import React, { useState } from 'react';
import { Task, Employee } from '../types';
import { CheckSquare, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  tasks: Task[];
  employees: Employee[];
  onAdd: (t: Task) => void;
  onUpdate: (t: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskManagement({ tasks, employees, onAdd, onUpdate, onDelete }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    employeeId: '',
    status: 'To Do',
    dueDate: todayStr
  });

  const handleOpenNew = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', employeeId: '', status: 'To Do', dueDate: todayStr });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Task) => {
    setEditingTask(t);
    setFormData({ ...t }); // Explicitly preserve existing task properties including dueDate
    setIsModalOpen(true);
  };

  const handleStatusChangeInline = (task: Task, newStatus: 'To Do' | 'In Progress' | 'Completed' | 'Overdue') => {
    // Keep exact same task data including dueDate, only update status
    onUpdate({
      ...task,
      status: newStatus
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      onUpdate({
        ...editingTask,
        ...formData
      } as Task);
    } else {
      onAdd({
        ...formData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString()
      } as Task);
    }
    setIsModalOpen(false);
  };

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unassigned';
  };

  // Helper to get effective status (if due date passed and not completed, it is overdue)
  const getEffectiveStatus = (task: Task) => {
    if (task.status === 'Completed') return 'Completed';
    if (task.status === 'Overdue' || (task.dueDate && task.dueDate < todayStr)) return 'Overdue';
    return task.status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Task Management</h2>
          <p className="text-sm text-slate-500">Assign and track work tasks for employees.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Task</th>
              <th className="px-6 py-4 font-semibold">Assignee</th>
              <th className="px-6 py-4 font-semibold">Due Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No tasks found. Create a new task!</p>
                </td>
              </tr>
            ) : (
              tasks.map(task => {
                const effectiveStatus = getEffectiveStatus(task);
                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{task.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[250px]">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {getEmployeeName(task.employeeId)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {task.dueDate}
                      {effectiveStatus === 'Overdue' && (
                        <span className="text-rose-600 font-bold ml-2 text-xxs inline-flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3 inline" /> Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={effectiveStatus}
                        onChange={(e) => handleStatusChangeInline(task, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border-0 outline-none cursor-pointer transition ${
                          effectiveStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          effectiveStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          effectiveStatus === 'Overdue' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenEdit(task)} className="text-indigo-600 hover:text-indigo-900 p-2 cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(task.id)} className="text-rose-600 hover:text-rose-900 p-2 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {editingTask ? 'Edit Task' : 'Add Task'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assignee</label>
                  <select required value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="" disabled>Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                  <input required type="date" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={formData.status || 'To Do'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
