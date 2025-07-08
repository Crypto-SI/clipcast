'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccounts } from '@/context/accounts-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, User } from 'lucide-react';

export default function TikTokSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addAccount } = useAccounts();
  const [isAdding, setIsAdding] = useState(false);
  const [accountData, setAccountData] = useState<any>(null);

  useEffect(() => {
    const accountParam = searchParams.get('account');
    if (accountParam) {
      try {
        const parsedAccount = JSON.parse(accountParam);
        setAccountData(parsedAccount);
        
        // Automatically add the account to context
        setIsAdding(true);
        addAccount(parsedAccount).then(() => {
          setIsAdding(false);
          // Redirect to main page after 2 seconds
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }).catch((error) => {
          console.error('Failed to add account:', error);
          setIsAdding(false);
        });
      } catch (error) {
        console.error('Failed to parse account data:', error);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [searchParams, addAccount, router]);

  if (!accountData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            TikTok Connected!
          </CardTitle>
          <CardDescription>
            Your TikTok account has been successfully linked to ClipCast.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <img 
              src={accountData.avatar} 
              alt={accountData.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-semibold text-gray-900">{accountData.name}</p>
              <p className="text-sm text-gray-600">{accountData.followers} followers</p>
            </div>
          </div>
          
          {isAdding ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Adding account...</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">Account added successfully!</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting to main page...</p>
            </div>
          )}
          
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
            variant="outline"
          >
            Go to Main Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 