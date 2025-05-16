'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Download,
  FileText,
  PieChart,
  BarChart,
  LineChart,
  DollarSign,
  CreditCard,
  Receipt,
  Users,
  BarChart3,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createTransaction, getTransactions, deleteTransaction } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAYMENT_METHODS = [
  { id: 'bkash', name: 'Bkash', currency: 'BDT', color: '#E2136E' },
  { id: 'nagad', name: 'Nagad', currency: 'BDT', color: '#FF6B6B' },
  { id: 'rocket', name: 'Rocket', currency: 'BDT', color: '#4CAF50' },
  { id: 'binance', name: 'Binance', currency: 'USD', color: '#F0B90B' },
  { id: 'cash', name: 'Cash', currency: 'BDT', color: '#2196F3' },
];

const EXPENSE_CATEGORIES = [
  { id: 'facebook_ads', name: 'Facebook Ads', icon: '📱', color: '#1877F2', bgColor: '#E7F3FF' },
  { id: 'promotional_videos', name: 'Promotional Videos', icon: '🎥', color: '#FF6B6B', bgColor: '#FFF0F0' },
  { id: 'poster_design', name: 'Poster Design', icon: '🎨', color: '#6B66FF', bgColor: '#F0F0FF' },
  { id: 'adobe_console', name: 'Adobe Console', icon: '💻', color: '#FF9500', bgColor: '#FFF4E6' },
  { id: 'other', name: 'Other', icon: '📦', color: '#34C759', bgColor: '#F0FFF4' },
];

const REPORT_PERIODS = [
  { id: 'daily', name: 'Daily' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'yearly', name: 'Yearly' },
];

type Transaction = {
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  description: string;
  type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed';
  referenceId?: string;
  notes?: string;
  category: string;
};

