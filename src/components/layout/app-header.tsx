'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User as UserIcon, PanelLeft } from 'lucide-react';
import { APP_NAME, LOGIN_PATH } from '@/lib/constants'; 
import { handleLogout } from '@/app/actions';
import type { User } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { motion } from 'framer-motion';
import * as React from 'react';

interface AppHeaderProps {
  currentUser: User | null;
}

export function AppHeader({ currentUser }: AppHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-muted/50"
                onClick={toggleSidebar}
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
              <Link
                href="/"
                className="text-lg sm:text-xl font-semibold text-foreground hover:text-primary transition-colors duration-200 md:hidden"
              >
                {APP_NAME}
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeSwitcher />
              {currentUser && (
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                >
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-border/40">
                    <AvatarImage
                      src={currentUser.image || ''}
                      alt={currentUser.name || ''}
                    />
                    <AvatarFallback className="bg-muted text-foreground">
                      {currentUser.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-muted/50 -ml-2"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <Link
              href="/"
              className="text-base sm:text-lg md:text-xl font-semibold text-foreground hover:text-primary transition-colors duration-200 md:hidden"
            >
              {APP_NAME}
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center -mt-1"
            >
              <ThemeSwitcher />
            </motion.div>

            {currentUser ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full transition-all duration-200 hover:scale-105 hover:bg-muted/50"
                    >
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-2 border-border/40">
                        <AvatarImage
                          src={currentUser.image || ''}
                          alt={currentUser.name || ''}
                        />
                        <AvatarFallback className="bg-muted text-foreground text-xs sm:text-sm">
                          {currentUser.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-56 animate-in fade-in zoom-in-95 duration-200 border-border/40 bg-background -mt-4" 
                    align="end" 
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {currentUser.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/admin/profile" 
                        className="cursor-pointer text-foreground hover:text-primary hover:bg-muted/50"
                      >
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/admin/settings" 
                        className="cursor-pointer text-foreground hover:text-primary hover:bg-muted/50"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/50"
                      onClick={() => handleLogout()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Button 
                  asChild 
                  variant="ghost"
                  className="text-sm sm:text-base text-foreground hover:text-primary hover:bg-muted/50 transition-colors duration-200"
                >
                  <Link href={LOGIN_PATH}>Sign In</Link>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
