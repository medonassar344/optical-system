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
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">{t.nav.settings}</h1>
                {isInitialLoading && <span className="text-sm text-indigo-500 animate-pulse">{t.settings.syncing}</span>}
            </div>

            {message.text && (
                <div className={`p-4 rounded-md transition-all ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-6 border-b pb-2 text-gray-700">{t.settings.profileInfo}</h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t.common.fullName}</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t.common.email}</label>
                            <input
                                type="email"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-colors shadow-sm"
                        >
                            {loading ? t.common.saving : t.settings.updateProfile}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-6 border-b pb-2 text-gray-700">{t.settings.security}</h2>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t.settings.currentPassword}</label>
                            <input
                                type="password"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700">{t.settings.newPassword}</label>
                            <input
                                type="password"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={passwordData.password}
                                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                required
                                disabled={loading}
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t.settings.confirmNewPassword}</label>
                            <input
                                type="password"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={passwordData.password_confirmation}
                                onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-900 disabled:opacity-50 font-semibold transition-colors shadow-sm"
                        >
                            {loading ? t.settings.changing : t.settings.changePassword}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
