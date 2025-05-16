'use client';

import { useState, useEffect } from 'react';
import { PaymentRequest, PaymentMethod } from '@/types';
import { getPaymentRequestsByResellerId, updatePaymentRequest } from '@/lib/data-service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PaymentRequestsProps {
  resellerId: string;
}

export function PaymentRequests({ resellerId }: PaymentRequestsProps) {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('');
  const [transactionId, setTransactionId] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentRequests();
  }, [resellerId]);

  const loadPaymentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading payment requests for reseller:', resellerId);
      const requests = await getPaymentRequestsByResellerId(resellerId);
      console.log('Loaded payment requests:', requests);
      setPaymentRequests(requests);
    } catch (err) {
      console.error('Error loading payment requests:', err);
      setError('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  // Add a refresh function that can be called periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadPaymentRequests();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [resellerId]);

  const handleUpdatePayment = async (requestId: string) => {
    if (!selectedPaymentMethod || !transactionId.trim()) {
      setError('Please fill in all payment details');
      return;
    }

    setUpdatingId(requestId);
    setError(null);

    try {
      const updatedRequest = await updatePaymentRequest(resellerId, requestId, {
        status: 'Approved',
        paymentMethod: selectedPaymentMethod,
        transactionId: transactionId.trim(),
      });

      if (!updatedRequest) {
        throw new Error('Failed to update payment request');
      }

      await loadPaymentRequests(); // Reload all requests to ensure we have the latest data
      setSelectedPaymentMethod('');
      setTransactionId('');
    } catch (err) {
      console.error('Error updating payment:', err);
      setError('Failed to update payment');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div>Loading payment requests...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {paymentRequests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Payment Request</CardTitle>
                <CardDescription>
                  Requested on {new Date(request.requestDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge
                variant={
                  request.status === 'Approved'
                    ? 'default'
                    : request.status === 'Rejected'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {request.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                {request.amount} {request.currency}
              </div>

              {request.status === 'Pending' && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <Select
                        value={selectedPaymentMethod}
                        onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bkash">Bkash</SelectItem>
                          <SelectItem value="Nagad">Nagad</SelectItem>
                          <SelectItem value="Rocket">Rocket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Transaction ID</label>
                      <Input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction ID"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUpdatePayment(request.id)}
                    disabled={updatingId === request.id || !selectedPaymentMethod || !transactionId.trim()}
                  >
                    {updatingId === request.id ? 'Submitting...' : 'Submit Payment'}
                  </Button>
                </div>
              )}

              {request.status === 'Approved' && (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Payment Method:</span>{' '}
                    {request.paymentMethod}
                  </p>
                  <p>
                    <span className="font-medium">Transaction ID:</span>{' '}
                    {request.transactionId}
                  </p>
                  <p>
                    <span className="font-medium">Payment Date:</span>{' '}
                    {new Date(request.paymentDate!).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {paymentRequests.length === 0 && (
        <div className="text-center text-gray-500">
          No payment requests found
        </div>
      )}
    </div>
  );
} 