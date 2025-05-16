import { AdminSettingsForm } from '@/components/admin/admin-settings-form';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      <AdminSettingsForm />
    </div>
  );
} 