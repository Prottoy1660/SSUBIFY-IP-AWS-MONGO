'use client';

import { useActionState, useEffect, useTransition } from 'react'; 
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Loader2, Mail, Lock } from 'lucide-react'; 
import { handleLogin } from '@/app/actions';
import { REGISTER_PATH } from '@/lib/constants'; 
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const LoginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email or phone is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

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
          <LogIn className="mr-2 h-4 w-4" /> Login
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(handleLogin, initialState); 
  const { toast } = useToast(); 

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: '',
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('userAgent', navigator.userAgent);
    
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      formData.append('ipAddress', data.ip);
    } catch (error) {
      console.error('Failed to get IP address:', error);
      formData.append('ipAddress', 'unknown');
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Label htmlFor="identifier" className="text-sm font-medium">Email or Phone</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="identifier"
            type="text"
            placeholder="Enter your email or phone number"
            required
            className="pl-10 bg-background/50 border-primary/10 focus:border-primary/30 transition-colors"
            {...form.register('identifier')}
          />
        </div>
        {form.formState.errors.identifier && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {form.formState.errors.identifier.message}
          </motion.p>
        )}
        {state?.errors?.identifier && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {state.errors.identifier[0]}
          </motion.p>
        )}
      </motion.div>

      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
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
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SubmitButton />
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center text-sm text-muted-foreground"
      >
        Don&apos;t have an account?{' '}
        <Link 
          href={REGISTER_PATH} 
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Register
        </Link>
      </motion.p>
    </form>
  );
}
