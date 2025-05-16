'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Users } from 'lucide-react';
import type { User as UserType } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ResellersListProps {
  resellers: UserType[];
}

export function ResellersList({ resellers }: ResellersListProps) {
  if (resellers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Users className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Resellers Found</p>
        <p className="text-sm">There are no resellers registered in the system yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {resellers.map((reseller) => (
        <Card key={reseller.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {reseller.name || 'Unnamed Reseller'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {reseller.email}
              </div>
              {reseller.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {reseller.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={reseller.banned ? "destructive" : "secondary"}>
                  {reseller.banned ? "Banned" : "Active"}
                </Badge>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href={`/admin/resellers/${reseller.id}`}>
                View Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 