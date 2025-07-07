'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { verifyAdminPassword } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export default function AdminAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await verifyAdminPassword(password);
    if (result.success) {
      setIsAuthenticated(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Zugriff verweigert',
        description: 'Das eingegebene Passwort ist falsch.',
      });
      setPassword('');
    }
    setIsLoading(false);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center h-screen main-background">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit border border-primary/20 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Admin-Bereich</CardTitle>
            <CardDescription>Bitte geben Sie das Passwort ein, um fortzufahren.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Prüfe...' : 'Anmelden'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}