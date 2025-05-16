'use client';

import type { Submission, SubmissionStatus } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/utils'; // Updated import path
import { CheckCircle2, Clock, XCircle, FilePlus, Archive, FolderOpen, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'; // Updated icons
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ResellerDashboardClientProps {
  submissions: Submission[];
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRenew = async () => {
    if (!submission.endDate) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/submissions/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submission.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to renew package');
      }

      toast({
        title: "Success",
        description: "Your package has been renewed for another month",
      });
    } catch (error) {
      console.error('Error renewing package:', error);
      toast({
        title: "Error",
        description: "Failed to renew package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] animate-in fade-in zoom-in-95">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{submission.customerEmail}</CardTitle>
            <CardDescription>Plan ID: {submission.requestedPlanId}</CardDescription>
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><strong>Duration:</strong> {submission.durationMonths} months</p>
        {submission.profileName && <p><strong>Profile Name:</strong> {submission.profileName}</p>}
        <p><strong>Requested:</strong> {formatDate(submission.requestDate)}</p>
        {submission.startDate && <p><strong>Start Date:</strong> {formatDate(submission.startDate)}</p>}
        {submission.endDate && <p><strong>End Date:</strong> {formatDate(submission.endDate)}</p>}
        {submission.notes && <p className="mt-2 text-muted-foreground"><strong>Notes:</strong> {submission.notes}</p>}
      </CardContent>
      {submission.status === 'Pending' && (
        <CardFooter className="text-xs text-accent-foreground/80 flex items-center">
          <Clock className="h-4 w-4 mr-1 text-accent" /> Awaiting admin approval.
        </CardFooter>
      )}
      {submission.status === 'Successful' && (
        <CardFooter className="flex justify-between items-center">
          <span className="text-xs text-green-600 dark:text-green-500 flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Approved and active.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRenew}
            disabled={isLoading}
            className="text-green-700 hover:text-green-800 hover:bg-green-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Renewing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew Package
              </>
            )}
          </Button>
        </CardFooter>
      )}
      {submission.status === 'Canceled' && (
        <CardFooter className="text-xs text-red-600 dark:text-red-500 flex items-center">
          <XCircle className="h-4 w-4 mr-1" /> This submission was canceled.
        </CardFooter>
      )}
    </Card>
  );
}

export function ResellerDashboardClient({ submissions }: ResellerDashboardClientProps) {
  const pendingSubmissions = submissions.filter(s => s.status === 'Pending').sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  const successfulSubmissions = submissions.filter(s => s.status === 'Successful').sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  const canceledSubmissions = submissions.filter(s => s.status === 'Canceled').sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

  const renderSubmissionList = (list: Submission[], emptyMessage: string, Icon: React.ElementType) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-300">
          <Icon className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">{emptyMessage}</p>
          <p className="text-sm">You currently have no submissions with this status.</p>
        </div>
      );
    }
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((sub, index) => (
          <div key={sub.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${index * 50}ms`}}>
             <SubmissionCard submission={sub} />
          </div>
        ))}
      </div>
    );
  };
  
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-6 animate-in fade-in zoom-in-95 duration-500">
        <Image src="https://picsum.photos/seed/nodatareseller/300/200" alt="No data" width={300} height={200} className="rounded-lg mb-8 opacity-70 shadow-lg" data-ai-hint="empty box document" />
        <h2 className="text-2xl font-semibold mb-2">No Submissions Yet</h2>
        <p className="text-muted-foreground mb-6">Once you submit customer emails, they will appear here.</p>
        <Button asChild className="animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200">
          <Link href="/reseller/submit">
            <FilePlus className="mr-2 h-4 w-4" /> Make Your First Submission
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">My Submissions</h1>
      <Tabs defaultValue="pending" className="w-full animate-in fade-in duration-300 delay-100">
        <TabsList className="grid w-full grid-cols-3 md:max-w-md">
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" /> Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="successful">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Successful ({successfulSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="canceled">
            <XCircle className="mr-2 h-4 w-4" /> Canceled ({canceledSubmissions.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          {renderSubmissionList(pendingSubmissions, "No Pending Submissions", FolderOpen)}
        </TabsContent>
        <TabsContent value="successful" className="mt-6">
          {renderSubmissionList(successfulSubmissions, "No Successful Submissions", Archive)}
        </TabsContent>
        <TabsContent value="canceled" className="mt-6">
          {renderSubmissionList(canceledSubmissions, "No Canceled Submissions", AlertTriangle)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

