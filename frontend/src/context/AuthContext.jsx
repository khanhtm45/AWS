import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { token, email: userEmail, fullName, role, userId, avatarUrl } = response.data;
            
            // Save auth data
            localStorage.setItem('token', token);
            const userData = { email: userEmail, fullName, role, userID: userId, userId: userId, avatarUrl };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('userID', userId); // Lưu userID riêng biệt
            
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: 'Tài khoản hoặc mật khẩu không đúng' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (newUserData) => {
        setUser(prevUser => ({ ...prevUser, ...newUserData }));
        localStorage.setItem('user', JSON.stringify(newUserData));
    };

    const loginAsGuest = () => {
        localStorage.clear(); // Clear any previous user data
        const guestUser = {
            email: 'guest@bloodline.com',
            fullName: 'Guest User',
            role: 'GUEST'
        };
        localStorage.setItem('user', JSON.stringify(guestUser));
        localStorage.setItem('token', 'guest_token_12345'); // Dummy token for guest
        setUser(guestUser);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
        loginAsGuest,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};