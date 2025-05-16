'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [ripple, setRipple] = React.useState<{x: number, y: number} | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Ripple effect handler
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setTimeout(() => setRipple(null), 400);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 focus:scale-110",
            open ? "ring-2 ring-offset-2 ring-indigo-400/70 dark:ring-indigo-500/60 bg-gradient-to-br from-indigo-100/60 via-purple-100/60 to-pink-100/60 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40 shadow-lg" : "hover:ring-2 hover:ring-indigo-300/40 hover:bg-gradient-to-br hover:from-indigo-50/40 hover:via-purple-50/40 hover:to-pink-50/40 dark:hover:from-indigo-900/20 dark:hover:via-purple-900/20 dark:hover:to-pink-900/20"
          )}
          onClick={handleButtonClick}
        >
          {/* Ripple effect */}
          {ripple && (
            <span
              className="absolute pointer-events-none block rounded-full bg-indigo-400/30 dark:bg-indigo-600/30 animate-ripple"
              style={{
                left: ripple.x - 24,
                top: ripple.y - 24,
                width: 48,
                height: 48,
              }}
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ scale: 0.7, opacity: 0, rotate: -180 }}
              animate={{ scale: 1.1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0, rotate: 180 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                duration: 0.4,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {theme === 'light' ? (
                <Sun className="h-5 w-5 text-yellow-500 drop-shadow-glow" />
              ) : theme === 'dark' ? (
                <Moon className="h-5 w-5 text-blue-400 drop-shadow-glow" />
              ) : (
                <Laptop className="h-5 w-5 text-gray-500 drop-shadow-glow" />
              )}
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <AnimatePresence>
        {open && (
          <DropdownMenuContent
            align="end"
            className="w-40 animate-in fade-in zoom-in-95 duration-300 border-0 shadow-2xl bg-gradient-to-br from-white/90 to-indigo-50/80 dark:from-gray-900/90 dark:to-indigo-950/80 backdrop-blur-lg"
            sideOffset={10}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -10 }}
              transition={{ duration: 0.25, type: "spring" }}
            >
              <DropdownMenuItem
                onClick={() => setTheme('light')}
                className={cn(
                  "flex items-center gap-2 cursor-pointer transition-colors duration-200",
                  theme === 'light' && "bg-accent"
                )}
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4 text-yellow-500" />
                </motion.div>
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex items-center gap-2 cursor-pointer transition-colors duration-200",
                  theme === 'dark' && "bg-accent"
                )}
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-4 w-4 text-blue-400" />
                </motion.div>
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('system')}
                className={cn(
                  "flex items-center gap-2 cursor-pointer transition-colors duration-200",
                  theme === 'system' && "bg-accent"
                )}
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Laptop className="h-4 w-4 text-gray-500" />
                </motion.div>
                <span>System</span>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}

// Add this to your global CSS (e.g., globals.css):
// .animate-ripple {
//   animation: ripple 0.4s linear;
// }
// @keyframes ripple {
//   0% { opacity: 0.5; transform: scale(0.5); }
//   100% { opacity: 0; transform: scale(2.5); }
// }
// .drop-shadow-glow {
//   filter: drop-shadow(0 0 6px #a5b4fc) drop-shadow(0 0 12px #818cf8);
// } 