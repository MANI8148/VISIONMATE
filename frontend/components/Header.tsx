
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Page, User } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { UserIcon } from './icons/UserIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface HeaderProps {
    user: User;
    setPage: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, setPage }) => {
    const { logout } = useContext(AuthContext);

    return (
        <header className="bg-gray-900/80 backdrop-blur-sm p-4 sticky top-0 z-50 border-b border-gray-700">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage(Page.Home)}>
                    <EyeIcon className="w-8 h-8 text-blue-400" />
                    <h1 className="text-2xl font-bold tracking-tighter">VisionMate</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-300 hidden sm:block">Welcome, {user.name}</span>
                    <button onClick={() => setPage(Page.Profile)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Profile">
                        <UserIcon />
                    </button>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Logout">
                        <LogoutIcon />
                    </button>
                </div>
            </div>
        </header>
    );
};