export default function FinancialManagementPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    paymentMethod: '',
    description: '',
    type: 'income',
    date: format(new Date(), 'yyyy-MM-dd'),
    referenceId: '',
    notes: '',
    category: 'other',
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedReportPeriod, setSelectedReportPeriod] = useState('monthly');
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [errors, setErrors] = useState<{
    amount?: string;
    paymentMethod?: string;
    description?: string;
    referenceId?: string;
  }>({});

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const loadedTransactions = await getTransactions();
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    }
  };

  const validateTransaction = () => {
    const newErrors: typeof errors = {};
    
    // Amount validation
    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    } else if (amount > 1000000000) { // 1 billion limit
      newErrors.amount = 'Amount exceeds maximum limit';
    }

    // Payment method validation
    if (!newTransaction.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    // Description validation
    if (!newTransaction.description.trim()) {
      newErrors.description = 'Please enter a description';
    } else if (newTransaction.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Reference ID validation (if provided)
    if (newTransaction.referenceId && newTransaction.referenceId.length > 100) {
      newErrors.referenceId = 'Reference ID must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTransaction = async () => {
    if (!validateTransaction()) return;

    const transaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: newTransaction.date,
      amount: parseFloat(newTransaction.amount),
      paymentMethod: newTransaction.paymentMethod,
      description: newTransaction.description.trim(),
      type: newTransaction.type as 'income' | 'expense',
      status: 'completed' as const,
      referenceId: newTransaction.referenceId.trim() || undefined,
      notes: newTransaction.notes.trim() || undefined,
      category: newTransaction.category,
    };

    try {
      await createTransaction(transaction);
      setTransactions([...transactions, transaction]);
      setNewTransaction({
        amount: '',
        paymentMethod: '',
        description: '',
        type: 'income',
        date: format(new Date(), 'yyyy-MM-dd'),
        referenceId: '',
        notes: '',
        category: 'other',
      });
      setErrors({});
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  // Calculate daily income and expenses for the selected month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyData = daysInMonth.map(day => {
    const dayTransactions = transactions.filter(t => t.date === format(day, 'yyyy-MM-dd'));
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExpenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, 'yyyy-MM-dd'),
      income: dayIncome,
      expenses: dayExpenses,
    };
  });

  // Calculate payment method distribution
  const paymentMethodDistribution = PAYMENT_METHODS.map(method => {
    const methodTransactions = transactions.filter(t => t.paymentMethod === method.id);
    const total = methodTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      ...method,
      total,
      percentage: (total / (totalIncome + totalExpenses)) * 100,
    };
  });

  // Function to delete transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
    setDeleteTransactionId(null);
  };

  // Calculate partner profits
  const calculatePartnerProfits = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;
    const partnerShare = netProfit / 2; // Split equally between partners

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      partnerShare,
    };
  };

  // Calculate expense breakdown by category
  const calculateExpenseBreakdown = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    return EXPENSE_CATEGORIES.map(category => {
      const categoryExpenses = expenses.filter(e => e.category === category.id);
      const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        ...category,
        total,
        percentage: (total / calculatePartnerProfits().totalExpenses) * 100,
      };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your business finances</p>
        </div>
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'MMMM yyyy')}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select value={viewMode} onValueChange={(value: 'daily' | 'monthly') => setViewMode(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="animate-in fade-in slide-in-from-left duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ৳{totalIncome.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month's total income</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-in fade-in slide-in-from-bottom duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ৳{totalExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month's total expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-in fade-in slide-in-from-bottom duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  ৳{netProfit.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Current month's net profit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-right duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partner Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ৳{calculatePartnerProfits().partnerShare.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Each partner's share</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Add New Transaction
            </CardTitle>
            <CardDescription>Record a new income or expense</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        setNewTransaction({ ...newTransaction, amount: value });
                      }
                    }}
                    placeholder="Enter amount"
                    className={cn("mt-1", errors.amount && "border-red-500")}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="mt-1"
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select
                    value={newTransaction.paymentMethod}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, paymentMethod: value })}
                  >
                    <SelectTrigger className={cn("mt-1", errors.paymentMethod && "border-red-500")}>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: method.color }}
                            />
                            {method.name} ({method.currency})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-sm text-red-500 mt-1">{errors.paymentMethod}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Enter description"
                  className={cn("mt-1", errors.description && "border-red-500")}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Reference ID (Optional)</label>
                <Input
                  value={newTransaction.referenceId}
                  onChange={(e) => setNewTransaction({ ...newTransaction, referenceId: e.target.value })}
                  placeholder="Enter reference ID"
                  className={cn("mt-1", errors.referenceId && "border-red-500")}
                  maxLength={100}
                />
                {errors.referenceId && (
                  <p className="text-sm text-red-500 mt-1">{errors.referenceId}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  placeholder="Enter additional notes"
                  maxLength={1000}
                />
              </div>

              {newTransaction.type === 'expense' && (
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                className="w-full"
                onClick={handleAddTransaction}
              >
                Add Transaction
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>Distribution of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calculateExpenseBreakdown().map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-full" 
                        style={{ backgroundColor: category.bgColor }}
                      >
                        <span style={{ color: category.color }}>{category.icon}</span>
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ৳{category.total.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={category.percentage} 
                    className="h-2"
                    style={{
                      backgroundColor: category.bgColor,
                      '--progress-foreground': category.color,
                    } as any}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>View all your transactions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedReportPeriod} onValueChange={setSelectedReportPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_PERIODS.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="animate-in fade-in slide-in-from-bottom duration-300">
                  <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.type === 'income' ? (
                        <div className="p-1 rounded-full bg-green-100 dark:bg-green-900">
                          <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-red-100 dark:bg-red-900">
                          <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                      <span className={cn(
                        "font-medium",
                        transaction.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {transaction.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'expense' && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-1 rounded-full" 
                          style={{ backgroundColor: EXPENSE_CATEGORIES.find(c => c.id === transaction.category)?.bgColor }}
                        >
                          <span style={{ color: EXPENSE_CATEGORIES.find(c => c.id === transaction.category)?.color }}>
                            {EXPENSE_CATEGORIES.find(c => c.id === transaction.category)?.icon}
                          </span>
                        </div>
                        <span>
                          {EXPENSE_CATEGORIES.find(c => c.id === transaction.category)?.name}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: PAYMENT_METHODS.find(m => m.id === transaction.paymentMethod)?.color }}
                      />
                      {PAYMENT_METHODS.find(m => m.id === transaction.paymentMethod)?.name}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.referenceId || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1",
                        transaction.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400",
                        transaction.status === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400",
                        transaction.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
                      )}
                    >
                      {transaction.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {transaction.status === 'failed' && <XCircle className="h-3 w-3" />}
                      {transaction.status === 'pending' && <Clock className="h-3 w-3" />}
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteTransactionId(transaction.id);
                        setShowDeleteDialog(true);
                      }}
                      className="hover:bg-red-100 dark:hover:bg-red-900"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Transaction
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTransactionId && handleDeleteTransaction(deleteTransactionId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 