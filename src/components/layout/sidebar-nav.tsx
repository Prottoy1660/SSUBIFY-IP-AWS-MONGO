'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/site';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import * as LucideIcons from 'lucide-react';
import type React from 'react';

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu className="w-full px-2 py-2">
      {items.map((item, index) => {
        const IconComponent = LucideIcons[item.icon] as React.FC<LucideIcons.LucideProps> | undefined;
        
        if (!IconComponent) {
          console.warn(`Icon not found: ${item.icon}`);
          return null;
        }

        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');

        return (
          <SidebarMenuItem key={index}>
            <Link 
              href={item.disabled ? '#' : item.href} 
              className={cn(
                'flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                item.disabled && 'pointer-events-none opacity-50',
                isActive && 'bg-muted/50 text-primary dark:text-primary'
              )}
            >
              {IconComponent ? (
                <IconComponent 
                  className={cn(
                    'h-4 w-4 sm:h-5 sm:w-5 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} 
                />
              ) : (
                <LucideIcons.HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{item.title}</span>
              {item.label && (
                <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
                  {item.label}
                </span>
              )}
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
