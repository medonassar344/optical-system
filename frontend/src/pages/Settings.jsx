import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
    const { t } = useLanguage();
    const { user, setUser } = useAuth();
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Initialize/Sync profile data when user is available
    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, email: user.email });
        }
    }, [user]);

    // Optional: add a small indicator if loading initially
    const isInitialLoading = !user;

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const { data } = await api.put('/profile', profileData);
            setUser(data.user);
            setMessage({ type: 'success', text: t.settings.profileSuccess });
        } catch (error) {
            const errorMsg = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(' ')
                : (error.response?.data?.message || t.settings.profileFailed);
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await api.put('/profile/password', passwordData);
            setMessage({ type: 'success', text: t.settings.passwordSuccess });
            setPasswordData({ current_password: '', password: '', password_confirmation: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(' ')
                : (error.response?.data?.message || t.settings.passwordFailed);
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-16 pb-20 animate-reveal">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        {t.nav.settings}
                        <span className="block text-xs font-bold text-indigo-500 tracking-[0.4em] mt-4 opacity-70">Control Center</span>
                    </h1>
                </div>
                {isInitialLoading && (
                    <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.settings.syncing}</span>
                    </div>
                )}
            </div>

            {/* Notification */}
            {message.text && (
                <div className={`p-6 rounded-[2rem] border animate-reveal flex items-center gap-4 ${message.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                        {message.type === 'success' ? '✓' : '!'}
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Profile Information */}
                <div className="glass-card p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-all"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                                👤
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">{t.settings.profileInfo}</h2>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">{t.common.fullName}</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">{t.common.email}</label>
                                <input
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale mt-4"
                            >
                                {loading ? t.common.saving : t.settings.updateProfile}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Change Password */}
                <div className="glass-card p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-red-500/10 transition-all"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                                🔒
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">{t.settings.security}</h2>
                        </div>

                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">{t.settings.currentPassword}</label>
                                <input
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">{t.settings.newPassword}</label>
                                <input
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">{t.settings.confirmNewPassword}</label>
                                <input
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                    value={passwordData.password_confirmation}
                                    onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white/[0.02] border border-white/10 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale mt-6"
                            >
                                {loading ? t.settings.changing : t.settings.changePassword}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer / Account Stats */}
            <div className="glass-card p-12 border-none bg-indigo-600 shadow-2xl shadow-indigo-600/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[100px] -mr-40 -mt-40 rounded-full"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-3 text-center md:text-left">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Logged in as</p>
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{user?.name}</h3>
                        <p className="text-xs font-bold text-white/40 tracking-widest">{user?.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        <div className="text-center md:text-right">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Access Level</p>
                            <p className="text-xl font-black text-white">ADMINISTRATOR</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Session ID</p>
                            <p className="text-xl font-black text-white font-mono">#{Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
