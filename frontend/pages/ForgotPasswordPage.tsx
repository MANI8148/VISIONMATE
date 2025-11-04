
import React, { useState } from 'react';
import { Page } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import AuthFormContainer from './AuthFormContainer';
import { Toast } from '../components/Toast';

interface ForgotPasswordPageProps {
  setPage: (page: Page) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(`Password reset link sent to ${email}`);
    }, 1500);
  };

  return (
    <AuthFormContainer title="Reset Password">
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-center text-gray-400">Enter your email and we'll send you a link to reset your password.</p>
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" isLoading={isLoading}>
          Send Reset Link
        </Button>
        <p className="text-sm text-center text-gray-400">
          Remember your password?{' '}
          <a href="#" onClick={() => setPage(Page.Login)} className="font-medium text-blue-500 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </AuthFormContainer>
  );
};
