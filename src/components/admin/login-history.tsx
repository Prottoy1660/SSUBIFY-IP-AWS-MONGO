'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import type { LoginInfo } from '@/types';
import { getAllLoginHistory, getResellerById } from '@/lib/data-service';
import { 
  Globe, 
  Monitor, 
  Smartphone, 
  Laptop, 
  AlertTriangle, 
  User, 
  Search,
  Clock,
  MapPin,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LoginHistory() {
  const [loginHistory, setLoginHistory] = useState<LoginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDetails, setUserDetails] = useState<Record<string, { email: string; phone: string; name?: string }>>({});
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    admin: 0,
    reseller: 0
  });

  useEffect(() => {
    const loadLoginHistory = async () => {
      try {
        const history = await getAllLoginHistory();
        setLoginHistory(history);

        // Calculate stats
        setStats({
          total: history.length,
          success: history.filter(login => login.status === 'success').length,
          failed: history.filter(login => login.status === 'failed').length,
          admin: history.filter(login => login.userRole === 'admin').length,
          reseller: history.filter(login => login.userRole === 'reseller').length
        });

        // Fetch user details for each unique user ID
        const uniqueUserIds = [...new Set(history.map(login => login.userId))];
        const details: Record<string, { email: string; phone: string; name?: string }> = {};
        
        for (const userId of uniqueUserIds) {
          const user = await getResellerById(userId);
          if (user) {
            details[userId] = {
              email: user.email,
              phone: user.phone,
              name: user.name
            };
          }
        }
        
        setUserDetails(details);
      } catch (error) {
        console.error('Error loading login history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoginHistory();
  }, []);

  const filteredHistory = loginHistory.filter(login => {
    const userDetail = userDetails[login.userId];
    return (
      login.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.deviceInfo.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.deviceInfo.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userDetail?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userDetail?.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userDetail?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Laptop className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-blue-700 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Total Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
            <p className="text-sm text-blue-600">All login attempts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{stats.success}</p>
            <p className="text-sm text-green-600">Successful logins</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-red-700 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">{stats.failed}</p>
            <p className="text-sm text-red-600">Failed attempts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Admin</span>
                <Badge variant="default" className="bg-purple-600">{stats.admin}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Reseller</span>
                <Badge variant="secondary" className="bg-purple-200 text-purple-700">{stats.reseller}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Login History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user ID, email, phone, name, IP, browser, or OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Logins</TabsTrigger>
                <TabsTrigger value="admin">Admin Logins</TabsTrigger>
                <TabsTrigger value="reseller">Reseller Logins</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {filteredHistory.map((login) => {
                      const userDetail = userDetails[login.userId];
                      return (
                        <motion.div
                          key={login.id}
                          variants={item}
                          layout
                          className={cn(
                            "rounded-lg border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md",
                            login.status === 'failed' && "border-red-200 bg-red-50",
                            login.status === 'success' && "border-green-200 bg-green-50"
                          )}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">User Details</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">{userDetail?.name || 'Unknown Name'}</p>
                                <p className="text-sm text-muted-foreground">{userDetail?.email || 'No Email'}</p>
                                <p className="text-sm text-muted-foreground">{userDetail?.phone || 'No Phone'}</p>
                                <Badge 
                                  variant={login.userRole === 'admin' ? 'default' : 'secondary'}
                                  className={cn(
                                    "mt-1",
                                    login.userRole === 'admin' ? "bg-primary" : "bg-secondary"
                                  )}
                                >
                                  {login.userRole}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(login.deviceInfo.deviceType)}
                                <p className="text-sm font-medium">Device & Browser</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.browser} {login.deviceInfo.browserVersion}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.os} {login.deviceInfo.osVersion}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.deviceType}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Location</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  IP: {login.ipAddress}
                                </p>
                                {login.location?.country && (
                                  <p className="text-sm text-muted-foreground">
                                    {login.location.city}, {login.location.country}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Time & Status</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(login.timestamp)}
                                </p>
                                <Badge
                                  variant={login.status === 'success' ? 'default' : 'destructive'}
                                  className={cn(
                                    "mt-1",
                                    login.status === 'success' ? "bg-green-600" : "bg-red-600"
                                  )}
                                >
                                  {login.status === 'success' ? 'Success' : 'Failed'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {login.status === 'failed' && (
                            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-100 p-2 rounded-md">
                              <AlertTriangle className="h-4 w-4" />
                              <p className="text-sm">Failed: {login.failureReason}</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              </TabsContent>

              <TabsContent value="admin" className="mt-4">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {filteredHistory
                      .filter(login => login.userRole === 'admin')
                      .map((login) => (
                        <motion.div
                          key={login.id}
                          variants={item}
                          layout
                          className={cn(
                            "rounded-lg border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md",
                            login.status === 'failed' && "border-red-200 bg-red-50",
                            login.status === 'success' && "border-green-200 bg-green-50"
                          )}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">User Details</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">{userDetails[login.userId]?.name || 'Unknown Name'}</p>
                                <p className="text-sm text-muted-foreground">{userDetails[login.userId]?.email || 'No Email'}</p>
                                <p className="text-sm text-muted-foreground">{userDetails[login.userId]?.phone || 'No Phone'}</p>
                                <Badge variant="default" className="mt-1 bg-primary">
                                  Admin
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(login.deviceInfo.deviceType)}
                                <p className="text-sm font-medium">Device & Browser</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.browser} {login.deviceInfo.browserVersion}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.os} {login.deviceInfo.osVersion}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.deviceType}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Location</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  IP: {login.ipAddress}
                                </p>
                                {login.location?.country && (
                                  <p className="text-sm text-muted-foreground">
                                    {login.location.city}, {login.location.country}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Time & Status</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(login.timestamp)}
                                </p>
                                <Badge
                                  variant={login.status === 'success' ? 'default' : 'destructive'}
                                  className={cn(
                                    "mt-1",
                                    login.status === 'success' ? "bg-green-600" : "bg-red-600"
                                  )}
                                >
                                  {login.status === 'success' ? 'Success' : 'Failed'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {login.status === 'failed' && (
                            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-100 p-2 rounded-md">
                              <AlertTriangle className="h-4 w-4" />
                              <p className="text-sm">Failed: {login.failureReason}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </motion.div>
              </TabsContent>

              <TabsContent value="reseller" className="mt-4">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {filteredHistory
                      .filter(login => login.userRole === 'reseller')
                      .map((login) => (
                        <motion.div
                          key={login.id}
                          variants={item}
                          layout
                          className={cn(
                            "rounded-lg border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md",
                            login.status === 'failed' && "border-red-200 bg-red-50",
                            login.status === 'success' && "border-green-200 bg-green-50"
                          )}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">User Details</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">{userDetails[login.userId]?.name || 'Unknown Name'}</p>
                                <p className="text-sm text-muted-foreground">{userDetails[login.userId]?.email || 'No Email'}</p>
                                <p className="text-sm text-muted-foreground">{userDetails[login.userId]?.phone || 'No Phone'}</p>
                                <Badge variant="secondary" className="mt-1 bg-secondary">
                                  Reseller
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(login.deviceInfo.deviceType)}
                                <p className="text-sm font-medium">Device & Browser</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.browser} {login.deviceInfo.browserVersion}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.os} {login.deviceInfo.osVersion}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {login.deviceInfo.deviceType}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Location</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  IP: {login.ipAddress}
                                </p>
                                {login.location?.country && (
                                  <p className="text-sm text-muted-foreground">
                                    {login.location.city}, {login.location.country}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Time & Status</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(login.timestamp)}
                                </p>
                                <Badge
                                  variant={login.status === 'success' ? 'default' : 'destructive'}
                                  className={cn(
                                    "mt-1",
                                    login.status === 'success' ? "bg-green-600" : "bg-red-600"
                                  )}
                                >
                                  {login.status === 'success' ? 'Success' : 'Failed'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {login.status === 'failed' && (
                            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-100 p-2 rounded-md">
                              <AlertTriangle className="h-4 w-4" />
                              <p className="text-sm">Failed: {login.failureReason}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 