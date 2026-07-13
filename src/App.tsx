import { useState, useEffect } from 'react';
import { Customer, Invoice, Quotation, AdminSettings, AppNotification, Employee, Task, TimeLog, Meeting } from './types';
import {
  initialCustomers,
  initialInvoices,
  initialQuotations,
  initialNotifications,
  defaultSettings,
} from './data/mockData';

// Component Imports
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import QuotationManagement from './components/QuotationManagement';
import InvoiceManagement from './components/InvoiceManagement';
import PaymentTracking from './components/PaymentTracking';
import FilterSystem from './components/FilterSystem';
import Reports from './components/Reports';
import NotificationSystem from './components/NotificationSystem';
import AdminSettingsPanel from './components/AdminSettings';
import PrintView from './components/PrintView';
import EmployeeManagement from './components/EmployeeManagement';
import TaskManagement from './components/TaskManagement';
import TimeTracking from './components/TimeTracking';
import MeetingSchedule from './components/MeetingSchedule';
import LoginScreen from './components/LoginScreen';

// Icon Imports
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Filter,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,
  CreditCard,
  CheckSquare,
  Clock,
  Calendar
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Core States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // State linking for editing or quote-conversion transitions
  const [activeInvoiceToEdit, setActiveInvoiceToEdit] = useState<Invoice | null>(null);

  // Active print preview document
  const [printDocument, setPrintDocument] = useState<{
    type: 'invoice' | 'quotation';
    data: any;
  } | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, quoRes, invRes, setRes, notRes, empRes, taskRes, timeRes, meetRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/quotations'),
          fetch('/api/invoices'),
          fetch('/api/settings'),
          fetch('/api/notifications'),
          fetch('/api/employees'),
          fetch('/api/tasks'),
          fetch('/api/time-logs'),
          fetch('/api/meetings')
        ]);
        
        if (custRes.ok) setCustomers(await custRes.json());
        if (quoRes.ok) setQuotations(await quoRes.json());
        if (invRes.ok) setInvoices(await invRes.json());
        if (setRes.ok) {
          const settingsData = await setRes.json();
          if (settingsData) setSettings(settingsData);
        }
        if (notRes.ok) setNotifications(await notRes.json());
        if (empRes.ok) setEmployees(await empRes.json());
        if (taskRes.ok) setTasks(await taskRes.json());
        if (timeRes.ok) setTimeLogs(await timeRes.json());
        if (meetRes.ok) setMeetings(await meetRes.json());
      } catch (err) {
        console.error("Error fetching data from API:", err);
      }
    };
    fetchData();
  }, []);

  // Unread Notification Badge Count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // --- Handlers ---

  // Customers CRUD
  const handleAddCustomer = (cust: Customer) => {
    setCustomers((prev) => [cust, ...prev]);
    fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cust) }).catch(console.error);
  };

  const handleUpdateCustomer = (cust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
    fetch(`/api/customers/${cust.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cust) }).catch(console.error);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/customers/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Quotation Actions
  const handleAddQuotation = (q: Quotation) => {
    setQuotations((prev) => [q, ...prev]);
    fetch('/api/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) }).catch(console.error);
    // Create notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Quotation Generated',
      message: `Quotation ${q.number} was drafted for amount $${q.grandTotal.toFixed(2)}.`,
      type: 'info',
      date: new Date().toISOString().split('T')[0],
      read: false,
      quotationId: q.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNotif) }).catch(console.error);
  };

  const handleUpdateQuotation = (q: Quotation) => {
    setQuotations((prev) => prev.map((item) => (item.id === q.id ? q : item)));
    fetch(`/api/quotations/${q.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) }).catch(console.error);
  };

  const handleDeleteQuotation = (id: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    fetch(`/api/quotations/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Quote to Invoice Conversion
  const handleConvertToInvoice = (q: Quotation) => {
    // 1. Mark Quote Approved
    setQuotations((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, status: 'Approved' } : item))
    );

    // 2. Draft target converted invoice
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const draftConvertedInvoice: Invoice = {
      id: 'NEW_CONVERTED', // special key flagged in InvoiceManagement
      number: 'INV-TEMP',  // auto-replaced
      quotationId: q.number,
      customerId: q.customerId,
      date: new Date().toISOString().split('T')[0],
      dueDate: futureDate.toISOString().split('T')[0],
      items: q.items.map((line) => ({ ...line, id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` })),
      subtotal: q.subtotal,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      grandTotal: q.grandTotal,
      paidAmount: 0,
      balance: q.grandTotal,
      notes: `Converted from Quotation ${q.number}. ` + (q.notes || ''),
      status: 'Unpaid',
      payments: [],
    };

    // 3. Set transition variables
    setActiveInvoiceToEdit(draftConvertedInvoice);
    setActiveTab('Invoices');

    // 4. Create Notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Quotation Converted',
      message: `Quotation ${q.number} was approved and converted into an invoice draft.`,
      type: 'success',
      date: new Date().toISOString().split('T')[0],
      read: false,
      quotationId: q.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Invoice Actions
  const handleAddInvoice = (inv: Invoice) => {
    setInvoices((prev) => [inv, ...prev]);
    fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inv) }).catch(console.error);
    // Create notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Invoice Created',
      message: `Tax Invoice ${inv.number} was generated for total $${inv.grandTotal.toFixed(2)}.`,
      type: 'success',
      date: new Date().toISOString().split('T')[0],
      read: false,
      invoiceId: inv.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNotif) }).catch(console.error);
  };

  const handleUpdateInvoice = (inv: Invoice) => {
    setInvoices((prev) => prev.map((item) => (item.id === inv.id ? inv : item)));
    fetch(`/api/invoices/${inv.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inv) }).catch(console.error);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    fetch(`/api/invoices/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Notification Actions
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    fetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(console.error);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch(`/api/notifications/read-all`, { method: 'PUT' }).catch(console.error);
  };

  const handleClearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Automated Overdue / Due in 3 Days Sweep Scan
  const handleTriggerAutomationScan = () => {
    const todayStr = '2026-06-24';
    const upcomingThresholdStr = '2026-06-27'; // today + 3 days

    const newAlerts: AppNotification[] = [];

    invoices.forEach((inv) => {
      // 1. Check Upcoming Due in 3 days (dueDate matches 2026-06-27 and invoice is unpaid/partially paid)
      if (inv.dueDate === upcomingThresholdStr && inv.status !== 'Paid') {
        const alreadyExists = notifications.some(
          (n) => n.invoiceId === inv.id && n.title.includes('Due in 3 Days')
        );
        if (!alreadyExists) {
          newAlerts.push({
            id: `notif-auto-up-${inv.id}`,
            title: 'Payment Due in 3 Days',
            message: `Invoice ${inv.number} has an upcoming payment due date on 2026-06-27. Balance outstanding is $${inv.balance.toFixed(2)}.`,
            type: 'info',
            date: todayStr,
            read: false,
            invoiceId: inv.id,
          });
        }
      }

      // 2. Check Overdue (dueDate is strictly before 2026-06-24 and invoice is unpaid/partially paid)
      if (inv.dueDate < todayStr && inv.status !== 'Paid') {
        const alreadyExists = notifications.some(
          (n) => n.invoiceId === inv.id && n.title.includes('Overdue')
        );
        if (!alreadyExists) {
          // Calculate overdue delta days
          const due = new Date(inv.dueDate);
          const today = new Date(todayStr);
          const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

          newAlerts.push({
            id: `notif-auto-over-${inv.id}`,
            title: 'Overdue Payment Alert',
            message: `Invoice ${inv.number} was due on ${inv.dueDate} and is now overdue by ${diffDays} days. Outstanding Receivable: $${inv.balance.toFixed(2)}.`,
            type: 'warning',
            date: todayStr,
            read: false,
            invoiceId: inv.id,
          });

          // update invoice status in state if not already set to Overdue
          if (inv.status !== 'Overdue') {
            inv.status = 'Overdue';
          }
        }
      }
    });

    if (newAlerts.length > 0) {
      setNotifications((prev) => [...newAlerts, ...prev]);
    }
  };

  // New HR / Work Handlers
  const handleAddEmployee = (e: Employee) => { setEmployees(p => [e, ...p]); fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) }).catch(console.error); };
  const handleUpdateEmployee = (e: Employee) => { setEmployees(p => p.map(x => x.id === e.id ? e : x)); fetch(`/api/employees/${e.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) }).catch(console.error); };
  const handleDeleteEmployee = (id: string) => { setEmployees(p => p.filter(x => x.id !== id)); fetch(`/api/employees/${id}`, { method: 'DELETE' }).catch(console.error); };

  const handleAddTask = (t: Task) => { setTasks(p => [t, ...p]); fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }).catch(console.error); };
  const handleUpdateTask = (t: Task) => { setTasks(p => p.map(x => x.id === t.id ? t : x)); fetch(`/api/tasks/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }).catch(console.error); };
  const handleDeleteTask = (id: string) => { setTasks(p => p.filter(x => x.id !== id)); fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(console.error); };

  const handleAddTimeLog = (t: TimeLog) => { setTimeLogs(p => [t, ...p]); fetch('/api/time-logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }).catch(console.error); };
  const handleUpdateTimeLog = (t: TimeLog) => { setTimeLogs(p => p.map(x => x.id === t.id ? t : x)); fetch(`/api/time-logs/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }).catch(console.error); };
  const handleDeleteTimeLog = (id: string) => { setTimeLogs(p => p.filter(x => x.id !== id)); fetch(`/api/time-logs/${id}`, { method: 'DELETE' }).catch(console.error); };

  const handleAddMeeting = (m: Meeting) => { setMeetings(p => [...p, m]); fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) }).catch(console.error); };
  const handleUpdateMeeting = (m: Meeting) => { setMeetings(p => p.map(x => x.id === m.id ? m : x)); fetch(`/api/meetings/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) }).catch(console.error); };
  const handleDeleteMeeting = (id: string) => { setMeetings(p => p.filter(x => x.id !== id)); fetch(`/api/meetings/${id}`, { method: 'DELETE' }).catch(console.error); };

  // Nav Links Configuration
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Customers', icon: Users },
    { name: 'Quotations', icon: FileText },
    { name: 'Invoices', icon: FileText },
    { name: 'Payments', icon: CreditCard },
    { name: 'Employees', icon: Users },
    { name: 'Tasks', icon: CheckSquare },
    { name: 'Time Logs', icon: Clock },
    { name: 'Meetings', icon: Calendar },
    { name: 'Filters', icon: Filter },
    { name: 'Reports', icon: BarChart3 },
    { name: 'Notifications', icon: Bell, badge: unreadCount },
    { name: 'Settings', icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter(item => (currentUser?.permissions || []).includes(item.name) || currentUser?.role === 'Admin');

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div id="vrtx-app-wrapper" className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased print:bg-white print:p-0">
      
      {/* Print Overlay */}
      {printDocument && (
        <PrintView
          document={printDocument}
          customers={customers}
          settings={settings}
          onClose={() => setPrintDocument(null)}
        />
      )}

      {/* Primary Top Bar Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center text-white font-black text-sm">V</div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">Skenetic digital</span>
            <span className="text-xxs bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-semibold">v3.2</span>
          </div>
        </div>

        {/* Utilities shortcuts */}
        <div className="flex items-center gap-4">
          {/* Notifications bell shortcut */}
          <button
            onClick={() => setActiveTab('Notifications')}
            className="relative p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white font-extrabold text-[8px] rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick profile info */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-100">
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs uppercase">
              {currentUser?.name?.charAt(0) || settings.companyName.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-700 truncate max-w-40">{currentUser?.name || settings.companyName}</p>
              <p className="text-3xxs text-slate-400 font-semibold tracking-wider uppercase">{currentUser?.role || 'BUSINESS ACCOUNT'}</p>
            </div>
            <button onClick={() => setCurrentUser(null)} className="ml-3 text-xs font-bold text-rose-500 hover:text-rose-700 border border-rose-100 hover:bg-rose-50 px-2 py-1 rounded transition cursor-pointer">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Navigation Sidebar (Desktop) */}
        <aside className="hidden md:block w-64 bg-white border-r border-slate-100 p-4 space-y-6 shrink-0 print:hidden">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-3xxs text-slate-400 font-semibold uppercase tracking-widest">AUSTIN HQ SYSTEMS</p>
            <p className="text-3xxs text-indigo-500 font-mono mt-1">Local: {currentTime.toLocaleString()}</p>
          </div>
        </aside>

        {/* Mobile slide-over navigation overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden print:hidden">
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex flex-col w-64 max-w-xs bg-white h-full p-4 space-y-6 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <span className="font-extrabold text-xs uppercase text-slate-800">Navigation Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Subview router stage container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden print:p-0 print:m-0 print:max-w-none">
          {activeTab === 'Dashboard' && (
            <Dashboard
              customers={customers}
              invoices={invoices}
              quotations={quotations}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectInvoice={(inv) => {
                setActiveInvoiceToEdit(inv);
                setActiveTab('Invoices');
              }}
            />
          )}

          {activeTab === 'Customers' && (
            <CustomerManagement
              customers={customers}
              invoices={invoices}
              quotations={quotations}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'Quotations' && (
            <QuotationManagement
              quotations={quotations}
              customers={customers}
              settings={settings}
              onAddQuotation={handleAddQuotation}
              onUpdateQuotation={handleUpdateQuotation}
              onDeleteQuotation={handleDeleteQuotation}
              onConvertToInvoice={handleConvertToInvoice}
              onSelectPrint={(doc) => setPrintDocument(doc)}
            />
          )}

          {activeTab === 'Invoices' && (
            <InvoiceManagement
              invoices={invoices}
              customers={customers}
              settings={settings}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onSelectPrint={(doc) => setPrintDocument(doc)}
              activeInvoiceToEdit={activeInvoiceToEdit}
              onClearActiveInvoiceToEdit={() => setActiveInvoiceToEdit(null)}
            />
          )}

          {activeTab === 'Payments' && (
            <PaymentTracking
              invoices={invoices}
              customers={customers}
            />
          )}

          {activeTab === 'Filters' && (
            <FilterSystem
              invoices={invoices}
              customers={customers}
            />
          )}

          {activeTab === 'Reports' && (
            <Reports
              invoices={invoices}
              customers={customers}
            />
          )}

          {activeTab === 'Notifications' && (
            <NotificationSystem
              notifications={notifications}
              invoices={invoices}
              customers={customers}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearNotification={handleClearNotification}
              onTriggerAutomationScan={handleTriggerAutomationScan}
            />
          )}

          {activeTab === 'Settings' && (
            <AdminSettingsPanel
              settings={settings}
              onSave={(setts) => {
                setSettings(setts);
                fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(setts) }).catch(console.error);
              }}
            />
          )}

          {activeTab === 'Employees' && (
            <EmployeeManagement employees={employees} onAdd={handleAddEmployee} onUpdate={handleUpdateEmployee} onDelete={handleDeleteEmployee} />
          )}

          {activeTab === 'Tasks' && (
            <TaskManagement tasks={tasks} employees={employees} onAdd={handleAddTask} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
          )}

          {activeTab === 'Time Logs' && (
            <TimeTracking timeLogs={timeLogs} employees={employees} tasks={tasks} onAdd={handleAddTimeLog} onUpdate={handleUpdateTimeLog} onDelete={handleDeleteTimeLog} />
          )}

          {activeTab === 'Meetings' && (
            <MeetingSchedule meetings={meetings} employees={employees} onAdd={handleAddMeeting} onUpdate={handleUpdateMeeting} onDelete={handleDeleteMeeting} />
          )}
        </main>
      </div>

      {/* Footer (Hidden in print) */}
      <footer className="bg-white border-t border-slate-100 py-3.5 text-center text-[10px] text-slate-400 font-medium print:hidden">
        <p>© 2026 {settings.companyName}. All ledger transactions are fully backed up locally.</p>
      </footer>
    </div>
  );
}
