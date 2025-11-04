import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Page } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import AuthFormContainer from './AuthFormContainer';
import { Toast } from '../components/Toast';

interface LoginPageProps {
  setPage: (page: Page) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      // Success will be handled by App.tsx observing isAuthenticated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormContainer title="Sign In">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-center justify-between">
            <div/>
            <a href="#" onClick={() => setPage(Page.ForgotPassword)} className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </a>
        </div>
        <Button type="submit" isLoading={isLoading}>
          Login
        </Button>
        <p className="text-sm text-center text-gray-400">
          Don't have an account?{' '}
          <a href="#" onClick={() => setPage(Page.Register)} className="font-medium text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </AuthFormContainer>
  );
};