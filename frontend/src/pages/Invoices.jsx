import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

export default function Invoices() {
    const { t } = useLanguage();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedMonths, setExpandedMonths] = useState({});
    const [expandedDays, setExpandedDays] = useState({});

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data } = await api.get('/invoices');
            const list = data.data || [];
            setInvoices(list);

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

    const handleViewInvoice = async (id) => {
        try {
            const { data } = await api.get(`/invoices/${id}`);
            setSelectedInvoice(data);
        } catch (e) {
            console.error(e);
            alert(t.invoices.failedDetails);
        }
    };

    // Filtered list
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv =>
            inv.id.toString().includes(searchTerm) ||
            inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [invoices, searchTerm]);

    // Grouping Logic: Month -> Day -> Invoices[]
    const groupedData = useMemo(() => {
        const groups = {};
        filteredInvoices.forEach(inv => {
            const date = new Date(inv.created_at);
            const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const dayKey = date.toLocaleDateString();

            if (!groups[monthKey]) {
                groups[monthKey] = { total: 0, days: {} };
            }
            if (!groups[monthKey].days[dayKey]) {
                groups[monthKey].days[dayKey] = { total: 0, invoices: [] };
            }

            groups[monthKey].total += parseFloat(inv.total);
            groups[monthKey].days[dayKey].total += parseFloat(inv.total);
            groups[monthKey].days[dayKey].invoices.push(inv);
        });
        return groups;
    }, [filteredInvoices]);

    const toggleMonth = (key) => {
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleDay = (key) => {
        setExpandedDays(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-12 pb-20 max-w-7xl mx-auto animate-reveal">
            {/* Header / Search */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        {t.nav.salesHistory}
                        <span className="block text-xs font-bold text-indigo-500 tracking-[0.4em] mt-4 opacity-70">{t.invoices.description}</span>
                    </h1>
                </div>

                <div className="relative w-full sm:w-[400px]">
                    <input
                        type="text"
                        placeholder={t.invoices.searchPlaceholder}
                        className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-3xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute left-6 top-5 opacity-20">🔎</span>
                </div>
            </div>

            {/* Content Area */}
            {Object.keys(groupedData).length === 0 ? (
                <div className="p-32 text-center glass-card border-dashed">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4">No Transactions</p>
                    <p className="text-gray-500 font-bold italic">{t.invoices.noMatches}</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedData).map(([monthKey, monthData], mIdx) => (
                        <div key={monthKey} className="space-y-6 animate-reveal" style={{ animationDelay: `${mIdx * 0.1}s` }}>
                            {/* Month Accordion Header */}
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
                                            📊
                                        </div>
                                        <div className="text-left">
                                            <h2 className={`text-2xl font-black tracking-tighter uppercase ${expandedMonths[monthKey] ? 'text-white' : 'text-white/80'}`}>{monthKey}</h2>
                                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] mt-1 ${expandedMonths[monthKey] ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                {Object.keys(monthData.days).length} Active selling days
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${expandedMonths[monthKey] ? 'text-indigo-200' : 'text-gray-500'}`}>{t.invoices.monthlyVolume}</p>
                                            <p className={`text-3xl font-black tracking-tighter ${expandedMonths[monthKey] ? 'text-white' : 'text-indigo-400'}`}>
                                                ${monthData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${expandedMonths[monthKey] ? 'border-white/30 rotate-180' : 'border-white/10 text-gray-500'}`}>
                                            ↓
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Days within Month */}
                            {expandedMonths[monthKey] && (
                                <div className="grid grid-cols-1 gap-6 pl-10 border-l border-white/10 animate-reveal">
                                    {Object.entries(monthData.days).map(([dayKey, dayData], dIdx) => (
                                        <div key={dayKey} className="space-y-4 animate-reveal" style={{ animationDelay: `${dIdx * 0.05}s` }}>
                                            {/* Day Header */}
                                            <button
                                                onClick={() => toggleDay(dayKey)}
                                                className={`w-full flex justify-between items-center px-8 py-6 rounded-[2.5rem] border transition-all ${expandedDays[dayKey]
                                                    ? 'bg-white/5 border-white/10 shadow-lg'
                                                    : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-2 h-2 rounded-full ${expandedDays[dayKey] ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-gray-700'}`}></div>
                                                    <h3 className={`text-sm font-black uppercase tracking-widest ${expandedDays[dayKey] ? 'text-white' : 'text-gray-500'}`}>
                                                        {new Date(dayKey).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                                    </h3>
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full ${expandedDays[dayKey] ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-600'}`}>
                                                        {dayData.invoices.length} orders
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <span className="text-sm font-black text-indigo-400 tracking-tighter">${dayData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    <span className={`text-[10px] transition-transform ${expandedDays[dayKey] ? 'rotate-180 text-white' : 'text-gray-600'}`}>▼</span>
                                                </div>
                                            </button>

                                            {/* Orders Table for Day */}
                                            {expandedDays[dayKey] && (
                                                <div className="glass-card overflow-hidden animate-reveal stagger-1">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                                                            <tr>
                                                                <th className="px-8 py-5">{t.invoices.order}</th>
                                                                <th className="px-8 py-5">{t.common.customer}</th>
                                                                <th className="px-8 py-5">{t.invoices.financials}</th>
                                                                <th className="px-8 py-5">{t.invoices.method}</th>
                                                                <th className="px-8 py-5 text-right">ACTION</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {dayData.invoices.map((inv, pIdx) => (
                                                                <tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors animate-reveal" style={{ animationDelay: `${pIdx * 0.05}s` }}>
                                                                    <td className="px-8 py-6">
                                                                        <div className="font-black text-indigo-400 tracking-tighter">ORD-#{inv.id}</div>
                                                                        <div className="text-[10px] font-bold text-gray-600 uppercase mt-1 tracking-widest">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <div className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors uppercase">{inv.customer?.name || t.dashboard.guest}</div>
                                                                        <div className="text-[10px] font-bold text-gray-600 mt-1 font-mono tracking-widest">{inv.customer?.phone}</div>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="text-lg font-black text-white tracking-tighter">${inv.total}</span>
                                                                            {inv.balance > 0 && (
                                                                                <span className="text-[8px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-[0.5rem] tracking-tighter">
                                                                                    -${inv.balance} DEBT
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <span className="px-3 py-1.5 rounded-full bg-white/5 text-gray-500 text-[9px] font-black uppercase tracking-widest group-hover:text-indigo-400 border border-white/5 transition-colors">
                                                                            {inv.payment_method}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-6 text-right">
                                                                        <button
                                                                            onClick={() => handleViewInvoice(inv.id)}
                                                                            className="text-[9px] font-black text-indigo-400/60 hover:text-white uppercase tracking-[0.2em] transition-all"
                                                                        >
                                                                            {t.invoices.viewRecord}
                                                                        </button>
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

            {/* Invoice Details Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 z-[110] animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[4rem] shadow-2xl w-full max-w-2xl max-h-[90vh] relative overflow-hidden flex flex-col animate-reveal">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[120px] -mr-40 -mt-40"></div>

                        <div className="flex justify-between items-start mb-12 flex-shrink-0 relative z-10">
                            <div>
                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t.invoices.invoiceTitle}</h2>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-4 opacity-70">{t.invoices.serialId}: #{selectedInvoice.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 relative z-10">
                            <div className="grid grid-cols-2 gap-8 mb-12">
                                <div className="glass-card p-6 border-none bg-white/[0.03]">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.invoices.clientIdentity}</p>
                                    <p className="text-lg font-black text-white uppercase tracking-tighter">{selectedInvoice.customer?.name || t.invoices.guestAccount}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1 font-mono tracking-widest">{selectedInvoice.customer?.phone}</p>
                                </div>
                                <div className="glass-card p-6 border-none bg-white/[0.03]">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.invoices.transactionDetails}</p>
                                    <p className="text-lg font-black text-indigo-400 uppercase tracking-tighter">{selectedInvoice.payment_method}</p>
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Recorded by {selectedInvoice.user?.name}</p>
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

                            {/* Ledger */}
                            {selectedInvoice.payments?.length > 0 && (
                                <div className="mb-12 bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                                    <h4 className="text-[9px] font-black text-gray-500 uppercase mb-8 tracking-[0.4em] text-center">{t.invoices.paymentLifecycle}</h4>
                                    <div className="space-y-4">
                                        {selectedInvoice.payments.map(pay => (
                                            <div key={pay.id} className="flex justify-between items-center bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                                                <div>
                                                    <p className="text-xs font-black text-white/80">{new Date(pay.created_at).toLocaleDateString()}</p>
                                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">{pay.notes || "Auto Processed"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-emerald-400 font-black text-sm">+${pay.amount}</p>
                                                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">{pay.payment_method}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                    {selectedInvoice.balance > 0 && (
                                        <div className="flex justify-between text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                            <span>{t.invoices.outstanding}</span>
                                            <span className="font-mono">${selectedInvoice.balance}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-4xl font-black text-indigo-400 tracking-tighter pt-4 border-t border-white/5">
                                        <span className="text-xs uppercase tracking-[0.3em] self-center">{t.common.total}</span>
                                        <span>${selectedInvoice.total}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 pt-8 mt-6 border-t border-white/5 flex-shrink-0 relative z-10 no-print">
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
                                {t.common.dismiss}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
