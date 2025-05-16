'use client';

import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Save, 
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Camera,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import type { User } from '@/types';

const ProfileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  currentPassword: z.string().min(6, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters.' }).optional(),
  confirmPassword: z.string().optional(),
  avatar: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

interface ProfileFormState {
  message: string;
  errors?: Record<string, string[]>;
}

interface AdminProfileFormProps {
  user: User;
}

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
        <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
      )}
      {pending ? 'Saving Changes...' : 'Save Changes'}
    </Button>
  );
}

export function AdminProfileForm({ user }: AdminProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      avatar: user.image || '',
    },
  });

  const [state, setState] = React.useState<ProfileFormState>({
    message: '',
    errors: {}
  });

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.errors && Object.keys(state.errors).length > 0 ? 'Error' : 'Success',
        description: state.message,
        variant: state.errors && Object.keys(state.errors).length > 0 ? 'destructive' : 'default',
      });
    }
  }, [state, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        // TODO: Implement profile update logic
        setState({
          message: 'Profile updated successfully.',
          errors: {}
        });
      } catch (error) {
        setState({
          message: 'Failed to update profile.',
          errors: { form: ['An error occurred while updating your profile.'] }
        });
      }
    });
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.url) {
        form.setValue('avatar', data.url);
        toast({ title: 'Profile picture updated!', variant: 'default' });
      } else {
        throw new Error('No URL returned');
      }
    } catch (error) {
      toast({ title: 'Failed to upload image', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
      
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-800/40 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="space-y-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
            className="text-center"
          >
            <div className="inline-block p-2 rounded-full bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 mb-4">
              <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Profile Settings
            </CardTitle>
            <CardDescription className="text-lg mt-3 text-gray-600 dark:text-gray-400">
              Update your profile information and preferences.
            </CardDescription>
          </motion.div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-8"
            >
              <motion.div variants={item} className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800">
                    <AvatarImage src={form.watch('avatar')} alt={form.getValues('name')} />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                      {form.getValues('name').split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-110 transition-transform duration-200"
                    onClick={handleAvatarClick}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" /> : <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to change profile picture</p>
              </motion.div>

              <Separator className="my-8" />

              <motion.div variants={item} className="space-y-4">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <UserIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                />
              </motion.div>

              <motion.div variants={item} className="space-y-4">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                />
              </motion.div>

              <motion.div variants={item} className="space-y-4">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register('phone')}
                  className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                />
              </motion.div>

              <Separator className="my-8" />

              <motion.div variants={item} className="space-y-4">
                <Label htmlFor="currentPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...form.register('currentPassword')}
                  className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                />
              </motion.div>

              <motion.div variants={item} className="space-y-4">
                <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...form.register('newPassword')}
                  className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                />
              </motion.div>

              <motion.div variants={item} className="space-y-4">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register('confirmPassword')}
                  className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                />
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {state?.message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <div 
                    className={cn(
                      "p-4 rounded-lg",
                      state.errors && Object.keys(state.errors).length > 0 
                        ? "bg-red-50/50 dark:bg-red-950/50 text-red-600 dark:text-red-400" 
                        : "bg-green-50/50 dark:bg-green-950/50 text-green-600 dark:text-green-400"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {state.errors && Object.keys(state.errors).length > 0 ? (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          <span>{state.message}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{state.message}</span>
                        </>
                      )}
                    </div>
                  </div>
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