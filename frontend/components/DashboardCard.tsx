import React from 'react';

export const DashboardCard: React.FC<{title: React.ReactNode; children: React.ReactNode, className?: string}> = ({title, children, className}) => (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg ${className}`}>
        <h3 className="text-xl font-semibold mb-4 text-white flex items-center">{title}</h3>
        {children}
    </div>
);