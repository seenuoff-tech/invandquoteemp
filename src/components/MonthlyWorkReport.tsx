import React, { useMemo, useState } from 'react';
import { Task, Employee } from '../types';
import { FileDown, Lock, ShieldCheck, CalendarDays, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import {
  MONTH_NAMES, getMonthlyTasks, getEffectiveTaskStatus, generateWorkReportPdf, getReportGeneratedDate,
} from '../utils/workReportPdf';

interface Props {
  tasks: Task[];
  employees: Employee[];
  currentUser: Employee;
  mode: 'admin' | 'self';
  passkey?: string;
  companyName?: string;
  logoUrl?: string;
}

// Default = previous month (report is generated on the 1st of every month)
const getDefaultPeriod = () => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

const statusStyle: Record<string, string> = {
  Completed: 'bg-emerald-100 text-emerald-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Overdue: 'bg-rose-100 text-rose-700',
  'To Do': 'bg-slate-100 text-slate-700',
};

export default function MonthlyWorkReport({ tasks, employees, currentUser, mode, passkey = '2807', companyName, logoUrl }: Props) {
  const [unlocked, setUnlocked] = useState(mode === 'self' || sessionStorage.getItem('workReportUnlocked') === '1');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const def = getDefaultPeriod();
  const [year, setYear] = useState(def.year);
  const [month, setMonth] = useState(def.month);
  const [employeeId, setEmployeeId] = useState(mode === 'self' ? currentUser.id : (employees[0]?.id || ''));

  const employee = mode === 'self' ? currentUser : employees.find(e => e.id === employeeId);
  const monthly = useMemo(
    () => (employee ? getMonthlyTasks(tasks, employee.id, year, month) : []),
    [tasks, employee, year, month]
  );

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    monthly.forEach(t => { (map[t.dueDate] ||= []).push(t); });
    return Object.entries(map);
  }, [monthly]);

  const count = (s: string) => monthly.filter(t => getEffectiveTaskStatus(t) === s).length;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === passkey) {
      sessionStorage.setItem('workReportUnlocked', '1');
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid passkey. Please try again.');
      setPin('');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={handleUnlock} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 w-full max-w-sm text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
            <Lock className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Work Reports Locked</h2>
            <p className="text-sm text-slate-500">Enter admin security passkey to continue.</p>
          </div>
          <input
            id="work-report-passkey"
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="••••"
            className="w-full text-center tracking-[0.5em] text-lg border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {pinError && <p className="text-xs font-semibold text-rose-600">{pinError}</p>}
          <button id="work-report-unlock" type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {mode === 'admin' && <ShieldCheck className="w-6 h-6 text-emerald-600" />}
            {mode === 'admin' ? 'Employee Monthly Work Reports' : 'My Monthly Work Report'}
          </h2>
          <p className="text-sm text-slate-500">
            {isCurrentMonth
              ? `Current month in progress — final report generates on ${getReportGeneratedDate(year, month)}.`
              : `Report generated on ${getReportGeneratedDate(year, month)}.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {mode === 'admin' && (
            <select id="work-report-employee" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              {employees.length === 0 && <option value="">No employees</option>}
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          )}
          <select id="work-report-month" value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
            {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select id="work-report-year" value={year} onChange={e => setYear(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            id="work-report-download"
            disabled={!employee}
            onClick={() => employee && generateWorkReportPdf({ employee, tasks: monthly, year, month, companyName, logoUrl })}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <FileDown className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {employee && (
        <div className="bg-gradient-to-r from-[#0439C5] to-indigo-500 rounded-xl p-5 text-white flex flex-wrap justify-between gap-4 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Employee</p>
            <p className="text-lg font-bold">{employee.name}</p>
            <p className="text-xs opacity-80">{employee.role}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider opacity-80">Period</p>
            <p className="text-lg font-bold">{MONTH_NAMES[month]} {year}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Tasks', val: monthly.length, icon: ListTodo, cls: 'text-slate-700' },
          { label: 'Completed', val: count('Completed'), icon: CheckCircle2, cls: 'text-emerald-600' },
          { label: 'In Progress', val: count('In Progress'), icon: Clock, cls: 'text-blue-600' },
          { label: 'To Do', val: count('To Do'), icon: CalendarDays, cls: 'text-slate-500' },
          { label: 'Overdue', val: count('Overdue'), icon: AlertCircle, cls: 'text-rose-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
            <c.icon className={`w-5 h-5 mb-2 ${c.cls}`} />
            <p className={`text-2xl font-bold ${c.cls}`}>{c.val}</p>
            <p className="text-xs text-slate-500 font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700">Date-wise Tasks</div>
        {grouped.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No tasks recorded for {MONTH_NAMES[month]} {year}.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {grouped.map(([date, list]) => (
              <div key={date} className="px-6 py-4 flex flex-col md:flex-row gap-3">
                <div className="md:w-36 shrink-0">
                  <p className="font-mono text-sm font-bold text-indigo-700">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })}
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {list.map(t => {
                    const s = getEffectiveTaskStatus(t);
                    return (
                      <div key={t.id} className="flex justify-between items-start gap-3 bg-slate-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{t.title}</p>
                          {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${statusStyle[s]}`}>{s}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
