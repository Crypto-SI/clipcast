'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlusCircle, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useAccounts, Account } from '@/context/accounts-context';

function AddAccountDialog({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [platform, setPlatform] = useState<'TikTok' | 'Instagram' | ''>('');
    const [name, setName] = useState('');
    const { addAccount } = useAccounts();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!platform || !name) return;
        addAccount({ platform, name });
        setIsOpen(false);
        setPlatform('');
        setName('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Account</DialogTitle>
                        <DialogDescription>
                            Connect a new TikTok or Instagram account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="platform" className="text-right">
                                Platform
                            </Label>
                            <Select required onValueChange={(value: 'TikTok' | 'Instagram') => setPlatform(value)} value={platform}>
                                <SelectTrigger id="platform" className="col-span-3">
                                    <SelectValue placeholder="Select a platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TikTok">TikTok</SelectItem>
                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Username
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="@username"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!platform || !name}>Connect Account</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DisconnectDialog({ account, onDisconnect }: { account: Account, onDisconnect: (id: string) => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">Disconnect</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will disconnect the account <span className="font-semibold">{account.name}</span> from ClipCast.
                        You can reconnect it at any time.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDisconnect(account.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Disconnect
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export default function AccountManager() {
    const { accounts, removeAccount } = useAccounts();

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Connected Accounts</CardTitle>
                <CardDescription>Manage your linked TikTok and Instagram accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {accounts.length > 0 ? accounts.map(account => (
                        <div key={account.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={account.avatar} alt={account.name} data-ai-hint={account.dataAiHint} />
                                    <AvatarFallback>{account.platform.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{account.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{account.platform}</span>
                                        <span className="text-xs">•</span>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            <span>{account.followers} Followers</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DisconnectDialog account={account} onDisconnect={removeAccount} />
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No accounts connected yet. Add one below!</p>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                 <AddAccountDialog>
                    <Button className="w-full" variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Account
                    </Button>
                 </AddAccountDialog>
            </CardFooter>
        </Card>
    )
}
