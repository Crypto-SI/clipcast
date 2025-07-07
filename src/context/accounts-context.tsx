'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAccountDetails } from '@/ai/flows/get-account-details';

// Helper to format large numbers
function formatFollowers(num: number): string {
    if (num >= 1000000) {
        const formatted = (num / 1000000).toFixed(1);
        return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'M';
    }
    if (num >= 1000) {
        const formatted = (num / 1000).toFixed(1);
        return (formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted) + 'K';
    }
    return num.toString();
}

export type Account = {
  id: string;
  platform: 'TikTok' | 'Instagram';
  name: string;
  avatar: string;
  dataAiHint: string;
  followers: string;
};

type AccountsContextType = {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'avatar' | 'dataAiHint' | 'followers'>) => Promise<void>;
  removeAccount: (accountId: string) => void;
};

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

const initialAccounts: Account[] = [
    { platform: 'TikTok', name: '@clipmaster', avatar: 'https://placehold.co/40x40.png?text=CM', id: 'tiktok1', dataAiHint: 'logo abstract', followers: formatFollowers(1200000) },
    { platform: 'Instagram', name: 'yourcreative_ig', avatar: 'https://placehold.co/40x40.png?text=YC', id: 'ig1', dataAiHint: 'logo letter', followers: formatFollowers(345000) },
    { platform: 'TikTok', name: '@dancemachine', avatar: 'https://placehold.co/40x40.png?text=DM', id: 'tiktok2', dataAiHint: 'logo robot', followers: formatFollowers(8700) },
];

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const { toast } = useToast();

  const addAccount = async (account: Omit<Account, 'id' | 'avatar' | 'dataAiHint' | 'followers'>) => {
    if (accounts.length >= 5) {
      toast({
        variant: 'destructive',
        title: 'Account Limit Reached',
        description: 'You can only connect up to 5 accounts.',
      });
      return;
    }

    if (accounts.some(a => a.name.toLowerCase() === account.name.toLowerCase() && a.platform === account.platform)) {
      toast({
          variant: 'destructive',
          title: 'Account Already Connected',
          description: 'This account has already been added.',
      });
      return;
    }

    try {
        const details = await getAccountDetails({ platform: account.platform, username: account.name });
        
        const newAccount: Account = {
          ...account,
          id: `${account.platform.toLowerCase()}-${Date.now()}`,
          avatar: `https://placehold.co/40x40.png?text=${account.name.replace('@','').substring(0, 2).toUpperCase()}`,
          dataAiHint: details.dataAiHint,
          followers: formatFollowers(details.followers),
        };

        setAccounts(prev => [...prev, newAccount]);
        
        toast({
            title: 'Account Connected!',
            description: `${account.name} has been successfully added.`,
        });

    } catch (error) {
        console.error('Failed to get account details:', error);
        toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: 'Could not retrieve account details from AI. Please try again.',
        });
        // Re-throw the error so the component knows the operation failed
        throw error;
    }
  };

  const removeAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId));
    toast({
        title: 'Account Disconnected',
        description: 'The account has been successfully removed.',
    });
  };

  return (
    <AccountsContext.Provider value={{ accounts, addAccount, removeAccount }}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};
