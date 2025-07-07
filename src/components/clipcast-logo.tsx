import { Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';

type ClipCastLogoProps = {
  className?: string;
};

export default function ClipCastLogo({ className }: ClipCastLogoProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3 text-primary', className)}>
      <Clapperboard className="h-10 w-10" />
      <h1 className="text-4xl font-bold font-headline text-foreground">
        ClipCast
      </h1>
    </div>
  );
}
