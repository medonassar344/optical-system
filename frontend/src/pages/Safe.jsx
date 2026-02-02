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
            alert(t.safe.deleteSuccess);
        } catch (e) {
            console.error(e);
            alert(t.safe.deleteFailed);
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

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-right min-w-[220px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.safe.totalBalance}</p>
                    <p className="text-3xl font-black text-indigo-600">${parseFloat(totalInSafe).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* --- Filters --- */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
                <FilterBtn label={t.safe.allStreams} active={filter === 'all'} onClick={() => setFilter('all')} />
                <FilterBtn label={t.safe.newOrders} active={filter === 'initial'} onClick={() => setFilter('initial')} />
                <FilterBtn label={t.safe.remaining} active={filter === 'debt_payment'} onClick={() => setFilter('debt_payment')} />
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
                                                                        <div className="font-black text-indigo-600">#{pay.invoice_id}</div>
                                                                        <div className="text-[10px] text-gray-400">{new Date(pay.created_at).toLocaleTimeString()}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 font-bold text-gray-700">
                                                                        {pay.invoice?.customer?.name || t.safe.guestStream}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${pay.type === 'initial'
                                                                            ? 'bg-blue-50 text-blue-600'
                                                                            : 'bg-orange-50 text-orange-600'
                                                                            }`}>
                                                                            {pay.type === 'initial' ? t.safe.initial : t.safe.remaining}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="font-black text-green-600 text-base">+${parseFloat(pay.amount).toLocaleString()}</div>
                                                                        <div className="text-[9px] text-gray-400 uppercase font-black">{pay.payment_method}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right pr-8">
                                                                        <button
                                                                            onClick={() => handleDeleteEntry(pay.id)}
                                                                            className="p-2 text-gray-200 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                                                                            title={t.safe.reverseTransaction}
                                                                        >
                                                                            <TrashIcon />
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
