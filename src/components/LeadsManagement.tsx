import React, { useState, useRef, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import {
  Plus, Search, Edit2, Trash2, Phone,
  UserPlus, Lock, X, CheckCircle, AlertCircle,
  ChevronRight, Users, TrendingUp, Star, Clock
} from 'lucide-react';

interface LeadsManagementProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onConvertLead: (lead: Lead) => void;
  leadsPin: string;
}

// ── PIN Gate ─────────────────────────────────────────────────────────────────
function PinGate({ correctPin, onUnlock }: { correctPin: string; onUnlock: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  useEffect(() => { ref0.current?.focus(); }, []);

  const handleDigit = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[index] = val;
    setDigits(next);
    setError(false);
    if (val && index < 3) refs[index + 1].current?.focus();
    if (index === 3 && val) {
      const pin = [...next.slice(0, 3), val].join('');
      if (pin === correctPin) {
        onUnlock();
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => {
          setShake(false);
          setDigits(['', '', '', '']);
          ref0.current?.focus();
        }, 700);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <style>{`
        @keyframes pinShake {
          0%,100%{transform:translateX(0);}
          20%{transform:translateX(-8px);}
          40%{transform:translateX(8px);}
          60%{transform:translateX(-6px);}
          80%{transform:translateX(6px);}
        }
        .pin-shake{animation:pinShake 0.5s ease-in-out;}
      `}</style>
      <div className="text-center space-y-8 w-full max-w-sm">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl rotate-6 opacity-20" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Leads Access</h2>
          <p className="text-sm text-slate-400 mt-1">Enter your 4-digit PIN to continue</p>
        </div>
        <div className={`flex justify-center gap-3 ${shake ? 'pin-shake' : ''}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              id={`pin-digit-${i}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all duration-200
                ${d ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-800'}
                ${error ? 'border-rose-400 bg-rose-50 text-rose-600' : ''}
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`}
            />
          ))}
        </div>
        {error && (
          <div className="flex items-center justify-center gap-2 text-rose-500 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Incorrect PIN. Try again.</span>
          </div>
        )}
        <p className="text-xs text-slate-300">PIN can be changed in Settings → Admin Settings</p>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg: Record<LeadStatus, { bg: string; text: string; border: string; dot: string }> = {
    New:       { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    dot: 'bg-blue-500' },
    Contacted: { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   dot: 'bg-amber-500' },
    Converted: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeadsManagement({
  leads, onAddLead, onUpdateLead, onDeleteLead, onConvertLead, leadsPin
}: LeadsManagementProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [confirmConvert, setConfirmConvert] = useState<Lead | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<LeadStatus>('New');

  if (!unlocked) {
    return <PinGate correctPin={leadsPin || '1234'} onUnlock={() => setUnlocked(true)} />;
  }

  const totalLeads = leads.length;
  const newCount = leads.filter(l => l.status === 'New').length;
  const contactedCount = leads.filter(l => l.status === 'Contacted').length;
  const convertedCount = leads.filter(l => l.status === 'Converted').length;

  const filtered = leads.filter(lead => {
    const matchSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile.includes(searchTerm) ||
      (lead.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditingLead(null);
    setFormName(''); setFormMobile(''); setFormNotes(''); setFormStatus('New');
    setIsModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormName(lead.name); setFormMobile(lead.mobile);
    setFormNotes(lead.notes || ''); setFormStatus(lead.status);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingLead(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMobile.trim()) return;
    if (editingLead) {
      onUpdateLead({ ...editingLead, name: formName.trim(), mobile: formMobile.trim(), notes: formNotes.trim(), status: formStatus });
    } else {
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        name: formName.trim(),
        mobile: formMobile.trim(),
        notes: formNotes.trim(),
        status: formStatus,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddLead(newLead);
    }
    closeModal();
  };

  const handleConvertConfirm = () => {
    if (!confirmConvert) return;
    onConvertLead(confirmConvert);
    setConvertSuccess(confirmConvert.name);
    setConfirmConvert(null);
    setTimeout(() => setConvertSuccess(null), 4000);
  };

  const statCards = [
    { label: 'Total Leads', value: totalLeads,    Icon: Users,       color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-100' },
    { label: 'New',         value: newCount,       Icon: Star,        color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
    { label: 'Contacted',   value: contactedCount, Icon: Phone,       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
    { label: 'Converted',   value: convertedCount, Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Leads
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Track potential clients and convert them to customers</p>
        </div>
        <button
          id="add-lead-btn"
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-100 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Convert Success Toast */}
      {convertSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span><strong>{convertSuccess}</strong> has been converted and added to Customers successfully!</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, Icon, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="leads-search"
            type="text"
            placeholder="Search by name, mobile or notes…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'New', 'Contacted', 'Converted'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-medium text-slate-500">No leads found</p>
            <p className="text-sm text-slate-400">
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'Click "Add Lead" to start tracking potential clients.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Lead', 'Mobile', 'Notes', 'Status', 'Added', 'Actions'].map((h, idx) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${
                      idx === 2 ? 'hidden md:table-cell' : idx === 4 ? 'hidden sm:table-cell' : idx === 5 ? 'text-right' : ''
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <a href={`tel:${lead.mobile}`} className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.mobile}
                      </a>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell max-w-xs">
                      <span className="text-slate-500 text-xs line-clamp-2">
                        {lead.notes || <span className="italic text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />{lead.createdAt}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.status !== 'Converted' && (
                          <button
                            id={`convert-lead-${lead.id}`}
                            onClick={() => setConfirmConvert(lead)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold border border-emerald-100 transition-all cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Convert</span>
                          </button>
                        )}
                        <button id={`edit-lead-${lead.id}`} onClick={() => openEdit(lead)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button id={`delete-lead-${lead.id}`} onClick={() => setConfirmDelete(lead)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name <span className="text-rose-400">*</span></label>
                <input id="lead-name-input" type="text" value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Arjun Sharma" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number <span className="text-rose-400">*</span></label>
                <input id="lead-mobile-input" type="tel" value={formMobile} onChange={e => setFormMobile(e.target.value)} required placeholder="e.g. 9876543210" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                <div className="flex gap-2">
                  {(['New', 'Contacted', 'Converted'] as LeadStatus[]).map(s => (
                    <button key={s} type="button" onClick={() => setFormStatus(s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        formStatus === s
                          ? s === 'New' ? 'bg-blue-600 text-white border-blue-600'
                            : s === 'Contacted' ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea id="lead-notes-input" value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={3} placeholder="Any notes about this potential client…" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button id="lead-save-btn" type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer">
                  {editingLead ? 'Save Changes' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Confirm */}
      {confirmConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmConvert(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <UserPlus className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-800">Convert to Customer?</h3>
              <p className="text-sm text-slate-500"><strong className="text-slate-700">{confirmConvert.name}</strong> will be moved to Customers automatically.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-medium text-slate-700">{confirmConvert.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Mobile</span><span className="font-medium text-slate-700">{confirmConvert.mobile}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmConvert(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button id="confirm-convert-btn" onClick={handleConvertConfirm} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-100 cursor-pointer">
                <ChevronRight className="w-4 h-4" />Convert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-800">Delete Lead?</h3>
              <p className="text-sm text-slate-500">Are you sure you want to delete <strong className="text-slate-700">{confirmDelete.name}</strong>? This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button id="confirm-delete-lead-btn" onClick={() => { onDeleteLead(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
