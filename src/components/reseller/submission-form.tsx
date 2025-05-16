'use client';

import { useActionState } from 'react';
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
import type { Plan } from '@/types';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, Loader2 } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Form } from '@/components/ui/form';

const NewSubmissionSchema = z.object({
  customerEmail: z.string().email({ message: 'Valid customer email is required.' }),
  requestedPlanId: z.string().min(1, { message: 'Please select a plan.' }),
  durationMonths: z.coerce.number().int().min(1, { message: 'Duration must be at least 1 month.' }).max(120, {message: 'Duration cannot exceed 120 months.'}),
  notes: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof NewSubmissionSchema>;

const initialState = {
  message: '',
  errors: {} as Record<string, string[] | undefined>, // Typed errors
  submission: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full transition-transform hover:scale-[1.02] active:scale-[0.98]" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FilePlus className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Submitting...' : 'Submit Request'}
    </Button>
  );
}

interface SubmissionFormProps {
  plans: Plan[];
}

export function SubmissionForm({ plans }: SubmissionFormProps) {
  const [state, formAction] = useActionState(submitNewCustomer, initialState); 
  const { toast } = useToast();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(NewSubmissionSchema),
    defaultValues: {
      customerEmail: '',
      requestedPlanId: '',
      durationMonths: plans[0]?.durationMonths || 12,
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
            notes: '',
        }); 
      }
    }
  }, [state, toast, form, plans]);
  
  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      form.setValue('durationMonths', selectedPlan.durationMonths);
    }
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
        <CardTitle className="text-2xl">New Customer Submission</CardTitle>
        <CardDescription>Fill in the details for the new customer subscription.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form action={formAction}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.customerEmail && (
                  <p className="text-sm text-destructive">{form.formState.errors.customerEmail.message}</p>
                )}
                {state?.errors?.customerEmail && (
                  <p className="text-sm text-destructive">{state.errors.customerEmail[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedPlanId">Requested Plan</Label>
                <Controller
                  name="requestedPlanId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      name={field.name} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handlePlanChange(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger id="requestedPlanId">
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
                {form.formState.errors.requestedPlanId && (
                  <p className="text-sm text-destructive">{form.formState.errors.requestedPlanId.message}</p>
                )}
                {state?.errors?.requestedPlanId && (
                  <p className="text-sm text-destructive">{state.errors.requestedPlanId[0]}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
              <FormField
                control={form.control}
                name="durationMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.durationMonths && (
                <p className="text-sm text-destructive">{form.formState.errors.durationMonths.message}</p>
              )}
              {state?.errors?.durationMonths && (
                <p className="text-sm text-destructive">{state.errors.durationMonths[0]}</p>
              )}
            </div>

            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-250">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {state?.errors?.notes && (
                <p className="text-sm text-destructive">{state.errors.notes[0]}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
            <SubmitButton />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
