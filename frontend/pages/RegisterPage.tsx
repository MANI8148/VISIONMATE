import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Page } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import AuthFormContainer from './AuthFormContainer';
import { Toast } from '../components/Toast';

interface RegisterPageProps {
  setPage: (page: Page) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ setPage }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormContainer title="Create Account">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
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
        <Button type="submit" isLoading={isLoading}>
          Register
        </Button>
        <p className="text-sm text-center text-gray-400">
          Already have an account?{' '}
          <a href="#" onClick={() => setPage(Page.Login)} className="font-medium text-blue-500 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </AuthFormContainer>
  );
};