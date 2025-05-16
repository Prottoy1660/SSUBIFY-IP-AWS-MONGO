'use client';

import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getApprovedCustomerEmails } from '@/lib/data-service';
import { format } from 'date-fns';

export function DashboardHeader() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportEmails = async () => {
    try {
      setIsExporting(true);
      const emails = await getApprovedCustomerEmails();
      
      // Create CSV content
      const headers = ['Email', 'Name', 'Plan', 'Start Date', 'End Date'];
      const csvContent = [
        headers.join(','),
        ...emails.map(email => [
          email.email,
          email.name || '',
          email.plan,
          format(new Date(email.startDate), 'yyyy-MM-dd'),
          format(new Date(email.endDate), 'yyyy-MM-dd')
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `approved-customers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Customer emails exported successfully",
      });
    } catch (error) {
      console.error('Error exporting emails:', error);
      toast({
        title: "Error",
        description: "Failed to export customer emails",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your business</p>
      </div>
      <div className="flex gap-4">
        <Button
          variant="default"
          size="lg"
          className="relative group gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden"
          onClick={handleExportEmails}
          disabled={isExporting}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Exporting...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-5 w-5 transform group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">Export Emails</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  );
} 