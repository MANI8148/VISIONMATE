
import React from 'react';
import { EyeIcon } from '../components/icons/EyeIcon';

interface AuthFormContainerProps {
  title: string;
  children: React.ReactNode;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-4">
                <EyeIcon className="w-12 h-12 text-blue-500" />
                <h1 className="text-5xl font-bold tracking-tighter">VisionMate</h1>
            </div>
            <p className="text-gray-400">Your companion in navigating the world.</p>
        </div>
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-semibold text-center text-white mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthFormContainer;
