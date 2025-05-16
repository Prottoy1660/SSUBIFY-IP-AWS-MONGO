import { LoginHistory } from '@/components/admin/login-history';

export default function LoginHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">
        Login History
      </h1>
      <LoginHistory />
    </div>
  );
} 