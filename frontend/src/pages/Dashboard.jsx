import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

export default function Dashboard() {
    const { t } = useLanguage();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [debtSearch, setDebtSearch] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/dashboard/stats');
            if (data) {
                setData(data);
            } else {
                setError(t.dashboard.noData);
            }
        } catch (e) {
            console.error("Dashboard fetch error:", e);
            setError(e.response?.data?.message || t.dashboard.unavailable);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/invoices/${paymentModal.id}/payment`, {
                amount: parseFloat(paymentAmount)
            });
            setPaymentModal(null);
            setPaymentAmount('');
            fetchStats();
            alert(t.dashboard.paymentSuccess);
        } catch (error) {
            alert(error.response?.data?.message || t.dashboard.paymentFailed);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">{t.dashboard.analyzing}</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">{t.dashboard.unavailable}</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
                onClick={fetchStats}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 shadow-sm"
            >
                {t.dashboard.tryAgain}
            </button>
        </div>
    );

    if (!data) return null;

    const metrics = data.metrics || {};
    const charts = data.charts || { trend: [], categories: [] };
    const recentInvoices = data.recent_invoices || [];
    const topProducts = data.top_products || [];
    const lowStockItems = data.low_stock_items || [];
    const outstandingInvoices = data.outstanding_invoices || [];

    // Trend Area Chart
    const trendConfig = {
        labels: (charts.trend || []).map(t => t.date || ''),
        datasets: [
            {
                fill: true,
                label: t.dashboard.revenue,
                data: (charts.trend || []).map(t => parseFloat(t.revenue || 0)),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4
            },
            {
                fill: true,
                label: t.dashboard.profit,
                data: (charts.trend || []).map(t => parseFloat(t.profit || 0)),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }
        ]
    };

    // Category Donut
    const categoryConfig = {
        labels: (charts.categories || []).map(c => (c.type ? (t.nav[c.type.toLowerCase()] || c.type) : t.dashboard.other).toUpperCase()),
        datasets: [
            {
                data: (charts.categories || []).map(c => parseFloat(c.total || 0)),
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(107, 114, 128, 0.8)',
                ],
                borderWidth: 0,
            }
        ]
    };

    const filteredDebts = outstandingInvoices.filter(inv =>
        (inv.customer?.name || '').toLowerCase().includes(debtSearch.toLowerCase()) ||
        (inv.id || '').toString().includes(debtSearch)
    );

    const formatCurrency = (val) => {
        const num = parseFloat(val || 0);
        return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-6 pb-8">
            {/* --- Hero Stats --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t.dashboard.dailyRevenue}
                    value={formatCurrency(metrics.daily_sales)}
                    color="indigo"
                    icon="💰"
                />
                <StatCard
                    title={t.dashboard.outstandingDebt}
                    value={formatCurrency(metrics.outstanding_total_balance)}
                    color="red"
                    icon="💸"
                    alert={metrics.outstanding_count > 0}
                />
                <StatCard
                    title={t.dashboard.totalCustomers}
                    value={metrics.customers_count || 0}
                    color="blue"
                    icon="👥"
                />
                <StatCard
                    title={t.dashboard.todaysProfit}
                    value={formatCurrency(metrics.today_profit)}
                    color="green"
                    icon="📈"
                />
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 tracking-tight">{t.dashboard.title}</h3>
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-100 rounded text-gray-500 uppercase">{t.dashboard.growthTrends}</span>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <Line
                            data={trendConfig}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'top', labels: { boxWidth: 10, usePointStyle: true } } },
                                scales: { y: { beginAtZero: true } }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-800 self-start mb-6">{t.dashboard.categoryDist}</h3>
                    <div className="w-full h-64 flex justify-center">
                        {charts.categories?.length > 0 ? (
                            <Doughnut
                                data={categoryConfig}
                                options={{
                                    cutout: '75%',
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center text-gray-400 italic text-sm">{t.dashboard.noSalesData}</div>
                        )}
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 w-full border-t pt-4">
                        {(charts.categories || []).map((c, i) => (
                            <div key={i} className="text-[11px] flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryConfig.datasets[0].backgroundColor[i] || '#ccc' }}></span>
                                    <span className="text-gray-500 capitalize truncate">{c.type ? (t.nav[c.type.toLowerCase()] || c.type) : t.dashboard.other}</span>
                                </div>
                                <span className="font-bold text-gray-800 ml-2">{formatCurrency(c.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Debt Management --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg text-xl">🚨</div>
                        <div>
                            <h3 className="font-bold text-gray-800">{t.dashboard.outstandingBalances}</h3>
                            <p className="text-xs text-gray-500">{t.dashboard.unpaidOrders}</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder={t.dashboard.findPlaceholder}
                            className="w-full text-sm border-gray-200 border p-2 pl-8 rtl:pl-2 rtl:pr-8 rounded-xl shadow-inner focus:ring-red-400 focus:border-red-400 outline-none"
                            value={debtSearch}
                            onChange={(e) => setDebtSearch(e.target.value)}
                        />
                        <span className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-gray-400 text-xs">🔍</span>
                    </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">{t.dashboard.table.unit}</th>
                                <th className="px-6 py-4">{t.dashboard.table.customer}</th>
                                <th className="px-6 py-4">{t.dashboard.table.financials}</th>
                                <th className="px-6 py-4 text-right rtl:text-left">{t.dashboard.table.action}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {filteredDebts.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-400 text-xs">#{inv.id}</div>
                                        <div className="text-[10px] text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{inv.customer?.name || t.dashboard.guest}</div>
                                        <div className="text-[10px] text-gray-500">{inv.customer?.phone || ''}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <p className="text-[9px] uppercase font-bold text-gray-400">{t.dashboard.table.total}</p>
                                                <p className="text-xs font-bold">${inv.total}</p>
                                            </div>
                                            <div className="w-px h-6 bg-gray-200"></div>
                                            <div className="text-center">
                                                <p className="text-[9px] uppercase font-bold text-green-400">{t.dashboard.table.paid}</p>
                                                <p className="text-xs font-bold text-green-600">${inv.amount_paid}</p>
                                            </div>
                                            <div className="w-px h-6 bg-gray-200"></div>
                                            <div className="text-center">
                                                <p className="text-[9px] uppercase font-bold text-red-400">{t.dashboard.table.debt}</p>
                                                <p className="text-xs font-black text-red-600">${(inv.total - inv.amount_paid).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right rtl:text-left">
                                        <button
                                            onClick={() => { setPaymentModal(inv); setPaymentAmount((inv.total - inv.amount_paid).toFixed(2)); }}
                                            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-black hover:scale-105 active:scale-95 transition-all"
                                        >
                                            {t.dashboard.table.process}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDebts.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-gray-400 italic">No debts found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Summary Panels --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Panel title={t.dashboard.recentTransactions} badge={t.dashboard.live}>
                    <table className="w-full text-left rtl:text-right">
                        <thead className="text-[10px] text-gray-400 uppercase font-bold border-b">
                            <tr>
                                <th className="pb-3 pl-4 rtl:pl-0 rtl:pr-4">{t.dashboard.id}</th>
                                <th className="pb-3">{t.dashboard.customer}</th>
                                <th className="pb-3">{t.dashboard.sum}</th>
                                <th className="pb-3 text-right rtl:text-left pr-4 rtl:pr-0 rtl:pl-4">{t.dashboard.method}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-xs">
                            {recentInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="py-3 pl-4 rtl:pl-0 rtl:pr-4 font-bold text-indigo-600">#{inv.id}</td>
                                    <td className="py-3 font-medium">{inv.customer?.name || t.dashboard.customer}</td>
                                    <td className="py-3 font-black text-gray-800">${inv.total}</td>
                                    <td className="py-3 text-right pr-4">
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase">{inv.payment_method}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Panel>

                <Panel title={t.dashboard.performanceLeaders} badge={t.dashboard.top5}>
                    <div className="space-y-4">
                        {topProducts.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-4 group">
                                <div className="text-2xl font-black text-gray-100 italic group-hover:text-indigo-100 transition-colors">0{i + 1}</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight">{p.brand} {p.model_code}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{p.type}</p>
                                </div>
                                <div className="text-right rtl:text-left">
                                    <p className="text-sm font-black text-indigo-600">{p.invoice_items_count}</p>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">{t.dashboard.units}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            {/* --- Payment Processing Modal --- */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative border border-gray-100 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                        <h2 className="text-3xl font-black text-gray-800 mb-2">{t.dashboard.modal.recordPayment}</h2>
                        <p className="text-sm text-gray-500 mb-8 border-b pb-4">{t.dashboard.modal.order} <span className="text-indigo-600 font-bold">#{paymentModal.id}</span> • {paymentModal.customer?.name || t.dashboard.customer}</p>

                        <div className="bg-green-50 p-6 rounded-2xl mb-8 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase font-black text-green-700 opacity-60">{t.dashboard.modal.remaining}</p>
                                <p className="text-3xl font-black text-green-700">${(paymentModal.total - paymentModal.amount_paid).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">💵</div>
                        </div>

                        <form onSubmit={handleProcessPayment} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">{t.dashboard.modal.amountToPay}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-2 border-gray-100 p-5 rounded-2xl text-2xl font-black text-gray-800 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all shadow-inner"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {paymentModal.payments?.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-dashed border-gray-200">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboard.modal.recentPayments}</p>
                                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                        {paymentModal.payments.map(p => (
                                            <div key={p.id} className="flex justify-between text-[11px] font-bold">
                                                <span className="text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                                                <span className="text-green-600">+${p.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal(null)}
                                    className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                                >
                                    {t.dashboard.modal.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {t.dashboard.modal.confirm}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, color, icon, alert = false }) {
    const bgColors = {
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-indigo-100',
        green: 'bg-green-50 border-green-100 text-green-600 shadow-green-100',
        blue: 'bg-blue-50 border-blue-100 text-blue-600 shadow-blue-100',
        red: 'bg-red-50 border-red-100 text-red-600 shadow-red-100',
    };

    const colorParts = (bgColors[color] || bgColors.indigo).split(' ');

    return (
        <div className={`p-6 rounded-3xl border-2 bg-white shadow-lg ${colorParts[3]} flex flex-col justify-between transition-all hover:-translate-y-1 duration-300 relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-6">
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${colorParts[0]} group-hover:scale-110 transition-transform`}>
                    {icon}
                </span>
                {alert && (
                    <div className="flex items-center gap-1.5 bg-red-100 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                        <span className="text-[8px] font-black text-red-600 uppercase">{t.dashboard.alert}</span>
                    </div>
                )}
            </div>
            <div>
                <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</h4>
                <p className={`text-4xl font-black mt-2 tracking-tight ${colorParts[2]}`}>{value}</p>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-20 h-20 ${colorParts[0]} opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform`}></div>
        </div>
    );
}

function Panel({ title, badge, children }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-800 tracking-tight">{title}</h3>
                {badge && <span className="text-[10px] font-black px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg uppercase tracking-widest">{badge}</span>}
            </div>
            {children}
        </div>
    );
}
