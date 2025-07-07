import AccountManager from '@/components/account-manager';
import ClipCastLogo from '@/components/clipcast-logo';
import UploadForm from '@/components/upload-form';
import { AccountsProvider } from '@/context/accounts-context';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-12 mt-8">
          <div className="inline-block">
            <ClipCastLogo />
          </div>
          <p className="text-muted-foreground mt-2 font-medium">
            Upload. Connect. Share.
          </p>
        </header>
        
        <AccountsProvider>
          <div className="space-y-8">
            <UploadForm />
            <AccountManager />
          </div>
        </AccountsProvider>

        <footer className="text-center mt-16 mb-8">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ClipCast. All Rights Reserved.</p>
        </footer>
      </div>
    </main>
  );
}
