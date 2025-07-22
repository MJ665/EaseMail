'use client';

import { useState, useEffect } from 'react';

type Contact = {
  id: string;
  fullName: string;
  companyName: string;
  emailAddress1: string;
  designation: string | null;
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

  if (loading) return <div>Loading contacts...</div>;
  if (contacts.length === 0) return <p>No contacts found.</p>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Company</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Designation</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td className="px-6 py-4 whitespace-nowrap">{contact.fullName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{contact.companyName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{contact.emailAddress1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{contact.designation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}