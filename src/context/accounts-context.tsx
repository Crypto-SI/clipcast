'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  username: string;
  displayName: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  isVerified: boolean;
  scopes?: string[];
  // TikTok-specific tokens
  accessToken?: string;
  refreshToken?: string;
  openId?: string;
  expiresAt?: number;
  connectedAt?: number;
  // Token status properties (from enhanced API)
  timeUntilExpiry?: number;
  isExpired?: boolean;
  needsRefresh?: boolean;
  status?: 'active' | 'expires_soon' | 'expired';
  lastRefreshed?: number;
  scope?: string;
  bio?: string;
  profileDeepLink?: string;
};

type AccountsContextType = {
  accounts: Account[];
  loading: boolean;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  removeAccount: (accountId: string) => void;
  disconnectAccount: (accountId: string) => void;
  connectTikTok: () => void;
  checkTikTokAuth: () => Promise<void>;
  connectInstagram: () => void;
  checkInstagramAuth: () => Promise<void>;
};

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

const initialAccounts: Account[] = [
    { 
        platform: 'Instagram', 
        username: 'yourcreative_ig', 
        displayName: 'Your Creative IG',
        avatar: 'https://placehold.co/40x40.png', 
        id: 'ig1', 
        followerCount: 345000,
        followingCount: 1200,
        likesCount: 2500000,
        videoCount: 156,
        isVerified: false
    },
];

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check for authentication on mount
  useEffect(() => {
    checkTikTokAuth();
    checkInstagramAuth();
    
    // Check for OAuth success/error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tikTokConnected = urlParams.get('success') === 'tiktok_connected';
    const instagramConnected = urlParams.get('instagram_connected') === 'true';
    const error = urlParams.get('error');
    
    if (tikTokConnected) {
      toast({
        title: 'TikTok Connected!',
        description: 'Your TikTok account has been successfully connected.',
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (instagramConnected) {
      toast({
        title: 'Instagram Connected!',
        description: 'Your Instagram account has been successfully connected.',
      });
      // Clean up URL and refresh Instagram auth
      window.history.replaceState({}, '', window.location.pathname);
      checkInstagramAuth();
    }
    
    if (error) {
      let errorMessage = 'Connection failed';
      if (error.includes('tiktok')) {
        errorMessage = `Failed to connect TikTok account: ${error}`;
      } else if (error.includes('instagram')) {
        errorMessage = `Failed to connect Instagram account: ${error}`;
      }
      
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: errorMessage,
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // Remove toast dependency to prevent infinite loops

  const checkTikTokAuth = async () => {
    try {
      const response = await fetch('/api/auth/tiktok/account');
      if (response.ok) {
        const accountData = await response.json();
        
        // Use callback pattern to avoid dependency issues
        setAccounts(prev => {
          // Check if TikTok account is already in the list
          const existingAccountIndex = prev.findIndex(acc => acc.platform === 'TikTok' && acc.openId === accountData.openId);
          
          const newAccount: Account = {
            id: `tiktok-${accountData.openId}`,
            platform: 'TikTok',
            username: accountData.username,
            displayName: accountData.displayName,
            avatar: accountData.avatar || 'https://placehold.co/40x40.png',
            followerCount: accountData.followerCount || 0,
            followingCount: accountData.followingCount || 0,
            likesCount: accountData.likesCount || 0,
            videoCount: accountData.videoCount || 0,
            isVerified: accountData.isVerified || false,
            scopes: accountData.scopes || [],
            openId: accountData.openId,
            accessToken: accountData.accessToken,
            refreshToken: accountData.refreshToken,
            expiresAt: accountData.expiresAt,
            connectedAt: accountData.connectedAt,
            // Enhanced properties from new API
            timeUntilExpiry: accountData.timeUntilExpiry,
            isExpired: accountData.isExpired,
            needsRefresh: accountData.needsRefresh,
            status: accountData.status,
            lastRefreshed: accountData.lastRefreshed,
            scope: accountData.scope,
            bio: accountData.bio,
            profileDeepLink: accountData.profileDeepLink,
          };
          
          if (existingAccountIndex !== -1) {
            // Update existing account
            const updatedAccounts = [...prev];
            updatedAccounts[existingAccountIndex] = newAccount;
            return updatedAccounts;
          } else {
            // Add new account
            return [...prev, newAccount];
          }
        });
      }
    } catch (error) {
      console.error('Error checking TikTok auth:', error);
    }
  };

  const checkInstagramAuth = async () => {
    try {
      const response = await fetch('/api/auth/instagram/account');
      if (response.ok) {
        const data = await response.json();
        
        if (data.connected && data.account) {
          const accountData = data.account;
          
          // Use callback pattern to avoid dependency issues
          setAccounts(prev => {
            // Check if Instagram account is already in the list
            const existingAccountIndex = prev.findIndex(acc => acc.platform === 'Instagram' && acc.id === accountData.id);
            
            const newAccount: Account = {
              id: `instagram-${accountData.id}`,
              platform: 'Instagram',
              username: accountData.username,
              displayName: accountData.displayName,
              avatar: 'https://placehold.co/40x40.png', // Instagram doesn't provide profile images in basic API
              followerCount: 0, // Not available in basic API
              followingCount: 0, // Not available in basic API
              likesCount: 0, // Not available in basic API
              videoCount: accountData.mediaCount || 0,
              isVerified: false, // Not available in basic API
              scopes: accountData.permissions || [],
              // Instagram-specific properties
              accessToken: accountData.accessToken,
              expiresAt: new Date(accountData.expiresAt).getTime(),
              connectedAt: new Date(accountData.connectedAt).getTime(),
              timeUntilExpiry: accountData.timeUntilExpiry,
              isExpired: accountData.isExpired,
              needsRefresh: accountData.needsRefresh,
              status: accountData.status,
            };
            
            if (existingAccountIndex !== -1) {
              // Update existing account
              const updatedAccounts = [...prev];
              updatedAccounts[existingAccountIndex] = newAccount;
              return updatedAccounts;
            } else {
              // Add new account
              return [...prev, newAccount];
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking Instagram auth:', error);
    }
  };

  const connectTikTok = () => {
    setLoading(true);
    window.location.href = '/api/auth/tiktok';
  };

  const connectInstagram = () => {
    setLoading(true);
    window.location.href = '/api/auth/instagram';
  };

  const addAccount = async (account: Omit<Account, 'id'>) => {
    if (accounts.length >= 5) {
      toast({
        variant: 'destructive',
        title: 'Account Limit Reached',
        description: 'You can only connect up to 5 accounts.',
      });
      return;
    }

    if (accounts.some(a => a.username.toLowerCase() === account.username.toLowerCase() && a.platform === account.platform)) {
      toast({
          variant: 'destructive',
          title: 'Account Already Connected',
          description: 'This account has already been added.',
      });
      return;
    }

    try {
        const details = await getAccountDetails({ platform: account.platform, username: account.username });
        const newAccount: Account = {
          ...account,
          id: `${account.platform.toLowerCase()}-${Date.now()}`,
          avatar: details.avatarUrl,
          followerCount: details.followers,
        };
        setAccounts(prev => [...prev, newAccount]);
        toast({
            title: 'Account Connected!',
            description: `${account.username} has been successfully added.`,
        });
    } catch (error) {
        console.error('Failed to get account details:', error);
        toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: 'Could not retrieve account details from AI. Please try again.',
        });
        throw error;
    }
  };

  const removeAccount = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    
    // If it's a TikTok account, also remove from server
    if (account?.platform === 'TikTok') {
      try {
        await fetch('/api/auth/tiktok/account', { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to remove TikTok account from server:', error);
      }
    }
    
    setAccounts(prev => prev.filter(account => account.id !== accountId));
    toast({
        title: 'Account Disconnected',
        description: 'The account has been successfully removed.',
    });
  };

  const disconnectAccount = (accountId: string) => {
    removeAccount(accountId);
  };

  return (
    <AccountsContext.Provider value={{ 
      accounts, 
      loading, 
      addAccount, 
      removeAccount, 
      disconnectAccount, 
      connectTikTok, 
      checkTikTokAuth,
      connectInstagram,
      checkInstagramAuth
    }}>
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
