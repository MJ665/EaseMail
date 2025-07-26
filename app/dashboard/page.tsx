'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import CSVUploader from './components/CSVUploader';
import TemplateManager from './components/TemplateManager';
import AttachmentManager from './components/AttachmentManager';
import EmailSender from './components/EmailSender';
import ContactList from './components/ContactList';
import Logo from '../components/Logo';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State to manage the UI flow
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isReadyToSend, setIsReadyToSend] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // This is the key function that was missing its implementation.
  // It checks if the user has uploaded contacts and created templates.
  const checkAppState = useCallback(async () => {
    try {
      const response = await fetch('/api/app-state');
      if (response.ok) {
        const state = await response.json();
        // The user is ready only if they have BOTH contacts AND templates
        setIsReadyToSend(state.hasContacts && state.hasTemplates);
      }
    } catch (error) {
      console.error("Failed to check app state:", error);
      // If the check fails, assume not ready, but stop loading.
      setIsReadyToSend(false);
    } finally {
      // This is the crucial line that stops the "Checking your setup..." message.
      setIsLoadingState(false);
    }
  }, []);

  // This hook now correctly calls the fully implemented checkAppState function.
  useEffect(() => {
    if (status === 'authenticated') {
      checkAppState();
    }
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router, checkAppState]);

  // This function is passed as a prop to child components.
  // When they update data, they call this, which re-checks the app state.
  const handleDataUpdate = useCallback(() => {
    setRefreshKey(prev => prev + 1); // Forces child components to re-fetch their own data
    setIsLoadingState(true); // Show the loading message again while re-checking
    checkAppState(); // Re-evaluates if the user is ready to send
  }, [checkAppState]);

  // This is the fully implemented loading screen logic.
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen text-white text-xl">
        Loading Session...
      </div>
    );
  }

  // This is the fully implemented Setup View.
  const SetupView = () => (
    <div className="card text-center max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
            <Logo className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Welcome to EaseMail!</h2>
        <p className="mt-4 text-lg text-slate-600">Lets get you ready to send your first batch of emails. Please complete the steps below.</p>
        <div className="w-full max-w-sm mx-auto my-6 border-t border-gray-300"></div>
        <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2">
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <h3 className="text-2xl font-semibold">Step 1: Upload Contacts</h3>
                <p className="mt-2 text-slate-500">Upload a CSV file of the people you want to email.</p>
                <div className="mt-4">
                    <CSVUploader onUploadSuccess={handleDataUpdate} />
                </div>
            </div>
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <h3 className="text-2xl font-semibold">Step 2: Create a Template</h3>
                <p className="mt-2 text-slate-500">Create a reusable email template.</p>
                 <div className="mt-4">
                    <TemplateManager onTemplateCreated={handleDataUpdate} />
                </div>
            </div>
        </div>
    </div>
  );
  
  // This is the fully implemented Sender View.
  const SenderView = () => (
    <>
      <EmailSender key={`sender-${refreshKey}`} />
      <div className="grid grid-cols-1 gap-8 mt-12 lg:grid-cols-3">
        <CSVUploader onUploadSuccess={handleDataUpdate} className="card h-full" />
        <TemplateManager onTemplateCreated={handleDataUpdate} className="card h-full" />
        <AttachmentManager onUploadSuccess={() => setRefreshKey(prev => prev+1)} className="card h-full" />
      </div>
      <div className="mt-12 card">
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">Your Full Contact List</h2>
        <ContactList refreshTrigger={refreshKey} />
      </div>
    </>
  );

  // This is the final, correct return statement with all logic.
  return (
    <div className="min-h-screen text-slate-800">
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                    <Logo className="h-10 w-10"/>
                    EaseMail
                  </div>
                  <div className="flex items-center">
                      <p className="hidden mr-4 text-sm sm:block text-slate-700">Signed in as {session?.user?.email}</p>
                      <button onClick={() => signOut({ callbackUrl: '/signin' })} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow">Sign out</button>
                  </div>
              </div>
          </div>
      </nav>
      <main className="py-10">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              {isLoadingState ? (
                <div className="text-xl font-semibold text-center text-white">Checking your setup...</div>
              ) : (
                isReadyToSend ? <SenderView /> : <SetupView />
              )}
          </div>
      </main>
    </div>
  );
}