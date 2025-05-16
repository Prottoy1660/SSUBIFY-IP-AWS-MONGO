'use client';

import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Save, 
  Settings, 
  Shield, 
  Bell, 
  Brain, 
  Globe, 
  Palette, 
  Mail, 
  Lock, 
  Database, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const SettingsSchema = z.object({
  // General Settings
  siteName: z.string().min(1, { message: 'Site name is required.' }),
  siteDescription: z.string().optional(),
  maintenanceMode: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'bn']),
  
  // Security Settings
  enableTwoFactor: z.boolean(),
  sessionTimeout: z.coerce.number().int().min(5).max(120),
  passwordPolicy: z.object({
    minLength: z.coerce.number().int().min(8).max(32),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    requireUppercase: z.boolean(),
  }),
  
  // Notification Settings
  emailNotifications: z.boolean(),
  notifyOnNewCustomer: z.boolean(),
  notifyOnPayment: z.boolean(),
  notifyOnExpiry: z.boolean(),
  notifyOnLogin: z.boolean(),
  emailTemplate: z.string().optional(),
  
  // AI Settings
  enableAIPrediction: z.boolean(),
  aiConfidenceThreshold: z.coerce.number().int().min(0).max(100),
  aiModelVersion: z.enum(['v1', 'v2', 'v3']),
  aiTrainingData: z.boolean(),
  
  // Backup Settings
  enableAutoBackup: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  backupRetention: z.coerce.number().int().min(1).max(365),
  backupLocation: z.enum(['local', 'cloud']),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

