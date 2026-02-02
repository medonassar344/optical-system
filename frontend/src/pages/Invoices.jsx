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
        <div className="space-y-6 pb-20 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">{t.nav.salesHistory}</h1>
                    <p className="text-sm text-gray-500">{t.invoices.description}</p>
                </div>
                <div className="relative w-72">
                    <input
                        type="text"
                        placeholder={t.invoices.searchPlaceholder}
                        className="w-full border-2 border-gray-100 p-2.5 pl-10 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                </div>
            </div>

            {Object.keys(groupedData).length === 0 ? (
                <div className="p-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic">{t.invoices.noMatches}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedData).map(([monthKey, monthData]) => (
                        <div key={monthKey} className="space-y-4">
                            {/* --- Month Header (The Rectangle) --- */}
                            <button
                                onClick={() => toggleMonth(monthKey)}
                                className={`w-full flex justify-between items-center p-6 rounded-2xl border-2 transition-all group ${expandedMonths[monthKey]
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 translate-y-[-2px]'
                                    : 'bg-white border-gray-100 text-gray-800 hover:border-indigo-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`text-2xl ${expandedMonths[monthKey] ? 'opacity-100' : 'opacity-40'}`}>📅</span>
                                    <h2 className="text-xl font-black">{monthKey}</h2>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className={`text-[10px] uppercase font-black ${expandedMonths[monthKey] ? 'text-indigo-200' : 'text-gray-400'}`}>{t.invoices.monthlyVolume}</p>
                                        <p className="text-lg font-black">${monthData.total.toLocaleString()}</p>
                                    </div>
                                    <span className={`text-xl transition-transform ${expandedMonths[monthKey] ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                            </button>

                            {/* --- Days List for Month --- */}
                            {expandedMonths[monthKey] && (
                                <div className="ml-4 pl-4 border-l-2 border-indigo-100 space-y-4 animate-slideDown">
                                    {Object.entries(monthData.days).map(([dayKey, dayData]) => (
                                        <div key={dayKey} className="space-y-3">
                                            {/* --- Day Header (Smaller Rectangle) --- */}
                                            <button
                                                onClick={() => toggleDay(dayKey)}
                                                className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${expandedDays[dayKey]
                                                    ? 'bg-gray-800 border-gray-800 text-white shadow-lg'
                                                    : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${expandedDays[dayKey] ? 'bg-indigo-400' : 'bg-gray-200'}`}></span>
                                                    <h3 className="font-bold">{new Date(dayKey).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${expandedDays[dayKey] ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {dayData.invoices.length} {t.common.orders}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-black text-sm">${dayData.total.toLocaleString()}</p>
                                                    <span className={`text-xs transition-transform ${expandedDays[dayKey] ? 'rotate-180' : ''}`}>▼</span>
                                                </div>
                                            </button>

                                            {/* --- Invoices Table for Day --- */}
                                            {expandedDays[dayKey] && (
                                                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm animate-fadeIn">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black border-b">
                                                            <tr>
                                                                <th className="px-6 py-4">{t.invoices.order}</th>
                                                                <th className="px-6 py-4">{t.common.customer}</th>
                                                                <th className="px-6 py-4">{t.invoices.financials}</th>
                                                                <th className="px-6 py-4">{t.invoices.method}</th>
                                                                <th className="px-6 py-4 text-right">{t.invoices.receipt}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y text-xs">
                                                            {dayData.invoices.map(inv => (
                                                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-6 py-4">
                                                                        <div className="font-black text-indigo-600">#{inv.id}</div>
                                                                        <div className="text-[10px] text-gray-400">{new Date(inv.created_at).toLocaleTimeString()}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="font-bold text-gray-800">{inv.customer?.name || t.dashboard.guest}</div>
                                                                        <div className="text-[10px] text-gray-400">{inv.customer?.phone}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="font-black text-gray-800">${inv.total}</span>
                                                                            {inv.balance > 0 && (
                                                                                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                                                                    -${inv.balance} {t.invoices.debt}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-tight">
                                                                            {inv.payment_method}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <button
                                                                            onClick={() => handleViewInvoice(inv.id)}
                                                                            className="text-indigo-600 hover:text-indigo-900 font-bold underline"
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

            {/* --- Invoice Details Modal --- */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-scaleUp">
                        <button
                            onClick={() => setSelectedInvoice(null)}
                            className="absolute top-6 right-6 text-gray-300 hover:text-gray-600 text-3xl"
                        >
                            &times;
                        </button>

                        <div className="flex justify-between items-start mb-10 border-b pb-8">
                            <div>
                                <h2 className="text-4xl font-black text-indigo-600 tracking-tighter">{t.invoices.invoiceTitle}</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{t.invoices.serialId}: #{selectedInvoice.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-gray-800">{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-400 font-bold uppercase">{new Date(selectedInvoice.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">{t.invoices.clientIdentity}</h4>
                                <p className="font-black text-gray-800 text-lg">{selectedInvoice.customer?.name || t.invoices.guestAccount}</p>
                                <p className="text-sm text-gray-500 font-medium">{selectedInvoice.customer?.phone}</p>
                                <p className="text-xs text-gray-400 mt-1">{selectedInvoice.customer?.address}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">{t.invoices.transactionDetails}</h4>
                                <p className="font-black text-indigo-600 text-lg capitalize">{selectedInvoice.payment_method} {t.invoices.transfer}</p>
                                <p className="text-xs text-gray-400 mt-1 italic leading-relaxed">{t.invoices.recordedBy} {selectedInvoice.user?.name} {t.invoices.viaPos}</p>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest px-1 text-center">{t.invoices.purchasedInventory}</h4>
                            <table className="w-full text-left">
                                <thead className="border-b-2 text-[10px] font-black text-gray-400 uppercase">
                                    <tr>
                                        <th className="pb-4 pl-1">{t.invoices.article}</th>
                                        <th className="pb-4 text-center">{t.common.qty}</th>
                                        <th className="pb-4 text-right">{t.common.price}</th>
                                        <th className="pb-4 text-right pr-1">{t.common.subtotal}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {selectedInvoice.items.map(item => (
                                        <tr key={item.id} className="group">
                                            <td className="py-5 pl-1">
                                                <div className="font-black text-gray-800 group-hover:text-indigo-600 transition-colors">{item.product?.brand} {item.product?.model_code}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{t.products.types[item.product?.type] || item.product?.type} • {t.invoices.opticalGrade}</div>
                                            </td>
                                            <td className="py-5 text-center text-gray-500 font-bold bg-gray-50/50 rounded-lg">{item.quantity}</td>
                                            <td className="py-5 text-right text-gray-500 font-medium">${item.price}</td>
                                            <td className="py-5 text-right font-black text-gray-800 pr-1">${item.subtotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- Payment History (The Ledger) --- */}
                        {selectedInvoice.payments?.length > 0 && (
                            <div className="mb-10 bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/50">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest text-center">{t.invoices.paymentLifecycle}</h4>
                                <div className="space-y-3">
                                    {selectedInvoice.payments.map(pay => (
                                        <div key={pay.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                                            <div>
                                                <p className="font-black text-gray-700 text-xs">{new Date(pay.created_at).toLocaleDateString()}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{pay.notes}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-green-600 font-black text-sm">+${pay.amount}</p>
                                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-tighter">{pay.payment_method}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-8 border-t-2 border-dashed border-gray-100">
                            <div className="w-56 space-y-3">
                                <div className="flex justify-between text-xs text-gray-400 font-black uppercase">
                                    <span>{t.common.subtotal}:</span>
                                    <span>${selectedInvoice.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-xs text-red-300 font-black uppercase">
                                    <span>{t.invoices.discount}:</span>
                                    <span>-${selectedInvoice.discount}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black text-green-500 border-t pt-2 uppercase">
                                    <span>{t.sales.amountPaid}:</span>
                                    <span>${selectedInvoice.amount_paid}</span>
                                </div>
                                {selectedInvoice.balance > 0 && (
                                    <div className="flex justify-between text-xs font-black text-red-500 uppercase">
                                        <span>{t.invoices.outstanding}:</span>
                                        <span>${selectedInvoice.balance}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-2xl font-black text-indigo-600 pt-3 border-t-2 border-indigo-100">
                                    <span>{t.common.total}:</span>
                                    <span>${selectedInvoice.total}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex gap-4 no-print">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                            >
                                {t.invoices.generatePdf}
                            </button>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="bg-gray-100 text-gray-500 px-8 py-4 rounded-2xl font-black hover:bg-gray-200 transition-colors"
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
