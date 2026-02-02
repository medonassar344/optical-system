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
        { name: t.nav.customers, path: '/customers' },
        { name: t.nav.sales, path: '/sales' },
        { name: t.nav.history, path: '/invoices' },
        { name: t.nav.safe, path: '/safe' },
        { name: t.nav.settings, path: '/settings' },
    ];

    const isRtl = language === 'ar';

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`w-64 bg-white shadow-lg ${isRtl ? 'order-last border-l' : 'border-r'}`}>
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-indigo-600">{t.appName}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t.managedBy} {user?.name}</p>
                </div>
                <nav className="mt-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 ${location.pathname === item.path ? 'bg-indigo-50 text-indigo-600 ' + (isRtl ? 'border-l-4 border-indigo-600' : 'border-r-4 border-indigo-600') : ''
                                }`}
                        >
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full text-left rtl:text-right flex items-center px-6 py-3 text-red-600 hover:bg-red-50 mt-auto"
                    >
                        {t.logout}
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center px-8">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {navItems.find(i => i.path === location.pathname)?.name || t.appName}
                    </h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="px-3 py-1 text-sm font-bold bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            {language === 'en' ? 'العربية' : 'English'}
                        </button>
                        <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                            {user?.role === 'admin' ? t.admin : t.employee}
                        </span>
                    </div>
                </header>
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
