'use client';
import { useState, useEffect } from 'react';

// Expanded type to include the designation field
type Contact = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string;
  emailAddress1: string;
  designation: string | null;
  personalLinkedinProfile: string | null;
};

export default function ContactList({ refreshTrigger }: { refreshTrigger: number }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      const response = await fetch('/api/contacts');
      if (response.ok) {
        setContacts(await response.json());
      }
      setLoading(false);
    };
    fetchContacts();
  }, [refreshTrigger]);

  if (loading) return <div className="p-4 text-center">Loading contacts...</div>;
  if (contacts.length === 0) return <p className="p-4 text-center text-slate-500">No contacts uploaded yet. Use the "Upload Contacts" component to get started.</p>;

  return (
    <div className="overflow-x-auto">
      {/* Use table-fixed for better column control and remove min-w-full */}
      <table className="w-full text-left table-fixed">
        <thead className="bg-slate-50/50">
          <tr>
            {/* Define explicit widths for columns */}
            <th className="w-1/4 px-4 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase">Name & Designation</th>
            <th className="w-1/4 px-4 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase">Email</th>
            <th className="w-1/4 px-4 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase">Company</th>
            <th className="w-1/6 px-4 py-3 text-xs font-bold tracking-wider text-slate-600 uppercase">LinkedIn</th>
          </tr>
        </thead>
        <tbody className="bg-white/70 divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-4 align-top">
                {/* Use break-words to wrap long text */}
                <div className="text-sm font-semibold text-slate-900 break-words">{contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim()}</div>
                <div className="text-xs text-slate-600 break-words">{contact.designation}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-sm text-slate-800 break-words">{contact.emailAddress1}</div>
              </td>
              <td className="px-4 py-4 align-top">
                 <div className="text-sm text-slate-800 break-words">{contact.companyName}</div>
              </td>
              <td className="px-4 py-4 text-sm align-top">
                {contact.personalLinkedinProfile && contact.personalLinkedinProfile !== 'N/A' ? (
                  <a href={contact.personalLinkedinProfile} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:text-indigo-800">
                    View Profile
                  </a>
                ) : (
                  <span className="text-slate-400">Not Provided</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}