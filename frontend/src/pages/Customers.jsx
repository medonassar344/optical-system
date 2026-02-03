import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import CustomerForm from '../components/CustomerForm';
import { useLanguage } from '../context/LanguageContext';

export default function Customers() {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [viewingHistory, setViewingHistory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const { data } = await api.get('/customers');
        setCustomers(data.data);
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    const handleSave = async (formData) => {
        try {
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer.id}`, formData);
            } else {
                await api.post('/customers', formData);
            }
            setShowModal(false);
            setEditingCustomer(null);
            fetchCustomers();
        } catch (e) {
            console.error(e);
            alert(t.customers.failedSave);
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t.common.areYouSure)) return;
        await api.delete(`/customers/${id}`);
        fetchCustomers();
    };

    const handleViewHistory = async (customer) => {
        try {
            const { data } = await api.get(`/customers/${customer.id}`);
            setViewingHistory(data);
        } catch (e) {
            console.error(e);
            alert(t.customers.failedHistory);
        }
    };

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto animate-reveal">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">{t.customers.customers}</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">
                        {filteredCustomers.length} {t.customers.customers.toLowerCase()} {t.dashboard.live}
                    </p>
                </div>
                <div className="flex w-full sm:w-auto gap-4 items-center">
                    <div className="relative flex-1 sm:min-w-[350px]">
                        <input
                            type="text"
                            placeholder={t.customers.searchPlaceholder}
                            className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="absolute left-5 top-4 opacity-20">🔎</span>
                    </div>
                    <button
                        onClick={() => { setEditingCustomer(null); setShowModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-widest text-xs whitespace-nowrap"
                    >
                        + {t.customers.addCustomer}
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="glass-card overflow-hidden">
                <table className="min-w-full border-collapse">
                    <thead className="bg-white/5 border-b border-white/5">
                        <tr>
                            <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.name}</th>
                            <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.phone}</th>
                            <th className="px-10 py-6 text-right text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer, idx) => (
                                <tr key={customer.id} className="group hover:bg-white/[0.02] transition-all animate-reveal" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                                {customer.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="text-xs font-bold text-gray-400 font-mono tracking-widest">{customer.phone}</span>
                                    </td>
                                    <td className="px-10 py-6 text-right whitespace-nowrap space-x-6">
                                        <button onClick={() => handleViewHistory(customer)} className="text-[10px] font-bold text-emerald-400/80 hover:text-emerald-400 transition-colors uppercase tracking-widest">{t.customers.profile}</button>
                                        <button onClick={() => handleEdit(customer)} className="text-[10px] font-bold text-indigo-400 hover:text-white transition-colors uppercase tracking-widest">{t.common.edit}</button>
                                        <button onClick={() => handleDelete(customer.id)} className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest">{t.common.delete}</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-10 py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-[10px] opacity-50">
                                    {t.dashboard.table.noDebts}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 z-50 animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
                        <h2 className="text-4xl font-black text-white mb-10 tracking-tight leading-none uppercase">
                            {editingCustomer ? t.customers.editCustomer : t.customers.newCustomer}
                        </h2>
                        <CustomerForm
                            initialData={editingCustomer}
                            onSubmit={handleSave}
                            onCancel={() => setShowModal(false)}
                            darkTheme={true}
                        />
                    </div>
                </div>
            )}

            {/* History Modal */}
            {viewingHistory && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 z-50 animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[4rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/5 blur-[120px] -ml-40 -mt-40"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h2 className="text-5xl font-black text-white tracking-tighter mb-2">{viewingHistory.name}</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-[0.3em] bg-indigo-500/5 px-4 py-1.5 rounded-full border border-indigo-500/10">{t.common.profile}</span>
                                        <span className="text-xs font-bold text-gray-500 font-mono">{viewingHistory.phone}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingHistory(null)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all text-2xl"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Prescription Display */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-reveal stagger-1">
                                <PrescriptionCard label="OD (Right Eye)" data={viewingHistory.medical_info?.od} color="indigo" ipd={viewingHistory.medical_info?.ipd} />
                                <PrescriptionCard label="OS (Left Eye)" data={viewingHistory.medical_info?.os} color="emerald" />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-gray-600 uppercase tracking-[0.4em] mb-8">{t.customers.orderHistory}</h3>

                                {viewingHistory.invoices && viewingHistory.invoices.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {viewingHistory.invoices.map((invoice, invIdx) => (
                                            <div key={invoice.id} className="glass-card overflow-hidden animate-reveal" style={{ animationDelay: `${invIdx * 0.1}s` }}>
                                                <div className="bg-white/5 px-8 py-5 flex justify-between items-center border-b border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-black text-indigo-400 tracking-tighter">ORD-#{invoice.id}</span>
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                                            {new Date(invoice.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-lg font-black text-white tracking-tighter">${invoice.total}</div>
                                                </div>
                                                <div className="p-8">
                                                    <table className="min-w-full text-left">
                                                        <thead className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
                                                            <tr>
                                                                <th className="pb-4">{t.common.name}</th>
                                                                <th className="pb-4 text-center">{t.common.qty}</th>
                                                                <th className="pb-4 text-right">{t.common.price}</th>
                                                                <th className="pb-4 text-right">TOTAL</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {invoice.items.map(item => (
                                                                <tr key={item.id} className="group">
                                                                    <td className="py-4">
                                                                        <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                                                            {item.product?.brand || 'Unknown'} {item.product?.model_code}
                                                                        </div>
                                                                        <div className="text-[9px] font-bold text-gray-600 uppercase mt-1">{item.product?.type}</div>
                                                                    </td>
                                                                    <td className="py-4 text-center text-sm font-bold text-gray-400">{item.quantity}</td>
                                                                    <td className="py-4 text-right text-sm font-bold text-gray-400">${item.price}</td>
                                                                    <td className="py-4 text-right text-sm font-bold text-white">${item.subtotal}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem]">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{t.customers.noOrders}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PrescriptionCard({ label, data, color, ipd }) {
    const accents = {
        indigo: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
    };
    return (
        <div className={`p-8 rounded-[2.5rem] border ${accents[color]} relative overflow-hidden group hover:bg-white/[0.01] transition-all`}>
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -mr-16 -mt-16 bg-${color}-500 transition-all group-hover:opacity-40`}></div>
            <div className="flex justify-between items-center mb-8 relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{label}</h4>
                {ipd && <span className="text-[9px] font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg">IPD: {ipd}</span>}
            </div>

            <div className="grid grid-cols-2 gap-8 relative z-10">
                <PrescrValue label="SPH" val={data?.sph} color={color} />
                <PrescrValue label="CYL" val={data?.cyl} color={color} />
                <PrescrValue label="AXIS" val={data?.axis} color={color} />
                <PrescrValue label="ADD" val={data?.add} color={color} />
            </div>
        </div>
    );
}

function PrescrValue({ label, val, color }) {
    return (
        <div className="space-y-1">
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-black tracking-tighter text-white group-hover:text-${color}-400 transition-colors`}>{val || '0.00'}</p>
        </div>
    );
}
