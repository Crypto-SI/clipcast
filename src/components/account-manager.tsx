'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const accounts = [
    { platform: 'TikTok', name: '@clipmaster', avatar: 'https://placehold.co/40x40.png?text=CM', id: 'tiktok1', dataAiHint: 'logo abstract' },
    { platform: 'Instagram', name: 'yourcreative_ig', avatar: 'https://placehold.co/40x40.png?text=YC', id: 'ig1', dataAiHint: 'logo letter' },
    { platform: 'TikTok', name: '@dancemachine', avatar: 'https://placehold.co/40x40.png?text=DM', id: 'tiktok2', dataAiHint: 'logo robot' },
];

export default function AccountManager() {
    const { toast } = useToast();

    const handleAddAccount = () => {
        if (accounts.length >= 5) {
            toast({
                variant: 'destructive',
                title: "Account Limit Reached",
                description: "You can only connect up to 5 accounts."
            });
        } else {
            toast({
                title: "Feature Coming Soon!",
                description: "The ability to add new accounts is not yet implemented."
            });
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Connected Accounts</CardTitle>
                <CardDescription>Manage your linked TikTok and Instagram accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {accounts.map(account => (
                        <div key={account.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={account.avatar} alt={account.name} data-ai-hint={account.dataAiHint} />
                                    <AvatarFallback>{account.platform.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{account.name}</p>
                                    <p className="text-sm text-muted-foreground">{account.platform}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Disconnect</Button>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" variant="outline" onClick={handleAddAccount}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Account
                </Button>
            </CardFooter>
        </Card>
    )
}
