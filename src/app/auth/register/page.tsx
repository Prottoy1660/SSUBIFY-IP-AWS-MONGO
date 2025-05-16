
import { AuthFormWrapper } from '@/components/auth/auth-form-wrapper';
import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Subify',
  description: 'Create a new Subify account.',
};

export default function RegisterPage() {
  return (
    <AuthFormWrapper
      title="Create an Account"
      description="Join Subify to manage your subscriptions."
    >
      <RegisterForm />
    </AuthFormWrapper>
  );
}
