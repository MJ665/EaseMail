'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CSVUploader from './components/CSVUploader';
import ContactList from './components/ContactList';
import TemplateManager from './components/TemplateManager';
import AttachmentManager from './components/AttachmentManager';
import EmailSender from './components/EmailSender';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center text-2xl font-bold">EaseMail</div>
            <div className="flex items-center">
              <p className="mr-4">Signed in as {session?.user?.email}</p>
              <button
                onClick={() => signOut({ callbackUrl: '/signin' })}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <EmailSender />

            <div className="grid grid-cols-1 gap-8 mt-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                    <CSVUploader onUploadSuccess={() => setRefreshTrigger(t => t + 1)} />
                </div>
                <div>
                    <TemplateManager />
                </div>
                <div>
                    <AttachmentManager />
                </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">Your Contact List</h2>
              <ContactList refreshTrigger={refreshTrigger} />
            </div>

        </div>
      </main>
    </div>
  );
}