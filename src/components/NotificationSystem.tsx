import React, { useState } from 'react';
import { AppNotification, Invoice, Customer } from '../types';
import { Bell, CheckCircle2, AlertTriangle, Info, Trash2, Mail, Send, Calendar, Play, Clock } from 'lucide-react';

interface NotificationSystemProps {
  notifications: AppNotification[];
  invoices: Invoice[];
  customers: Customer[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onTriggerAutomationScan: () => void;
}

export default function NotificationSystem({
  notifications,
  invoices,
  customers,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onTriggerAutomationScan,
}: NotificationSystemProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleSimulateReminder = (notif: AppNotification, channel: 'Email' | 'WhatsApp') => {
    let targetContact = '';
    let invoiceNo = '';
    
    if (notif.invoiceId) {
      const inv = invoices.find((i) => i.id === notif.invoiceId);
      invoiceNo = inv?.number || 'INV-XXXX';
      const cust = customers.find((c) => c.id === inv?.customerId);
      targetContact = channel === 'Email' ? cust?.email || '' : cust?.mobile || '';
    }

    alert(
      `Simulated Automatic Reminder dispatched successfully!\n\n` +
      `Channel: ${channel}\n` +
      `Recipient: ${targetContact || 'Client Contact'}\n` +
      `Subject/Content: [Urgent Payment Reminder] for Invoice ${invoiceNo}.\n` +
      `Status: Sent`
    );
  };

  return (
    <div id="notification-center-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Notification Center</h1>
          <p className="text-sm text-slate-500 font-normal">Monitor automated financial alerts, payment warnings, and workflow status.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Automation Scan Trigger */}
          <button
            onClick={() => {
              onTriggerAutomationScan();
              alert('Ledger scan complete. Automated alerts generated for upcoming due dates (3 days) and overdue statements.');
            }}
            className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
            title="Scan database for overdue invoices and upcoming due dates"
          >
            <Play className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Scan for Reminders</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-lg font-semibold transition border border-indigo-100 cursor-pointer"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Notifications List */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-400" />
              <span>In-App Alerts ({filteredNotifications.length})</span>
            </h3>

            <div className="flex gap-2 text-xxs font-semibold">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded ${filter === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No notifications to display.
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isOverdueAlert = n.title.includes('Overdue');
                const isUpcomingDue = n.title.includes('Due');
                const isSuccess = n.type === 'success';

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border flex gap-3 transition relative ${
                      !n.read ? 'bg-indigo-50/15 border-indigo-100/50' : 'bg-white border-slate-100'
                    }`}
                  >
                    {/* Status Dot */}
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 absolute top-4 left-4" />
                    )}

                    {/* Icon wrapper */}
                    <div className={`p-2 rounded-lg h-fit ${!n.read ? 'ml-2.5' : ''} ${
                      isOverdueAlert ? 'bg-rose-50 text-rose-600' :
                      isUpcomingDue ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {isOverdueAlert && <AlertTriangle className="w-4 h-4" />}
                      {isUpcomingDue && <Clock className="w-4 h-4" />}
                      {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                    </div>

                    {/* Content wrapper */}
                    <div className="flex-1 space-y-1 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 text-xs">{n.title}</span>
                        <span className="text-3xxs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{n.date}</span>
                        </span>
                      </div>
                      <p className="text-xxs text-slate-500 leading-relaxed">{n.message}</p>

                      {/* Action Triggers */}
                      {n.invoiceId && (
                        <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                          <span className="text-3xxs text-slate-400 uppercase font-semibold">Remind Client:</span>
                          <button
                            onClick={() => handleSimulateReminder(n, 'Email')}
                            className="flex items-center gap-1 text-3xxs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded hover:bg-blue-100 transition"
                          >
                            <Mail className="w-2.5 h-2.5" />
                            <span>Email</span>
                          </button>
                          <button
                            onClick={() => handleSimulateReminder(n, 'WhatsApp')}
                            className="flex items-center gap-1 text-3xxs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="absolute right-3 top-3 flex items-center gap-1">
                      {!n.read && (
                        <button
                          onClick={() => onMarkAsRead(n.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-3xxs font-bold px-1 py-0.5"
                          title="Mark Read"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => onClearNotification(n.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Information/Insights */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 lg:col-span-1 h-fit">
          <div className="border-b border-slate-50 pb-2">
            <h3 className="text-sm font-semibold text-slate-800">Alert Diagnostics</h3>
            <p className="text-xxs text-slate-400">Rules applied in automated notification sweeps.</p>
          </div>

          <div className="space-y-4 text-xxs leading-relaxed">
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded bg-blue-50 text-blue-600 mt-0.5">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Upcoming Payment sweeps</p>
                <p className="text-slate-500">Triggered precisely 3 days prior to an unpaid invoice's due date. Scans balance offsets.</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded bg-rose-50 text-rose-600 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Overdue Reminders</p>
                <p className="text-slate-500">Triggered daily for any active ledger invoice whose payment due date is less than today's baseline.</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded bg-emerald-50 text-emerald-600 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Client Actions</p>
                <p className="text-slate-500">Includes notification confirmations when proposals are marked as "Approved" or converted into tax invoices.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
