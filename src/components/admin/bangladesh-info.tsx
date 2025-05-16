'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { motion } from 'framer-motion';

export function BangladeshInfo() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      const bangladeshTime = formatInTimeZone(new Date(), 'Asia/Dhaka', 'h:mm:ss a');
      const bangladeshDate = formatInTimeZone(new Date(), 'Asia/Dhaka', 'EEEE, MMMM d, yyyy');
      setTime(bangladeshTime);
      setDate(bangladeshDate);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <Card className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary animate-pulse" />
          Bangladesh Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Current Time (BD)</p>
              <motion.p 
                key={time}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
              >
                {time}
              </motion.p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center"
            >
              <Clock className="h-6 w-6 text-primary" />
            </motion.div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm text-muted-foreground"
          >
            {date}
          </motion.p>
        </div>
      </CardContent>
    </Card>
  );
} 