'use client';

import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { submitNewCustomer } from '@/app/actions';
import type { Plan, Submission } from '@/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, Loader2, UserPlus, Calendar, Mail, Package, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const NewCustomerSchema = z.object({
  customerEmail: z.string().email({ message: 'Valid customer email is required.' }).optional(),
  requestedPlanId: z.string().min(1, { message: 'Please select a plan.' }),
  durationMonths: z.coerce.number().int().min(1, { message: 'Duration must be at least 1 month.' }).max(120, {message: 'Duration cannot exceed 120 months.'}),
  subscriptionStartDate: z.string().min(1, { message: 'Subscription start date is required.' }),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof NewCustomerSchema>;

const initialState = {
  message: '',
  errors: {} as Record<string, string[] | undefined>,
  submission: undefined as Submission | undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      className="w-full relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 group"
      disabled={pending}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: pending ? '100%' : '-100%' }}
        transition={{ duration: 1.5, repeat: pending ? Infinity : 0 }}
      />
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
      )}
      {pending ? 'Adding Customer...' : 'Add Customer'}
    </Button>
  );
}

interface AdminAddCustomerFormProps {
  plans: Plan[];
}

export function AdminAddCustomerForm({ plans }: AdminAddCustomerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(submitNewCustomer, initialState);
  const { toast } = useToast();
  const [formProgress, setFormProgress] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isUsingCsv, setIsUsingCsv] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(NewCustomerSchema),
    defaultValues: {
      customerEmail: '',
      requestedPlanId: '',
      durationMonths: plans[0]?.durationMonths || 12,
      subscriptionStartDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.errors && Object.keys(state.errors).length > 0 ? 'Error' : 'Success',
        description: state.message,
        variant: state.errors && Object.keys(state.errors).length > 0 ? 'destructive' : 'default',
      });
      if (!(state.errors && Object.keys(state.errors).length > 0) && state.submission) {
        form.reset({ 
          customerEmail: '', 
          requestedPlanId: '', 
          durationMonths: plans[0]?.durationMonths || 12, 
          subscriptionStartDate: new Date().toISOString().split('T')[0],
          notes: '',
        }); 
        setFormProgress(0);
      }
    }
  }, [state, toast, form, plans]);

  useEffect(() => {
    const values = form.getValues();
    let progress = 0;
    if (isUsingCsv) {
      if (values.requestedPlanId) progress += 33;
      if (values.durationMonths) progress += 33;
      if (values.subscriptionStartDate) progress += 34;
    } else {
      if (values.customerEmail) progress += 25;
      if (values.requestedPlanId) progress += 25;
      if (values.durationMonths) progress += 25;
      if (values.subscriptionStartDate) progress += 25;
    }
    setFormProgress(progress);
  }, [form.watch(), isUsingCsv]);
  
  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      form.setValue('durationMonths', selectedPlan.durationMonths);
    }
  };

  const onSubmit = async (data: CustomerFormValues) => {
    if (isUsingCsv) {
      if (!csvFile) {
        toast({
          title: "Error",
          description: "Please upload a CSV file first",
          variant: "destructive",
        });
        return;
      }
      
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('requestedPlanId', data.requestedPlanId);
      formData.append('durationMonths', data.durationMonths.toString());
      formData.append('subscriptionStartDate', data.subscriptionStartDate);

      try {
        const response = await fetch('/api/admin/import-customers', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to import customers');
        }

        const result = await response.json();
        toast({
          title: "Success",
          description: `Successfully imported ${result.importedCount} customers`,
        });

        form.reset({
          requestedPlanId: '',
          durationMonths: plans[0]?.durationMonths || 12,
          subscriptionStartDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        setCsvFile(null);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import customers. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      startTransition(() => {
        formAction(formData);
      });
    }
  };

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast({
        title: "Error",
        description: "Please upload a valid CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('requestedPlanId', form.getValues('requestedPlanId'));
      formData.append('durationMonths', form.getValues('durationMonths').toString());
      formData.append('subscriptionStartDate', form.getValues('subscriptionStartDate'));

      const response = await fetch('/api/admin/import-customers', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import customers');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Successfully imported ${result.importedCount} customers`,
      });

      form.reset({
        requestedPlanId: '',
        durationMonths: plans[0]?.durationMonths || 12,
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setCsvFile(null);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-pink-950/50 rounded-3xl blur-3xl opacity-50" />
      
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-800/40 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="space-y-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
            className="text-center"
          >
            <div className="inline-block p-2 rounded-full bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 mb-4">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Add New Customer
            </CardTitle>
            <CardDescription className="text-lg mt-3 text-gray-600 dark:text-gray-400">
              Fill in the details for the new customer subscription.
            </CardDescription>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Form Progress</span>
              <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                {formProgress}%
              </Badge>
            </div>
            <Progress 
              value={formProgress} 
              className="h-2 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 [&>div]:bg-gradient-to-r [&>div]:from-indigo-600 [&>div]:via-purple-600 [&>div]:to-pink-600 dark:[&>div]:from-indigo-400 dark:[&>div]:via-purple-400 dark:[&>div]:to-pink-400"
            />
          </motion.div>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-8 md:grid-cols-2"
            >
              {!isUsingCsv && (
                <motion.div variants={item} className="space-y-3">
                  <Label htmlFor="customerEmail" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Customer Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="customer@example.com"
                      className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                      {...form.register('customerEmail')}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: form.getValues('customerEmail') ? 1 : 0, scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {(form.formState.errors.customerEmail || state?.errors?.customerEmail) && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-red-500 dark:text-red-400"
                      >
                        {form.formState.errors.customerEmail?.message || state?.errors?.customerEmail?.[0]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              <motion.div variants={item} className="space-y-3">
                <Label htmlFor="requestedPlanId" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Requested Plan
                </Label>
                <Controller
                  name="requestedPlanId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handlePlanChange(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger 
                        id="requestedPlanId" 
                        className="transition-all duration-300 focus:ring-2 focus:ring-purple-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                      >
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <AnimatePresence>
                  {(form.formState.errors.requestedPlanId || state?.errors?.requestedPlanId) && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 dark:text-red-400"
                    >
                      {form.formState.errors.requestedPlanId?.message || state?.errors?.requestedPlanId?.[0]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={item} className="space-y-3">
                <Label htmlFor="durationMonths" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  Duration (Months)
                </Label>
                <div className="space-y-2">
                  <Input
                    id="durationMonths"
                    type="number"
                    placeholder="e.g., 12"
                    className="transition-all duration-300 focus:ring-2 focus:ring-pink-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    {...form.register('durationMonths')}
                  />
                  <p className="text-sm text-muted-foreground">
                    The subscription will expire after this many months from the start date.
                  </p>
                </div>
                <AnimatePresence>
                  {(form.formState.errors.durationMonths || state?.errors?.durationMonths) && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 dark:text-red-400"
                    >
                      {form.formState.errors.durationMonths?.message || state?.errors?.durationMonths?.[0]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={item} className="space-y-3">
                <Label htmlFor="subscriptionStartDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Subscription Start Date
                </Label>
                <div className="space-y-2">
                  <Input
                    id="subscriptionStartDate"
                    type="date"
                    className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    {...form.register('subscriptionStartDate')}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the date when the subscription was actually given to the customer. This will be used to calculate the expiration date.
                  </p>
                </div>
                <AnimatePresence>
                  {(form.formState.errors.subscriptionStartDate || state?.errors?.subscriptionStartDate) && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 dark:text-red-400"
                    >
                      {form.formState.errors.subscriptionStartDate?.message || state?.errors?.subscriptionStartDate?.[0]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={item} className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="csvFile" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FilePlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Import Customers (CSV)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUsingCsv(!isUsingCsv)}
                    className="text-sm"
                  >
                    {isUsingCsv ? 'Switch to Manual Entry' : 'Switch to CSV Import'}
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvImport}
                    className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    disabled={isImporting}
                  />
                  {isImporting && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Importing...</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with customer emails. The file should have a header row with 'email' column.
                </p>
              </motion.div>

              <motion.div variants={item} className="space-y-3">
                <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes for renewal prediction..."
                  className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 min-h-[100px] resize-none"
                  {...form.register('notes')}
                />
                <AnimatePresence>
                  {state?.errors?.notes && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-500 dark:text-red-400"
                    >
                      {state.errors.notes[0]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {state?.message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert 
                    variant={state.errors && Object.keys(state.errors).length > 0 ? "destructive" : "default"}
                    className={cn(
                      "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0",
                      state.errors && Object.keys(state.errors).length > 0 
                        ? "bg-red-50/50 dark:bg-red-950/50" 
                        : "bg-green-50/50 dark:bg-green-950/50"
                    )}
                  >
                    <AlertDescription className="flex items-center gap-2">
                      {state.errors && Object.keys(state.errors).length > 0 ? (
                        <span className="text-red-600 dark:text-red-400">{state.message}</span>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">{state.message}</span>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full"
            >
              <SubmitButton />
            </motion.div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
} 