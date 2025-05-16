'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Package, AlertTriangle, Key, Trash2, Ban, Edit2, Users, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import type { User as UserType, Submission, PaymentRequest, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { banReseller, resetResellerPassword, deleteReseller, updateResellerInfo, updateSubmissionProfileName, createPaymentRequest, getPaymentRequestsByResellerId, updatePaymentRequest, getResellerById, createSuccessfulSubmission } from '@/lib/data-service';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResellerProfileProps {
  reseller: UserType;
  submissions: Submission[];
}

export function ResellerProfile({ reseller, submissions: initialSubmissions }: ResellerProfileProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSubmissionId, setLoadingSubmissionId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editForm, setEditForm] = useState({
    name: reseller.name,
    email: reseller.email,
    phone: reseller.phone || '',
  });
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Bkash');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const loadPaymentRequests = async () => {
      const requests = await getPaymentRequestsByResellerId(reseller.id);
      setPaymentRequests(requests);
    };
    loadPaymentRequests();
  }, [reseller.id]);

  const handleBanReseller = async () => {
    try {
      setIsLoading(true);
      const updatedReseller = await banReseller(reseller.id, !reseller.banned);
      if (updatedReseller) {
        toast({
          title: reseller.banned ? "Reseller Unbanned" : "Reseller Banned",
          description: `${reseller.name} has been ${reseller.banned ? "unbanned" : "banned"} from the system.`,
        });
        router.refresh();
      } else {
        throw new Error('Failed to update reseller status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reseller status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsBanDialogOpen(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const updatedReseller = await resetResellerPassword(reseller.id, newPassword);
      if (updatedReseller) {
        toast({
          title: "Password Reset",
          description: `Password has been reset for ${reseller.name}.`,
        });
        router.refresh();
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsResetPasswordDialogOpen(false);
      setNewPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const success = await deleteReseller(reseller.id);
      if (success) {
        toast({
          title: "Account Deleted",
          description: `${reseller.name}'s account has been deleted.`,
        });
        router.push('/admin/resellers');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      setIsLoading(true);
      const updatedReseller = await updateResellerInfo(reseller.id, editForm);
      if (updatedReseller) {
        toast({
          title: "Profile Updated",
          description: "Reseller information has been updated successfully.",
        });
        router.refresh();
      } else {
        throw new Error('Failed to update reseller information');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reseller information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsEditDialogOpen(false);
    }
  };

  const handleCreatePaymentRequest = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting payment request creation process');
      console.log('Reseller ID:', reseller.id);
      console.log('Amount:', amount);
      
      // First verify the reseller exists
      console.log('Verifying reseller exists...');
      const resellerExists = await getResellerById(reseller.id);
      console.log('Reseller verification result:', resellerExists ? 'Found' : 'Not found');
      
      if (!resellerExists) {
        throw new Error('Reseller not found');
      }

      console.log('Creating payment request...');
      const request = await createPaymentRequest(reseller.id, amount);
      console.log('Payment request creation result:', request ? 'Success' : 'Failed');
      
      if (!request) {
        throw new Error('Failed to create payment request - no request returned');
      }

      console.log('Payment request created successfully:', request);

      toast({
        title: "Payment Request Created",
        description: `Payment request for ${amount} BDT has been created.`,
      });

      // Update the local state with the new request
      console.log('Updating local state with new request');
      setPaymentRequests(prev => [request, ...prev]);
      setIsPaymentDialogOpen(false);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error in handleCreatePaymentRequest:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePayment = async (requestId: string) => {
    if (!transactionId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a transaction ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const updatedRequest = await updatePaymentRequest(reseller.id, requestId, {
        status: 'Approved',
        paymentMethod: selectedPaymentMethod,
        transactionId: transactionId.trim(),
      });
      if (updatedRequest) {
        toast({
          title: "Payment Updated",
          description: "Payment has been marked as approved.",
        });
        setPaymentRequests(prev =>
          prev.map(req => (req.id === requestId ? updatedRequest : req))
        );
        setTransactionId('');
        setSelectedPaymentMethod('Bkash'); // Reset to default
      } else {
        throw new Error('Failed to update payment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomerEmail = async () => {
    if (!customerEmail) return;

    setIsAddingCustomer(true);
    try {
      const submission = await createSuccessfulSubmission(reseller.id, customerEmail);
      if (submission) {
        setSubmissions((prev: Submission[]) => [submission, ...prev]);
        setCustomerEmail('');
        toast({
          title: "Success",
          description: "Customer email added successfully",
        });
      } else {
        throw new Error('Failed to add customer email');
      }
    } catch (error) {
      console.error('Error adding customer email:', error);
      toast({
        title: "Error",
        description: "Failed to add customer email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleDeleteEmail = async (submissionId: string) => {
    try {
      setLoadingSubmissionId(submissionId);
      const updatedSubmission = await updateSubmissionProfileName(submissionId, '');
      if (updatedSubmission) {
        setSubmissions(prev => prev.map(sub => 
          sub.id === submissionId ? updatedSubmission : sub
        ));
        toast({
          title: "Email Deleted",
          description: "Customer email has been removed from the submission.",
        });
      } else {
        throw new Error('Failed to delete email');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSubmissionId(null);
    }
  };

  const stats = {
    totalSubmissions: submissions.length,
    successfulSubmissions: submissions.filter(s => s.status === 'Successful').length,
    pendingSubmissions: submissions.filter(s => s.status === 'Pending').length,
    canceledSubmissions: submissions.filter(s => s.status === 'Canceled').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successfulSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.canceledSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg">{reseller.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant="secondary" className="capitalize">
                  {reseller.role}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="text-lg">{reseller.email}</p>
              </div>
              {reseller.phone && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </p>
                  <p className="text-lg">{reseller.phone}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={reseller.banned ? "destructive" : "secondary"}>
                  {reseller.banned ? "Banned" : "Active"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Submissions
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Input
                  placeholder="Enter customer email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="max-w-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomerEmail}
                  disabled={!customerEmail || isAddingCustomer}
                >
                  {isAddingCustomer ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Email
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add customer emails to automatically create successful submissions
              </p>
            </div>
            {submissions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No customer submissions found
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Customer Email</p>
                          <div className="flex items-center gap-2">
                            <p>{submission.customerEmail}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEmail(submission.id)}
                              disabled={loadingSubmissionId === submission.id}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant={submission.status === 'Successful' ? 'secondary' : submission.status === 'Pending' ? 'outline' : 'destructive'}>
                            {submission.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Requested</p>
                          <p>{formatDate(submission.requestDate)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Payment Requests
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Request Payment
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentRequests.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No payment requests found
              </div>
            ) : (
              <div className="space-y-4">
                {paymentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Amount</p>
                          <p className="text-lg">{request.amount} BDT</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge
                            variant={
                              request.status === 'Approved'
                                ? 'secondary'
                                : request.status === 'Pending'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Requested</p>
                          <p>{formatDate(request.requestDate)}</p>
                        </div>
                        {request.status === 'Pending' && (
                          <div className="col-span-3 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Payment Method</Label>
                                <Select
                                  value={selectedPaymentMethod}
                                  onValueChange={(value) =>
                                    setSelectedPaymentMethod(value as PaymentMethod)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Bkash">Bkash</SelectItem>
                                    <SelectItem value="Nagad">Nagad</SelectItem>
                                    <SelectItem value="Rocket">Rocket</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Transaction ID</Label>
                                <Input
                                  value={transactionId}
                                  onChange={(e) => setTransactionId(e.target.value)}
                                  placeholder="Enter transaction ID"
                                />
                              </div>
                            </div>
                            <Button
                              className="mt-4"
                              onClick={() => handleUpdatePayment(request.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? "Updating..." : "Mark as Paid"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Account Actions
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBanDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Ban className="mr-2 h-4 w-4" />
                {reseller.banned ? "Unban Reseller" : "Ban Reseller"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Ban className="mr-2 h-4 w-4" />
                    {reseller.banned ? "Unban Reseller" : "Ban Reseller"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{reseller.banned ? "Unban Reseller" : "Ban Reseller"}</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to {reseller.banned ? "unban" : "ban"} {reseller.name}?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBanDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleBanReseller} disabled={isLoading}>
                      {isLoading ? "Updating..." : reseller.banned ? "Unban" : "Ban"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter a new password for {reseller.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleResetPassword} disabled={isLoading}>
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete {reseller.name}'s account? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
                      {isLoading ? "Deleting..." : "Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Submission History
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
              <TabsTrigger value="successful">Successful ({stats.successfulSubmissions})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pendingSubmissions})</TabsTrigger>
              <TabsTrigger value="canceled">Canceled ({stats.canceledSubmissions})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <SubmissionList submissions={submissions} />
            </TabsContent>
            <TabsContent value="successful" className="mt-4">
              <SubmissionList submissions={submissions.filter(s => s.status === 'Successful')} />
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              <SubmissionList submissions={submissions.filter(s => s.status === 'Pending')} />
            </TabsContent>
            <TabsContent value="canceled" className="mt-4">
              <SubmissionList submissions={submissions.filter(s => s.status === 'Canceled')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Information Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reseller Information</DialogTitle>
            <DialogDescription>
              Update the reseller's personal information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateInfo} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter reseller name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter reseller email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter reseller phone"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Request Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payment</DialogTitle>
            <DialogDescription>
              Enter the amount to request from the reseller.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (BDT)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount in BDT"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePaymentRequest}
              disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Request
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionList({ submissions }: { submissions: Submission[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleDeleteEmail = async (submissionId: string) => {
    try {
      setIsLoading(submissionId);
      const updatedSubmission = await updateSubmissionProfileName(submissionId, '');
      if (updatedSubmission) {
        toast({
          title: "Email Deleted",
          description: "Customer email has been removed from the submission.",
        });
        router.refresh();
      } else {
        throw new Error('Failed to delete email');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No submissions found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Email</p>
                <div className="flex items-center gap-2">
                  <p>{submission.customerEmail}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEmail(submission.id)}
                    disabled={isLoading === submission.id}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={submission.status === 'Successful' ? 'secondary' : submission.status === 'Pending' ? 'outline' : 'destructive'}>
                  {submission.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requested</p>
                <p>{formatDate(submission.requestDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 