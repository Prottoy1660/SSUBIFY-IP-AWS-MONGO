'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, addMonths } from '@/lib/utils';
import { getExpiringSubmissions, markNotificationAsRead, updateSubmissionStatus } from '@/lib/data-service';
import type { Submission } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExpiringPackages() {
  const [expiringSubmissions, setExpiringSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadExpiringSubmissions = async () => {
    setIsLoading(true);
    try {
      const submissions = await getExpiringSubmissions();
      setExpiringSubmissions(submissions);
    } catch (error) {
      console.error('Error loading expiring submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load expiring submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpiringSubmissions();
    // Refresh every hour
    const interval = setInterval(loadExpiringSubmissions, 3600000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (submissionId: string) => {
    try {
      const success = await markNotificationAsRead(submissionId);
      if (success) {
        setExpiringSubmissions(prev => 
          prev.filter(sub => sub.id !== submissionId)
        );
        toast({
          title: "Notification Dismissed",
          description: "The notification has been marked as read",
        });
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss notification",
        variant: "destructive",
      });
    }
  };

  const handleRenew = async () => {
    if (!selectedSubmission?.endDate) return;

    setIsLoading(true);
    try {
      const newEndDate = addMonths(new Date(selectedSubmission.endDate), 1);
      const updatedSubmission = await updateSubmissionStatus(selectedSubmission.id, 'Successful');
      
      if (updatedSubmission) {
        setExpiringSubmissions(prev => 
          prev.filter(sub => sub.id !== selectedSubmission.id)
        );
        toast({
          title: "Success",
          description: "Package has been renewed for another month",
        });
        setIsRenewDialogOpen(false);
        setSelectedSubmission(null);
      } else {
        throw new Error('Failed to renew package');
      }
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

  if (expiringSubmissions.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mb-6 border-yellow-500 animate-in fade-in slide-in-from-top-4 duration-500">
        <CardHeader className="bg-yellow-50">
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            Expiring Packages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {expiringSubmissions.map((submission, index) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200 animate-in fade-in slide-in-from-right-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {submission.customerEmail}
                  </p>
                  <p className="text-sm text-yellow-700">
                    Expires on {formatDate(submission.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setIsRenewDialogOpen(true);
                    }}
                    className="text-green-700 hover:text-green-800 hover:bg-green-50 transition-all duration-200 hover:scale-105"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(submission.id)}
                    className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent className="animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>Renew Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to renew this package for another month?
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && selectedSubmission.endDate && (
            <div className="space-y-2 py-4">
              <p className="text-sm text-muted-foreground">
                Customer: {selectedSubmission.customerEmail}
              </p>
              <p className="text-sm text-muted-foreground">
                Current Expiry: {formatDate(selectedSubmission.endDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                New Expiry: {formatDate(addMonths(new Date(selectedSubmission.endDate), 1).toISOString())}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRenewDialogOpen(false)}
              disabled={isLoading}
              className="transition-all duration-200 hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenew}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-105"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Renewing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renew Package
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 