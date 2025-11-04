import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';

export const ProfilePage: React.FC = () => {
    const { user, updateProfile } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    if (!user) {
        return <div>Loading...</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccess(null);
        setError(null);
        try {
            await updateProfile(name, email);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while updating profile.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}
            {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
            <div className="max-w-2xl mx-auto bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-lg">
                <h2 className="text-3xl font-bold mb-6 text-white">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        id="name"
                        label="Full Name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                     <Input 
                        id="email"
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                        <p className="bg-gray-700 text-gray-400 p-3 rounded-lg">{user.role}</p>
                    </div>
                    <Button type="submit" isLoading={isLoading}>
                        Save Changes
                    </Button>
                </form>
            </div>
        </main>
    );
}