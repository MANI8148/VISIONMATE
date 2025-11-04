
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { Page } from './types';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { Header } from './components/Header';

const AppContent: React.FC = () => {
    const [page, setPage] = useState<Page>(Page.Login);
    const { isAuthenticated, user } = useContext(AuthContext);

    useEffect(() => {
        if (isAuthenticated) {
            setPage(Page.Home);
        } else {
            setPage(Page.Login);
        }
    }, [isAuthenticated]);
    
    if (!isAuthenticated || !user) {
        switch (page) {
            case Page.Register:
                return <RegisterPage setPage={setPage} />;
            case Page.ForgotPassword:
                return <ForgotPasswordPage setPage={setPage} />;
            default:
                return <LoginPage setPage={setPage} />;
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Header user={user} setPage={setPage} />
            {page === Page.Home && <HomePage />}
            {page === Page.Profile && <ProfilePage />}
        </div>
    );
};


const App: React.FC = () => {
    return (
        <AuthProvider>
            <AlertProvider>
                <AppContent />
            </AlertProvider>
        </AuthProvider>
    );
};

export default App;
