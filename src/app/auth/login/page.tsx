
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Subify',
  description: 'Login to your Subify account.',
};

export default function LoginPage() {
  return (
    <AuthFormWrapper
      title="Welcome Back!"
      description="Enter your credentials to access your account."
    >
      <LoginForm />
    </AuthFormWrapper>
  );
}
