import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
    const { user, logout } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { name: t.nav.dashboard, path: '/' },
        { name: t.nav.inventory, path: '/products' },
        { name: t.nav.categories, path: '/categories' },
        { name: t.nav.customers, path: '/customers' },
        { name: t.nav.sales, path: '/sales' },
        { name: t.nav.safe, path: '/safe' },
        { name: t.nav.settings, path: '/settings' },
    ];

    const isRtl = language === 'ar';

    return (
        <div className="flex h-screen bg-[#0a0c10] text-gray-200 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`w-72 relative flex flex-col bg-white/[0.01] backdrop-blur-2xl border-white/5 ${isRtl ? 'order-last border-l' : 'border-r'}`}>
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center font-bold text-xl">
                            O
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">{t.appName}</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">{t.managedBy} {user?.name}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-4 custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-6 py-3.5 rounded-2xl transition-all duration-300 group ${location.pathname === item.path
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]'
                                : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-200'
                                }`}
                        >
                            <span className="font-semibold tracking-wide">{item.name}</span>
                            {location.pathname === item.path && (
                                <div className={`ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]`}></div>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-6 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors group"
                    >
                        <span className="font-bold">{t.logout}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-24 flex justify-between items-center px-12 bg-white/[0.01] border-b border-white/5">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {navItems.find(i => i.path === location.pathname)?.name || t.appName}
                    </h2>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleLanguage}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold text-xs"
                        >
                            {language === 'en' ? 'AR' : 'EN'}
                        </button>

                        <div className="flex items-center gap-4 bg-white/5 p-1.5 pr-6 rounded-2xl border border-white/5">
                            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                                {user?.name?.[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">
                                    {user?.role === 'admin' ? t.admin : t.employee}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