interface AdminSettingsFormState {
  message: string;
  errors?: Record<string, string[]>;
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

export function AdminSettingsForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [formProgress, setFormProgress] = useState(0);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      siteName: 'My Admin Panel',
      siteDescription: '',
      maintenanceMode: false,
      theme: 'system',
      language: 'en',
      enableTwoFactor: false,
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 12,
        requireNumbers: true,
        requireSpecialChars: true,
        requireUppercase: true,
      },
      emailNotifications: true,
      notifyOnNewCustomer: true,
      notifyOnPayment: true,
      notifyOnExpiry: true,
      notifyOnLogin: true,
      emailTemplate: '',
      enableAIPrediction: true,
      aiConfidenceThreshold: 75,
      aiModelVersion: 'v2',
      aiTrainingData: true,
      enableAutoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      backupLocation: 'cloud',
    },
  });

  const [state, formAction] = useActionState<AdminSettingsFormState>(async () => {
    // TODO: Implement settings update logic
    return { message: 'Settings updated successfully.' };
  }, {
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

  useEffect(() => {
    const values = form.getValues();
    let progress = 0;
    const totalFields = Object.keys(values).length;
    const filledFields = Object.entries(values).filter(([_, value]) => {
      if (typeof value === 'boolean') return true;
      if (typeof value === 'number') return value > 0;
      if (typeof value === 'string') return value.length > 0;
      if (typeof value === 'object') return Object.values(value).some(v => v !== undefined);
      return false;
    }).length;
    progress = (filledFields / totalFields) * 100;
    setFormProgress(progress);
  }, [form.watch()]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
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
              <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Admin Settings
            </CardTitle>
            <CardDescription className="text-lg mt-3 text-gray-600 dark:text-gray-400">
              Configure your admin panel settings and preferences.
            </CardDescription>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Settings Progress</span>
              <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                {Math.round(formProgress)}%
              </Badge>
            </div>
            <Progress 
              value={formProgress} 
              className="h-2 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 [&>div]:bg-gradient-to-r [&>div]:from-indigo-600 [&>div]:via-purple-600 [&>div]:to-pink-600 dark:[&>div]:from-indigo-400 dark:[&>div]:via-purple-400 dark:[&>div]:to-pink-400"
            />
          </motion.div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <Tabs 
              defaultValue="general" 
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-6 mb-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                  <Globe className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                  <Brain className="h-4 w-4" />
                  AI
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                  <Database className="h-4 w-4" />
                  Backup
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
              </TabsList>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
              >
                <TabsContent value="general" className="space-y-6">
                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="siteName" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Site Name
                    </Label>
                    <Input
                      id="siteName"
                      {...form.register('siteName')}
                      className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    />
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="siteDescription" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Site Description
                    </Label>
                    <Textarea
                      id="siteDescription"
                      {...form.register('siteDescription')}
                      className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    />
                  </motion.div>

                  <motion.div variants={item} className="flex items-center space-x-2">
                    <Switch
                      id="maintenanceMode"
                      {...form.register('maintenanceMode')}
                    />
                    <Label htmlFor="maintenanceMode" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      Maintenance Mode
                    </Label>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="theme" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Theme
                    </Label>
                    <Select
                      onValueChange={(value) => form.setValue('theme', value as 'light' | 'dark' | 'system')}
                      defaultValue={form.getValues('theme')}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="language" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Language
                    </Label>
                    <Select
                      onValueChange={(value) => form.setValue('language', value as 'en' | 'bn')}
                      defaultValue={form.getValues('language')}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="bn">বাংলা</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <motion.div variants={item} className="flex items-center space-x-2">
                    <Switch
                      id="enableTwoFactor"
                      {...form.register('enableTwoFactor')}
                    />
                    <Label htmlFor="enableTwoFactor" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Enable Two-Factor Authentication
                    </Label>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="sessionTimeout" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      {...form.register('sessionTimeout')}
                      className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    />
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Password Policy
                    </Label>
                    <div className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <div className="space-y-2">
                        <Label htmlFor="minLength" className="text-gray-700 dark:text-gray-300">Minimum Length</Label>
                        <Input
                          id="minLength"
                          type="number"
                          {...form.register('passwordPolicy.minLength')}
                          className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireNumbers"
                          {...form.register('passwordPolicy.requireNumbers')}
                        />
                        <Label htmlFor="requireNumbers" className="text-gray-700 dark:text-gray-300">Require Numbers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireSpecialChars"
                          {...form.register('passwordPolicy.requireSpecialChars')}
                        />
                        <Label htmlFor="requireSpecialChars" className="text-gray-700 dark:text-gray-300">Require Special Characters</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireUppercase"
                          {...form.register('passwordPolicy.requireUppercase')}
                        />
                        <Label htmlFor="requireUppercase" className="text-gray-700 dark:text-gray-300">Require Uppercase Letters</Label>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                  <motion.div variants={item} className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      {...form.register('emailNotifications')}
                    />
                    <Label htmlFor="emailNotifications" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Enable Email Notifications
                    </Label>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Notification Preferences
                    </Label>
                    <div className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyOnNewCustomer"
                          {...form.register('notifyOnNewCustomer')}
                        />
                        <Label htmlFor="notifyOnNewCustomer" className="text-gray-700 dark:text-gray-300">Notify on New Customer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyOnPayment"
                          {...form.register('notifyOnPayment')}
                        />
                        <Label htmlFor="notifyOnPayment" className="text-gray-700 dark:text-gray-300">Notify on Payment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyOnExpiry"
                          {...form.register('notifyOnExpiry')}
                        />
                        <Label htmlFor="notifyOnExpiry" className="text-gray-700 dark:text-gray-300">Notify on Account Expiry</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notifyOnLogin"
                          {...form.register('notifyOnLogin')}
                        />
                        <Label htmlFor="notifyOnLogin" className="text-gray-700 dark:text-gray-300">Notify on Login</Label>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="emailTemplate" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Email Template
                    </Label>
                    <Textarea
                      id="emailTemplate"
                      {...form.register('emailTemplate')}
                      className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 min-h-[150px]"
                      placeholder="Enter your email notification template..."
                    />
                  </motion.div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-6">
                  <motion.div variants={item} className="flex items-center space-x-2">
                    <Switch
                      id="enableAIPrediction"
                      {...form.register('enableAIPrediction')}
                    />
                    <Label htmlFor="enableAIPrediction" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Enable AI Prediction
                    </Label>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="aiConfidenceThreshold" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      AI Confidence Threshold (%)
                    </Label>
                    <Input
                      id="aiConfidenceThreshold"
                      type="number"
                      {...form.register('aiConfidenceThreshold')}
                      className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    />
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="aiModelVersion" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      AI Model Version
                    </Label>
                    <Select
                      onValueChange={(value) => form.setValue('aiModelVersion', value as 'v1' | 'v2' | 'v3')}
                      defaultValue={form.getValues('aiModelVersion')}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Select AI model version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v1">Version 1</SelectItem>
                        <SelectItem value="v2">Version 2</SelectItem>
                        <SelectItem value="v3">Version 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div variants={item} className="flex items-center space-x-2">
                    <Switch
                      id="aiTrainingData"
                      {...form.register('aiTrainingData')}
                    />
                    <Label htmlFor="aiTrainingData" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Enable AI Training Data Collection
                    </Label>
                  </motion.div>
                </TabsContent>

                <TabsContent value="backup" className="space-y-6">
                  <motion.div variants={item} className="flex items-center space-x-2">
                    <Switch
                      id="enableAutoBackup"
                      {...form.register('enableAutoBackup')}
                    />
                    <Label htmlFor="enableAutoBackup" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Enable Automatic Backup
                    </Label>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="backupFrequency" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Backup Frequency
                    </Label>
                    <Select
                      onValueChange={(value) => form.setValue('backupFrequency', value as 'daily' | 'weekly' | 'monthly')}
                      defaultValue={form.getValues('backupFrequency')}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Select backup frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="backupRetention" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Backup Retention (days)
                    </Label>
                    <Input
                      id="backupRetention"
                      type="number"
                      {...form.register('backupRetention')}
                      className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    />
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label htmlFor="backupLocation" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Backup Location
                    </Label>
                    <Select
                      onValueChange={(value) => form.setValue('backupLocation', value as 'local' | 'cloud')}
                      defaultValue={form.getValues('backupLocation')}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Select backup location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Storage</SelectItem>
                        <SelectItem value="cloud">Cloud Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                  <motion.div variants={item} className="space-y-4">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Theme Customization
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Primary Colors</h4>
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor" className="text-gray-700 dark:text-gray-300">Primary Color</Label>
                          <Input
                            id="primaryColor"
                            type="color"
                            className="h-10 w-full"
                            defaultValue="#4F46E5"
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Secondary Colors</h4>
                        <div className="space-y-2">
                          <Label htmlFor="secondaryColor" className="text-gray-700 dark:text-gray-300">Secondary Color</Label>
                          <Input
                            id="secondaryColor"
                            type="color"
                            className="h-10 w-full"
                            defaultValue="#7C3AED"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="space-y-4">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Layout Options
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Sidebar</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="compactSidebar" />
                            <Label htmlFor="compactSidebar" className="text-gray-700 dark:text-gray-300">Compact Sidebar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="showIconsOnly" />
                            <Label htmlFor="showIconsOnly" className="text-gray-700 dark:text-gray-300">Show Icons Only</Label>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Header</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="fixedHeader" />
                            <Label htmlFor="fixedHeader" className="text-gray-700 dark:text-gray-300">Fixed Header</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="showNotifications" />
                            <Label htmlFor="showNotifications" className="text-gray-700 dark:text-gray-300">Show Notifications</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </motion.div>
            </Tabs>

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