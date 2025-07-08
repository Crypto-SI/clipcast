'use client';

import {
  AlertTriangle,
  CheckCircle2,
  FileVideo,
  Loader2,
  Share2,
  Sparkles,
  UploadCloud,
  Users,
  X,
  Info,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateHashtagsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useAccounts } from '@/context/accounts-context';

const formSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  video: z.instanceof(File).refine(file => file.size > 0, 'A video file is required.'),
});

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { accounts } = useAccounts();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Pre-select all accounts by default and sync selection when accounts change
  useEffect(() => {
    const accountIds = accounts.map(a => a.id);
    setSelectedAccounts(prev => {
      // If no previous selection, select all accounts
      if (prev.length === 0) {
        return accountIds;
      }
      
      // Get a set of the current account IDs for quick lookups
      const currentAccountIds = new Set(accountIds);
      // Filter the previous selection to only include accounts that still exist
      const validPrevSelected = prev.filter(id => currentAccountIds.has(id));
      
      // Add any new accounts that weren't previously selected
      const newAccountsToAdd = accountIds.filter(id => !prev.includes(id));
      
      const result = [...validPrevSelected, ...newAccountsToAdd];
      
      // Only update if there's actually a change
      if (result.length !== prev.length || !result.every(id => prev.includes(id))) {
        return result;
      }
      
      return prev;
    });
  }, [accounts]);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: '' },
  });
  
  // Effect to clean up the object URL when the component unmounts or previewUrl changes
  useEffect(() => {
    return () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    };
  }, [previewUrl]);

  const handleFileChange = (selectedFile: File | null) => {
    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (selectedFile) {
        if (selectedFile.type.startsWith('video/')) {
            setFile(selectedFile);
            form.setValue('video', selectedFile, { shouldValidate: true });
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        } else {
            setFile(null);
            // @ts-ignore
            form.setValue('video', undefined, { shouldValidate: true });
            toast({
              variant: 'destructive',
              title: 'Invalid File Type',
              description: 'Please upload a valid video file.',
            });
        }
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, over: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(over);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };
  
  const clearFile = () => {
    setFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    // @ts-ignore zod is expecting a File, but we're clearing it.
    form.setValue('video', undefined, { shouldValidate: true });
  }

  const handleGenerateHashtags = async () => {
    if (!file || !form.getValues('description')) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a video and add a description first.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const result = await generateHashtagsAction(base64data, form.getValues('description'));
        setHashtags(result);
        toast({
          title: 'Success!',
          description: 'Hashtags generated by AI.',
        });
      };
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const removeHashtag = (tagToRemove: string) => {
    setHashtags(prev => prev.filter(tag => tag !== tagToRemove));
  }
  
  const handleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  }

  const resetFormState = () => {
    form.reset();
    clearFile();
    setHashtags([]);
    // Reselect all accounts after reset using callback pattern
    setSelectedAccounts(() => accounts.map(a => a.id));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (selectedAccounts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Accounts Selected',
        description: 'Please select at least one account to upload to.',
      });
      return;
    }

    // Show limitation notice for TikTok accounts
    const tikTokAccounts = accounts.filter(acc => 
      acc.platform === 'TikTok' && selectedAccounts.includes(acc.id)
    );
    
    if (tikTokAccounts.length > 0) {
      toast({
        variant: 'destructive',
        title: 'TikTok Upload Not Available',
        description: 'TikTok video upload requires special API approval. Currently available: profile viewing and stats.',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for now
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

             // Simulate successful upload
       toast({
         title: 'Upload Successful!',
         description: `Video uploaded to ${selectedAccounts.length} account(s).`,
       });

      resetFormState();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Functionality Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> Video upload functionality is currently in demo mode. 
          TikTok video upload requires special API approval. Currently available: account connection, 
          profile viewing, and AI hashtag generation.
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <UploadCloud className="h-6 w-6" />
            Upload Video
          </CardTitle>
          <CardDescription>
            Upload your video content and generate AI-powered hashtags for maximum reach.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="video"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video File</FormLabel>
                      <FormControl>
                        <div
                          className={cn(
                            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                            isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
                            file ? 'border-green-500 bg-green-50' : ''
                          )}
                          onDragOver={(e) => handleDragEvents(e, true)}
                          onDragLeave={(e) => handleDragEvents(e, false)}
                          onDrop={handleDrop}
                        >
                          {file ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center">
                                <FileVideo className="h-12 w-12 text-green-500" />
                              </div>
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              {previewUrl && (
                                <div className="mt-4">
                                  <video
                                    src={previewUrl}
                                    controls
                                    className="mx-auto max-w-xs max-h-40 rounded-lg"
                                  />
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearFile}
                                className="mt-2"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center">
                                <UploadCloud className="h-12 w-12 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-lg font-medium">
                                  Drag & drop your video here
                                </p>
                                <p className="text-sm text-gray-500">
                                  or click to browse files
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Choose File
                              </Button>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description Section */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a compelling description for your video..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Hashtags Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>AI-Generated Hashtags</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateHashtags}
                    disabled={isGenerating || !file || !form.getValues('description')}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Hashtags'}
                  </Button>
                </div>
                
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-red-100">
                        #{tag}
                        <X 
                          className="h-3 w-3 ml-1 hover:text-red-500" 
                          onClick={() => removeHashtag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Selection */}
              <div className="space-y-4">
                <Label>Select Accounts to Upload To</Label>
                {accounts.length > 0 ? (
                  <div className="grid gap-3">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className={cn(
                          'flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors',
                          selectedAccounts.includes(account.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Checkbox 
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={() => handleAccountSelection(account.id)}
                        />
                        <div 
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                          onClick={() => handleAccountSelection(account.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={account.avatar} alt={account.displayName} />
                            <AvatarFallback>{account.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{account.displayName}</p>
                            <p className="text-sm text-gray-500">
                              @{account.username} • {account.platform}
                            </p>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {account.followerCount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No accounts connected.</p>
                    <p className="text-sm">Connect your social media accounts to start uploading.</p>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isUploading || !file || selectedAccounts.length === 0}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Upload to {selectedAccounts.length} Account{selectedAccounts.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
