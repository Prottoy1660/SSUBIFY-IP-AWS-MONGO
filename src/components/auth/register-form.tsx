'use client';

import { useActionState, useEffect } from 'react'; 
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, UserPlus, Loader2, User, Mail, Phone, Lock } from 'lucide-react'; 
import { handleRegister } from '@/app/actions';
import { LOGIN_PATH } from '@/lib/constants'; 
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phone: z.string().min(7, { message: 'Please enter a valid phone number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

const initialState = {
  message: '',
  errors: {} as Record<string, string[] | undefined>, 
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/20" 
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" /> Register
        </>
      )}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(handleRegister, initialState); 
  const { toast } = useToast(); 

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  useEffect(() => {
    if (state?.message && !state.message.toLowerCase().includes('successful')) { 
      toast({
        title: state.errors && Object.keys(state.errors).length > 0 ? 'Error' : 'Notification',
        description: state.message,
        variant: state.errors && Object.keys(state.errors).length > 0 ? 'destructive' : 'default',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            required
            className="pl-10 bg-background/50 border-primary/10 focus:border-primary/30 transition-colors"
            {...form.register('name')}
          />
        </div>
        {form.formState.errors.name && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {form.formState.errors.name.message}
          </motion.p>
        )}
        {state?.errors?.name && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {state.errors.name[0]}
          </motion.p>
        )}
      </motion.div>

      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="login@subifybd.com"
            required
            className="pl-10 bg-background/50 border-primary/10 focus:border-primary/30 transition-colors"
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {form.formState.errors.email.message}
          </motion.p>
        )}
        {state?.errors?.email && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {state.errors.email[0]}
          </motion.p>
        )}
      </motion.div>

      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. 017XXXXXXXX"
            required
            className="pl-10 bg-background/50 border-primary/10 focus:border-primary/30 transition-colors"
            {...form.register('phone')}
          />
        </div>
        {form.formState.errors.phone && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {form.formState.errors.phone.message}
          </motion.p>
        )}
        {state?.errors?.phone && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {state.errors.phone[0]}
          </motion.p>
        )}
      </motion.div>

      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            required
            className="pl-10 bg-background/50 border-primary/10 focus:border-primary/30 transition-colors"
            {...form.register('password')}
          />
        </div>
        {form.formState.errors.password && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {form.formState.errors.password.message}
          </motion.p>
        )}
        {state?.errors?.password && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {state.errors.password[0]}
          </motion.p>
        )}
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <SubmitButton />
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="text-center text-sm text-muted-foreground"
      >
        Already have an account?{' '}
        <Link 
          href={LOGIN_PATH} 
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Login
        </Link>
      </motion.p>
    </form>
  );
}
