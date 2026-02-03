import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

export default function Safe() {
    const { t } = useLanguage();
    const [payments, setPayments] = useState([]);
    const [totalInSafe, setTotalInSafe] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, initial, debt_payment
    const [expandedMonths, setExpandedMonths] = useState({});
    const [expandedDays, setExpandedDays] = useState({});
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({ amount: '', notes: '', payment_method: 'cash' });
    const [isSaving, setIsSaving] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        fetchSafeData();
    }, []);

    const fetchSafeData = async () => {
        try {
            const { data } = await api.get('/safe');
            const list = data.data || [];
            setPayments(list);
            setTotalInSafe(data.total_in_safe);

            // Auto-expand current month and today's day
            if (list.length > 0) {
                const now = new Date();
                const currentMonthKey = now.toLocaleString('default', { month: 'long', year: 'numeric' });
                const todayKey = now.toLocaleDateString();
                setExpandedMonths({ [currentMonthKey]: true });
                setExpandedDays({ [todayKey]: true });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!confirm(t.safe.confirmDelete)) return;

        try {
            await api.delete(`/safe/${id}`);
            fetchSafeData();
            alert(t.safe.entryDeleted);
        } catch (e) {
            console.error(e);
            alert(t.safe.failed);
        }
    };

    const handleAddManualEntry = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/safe', manualForm);
            setShowManualModal(false);
            setManualForm({ amount: '', notes: '', payment_method: 'cash' });
            fetchSafeData();
            alert(t.safe.addSuccess);
        } catch (e) {
            console.error(e);
            alert(t.safe.addFailed);
        } finally {
            setIsSaving(false);
        }
    };

    const handleViewInvoice = async (invoiceId) => {
        try {
            const { data } = await api.get(`/invoices/${invoiceId}`);
            setSelectedInvoice(data);
        } catch (e) {
            console.error(e);
            alert(t.invoices.failedLoad);
        }
    };

    const filteredPayments = useMemo(() => {
        return payments.filter(p => filter === 'all' || p.type === filter);
    }, [payments, filter]);

    // Grouping Logic: Month -> Day -> Payments[]
    const groupedData = useMemo(() => {
        const groups = {};
        filteredPayments.forEach(pay => {
            const date = new Date(pay.created_at);
            const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const dayKey = date.toLocaleDateString();

            if (!groups[monthKey]) {
                groups[monthKey] = { total: 0, days: {} };
            }
            if (!groups[monthKey].days[dayKey]) {
                groups[monthKey].days[dayKey] = { total: 0, payments: [] };
            }

            groups[monthKey].total += parseFloat(pay.amount);
            groups[monthKey].days[dayKey].total += parseFloat(pay.amount);
            groups[monthKey].days[dayKey].payments.push(pay);
        });
        return groups;
    }, [filteredPayments]);

    const toggleMonth = (key) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleDay = (key) => setExpandedDays(prev => ({ ...prev, [key]: !prev[key] }));

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 font-medium">{t.safe.loadingSafe}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <span className="bg-indigo-600 text-white p-2 rounded-xl text-xl shadow-lg shadow-indigo-100">🏦</span>
                        {t.nav.safe}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{t.safe.description}</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowManualModal(true)}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <span>➕</span> {t.safe.addEntry}
                    </button>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-right min-w-[220px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.safe.totalBalance}</p>
                        <p className="text-3xl font-black text-indigo-600">${parseFloat(totalInSafe).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {/* --- Filters --- */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
                <FilterBtn label={t.safe.allStreams} active={filter === 'all'} onClick={() => setFilter('all')} />
                <FilterBtn label={t.safe.newOrders} active={filter === 'initial'} onClick={() => setFilter('initial')} />
                <FilterBtn label={t.safe.remaining} active={filter === 'debt_payment'} onClick={() => setFilter('debt_payment')} />
                <FilterBtn label={t.safe.manual} active={filter === 'manual'} onClick={() => setFilter('manual')} />
            </div>

            {Object.keys(groupedData).length === 0 ? (
                <div className="p-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic">{t.safe.noMatches}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedData).map(([monthKey, monthData]) => (
                        <div key={monthKey} className="space-y-4">
                            {/* --- Month Header --- */}
                            <button
                                onClick={() => toggleMonth(monthKey)}
                                className={`w-full flex justify-between items-center p-6 rounded-2xl border-2 transition-all ${expandedMonths[monthKey]
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-y-[-2px]'
                                    : 'bg-white border-gray-100 text-gray-800 hover:border-indigo-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">📁</span>
                                    <h2 className="text-xl font-black">{monthKey}</h2>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className={`text-[10px] uppercase font-black ${expandedMonths[monthKey] ? 'text-indigo-200' : 'text-gray-400'}`}>{t.safe.monthlyTotal}</p>
                                        <p className="text-lg font-black">${monthData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <span className={`text-xl transition-transform ${expandedMonths[monthKey] ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                            </button>

                            {/* --- Days List --- */}
                            {expandedMonths[monthKey] && (
                                <div className="ml-4 pl-4 border-l-2 border-indigo-100 space-y-4 animate-slideDown">
                                    {Object.entries(monthData.days).map(([dayKey, dayData]) => (
                                        <div key={dayKey} className="space-y-3">
                                            {/* --- Day Header --- */}
                                            <button
                                                onClick={() => toggleDay(dayKey)}
                                                className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${expandedDays[dayKey]
                                                    ? 'bg-gray-800 border-gray-800 text-white shadow-md'
                                                    : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${expandedDays[dayKey] ? 'bg-indigo-400' : 'bg-gray-200'}`}></span>
                                                    <h3 className="font-bold">{new Date(dayKey).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${expandedDays[dayKey] ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {dayData.payments.length} {t.safe.entries}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-black text-sm">${dayData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    <span className={`text-xs transition-transform ${expandedDays[dayKey] ? 'rotate-180' : ''}`}>▼</span>
                                                </div>
                                            </button>

                                            {/* --- Payments Table --- */}
                                            {expandedDays[dayKey] && (
                                                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm animate-fadeIn">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black border-b">
                                                            <tr>
                                                                <th className="px-6 py-4">{t.safe.serialTime}</th>
                                                                <th className="px-6 py-4">{t.safe.entity}</th>
                                                                <th className="px-6 py-4">{t.safe.stream}</th>
                                                                <th className="px-6 py-4">{t.safe.value}</th>
                                                                <th className="px-6 py-4 text-right pr-8">{t.common.actions}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y text-xs">
                                                            {dayData.payments.map(pay => (
                                                                <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-6 py-4">
                                                                        <div className="font-black text-indigo-600">{pay.invoice_id ? `#${pay.invoice_id}` : t.safe.manualSafe}</div>
                                                                        <div className="text-[10px] text-gray-400">{new Date(pay.created_at).toLocaleTimeString()}</div>
                                                                        {pay.notes && <div className="text-[10px] text-indigo-400 mt-1 italic">📝 {pay.notes}</div>}
                                                                    </td>
                                                                    <td className="px-6 py-4 font-bold text-gray-700">
                                                                        {pay.invoice?.customer?.name || (pay.invoice_id ? t.safe.guestStream : t.admin)}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${pay.type === 'initial'
                                                                            ? 'bg-blue-50 text-blue-600'
                                                                            : pay.type === 'debt_payment'
                                                                                ? 'bg-orange-50 text-orange-600'
                                                                                : 'bg-green-50 text-green-600'
                                                                            }`}>
                                                                            {pay.type === 'initial' ? t.safe.initial : pay.type === 'debt_payment' ? t.safe.remaining : t.safe.manual}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="font-black text-green-600 text-base">+${parseFloat(pay.amount).toLocaleString()}</div>
                                                                        <div className="text-[9px] text-gray-400 uppercase font-black">{pay.payment_method}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right pr-8">
                                                                        <div className="flex justify-end gap-2">
                                                                            {pay.invoice_id && (
                                                                                <button
                                                                                    onClick={() => handleViewInvoice(pay.invoice_id)}
                                                                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-lg"
                                                                                    title={t.invoices.viewRecord}
                                                                                >
                                                                                    <EyeIcon />
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleDeleteEntry(pay.id)}
                                                                                className="p-2 text-gray-200 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                                                                                title={t.safe.reverseTransaction}
                                                                            >
                                                                                <TrashIcon />
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
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- Manual Entry Modal --- */}
            {showManualModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-800">{t.safe.addManualEntry}</h2>
                            <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleAddManualEntry} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.safe.amount}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold transition-all"
                                        value={manualForm.amount}
                                        onChange={e => setManualForm({ ...manualForm, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.safe.notes}</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-medium transition-all"
                                    placeholder={t.safe.notes}
                                    value={manualForm.notes}
                                    onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                                />
                            </div>

                            <button
                                disabled={isSaving}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 mt-4 active:scale-95"
                            >
                                {isSaving ? t.common.loading : t.common.save}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Invoice Details Modal (Merged from Invoices) --- */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fadeIn">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-scaleUp">
                        <button
                            onClick={() => setSelectedInvoice(null)}
                            className="absolute top-6 right-6 text-gray-300 hover:text-gray-600 text-2xl transition-colors"
                        >
                            ✕
                        </button>

                        <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                            <div>
                                <h2 className="text-3xl font-black text-indigo-600 tracking-tighter">{t.nav.history}</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{t.common.orderNo} #{selectedInvoice.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-gray-800">{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(selectedInvoice.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                <h4 className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">{t.dashboard.customer}</h4>
                                <p className="font-black text-gray-800">{selectedInvoice.customer?.name || t.dashboard.guest}</p>
                                <p className="text-[10px] text-gray-500 font-bold">{selectedInvoice.customer?.phone}</p>
                            </div>
                            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                <h4 className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">{t.dashboard.method}</h4>
                                <p className="font-black text-indigo-600 uppercase text-sm">{selectedInvoice.payment_method}</p>
                                <p className="text-[9px] text-gray-400 font-black tracking-tighter leading-relaxed">
                                    {t.invoices.recordedBy} {selectedInvoice.user?.name}
                                </p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest text-center">{t.invoices.purchasedInventory}</h4>
                            <div className="overflow-hidden border border-gray-100 rounded-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3">{t.invoices.article}</th>
                                            <th className="px-4 py-3 text-center">{t.common.qty}</th>
                                            <th className="px-4 py-3 text-right">{t.common.subtotal}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                        {selectedInvoice.items.map(item => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-4">
                                                    <div className="font-black text-gray-800">{item.product?.brand} {item.product?.model_code}</div>
                                                    <div className="text-[9px] text-gray-400 uppercase font-black">{t.products.types[item.product?.type] || item.product?.type}</div>
                                                </td>
                                                <td className="px-4 py-4 text-center text-gray-500 font-black">{item.quantity}</td>
                                                <td className="px-4 py-4 text-right font-black text-gray-800">${item.subtotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t-2 border-dashed border-gray-100">
                            <div className="w-48 space-y-2">
                                <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase">
                                    <span>{t.common.subtotal}:</span>
                                    <span>${selectedInvoice.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-red-400 font-black uppercase">
                                    <span>{t.invoices.discount}:</span>
                                    <span>-${selectedInvoice.discount}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-green-600 pt-1 uppercase">
                                    <span>{t.sales.amountPaid}:</span>
                                    <span>${selectedInvoice.amount_paid}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-indigo-600 pt-2 border-t border-gray-100">
                                    <span>{t.common.total}:</span>
                                    <span>${selectedInvoice.total}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                            >
                                🖨️ {t.invoices.generatePdf}
                            </button>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="px-8 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                            >
                                {t.common.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterBtn({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${active
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
                }`}
        >
            {label}
        </button>
    );
}

function TrashIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}
