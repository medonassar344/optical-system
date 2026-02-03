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
    const [period, setPeriod] = useState('this_month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [debtSearch, setDebtSearch] = useState('');

    useEffect(() => {
        fetchStats();
    }, [period]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`/dashboard/stats?period=${period}`);
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
    const topProducts = data.top_products || { frames: [], lenses: [], all: [] };
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
        <div className="space-y-6 pb-20">
            {/* --- Period Selector --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">{t.dashboard.metrics.profit}</h1>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{t.dashboard.growthTrends}</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="bg-gray-50 border-2 border-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 transition-all"
                >
                    <option value="today">{t.dashboard.periods.today}</option>
                    <option value="yesterday">{t.dashboard.periods.yesterday}</option>
                    <option value="seven_days">{t.dashboard.periods.seven_days}</option>
                    <option value="this_month">{t.dashboard.periods.this_month}</option>
                    <option value="last_month">{t.dashboard.periods.last_month}</option>
                    <option value="this_year">{t.dashboard.periods.this_year}</option>
                    <option value="last_year">{t.dashboard.periods.last_year}</option>
                </select>
            </div>

            {/* --- Hero Stats --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t.dashboard.metrics.revenue}
                    value={formatCurrency(metrics.revenue)}
                    color="indigo"
                    icon="💰"
                />
                <StatCard
                    title={t.dashboard.metrics.cogs}
                    value={formatCurrency(metrics.cogs)}
                    color="red"
                    icon="📉"
                />
                <StatCard
                    title={t.dashboard.metrics.profit}
                    value={formatCurrency(metrics.profit)}
                    color="green"
                    icon="📈"
                />
                <StatCard
                    title={t.dashboard.metrics.growth}
                    value={`${metrics.growth > 0 ? '+' : ''}${parseFloat(metrics.growth).toFixed(1)}%`}
                    color={metrics.growth >= 0 ? "blue" : "red"}
                    icon={metrics.growth >= 0 ? "🚀" : "⚠️"}
                />
            </div>

            {/* --- Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-black text-gray-800 mb-8 tracking-tighter uppercase">{t.dashboard.metrics.revenue}</h3>
                    <div className="flex-1">
                        <Line
                            data={trendConfig}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                                    x: { grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="text-lg font-black text-gray-800 self-start mb-8 tracking-tighter uppercase">{t.dashboard.categoryDist}</h3>
                    <div className="w-full aspect-square relative flex items-center justify-center">
                        <div className="absolute inset-0 p-4">
                            <Doughnut
                                data={categoryConfig}
                                options={{
                                    cutout: '80%',
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t.common.total}</p>
                            <p className="text-2xl font-black text-gray-800">{formatCurrency(metrics.revenue)}</p>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3 w-full border-t border-gray-100 pt-6">
                        {(charts.categories || []).map((c, i) => (
                            <div key={i} className="flex items-center justify-between group cursor-default">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: categoryConfig.datasets[0].backgroundColor[i] }}></span>
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-tight group-hover:text-gray-800 transition-colors">
                                        {c.type ? (t.nav[c.type.toLowerCase()] || c.type) : t.dashboard.other}
                                    </span>
                                </div>
                                <span className="text-xs font-black text-gray-800">{formatCurrency(c.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Top Products Breakdown --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Panel title={t.nav.frames} badge={t.dashboard.top5}>
                    <div className="space-y-4">
                        {(topProducts.frames || []).map((p, i) => (
                            <TopProductRow key={p.id} index={i} product={p} unitsLabel={t.dashboard.units} />
                        ))}
                        {topProducts.frames?.length === 0 && <p className="text-center text-gray-400 text-xs py-10 italic">No frames sold in this period.</p>}
                    </div>
                </Panel>
                <Panel title={t.nav.lenses} badge={t.dashboard.top5}>
                    <div className="space-y-4">
                        {(topProducts.lenses || []).map((p, i) => (
                            <TopProductRow key={p.id} index={i} product={p} unitsLabel={t.dashboard.units} />
                        ))}
                        {topProducts.lenses?.length === 0 && <p className="text-center text-gray-400 text-xs py-10 italic">No lenses sold in this period.</p>}
                    </div>
                </Panel>
            </div>

            {/* --- Low Stock & Recent Invoices --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-black text-gray-800 uppercase tracking-tighter">{t.dashboard.outstandingBalances}</h3>
                        <div className="relative w-48">
                            <input
                                type="text"
                                placeholder={t.dashboard.findPlaceholder}
                                className="w-full text-[10px] border-2 border-gray-100 p-2 pl-8 rounded-xl focus:border-red-400 outline-none transition-all font-bold"
                                value={debtSearch}
                                onChange={(e) => setDebtSearch(e.target.value)}
                            />
                            <span className="absolute left-3 top-2.5 text-[10px]">🔎</span>
                        </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100">
                                {filteredDebts.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-indigo-600 text-xs">#{inv.id}</div>
                                            <div className="text-[10px] text-gray-400 font-bold">{new Date(inv.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-black text-gray-800 text-sm">{inv.customer?.name}</div>
                                            <div className="text-[10px] text-gray-400 font-black tracking-tighter">{inv.customer?.phone}</div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="inline-flex flex-col items-end">
                                                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">{t.dashboard.table.debt}</p>
                                                <p className="text-lg font-black text-red-600">${(inv.total - inv.amount_paid).toFixed(2)}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => { setPaymentModal(inv); setPaymentAmount((inv.total - inv.amount_paid).toFixed(2)); }}
                                                className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 transition-all uppercase"
                                            >
                                                {t.dashboard.table.process}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">{t.dashboard.recentTransactions}</h3>
                        <span className="text-[9px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-lg animate-pulse">● {t.dashboard.live}</span>
                    </div>
                    <div className="space-y-6">
                        {recentInvoices.map(inv => (
                            <div key={inv.id} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-sm font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    #{inv.id.toString().slice(-2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-800 truncate">{inv.customer?.name || t.dashboard.guest}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{inv.payment_method}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-gray-900">${inv.total}</p>
                                    <p className="text-[9px] text-gray-400 font-black">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Payment Modal (Existing) --- */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-fadeIn">
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md relative border border-white/20">
                        <h2 className="text-3xl font-black text-gray-800 mb-2 leading-none">{t.dashboard.modal.recordPayment}</h2>
                        <p className="text-xs text-gray-400 mb-10 font-bold uppercase tracking-widest border-b pb-6">
                            {t.dashboard.modal.order} <span className="text-indigo-600">#{paymentModal.id}</span>
                        </p>

                        <div className="bg-indigo-600 p-8 rounded-[2rem] mb-10 text-white shadow-xl shadow-indigo-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.2em] mb-1">{t.dashboard.modal.remaining}</p>
                                <p className="text-4xl font-black">${(paymentModal.total - paymentModal.amount_paid).toFixed(2)}</p>
                            </div>
                            <div className="text-4xl">💰</div>
                        </div>

                        <form onSubmit={handleProcessPayment} className="space-y-8">
                            <input
                                type="number"
                                step="0.01"
                                className="w-full bg-gray-50 border-4 border-gray-50 p-6 rounded-[2rem] text-3xl font-black text-gray-800 focus:border-indigo-100 focus:bg-white transition-all outline-none"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                autoFocus
                            />

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 py-5 rounded-3xl font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]">
                                    {t.dashboard.modal.cancel}
                                </button>
                                <button type="submit" className="flex-[2] bg-gray-900 text-white py-5 rounded-3xl font-black shadow-2xl hover:bg-black active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">
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

function StatCard({ title, value, color, icon }) {
    const themes = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 ring-indigo-500/10',
        red: 'text-red-600 bg-red-50 border-red-100 ring-red-500/10',
        green: 'text-green-600 bg-green-50 border-green-100 ring-green-500/10',
        blue: 'text-blue-600 bg-blue-50 border-blue-100 ring-blue-500/10',
    };
    const theme = themes[color] || themes.indigo;

    return (
        <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-bounce-slow group-hover:scale-125 transition-transform ${theme.split(' ')[1]}`}>
                    {icon}
                </div>
                <div className={`w-2 h-2 rounded-full ${theme.split(' ')[0].replace('text-', 'bg-')}`}></div>
            </div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{title}</h4>
            <div className={`text-3xl font-black tracking-tighter ${theme.split(' ')[0]}`}>{value}</div>
            <div className={`mt-3 h-1 w-12 rounded-full opacity-30 ${theme.split(' ')[0].replace('text-', 'bg-')}`}></div>
        </div>
    );
}

function TopProductRow({ index, product, unitsLabel }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[11px] font-black text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                0{index + 1}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-black text-gray-800 text-xs truncate uppercase tracking-tight">{product.brand} {product.model_code}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase italic">{product.type}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                    <span className="text-[9px] text-indigo-500 font-black">${product.price}</span>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-black text-gray-800 leading-none">{product.invoice_items_count}</p>
                <p className="text-[8px] text-gray-400 font-black uppercase tracking-tighter">{unitsLabel}</p>
            </div>
        </div>
    );
}

function Panel({ title, badge, children }) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">{title}</h3>
                {badge && <span className="text-[9px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-xl uppercase tracking-widest">{badge}</span>}
            </div>
            {children}
        </div>
    );
}
