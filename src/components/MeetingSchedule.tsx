import React, { useState } from 'react';
import { Meeting, Employee } from '../types';
import { Calendar, Plus, Edit2, Trash2, Users } from 'lucide-react';

interface Props {
  meetings: Meeting[];
  employees: Employee[];
  onAdd: (m: Meeting) => void;
  onUpdate: (m: Meeting) => void;
  onDelete: (id: string) => void;
}

export default function MeetingSchedule({ meetings, employees, onAdd, onUpdate, onDelete }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  
  const [formData, setFormData] = useState<Partial<Meeting>>({
    title: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    organizerId: '',
    attendees: []
  });

  const handleOpenNew = () => {
    setEditingMeeting(null);
    setFormData({
      title: '', description: '', 
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
      organizerId: '', attendees: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Meeting) => {
    setEditingMeeting(m);
    setFormData({
      ...m,
      startTime: new Date(m.startTime).toISOString().slice(0, 16),
      endTime: new Date(m.endTime).toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMeeting) {
      onUpdate({ ...editingMeeting, ...formData } as Meeting);
    } else {
      onAdd({
        ...formData,
        id: `meet-${Date.now()}`
      } as Meeting);
    }
    setIsModalOpen(false);
  };

  const toggleAttendee = (empId: string) => {
    const current = formData.attendees || [];
    if (current.includes(empId)) {
      setFormData({ ...formData, attendees: current.filter(id => id !== empId) });
    } else {
      setFormData({ ...formData, attendees: [...current, empId] });
    }
  };

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Meeting Schedule</h2>
          <p className="text-sm text-slate-500">Plan and track team meetings.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Meeting</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Organizer</th>
              <th className="px-6 py-4 font-semibold">Attendees</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No meetings scheduled. Plan your first sync!</p>
                </td>
              </tr>
            ) : (
              meetings.map(meet => (
                <tr key={meet.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{meet.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{meet.description}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    <div>{new Date(meet.startTime).toLocaleString()}</div>
                    <div className="text-slate-400">to {new Date(meet.endTime).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {getEmployeeName(meet.organizerId)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{meet.attendees.length} people</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenEdit(meet)} className="text-indigo-600 hover:text-indigo-900 p-2">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(meet.id)} className="text-rose-600 hover:text-rose-900 p-2">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Organizer</label>
                <select required value={formData.organizerId} onChange={e => setFormData({...formData, organizerId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="" disabled>Select Organizer</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Attendees</label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={(formData.attendees || []).includes(emp.id)}
                        onChange={() => toggleAttendee(emp.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      {emp.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
