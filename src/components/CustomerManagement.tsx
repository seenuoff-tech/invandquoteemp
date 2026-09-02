import React, { useState } from 'react';
import { Customer, Invoice, Quotation } from '../types';
import { Download, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, FileText, User, Users, Briefcase, IndianRupee, X } from 'lucide-react';
import { exportCustomersToExcel } from '../utils/excelExporter';

interface CustomerManagementProps {
  customers: Customer[];
  invoices: Invoice[];
  quotations: Quotation[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomerManagement({
  customers,
  invoices,
  quotations,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}: CustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate dynamic metrics for a customer
  const getCustomerMetrics = (customerId: string) => {
    const custQuotes = quotations.filter((q) => q.customerId === customerId);
    const custInvoices = invoices.filter((i) => i.customerId === customerId);
    
    const totalQuotesCount = custQuotes.length;
    const totalInvoicesCount = custInvoices.length;
    
    let totalPaid = 0;
    let pendingAmount = 0;
    
    custInvoices.forEach((inv) => {
      totalPaid += inv.paidAmount;
      pendingAmount += inv.balance;
    });

    return {
      totalQuotesCount,
      totalInvoicesCount,
      totalPaid,
      pendingAmount,
      custQuotes,
      custInvoices,
    };
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedCustomer(null);
    setName('');
    setCompanyName('');
    setMobile('');
    setEmail('');
    setBillingAddress('');
    setShippingAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening profile
    setIsEditing(true);
    setSelectedCustomer(customer);
    setName(customer.name);
    setCompanyName(customer.companyName);
    setMobile(customer.mobile);
    setEmail(customer.email);
    setBillingAddress(customer.billingAddress);
    setShippingAddress(customer.shippingAddress);
    setNotes(customer.notes || '');
    setIsModalOpen(true);
  };

  const handleCopyBillingToShipping = () => {
    setShippingAddress(billingAddress);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customerData: Customer = {
      id: isEditing && selectedCustomer ? selectedCustomer.id : `cust-${Date.now()}`,
      name,
      companyName,
      mobile,
      email,
      billingAddress,
      shippingAddress,
      notes,
      createdAt: isEditing && selectedCustomer ? selectedCustomer.createdAt : new Date().toISOString().split('T')[0],
    };

    if (isEditing) {
      onUpdateCustomer(customerData);
      // Update active viewing profile if it was edited
      if (viewingProfile?.id === customerData.id) {
        setViewingProfile(customerData);
      }
    } else {
      onAddCustomer(customerData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this customer? This will not delete their historical invoices or quotes, but they will remain linked.')) {
      onDeleteCustomer(id);
      if (viewingProfile?.id === id) {
        setViewingProfile(null);
      }
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      customer.companyName.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.mobile.toLowerCase().includes(term)
    );
  });

  return (
    <div id="customer-mgmt-container" className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Customer Management</h1>
          <p className="text-sm text-slate-500">Add, edit, and view details about your business clients.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportCustomersToExcel(customers, invoices)}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-2.5 rounded-xl transition cursor-pointer shadow-2xs"
            title="Export all customers to Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Customers</span>
          </button>

          <button
            onClick={openAddModal}
            id="add-customer-btn"
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List Panel */}
        <div className={`bg-white rounded-xl border border-slate-100 p-4 space-y-4 ${viewingProfile ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Contact Details</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 text-sm">
                      No customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const metrics = getCustomerMetrics(customer.id);
                    const isSelected = viewingProfile?.id === customer.id;
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setViewingProfile(customer)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{customer.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{customer.companyName || 'Individual'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <div className="text-slate-600 flex items-center gap-1.5 text-xs">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="text-slate-400 flex items-center gap-1.5 text-xs mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{customer.mobile}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {metrics.pendingAmount > 0 ? (
                            <span className="text-amber-600 font-semibold">₹{metrics.pendingAmount.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => openEditModal(customer, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(customer.id, e)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detailed Profile Panel */}
        {viewingProfile && (
          <div id="customer-profile-card" className="bg-white rounded-xl border border-slate-100 p-6 space-y-6 relative h-fit animate-fade-in lg:col-span-1">
            <button
              onClick={() => setViewingProfile(null)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-lg mb-3">
                {viewingProfile.name.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold text-slate-800">{viewingProfile.name}</h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{viewingProfile.companyName}</p>
            </div>

            {/* Quick Metrics */}
            {(() => {
              const metrics = getCustomerMetrics(viewingProfile.id);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                      <div className="text-xxs font-medium text-slate-400 uppercase">Quotations</div>
                      <div className="text-lg font-bold text-slate-700">{metrics.totalQuotesCount}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                      <div className="text-xxs font-medium text-slate-400 uppercase">Invoices</div>
                      <div className="text-lg font-bold text-slate-700">{metrics.totalInvoicesCount}</div>
                    </div>
                    <div className="bg-emerald-50/30 p-3 rounded-lg border border-emerald-100/30">
                      <div className="text-xxs font-medium text-emerald-600 uppercase">Total Paid</div>
                      <div className="text-lg font-bold text-emerald-700">₹{metrics.totalPaid.toFixed(2)}</div>
                    </div>
                    <div className="bg-rose-50/30 p-3 rounded-lg border border-rose-100/30">
                      <div className="text-xxs font-medium text-rose-600 uppercase">Pending</div>
                      <div className="text-lg font-bold text-rose-700">₹{metrics.pendingAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Contact Info Detail */}
                  <div className="space-y-3 text-sm pt-4 border-t border-slate-100">
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xxs text-slate-400 uppercase">Email</div>
                        <div className="text-slate-700 break-all">{viewingProfile.email}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xxs text-slate-400 uppercase">Mobile</div>
                        <div className="text-slate-700">{viewingProfile.mobile}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xxs text-slate-400 uppercase">Billing Address</div>
                        <div className="text-slate-600 text-xs">{viewingProfile.billingAddress}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xxs text-slate-400 uppercase">Shipping Address</div>
                        <div className="text-slate-600 text-xs">{viewingProfile.shippingAddress}</div>
                      </div>
                    </div>

                    {viewingProfile.notes && (
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-xxs text-slate-400 uppercase">Notes</div>
                          <div className="text-slate-600 text-xs italic">{viewingProfile.notes}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Customer Address *</label>
                  <textarea
                    required
                    rows={3}
                    value={billingAddress}
                    onChange={(e) => {
                      setBillingAddress(e.target.value);
                      setShippingAddress(e.target.value);
                    }}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Internal Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
                >
                  {isEditing ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
