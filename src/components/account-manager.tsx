'use client';

import { useAccounts } from '@/context/accounts-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Users, Heart, PlayCircle, Clock, RefreshCw, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AccountManager() {
  const { accounts, loading, connectTikTok, disconnectAccount, checkTikTokAuth, connectInstagram, checkInstagramAuth } = useAccounts();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleTikTokLogin = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/tiktok/simple-login');
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Authorization Required',
          description: 'Opening TikTok authorization page. Please complete the login process.',
          duration: 5000,
        });
        window.location.href = data.authUrl;
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: data.error_description || data.error || 'Failed to start authorization process',
        });
      }
    } catch (error) {
      console.error('TikTok login error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: 'An error occurred while connecting to TikTok',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstagramLogin = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/instagram');
      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          toast({
            title: 'Authorization Required',
            description: 'Opening Instagram authorization page. Please complete the login process.',
            duration: 5000,
          });
          window.location.href = data.authUrl;
        }
      } else {
        const errorData = await response.json();
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: errorData.error || 'Failed to start Instagram authorization',
        });
      }
    } catch (error) {
      console.error('Instagram login error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: 'An error occurred while connecting to Instagram',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshAccount = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    setIsRefreshing(true);
    try {
      let response;
      if (account.platform === 'TikTok') {
        response = await fetch('/api/auth/tiktok/account', {
          method: 'POST'
        });
      } else if (account.platform === 'Instagram') {
        response = await fetch('/api/auth/instagram/account', {
          method: 'POST'
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        toast({
          title: 'Account Refreshed',
          description: `Your ${account.platform} account information has been updated.`,
        });
        
        // Refresh the accounts context
        if (account.platform === 'TikTok') {
          await checkTikTokAuth();
        } else if (account.platform === 'Instagram') {
          await checkInstagramAuth();
        }
      } else {
        const errorData = response ? await response.json() : { error: 'Unknown error' };
        toast({
          variant: 'destructive',
          title: 'Refresh Failed',
          description: errorData.error || 'Failed to refresh account data',
        });
      }
    } catch (error) {
      console.error('Account refresh error:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: 'An error occurred while refreshing account data',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeUntilExpiry = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = (account: any) => {
    if (account.isExpired) return 'destructive';
    if (account.needsRefresh) return 'secondary';
    return 'default';
  };

  const getStatusText = (account: any) => {
    if (account.isExpired) return 'Token Expired';
    if (account.needsRefresh) return 'Expires Soon';
    return 'Active';
  };

  const tikTokAccounts = accounts.filter(acc => acc.platform === 'TikTok');
  const instagramAccounts = accounts.filter(acc => acc.platform === 'Instagram');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connected Accounts</h2>
          <p className="text-muted-foreground">
            Manage your social media accounts for video uploads.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {accounts.length}/5 accounts
        </Badge>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Secure Authentication:</strong> This app uses OAuth 2.0 with PKCE for maximum security. 
          Connect your social media accounts using secure authentication.
        </AlertDescription>
      </Alert>

      {/* Connected Accounts Display */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Your connected social media accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={account.avatar} alt={account.displayName} />
                      <AvatarFallback>{account.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{account.displayName}</h3>
                        {account.isVerified && (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                        <Badge variant={getStatusColor(account)} className="text-xs">
                          {getStatusText(account)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{account.username} • {account.platform}
                      </p>
                      {account.timeUntilExpiry !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {account.isExpired 
                              ? 'Token expired - reconnection required'
                              : `Token expires in ${formatTimeUntilExpiry(account.timeUntilExpiry)}`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{account.followerCount?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{account.likesCount?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <PlayCircle className="h-4 w-4" />
                          <span>{account.videoCount?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshAccount(account.id)}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectAccount(account.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Connection Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TikTok Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              TikTok Account
              <Badge variant="outline" className="text-xs">OAuth 2.0 + PKCE</Badge>
            </CardTitle>
            <CardDescription>
              Connect your TikTok account to access profile information, statistics, and video management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tikTokAccounts.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold mb-2">No TikTok account connected</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect your TikTok account with secure OAuth 2.0 authentication.
                </p>
                <Button 
                  onClick={handleTikTokLogin} 
                  disabled={isConnecting}
                  className="w-full"
                  size="sm"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Connect TikTok
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm font-medium">TikTok Connected</p>
                <p className="text-xs text-muted-foreground">
                  {tikTokAccounts[0].username}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instagram Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Instagram Account
              <Badge variant="outline" className="text-xs">OAuth 2.0</Badge>
            </CardTitle>
            <CardDescription>
              Connect your Instagram Business account to publish images, videos, and stories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {instagramAccounts.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold mb-2">No Instagram account connected</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect your Instagram Business account to publish content.
                </p>
                <Button 
                  onClick={handleInstagramLogin} 
                  disabled={isConnecting}
                  className="w-full"
                  size="sm"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Connect Instagram
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm font-medium">Instagram Connected</p>
                <p className="text-xs text-muted-foreground">
                  {instagramAccounts[0].username}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Capabilities */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Current Capabilities:</strong> With connected accounts, you can view profile information, 
          follower statistics, and publish content. All authentication uses OAuth 2.0 for maximum security.
          <br />
          <strong>Instagram:</strong> Requires a Business or Creator account for content publishing.
        </AlertDescription>
      </Alert>
    </div>
  );
}
