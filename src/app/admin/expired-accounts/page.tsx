import { ExpiredAccounts } from '@/components/admin/expired-accounts';

export default function ExpiredAccountsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">
        Expired Accounts
      </h1>
      <ExpiredAccounts />
    </div>
  );
} 