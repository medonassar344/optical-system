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
        <div className="space-y-12 pb-20 max-w-7xl mx-auto animate-reveal">
            {/* Header / Top Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        {t.nav.safe}
                        <span className="block text-xs font-bold text-indigo-500 tracking-[0.4em] mt-4 opacity-70">{t.safe.description}</span>
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto">
                    <div className="glass-card flex-1 min-w-[280px] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">{t.safe.totalBalance}</p>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white tracking-tighter">${parseFloat(totalInSafe).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs font-bold text-emerald-400 mb-1.5 uppercase tracking-widest">{t.dashboard.live}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowManualModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-6 rounded-3xl font-black transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 uppercase tracking-[0.2em] text-xs h-fit"
                    >
                        {t.safe.addEntry}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-white/[0.02] border border-white/5 p-2 rounded-[2rem] w-fit">
                <FilterBtn label={t.safe.allStreams} active={filter === 'all'} onClick={() => setFilter('all')} />
                <FilterBtn label={t.safe.newOrders} active={filter === 'initial'} onClick={() => setFilter('initial')} />
                <FilterBtn label={t.safe.remaining} active={filter === 'debt_payment'} onClick={() => setFilter('debt_payment')} />
                <FilterBtn label={t.safe.manual} active={filter === 'manual'} onClick={() => setFilter('manual')} />
            </div>

            {/* Safe Content */}
            {Object.keys(groupedData).length === 0 ? (
                <div className="p-32 text-center glass-card border-dashed">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4">Empty Vault</p>
                    <p className="text-gray-500 font-bold italic">{t.safe.noMatches}</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedData).map(([monthKey, monthData], mIdx) => (
                        <div key={monthKey} className="space-y-6 animate-reveal" style={{ animationDelay: `${mIdx * 0.1}s` }}>
                            {/* Month Header */}
                            <button
                                onClick={() => toggleMonth(monthKey)}
                                className={`w-full group relative overflow-hidden transition-all duration-500 rounded-[3rem] border ${expandedMonths[monthKey]
                                    ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-600/20'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-center p-10 relative z-10">
                                    <div className="flex items-center gap-10">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl transition-all ${expandedMonths[monthKey] ? 'bg-white/20' : 'bg-white/5'}`}>
                                            📅
                                        </div>
                                        <div className="text-left">
                                            <h2 className={`text-2xl font-black tracking-tighter uppercase ${expandedMonths[monthKey] ? 'text-white' : 'text-white/80'}`}>{monthKey}</h2>
                                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] mt-1 ${expandedMonths[monthKey] ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                {Object.keys(monthData.days).length} {t.safe.entries} recorded
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${expandedMonths[monthKey] ? 'text-indigo-200' : 'text-gray-500'}`}>{t.safe.monthlyTotal}</p>
                                            <p className={`text-3xl font-black tracking-tighter ${expandedMonths[monthKey] ? 'text-white' : 'text-indigo-400'}`}>
                                                ${monthData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${expandedMonths[monthKey] ? 'border-white/30 rotate-180' : 'border-white/10 text-gray-500'}`}>
                                            ↓
                                        </div>
                                    </div>
                                </div>
                                {expandedMonths[monthKey] && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>}
                            </button>

                            {/* Days List */}
                            {expandedMonths[monthKey] && (
                                <div className="grid grid-cols-1 gap-6 pl-10 border-l border-white/10 animate-reveal">
                                    {Object.entries(monthData.days).map(([dayKey, dayData], dIdx) => (
                                        <div key={dayKey} className="space-y-4 animate-reveal" style={{ animationDelay: `${dIdx * 0.05}s` }}>
                                            {/* Day Row */}
                                            <button
                                                onClick={() => toggleDay(dayKey)}
                                                className={`w-full flex justify-between items-center px-8 py-6 rounded-[2rem] border transition-all ${expandedDays[dayKey]
                                                    ? 'bg-white/5 border-white/10'
                                                    : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-2 h-2 rounded-full ${expandedDays[dayKey] ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-gray-700'}`}></div>
                                                    <h3 className={`text-sm font-black uppercase tracking-widest ${expandedDays[dayKey] ? 'text-white' : 'text-gray-500'}`}>
                                                        {new Date(dayKey).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <span className="text-xs font-black text-indigo-400/80 tracking-tighter">${dayData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    <span className={`text-[10px] font-bold text-gray-600 transition-transform ${expandedDays[dayKey] ? 'rotate-180' : ''}`}>▼</span>
                                                </div>
                                            </button>

                                            {/* Tables for each Day */}
                                            {expandedDays[dayKey] && (
                                                <div className="glass-card overflow-hidden animate-reveal stagger-1">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                                                            <tr>
                                                                <th className="px-8 py-4">{t.safe.serialTime}</th>
                                                                <th className="px-8 py-4">{t.safe.entity}</th>
                                                                <th className="px-8 py-4">{t.safe.stream}</th>
                                                                <th className="px-8 py-4">{t.safe.value}</th>
                                                                <th className="px-8 py-4 text-right">ACTIONS</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {dayData.payments.map((pay, pIdx) => (
                                                                <tr key={pay.id} className="group hover:bg-white/[0.02] transition-colors animate-reveal" style={{ animationDelay: `${pIdx * 0.05}s` }}>
                                                                    <td className="px-8 py-6">
                                                                        <div className="font-black text-indigo-400 tracking-tighter">{pay.invoice_id ? `ORD-#${pay.invoice_id}` : t.safe.manualSafe}</div>
                                                                        <div className="text-[10px] font-bold text-gray-600 uppercase mt-1 tracking-widest">{new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                        {pay.notes && <div className="text-[10px] font-bold text-emerald-500/60 mt-2 bg-emerald-500/5 px-2 py-1 rounded w-fit">💬 {pay.notes}</div>}
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <span className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors uppercase">
                                                                            {pay.invoice?.customer?.name || (pay.invoice_id ? t.safe.guestStream : t.admin)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${pay.type === 'initial'
                                                                            ? 'text-blue-400 bg-blue-500/5 border-blue-500/10'
                                                                            : pay.type === 'debt_payment'
                                                                                ? 'text-orange-400 bg-orange-500/5 border-orange-500/10'
                                                                                : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                                                                            }`}>
                                                                            {pay.type === 'initial' ? t.safe.initial : pay.type === 'debt_payment' ? t.safe.remaining : t.safe.manual}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <div className="font-black text-white text-lg tracking-tighter">+${parseFloat(pay.amount).toLocaleString()}</div>
                                                                        <div className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em]">{pay.payment_method}</div>
                                                                    </td>
                                                                    <td className="px-8 py-6 text-right space-x-4">
                                                                        {pay.invoice_id && (
                                                                            <button onClick={() => handleViewInvoice(pay.invoice_id)} className="text-[9px] font-black text-indigo-400/60 hover:text-white uppercase tracking-widest transition-all">{t.invoices.viewRecord}</button>
                                                                        )}
                                                                        <button onClick={() => handleDeleteEntry(pay.id)} className="text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-all">{t.safe.reverseTransaction}</button>
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

            {/* Manual Entry Modal */}
            {showManualModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 z-[100] animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
                        <h2 className="text-3xl font-black text-white mb-10 tracking-tighter uppercase flex-shrink-0">{t.safe.addManualEntry}</h2>

                        <form onSubmit={handleAddManualEntry} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-4 -mr-4 pb-4">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-4">{t.safe.amount}</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-700">$</span>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-white/5 border border-white/10 p-6 pl-14 rounded-2xl text-2xl font-black text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-800"
                                            placeholder="0.00"
                                            value={manualForm.amount}
                                            onChange={e => setManualForm({ ...manualForm, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-4">{t.safe.notes}</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all h-32 placeholder:text-gray-800"
                                        placeholder={t.safe.notes}
                                        value={manualForm.notes}
                                        onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 mt-6 border-t border-white/5 flex-shrink-0">
                                <button type="button" onClick={() => setShowManualModal(false)} className="flex-1 px-8 py-5 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest focus:outline-none">{t.common.cancel}</button>
                                <button
                                    disabled={isSaving}
                                    className="flex-[2] bg-indigo-600 text-white py-5 rounded-3xl font-black text-xs hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 uppercase tracking-[0.2em]"
                                >
                                    {isSaving ? t.common.loading : t.common.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Details Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 z-[110] animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[4rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative animate-reveal">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[120px] -mr-40 -mt-40"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t.nav.history}</h2>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-4 opacity-70">{t.common.orderNo} #{selectedInvoice.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all text-2xl"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-12">
                                <div className="glass-card p-6 border-none bg-white/[0.03]">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.dashboard.customer}</p>
                                    <p className="text-lg font-black text-white uppercase tracking-tighter">{selectedInvoice.customer?.name || t.dashboard.guest}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1 font-mono tracking-widest">{selectedInvoice.customer?.phone}</p>
                                </div>
                                <div className="glass-card p-6 border-none bg-white/[0.03]">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.dashboard.method}</p>
                                    <p className="text-lg font-black text-indigo-400 uppercase tracking-tighter">{selectedInvoice.payment_method}</p>
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">By {selectedInvoice.user?.name}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-12">
                                <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] text-center mb-8">{t.invoices.purchasedInventory}</h4>
                                <div className="glass-card overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                            <tr>
                                                <th className="px-6 py-4">{t.invoices.article}</th>
                                                <th className="px-6 py-4 text-center">{t.common.qty}</th>
                                                <th className="px-6 py-4 text-right">PRICE</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {selectedInvoice.items.map(item => (
                                                <tr key={item.id} className="group">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors uppercase">{item.product?.brand} {item.product?.model_code}</div>
                                                        <div className="text-[9px] font-black text-gray-600 uppercase mt-1 tracking-widest">{item.product?.type}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm font-black text-gray-400">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-black text-white">${item.subtotal}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end mb-12">
                                <div className="w-64 space-y-4 pt-6 border-t border-white/10">
                                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <span>SUBTOTAL</span>
                                        <span className="text-white font-mono">${selectedInvoice.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-red-500/60 uppercase tracking-widest">
                                        <span>{t.invoices.discount}</span>
                                        <span className="font-mono">-${selectedInvoice.discount}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                        <span>PAID</span>
                                        <span className="font-mono">${selectedInvoice.amount_paid}</span>
                                    </div>
                                    <div className="flex justify-between text-4xl font-black text-indigo-400 tracking-tighter pt-4 border-t border-white/5">
                                        <span className="text-xs uppercase tracking-[0.3em] self-center">{t.common.total}</span>
                                        <span>${selectedInvoice.total}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-6 sticky bottom-0 bg-[#0f1218]/90 backdrop-blur-md pb-6">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10"
                                >
                                    🖨️ {t.invoices.generatePdf}
                                </button>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all"
                                >
                                    {t.common.close}
                                </button>
                            </div>
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
            className={`px-8 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border ${active
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                : 'text-gray-600 border-transparent hover:text-white hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    );
}
