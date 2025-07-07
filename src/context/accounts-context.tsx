'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export type Account = {
  id: string;
  platform: 'TikTok' | 'Instagram';
  name: string;
  avatar: string;
  dataAiHint: string;
};

type AccountsContextType = {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'avatar' | 'dataAiHint'>) => void;
  removeAccount: (accountId: string) => void;
};

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

const initialAccounts: Account[] = [
    { platform: 'TikTok', name: '@clipmaster', avatar: 'https://placehold.co/40x40.png?text=CM', id: 'tiktok1', dataAiHint: 'logo abstract' },
    { platform: 'Instagram', name: 'yourcreative_ig', avatar: 'https://placehold.co/40x40.png?text=YC', id: 'ig1', dataAiHint: 'logo letter' },
    { platform: 'TikTok', name: '@dancemachine', avatar: 'https://placehold.co/40x40.png?text=DM', id: 'tiktok2', dataAiHint: 'logo robot' },
];

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const { toast } = useToast();

  const addAccount = (account: Omit<Account, 'id' | 'avatar' | 'dataAiHint'>) => {
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

    const newAccount: Account = {
      ...account,
      id: `${account.platform.toLowerCase()}-${Date.now()}`,
      avatar: `https://placehold.co/40x40.png?text=${account.name.replace('@','').substring(0, 2).toUpperCase()}`,
      dataAiHint: 'logo social',
    };
    setAccounts(prev => [...prev, newAccount]);
    toast({
        title: 'Account Connected!',
        description: `${account.name} has been successfully added.`,
    });
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
