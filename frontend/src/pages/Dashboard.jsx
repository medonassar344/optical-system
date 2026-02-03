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
        <div className="flex flex-col items-center justify-center h-96 gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-indigo-400 font-bold tracking-[0.2em] animate-pulse uppercase text-xs">{t.dashboard.analyzing}</p>
        </div>
    );

    if (error) return (
        <div className="p-12 glass-card border-red-500/20 text-center max-w-2xl mx-auto mt-12 animate-reveal">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.dashboard.unavailable}</h2>
            <p className="text-gray-500 mb-8">{error}</p>
            <button
                onClick={fetchStats}
                className="bg-red-500/80 hover:bg-red-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
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

    const trendConfig = {
        labels: (charts.trend || []).map(t => t.date || ''),
        datasets: [
            {
                fill: true,
                data: (charts.trend || []).map(t => parseFloat(t.revenue || 0)),
                borderColor: '#6366f1',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                    return gradient;
                },
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                tension: 0.45
            }
        ]
    };

    const categoryConfig = {
        labels: (charts.categories || []).map(c => (c.type ? (t.nav[c.type.toLowerCase()] || c.type) : t.dashboard.other).toUpperCase()),
        datasets: [
            {
                data: (charts.categories || []).map(c => parseFloat(c.total || 0)),
                backgroundColor: [
                    '#6366f1',
                    '#a855f7',
                    '#ec4899',
                    '#06b6d4',
                    '#10b981',
                ],
                hoverOffset: 15,
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
        <div className="space-y-10 pb-20 max-w-7xl mx-auto animate-reveal">
            {/* Top Bar with Period Selector */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">{t.dashboard.metrics.profit}</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">{t.dashboard.growthTrends}</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    {['today', 'this_month', 'this_year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${period === p
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {t.dashboard.periods[p]}
                        </button>
                    ))}
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-transparent text-gray-400 text-xs font-bold px-4 outline-none border-none cursor-pointer hover:text-gray-200"
                    >
                        <option value="yesterday" className="bg-[#0a0c10]">{t.dashboard.periods.yesterday}</option>
                        <option value="last_month" className="bg-[#0a0c10]">{t.dashboard.periods.last_month}</option>
                        <option value="last_year" className="bg-[#0a0c10]">{t.dashboard.periods.last_year}</option>
                    </select>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HeroStatCard
                    label={t.dashboard.metrics.revenue}
                    value={formatCurrency(metrics.revenue)}
                    color="indigo"
                    trend={metrics.growth}
                    icon="💰"
                />
                <HeroStatCard
                    label={t.dashboard.metrics.profit}
                    value={formatCurrency(metrics.profit)}
                    color="emerald"
                    icon="📈"
                    trend={((metrics.profit - (metrics.prev_revenue - metrics.cogs)) / (metrics.prev_revenue - metrics.cogs || 1)) * 100}
                />
                <HeroStatCard
                    label={t.dashboard.metrics.growth}
                    value={`${metrics.growth > 0 ? '+' : ''}${parseFloat(metrics.growth).toFixed(1)}%`}
                    color="cyan"
                    icon="🚀"
                />
            </div>

            {/* Performance Spotlight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Champions */}
                <div className="glass-card p-8 relative overflow-hidden group border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -mr-16 -mt-16"></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{t.dashboard.marketChampions}</h3>
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px]">📊</div>
                        </div>

                        <div className="space-y-6 overflow-y-auto custom-scrollbar max-h-[180px] pr-2">
                            {(data.category_champions || []).map((cat, idx) => (
                                <div key={cat.id} className="space-y-4 animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="flex items-center gap-3 border-l-2 border-indigo-500/50 pl-3">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{cat.name}</span>
                                    </div>
                                    <div className="space-y-3 pl-4">
                                        {(cat.top_items || []).map((item, iIdx) => (
                                            <div key={iIdx} className="flex justify-between items-center group/item">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-tight group-hover/item:text-indigo-400 transition-colors">
                                                        {item.brand} {item.model_code}
                                                    </span>
                                                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-0.5">${item.price}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-indigo-500">{item.total_sold} <span className="text-[7px] text-gray-600 uppercase font-black">{t.dashboard.units}</span></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Elite Performers (Global Top Sellers) */}
                <div className="glass-card p-8 relative overflow-hidden group border-purple-500/20 shadow-2xl shadow-purple-500/10">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-[60px] -ml-16 -mt-16"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{t.dashboard.elitePerformers}</h3>
                            <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-[10px]">✨</div>
                        </div>

                        <div className="space-y-4 pr-2">
                            {(topProducts.all || []).map((product, idx) => (
                                <div key={product.id} className="flex items-center gap-5 group/elite animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-purple-400 group-hover/elite:bg-purple-600 group-hover/elite:text-white transition-all">
                                        0{idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-white uppercase truncate">{product.brand} {product.model_code}</p>
                                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-1">{product.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-purple-400">{product.total_sold} <span className="text-[8px] text-gray-700 uppercase">{t.dashboard.units}</span></p>
                                        <p className="text-[9px] font-bold text-gray-200 mt-1">${product.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-10 min-h-[450px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-2">{t.dashboard.revenue}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t.dashboard.growthTrends}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white">{formatCurrency(metrics.revenue)}</p>
                                <p className="text-[10px] text-emerald-400 font-bold uppercase">+{metrics.growth.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Line
                                data={trendConfig}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { display: false },
                                        x: {
                                            grid: { display: false },
                                            ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 10, weight: 'bold' } }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-10 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 blur-[60px] -ml-16 -mt-16"></div>
                    <h3 className="text-xl font-bold text-white tracking-tight self-start mb-10 leading-none uppercase">{t.dashboard.categoryDist}</h3>

                    <div className="w-full aspect-square relative flex items-center justify-center p-4 mb-8">
                        <Doughnut
                            data={categoryConfig}
                            options={{
                                cutout: '85%',
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } }
                            }}
                        />
                        <div className="absolute text-center">
                            <p className="text-4xl font-black text-white tracking-tighter">
                                {charts.categories.length}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t.categories.title}</p>
                        </div>
                    </div>

                    <div className="w-full space-y-4 pt-10 border-t border-white/5">
                        {(charts.categories || []).map((c, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryConfig.datasets[0].backgroundColor[i] }}></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-gray-300 transition-colors">
                                        {c.type ? (t.nav[c.type.toLowerCase()] || c.type) : t.dashboard.other}
                                    </span>
                                </div>
                                <span className="text-sm font-black text-white">{formatCurrency(c.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Debts Table */}
                <div className="lg:col-span-2 glass-card overflow-hidden">
                    <div className="p-10 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-2">{t.dashboard.outstandingBalances}</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{outstandingInvoices.length} {t.dashboard.activeDebts}</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder={t.dashboard.findPlaceholder}
                                className="w-full bg-white/5 border border-white/10 p-3 pl-10 rounded-2xl text-xs font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                value={debtSearch}
                                onChange={(e) => setDebtSearch(e.target.value)}
                            />
                            <span className="absolute left-4 top-3.5 opacity-30 text-xs">🔎</span>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full border-collapse">
                            <tbody className="divide-y divide-white/5">
                                {filteredDebts.map((inv, idx) => (
                                    <tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors stagger-1 animate-reveal" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <td className="px-10 py-6">
                                            <div className="text-xs font-black text-indigo-400 mb-1">ID: #{inv.id}</div>
                                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{new Date(inv.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="text-sm font-bold text-white mb-0.5">{inv.customer?.name}</div>
                                            <div className="text-[10px] text-gray-500 font-bold tracking-[0.1em]">{inv.customer?.phone}</div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="text-[10px] font-bold text-red-500/50 uppercase tracking-widest mb-1">{t.dashboard.table.debt}</div>
                                            <div className="text-xl font-black text-red-400">{formatCurrency(inv.total - inv.amount_paid)}</div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button
                                                onClick={() => { setPaymentModal(inv); setPaymentAmount((inv.total - inv.amount_paid).toFixed(2)); }}
                                                className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-white/10 active:scale-95 transition-all uppercase tracking-widest"
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

                {/* Recent Transactions */}
                <div className="glass-card p-10 border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-2">{t.dashboard.recentTransactions}</h3>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">● {t.dashboard.live}</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        {recentInvoices.map((inv, idx) => (
                            <div key={inv.id} className="flex items-center gap-5 group animate-reveal" style={{ animationDelay: `${idx * 0.12}s` }}>
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-sm font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-500">
                                    {inv.id.toString().slice(-2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{inv.customer?.name || t.dashboard.guest}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{inv.payment_method}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-black text-gray-200">{formatCurrency(inv.total)}</p>
                                    <p className="text-[9px] text-gray-600 font-bold">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment Modal Refined */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -mr-32 -mt-32"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-white mb-2 leading-none">{t.dashboard.modal.recordPayment}</h2>
                            <p className="text-xs text-gray-500 mb-12 font-bold uppercase tracking-widest">
                                {t.dashboard.modal.order} <span className="text-indigo-400">#{paymentModal.id}</span>
                            </p>

                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[2.5rem] mb-12 text-white shadow-2xl shadow-indigo-500/20">
                                <p className="text-[10px] uppercase font-bold opacity-60 tracking-[0.3em] mb-2">{t.dashboard.modal.remaining}</p>
                                <p className="text-5xl font-black tracking-tighter">{formatCurrency(paymentModal.total - paymentModal.amount_paid)}</p>
                            </div>

                            <form onSubmit={handleProcessPayment} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.dashboard.modal.paymentAmount}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-white/5 border-2 border-white/5 p-8 rounded-[2rem] text-4xl font-black text-white focus:border-indigo-500/30 focus:bg-white/10 transition-all outline-none"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-6 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentModal(null)}
                                        className="flex-1 py-6 rounded-3xl font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest text-[11px]"
                                    >
                                        {t.dashboard.modal.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-indigo-600 text-white py-6 rounded-3xl font-black shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                                    >
                                        {t.dashboard.modal.confirm}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function HeroStatCard({ label, value, color, trend, icon }) {
    const colors = {
        indigo: 'bg-indigo-500 shadow-indigo-500/20 text-indigo-400',
        purple: 'bg-purple-500 shadow-purple-500/20 text-purple-400',
        emerald: 'bg-emerald-500 shadow-emerald-500/20 text-emerald-400',
        cyan: 'bg-cyan-500 shadow-cyan-500/20 text-cyan-400',
    };

    return (
        <div className="glass-card p-8 group relative overflow-hidden h-[180px] flex flex-col justify-between">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 -mr-12 -mt-12 ${colors[color].split(' ')[0]}`}></div>

            <div className="flex justify-between items-start relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-3xl transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10 group-hover:rotate-12`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-3xl font-black text-white tracking-tighter group-hover:text-glow transition-all duration-500">{value}</p>
            </div>
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
