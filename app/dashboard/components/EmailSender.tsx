
'use client';
import { useState, useEffect } from 'react';

// Define types for our data
type Contact = { id: string; fullName: string; companyName: string; emailAddress1: string; [key: string]: any; };
type Template = { id: string; name: string; subject: string; body: string; };
type Attachment = { id: string; fileName: string; filePath: string; };

export default function EmailSender() {
  // Data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Selection states
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<Set<string>>(new Set());

  // Email generation flow states
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEmail, setCurrentEmail] = useState<{ to: string, subject: string, body: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetch('/api/contacts').then(res => res.json()).then(setContacts);
    fetch('/api/templates').then(res => res.json()).then(setTemplates);
    fetch('/api/attachments').then(res => res.json()).then(setAttachments);
  }, []);

  const handleContactSelect = (contactId: string) => {
    const newSelection = new Set(selectedContactIds);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContactIds(newSelection);
  };
  
  const handleAttachmentSelect = (attachmentId: string) => {
    const newSelection = new Set(selectedAttachmentIds);
    if (newSelection.has(attachmentId)) {
      newSelection.delete(attachmentId);
    } else {
      newSelection.add(attachmentId);
    }
    setSelectedAttachmentIds(newSelection);
  };

  const startGeneration = async () => {
    if (selectedContactIds.size === 0 || !selectedTemplateId) {
      alert('Please select at least one contact and a template.');
      return;
    }
    setIsGenerating(true);
    setCurrentIndex(0);
    await generateNextEmail(0);
  };
  
  const generateNextEmail = async (index: number) => {
      if (index >= selectedContactIds.size) {
          endGeneration();
          return;
      }
      
      const contactId = Array.from(selectedContactIds)[index];
      const contact = contacts.find(c => c.id === contactId);
      const template = templates.find(t => t.id === selectedTemplateId);
      
      if (!contact || !template) {
          endGeneration();
          return;
      }

      setStatusMessage(`Generating email for ${contact.fullName}...`);
      
      const response = await fetch('/api/generate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact, template, user: { name: 'Your Name' } }),
      });

      if (response.ok) {
          const emailContent = await response.json();
          setCurrentEmail({ to: contact.emailAddress1, ...emailContent });
          setIsModalOpen(true);
      } else {
          alert(`Failed to generate email for ${contact.fullName}.`);
          await generateNextEmail(index + 1);
      }
  }
  
  const handleSend = async () => {
      if (!currentEmail) return;

      setStatusMessage(`Sending email to ${currentEmail.to}...`);

      const selectedAttachments = attachments.filter(a => selectedAttachmentIds.has(a.id));

      await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentEmail, attachments: selectedAttachments }),
      });
      
      setIsModalOpen(false);
      setCurrentEmail(null);
      await generateNextEmail(currentIndex + 1);
      setCurrentIndex(currentIndex + 1);
  };

  const handleSkip = async () => {
    setIsModalOpen(false);
    setCurrentEmail(null);
    await generateNextEmail(currentIndex + 1);
    setCurrentIndex(currentIndex + 1);
  }

  const endGeneration = () => {
    setIsGenerating(false);
    setStatusMessage('All emails processed!');
    setSelectedContactIds(new Set());
    setTimeout(() => setStatusMessage(''), 5000);
  }

  return (
    <div className="p-6 my-12 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Compose & Send</h2>
      {/* Step 1: Select Contacts */}
      <div>
        <h3 className="mt-4 text-lg font-semibold">1. Select Contacts</h3>
        <div className="h-48 overflow-y-auto border rounded">
          {contacts.map(c => (
            <div key={c.id} className="p-2 border-b">
              <input type="checkbox" id={`contact-${c.id}`} checked={selectedContactIds.has(c.id)} onChange={() => handleContactSelect(c.id)} />
              <label htmlFor={`contact-${c.id}`} className="ml-2">{c.fullName} - {c.companyName}</label>
            </div>
          ))}
        </div>
      </div>
      {/* Step 2: Select Template */}
      <div>
        <h3 className="mt-4 text-lg font-semibold">2. Select Template</h3>
        <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full p-2 border rounded">
            <option value="">-- Choose a template --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {/* Step 3: Select Attachments */}
      <div>
        <h3 className="mt-4 text-lg font-semibold">3. Select Attachments (Optional)</h3>
        {attachments.map(a => (
            <div key={a.id}>
                <input type="checkbox" id={`att-${a.id}`} checked={selectedAttachmentIds.has(a.id)} onChange={() => handleAttachmentSelect(a.id)} />
                <label htmlFor={`att-${a.id}`} className="ml-2">{a.fileName}</label>
            </div>
        ))}
      </div>
      {/* Step 4: Generate and Send */}
      <button onClick={startGeneration} disabled={isGenerating} className="w-full px-4 py-3 mt-6 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
        {isGenerating ? 'Processing...' : `Generate & Send Emails (${selectedContactIds.size} selected)`}
      </button>
      {statusMessage && <p className="mt-4 text-center">{statusMessage}</p>}

      {/* Approval Modal */}
      {isModalOpen && currentEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-xl font-bold">Review Email</h3>
            <div className="p-2 mt-4 bg-gray-100 border rounded">
                <p><strong>To:</strong> {currentEmail.to}</p>
                <p><strong>Subject:</strong> {currentEmail.subject}</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: currentEmail.body }} className="w-full p-2 mt-2 border rounded h-72 overflow-y-auto"/>
            <div className="flex justify-end mt-6 space-x-4">
              <button onClick={handleSkip} className="px-4 py-2 bg-gray-300 rounded-md">Skip</button>
              <button onClick={() => { /* Edit functionality can be added here */ alert('Edit not implemented'); }} className="px-4 py-2 bg-yellow-500 rounded-md">Edit</button>
              <button onClick={() => generateNextEmail(currentIndex)} className="px-4 py-2 bg-blue-500 rounded-md text-white">Regenerate</button>
              <button onClick={handleSend} className="px-4 py-2 font-bold text-white bg-green-600 rounded-md">Approve & Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}