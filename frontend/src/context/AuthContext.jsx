import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

const AuthContext = createContext({
    user: null,
    setUser: (user) => { },
    token: null,
    login: async (email, password) => { },
    logout: async () => { },
    loading: true
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/user').then(({ data }) => {
                setUser(data);
            }).catch(() => {
                _setToken(null);
            }).finally(() => {
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [token]);

    const _setToken = (token) => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
        setToken(token);
    };

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });
        _setToken(data.access_token);
        setUser(data.user);
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            console.error(e);
        } finally {
            _setToken(null);
            setUser(null);
        }
    };

    const value = useMemo(() => ({
        user,
        setUser,
        token,
        login,
        logout,
        loading
    }), [user, token, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
