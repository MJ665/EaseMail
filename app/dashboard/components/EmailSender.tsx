'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';

// Define types for our data
type Contact = {
    id: string;
    fullName: string;
    companyName: string;
    emailAddress1: string;
    [key: string]: any;
};
type Template = {
    id: string;
    name: string;
    subject: string;
    body: string;
};
type Attachment = {
    id: string;
    fileName: string;
    filePath: string;
    fileType?: string;
};

export default function EmailSender() {
    const { data: session } = useSession();

    // SMTP Credentials State
    const [smtpConfig, setSmtpConfig] = useState({ email: '', password: '' });

    // Data states
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<Set<string>>(new Set());
    const [selectedInlineImageId, setSelectedInlineImageId] = useState<string>('');

    // Email generation flow states
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentEmail, setCurrentEmail] = useState<{ to: string, subject: string, body: string } | null>(null);
    const [editableBody, setEditableBody] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Fetch all necessary data on component mount
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [contactsRes, templatesRes, attachmentsRes] = await Promise.all([
                    fetch('/api/contacts'),
                    fetch('/api/templates'),
                    fetch('/api/attachments'),
                ]);

                if (contactsRes.ok) setAllContacts(await contactsRes.json());
                else {
                    console.error("Failed to fetch contacts:", await contactsRes.text());
                    setAllContacts([]);
                }

                if (templatesRes.ok) setTemplates(await templatesRes.json());
                else {
                    console.error("Failed to fetch templates:", await templatesRes.text());
                    setTemplates([]);
                }

                if (attachmentsRes.ok) setAttachments(await attachmentsRes.json());
                else {
                    console.error("Failed to fetch attachments:", await attachmentsRes.text());
                    setAttachments([]);
                }
            } catch (error) {
                console.error("A critical error occurred during data fetch:", error);
                setStatusMessage("Error: Could not load application data.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // **THIS IS THE FULLY IMPLEMENTED SEARCH LOGIC**
    const filteredContacts = useMemo(() => {
        if (!searchTerm || !Array.isArray(allContacts)) {
            return allContacts;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return allContacts.filter(
            (contact) =>
                contact.fullName?.toLowerCase().includes(lowercasedTerm) ||
                contact.companyName?.toLowerCase().includes(lowercasedTerm) ||
                contact.emailAddress1?.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, allContacts]);

    const handleContactSelect = (contactId: string) => {
        const newSelection = new Set(selectedContactIds);
        newSelection.has(contactId) ? newSelection.delete(contactId) : newSelection.add(contactId);
        setSelectedContactIds(newSelection);
    };

    const handleAttachmentSelect = (attachmentId: string) => {
        const newSelection = new Set(selectedAttachmentIds);
        newSelection.has(attachmentId) ? newSelection.delete(attachmentId) : newSelection.add(attachmentId);
        setSelectedAttachmentIds(newSelection);
    };

    const startGeneration = async () => {
        if (selectedContactIds.size === 0 || !selectedTemplateId) {
            alert('Please select at least one contact and a template.');
            return;
        }
        if (!smtpConfig.email || !smtpConfig.password) {
            alert('Please provide your Host Email and Google App Password to send emails.');
            return;
        }
        setIsProcessing(true);
        setCurrentIndex(0);
        await generateEmailForIndex(0);
    };

    const generateEmailForIndex = async (index: number, isRegen = false) => {
        if (!isRegen && index >= selectedContactIds.size) {
            endGeneration("All emails have been processed!");
            return;
        }
        const contactId = Array.from(selectedContactIds)[index];
        const contact = allContacts.find(c => c.id === contactId);
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!contact || !template) {
            endGeneration("Error: Could not find contact or template.");
            return;
        }

        setStatusMessage(`Generating for ${contact.fullName}...`);
        setIsModalOpen(true);
        setCurrentEmail({ to: contact.emailAddress1, subject: "Generating...", body: "Please wait, contacting Gemini AI..." });
        setEditableBody("Please wait, contacting Gemini AI...");

        const response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contact,
                template,
                user: session?.user,
            }),
        });

        if (response.ok) {
            const emailContent = await response.json();
            setCurrentEmail({ to: contact.emailAddress1, ...emailContent });
            setEditableBody(emailContent.body);
        } else {
            alert(`Failed to generate email for ${contact.fullName}. Skipping.`);
            await processNext();
        }
    }

    const handleSend = async () => {
        if (!currentEmail) return;
        setStatusMessage(`Sending email to ${currentEmail.to}...`);

        const finalEmail = { ...currentEmail, body: editableBody };
        const regularAttachments = attachments.filter(a => selectedAttachmentIds.has(a.id) && a.id !== selectedInlineImageId);
        const inlineAttachment = attachments.find(a => a.id === selectedInlineImageId);

        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                smtpConfig,
                emailData: {
                    ...finalEmail,
                    attachments: regularAttachments,
                    inlineAttachment
                }
            }),
        });
        await processNext();
    };

    const processNext = async () => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setIsModalOpen(false);
        setCurrentEmail(null);
        if (nextIndex < selectedContactIds.size) {
            await generateEmailForIndex(nextIndex);
        } else {
            endGeneration("All emails have been processed!");
        }
    };

    const endGeneration = (message: string) => {
        setIsProcessing(false);
        setStatusMessage(message);
        setSelectedContactIds(new Set());
        setIsModalOpen(false);
        setTimeout(() => setStatusMessage(''), 5000);
    }

    if (loading) {
        return <div className="p-6 text-center card">Loading application data...</div>;
    }

    return (
        <div className="card">
            <h2 className="text-3xl font-bold text-center text-slate-800">Compose & Send</h2>

            <div className="p-4 mt-6 border-2 border-red-300 rounded-lg bg-red-50">
                <h3 className="text-lg font-semibold text-red-800">Step 1: Your Email Sending Configuration</h3>
                <p className="mt-1 text-sm text-red-700">Disclaimer: Your email and password are used only for this session and are **not** stored in our database for privacy and security.</p>
                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                    <input type="email" placeholder="HOST EMAIL (e.g., yourname@gmail.com)" value={smtpConfig.email} onChange={e => setSmtpConfig({ ...smtpConfig, email: e.target.value })} className="w-full p-2 border-gray-300 rounded-md shadow-sm" />
                    <input type="password" placeholder="GOOGLE APP PASSWORD" value={smtpConfig.password} onChange={e => setSmtpConfig({ ...smtpConfig, password: e.target.value })} className="w-full p-2 border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <h3 className="text-lg font-semibold">Step 2: Select Contacts</h3>
                    <input
                        type="text"
                        placeholder="Search by name, company, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 mt-2 mb-2 border rounded-md shadow-sm"
                    />
                    <div className="h-48 overflow-y-auto border rounded-md">
                        {Array.isArray(filteredContacts) && filteredContacts.map(c => (
                            <div key={c.id} className="flex items-center p-2 border-b last:border-b-0 hover:bg-slate-50/50">
                                <input type="checkbox" id={`contact-${c.id}`} checked={selectedContactIds.has(c.id)} onChange={() => handleContactSelect(c.id)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor={`contact-${c.id}`} className="ml-3 text-sm text-slate-700">{c.fullName} - <span className="text-slate-500">{c.companyName}</span></label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold">Step 3: Select Template</h3>
                    <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full p-2 mt-2 border rounded-md">
                        <option value="">-- Choose a template --</option>
                        {Array.isArray(templates) && templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    <h3 className="mt-4 text-lg font-semibold">Step 4: Select Attachments</h3>
                    <div className="mt-2 space-y-2 h-24 overflow-y-auto border rounded p-2">
                        {Array.isArray(attachments) && attachments.map(a => (
                            <div key={a.id} className="flex items-center">
                                <input type="checkbox" id={`att-${a.id}`} checked={selectedAttachmentIds.has(a.id)} onChange={() => handleAttachmentSelect(a.id)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor={`att-${a.id}`} className="ml-3 text-sm text-slate-700">{a.fileName}</label>
                            </div>
                        ))}
                    </div>
                    
                    <h3 className="mt-4 text-lg font-semibold">Optional: Select Image for `!!!IMAGE HERE`</h3>
                    <select value={selectedInlineImageId} onChange={e => setSelectedInlineImageId(e.target.value)} className="w-full p-2 mt-2 border rounded-md">
                        <option value="">-- No inline image --</option>
                        {attachments && attachments.filter(a => a.fileType?.startsWith('image/')).map(t => <option key={t.id} value={t.id}>{t.fileName}</option>)}
                    </select>
                </div>
            </div>

            <div className="mt-8 text-center">
                <button onClick={startGeneration} disabled={isProcessing || selectedContactIds.size === 0 || !selectedTemplateId || !smtpConfig.email || !smtpConfig.password} className="w-full max-w-md px-6 py-3 text-lg font-bold text-white bg-green-600 rounded-md shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300">
                    {isProcessing ? 'Processing...' : `Start Sending Process (${selectedContactIds.size} selected)`}
                </button>
                {statusMessage && <p className="mt-4 text-center text-indigo-600">{statusMessage}</p>}
            </div>

            {isModalOpen && currentEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => endGeneration("Process cancelled.")}>
                    <div className="relative w-full max-w-3xl p-6 bg-white rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold">Review Email ({currentIndex + 1} of {selectedContactIds.size})</h3>
                        <div className="p-2 mt-4 bg-gray-100 border rounded">
                            <p><strong>To:</strong> {currentEmail.to}</p>
                            <p><strong>Subject:</strong> {currentEmail.subject}</p>
                        </div>
                        <textarea value={editableBody} onChange={(e) => setEditableBody(e.target.value)} className="w-full p-2 mt-2 font-mono text-sm border rounded h-72" />
                        <div className="flex flex-wrap justify-end mt-6 space-x-2">
                            <button onClick={() => endGeneration("Process cancelled.")} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Cancel Process</button>
                            <button onClick={processNext} className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500">Skip</button>
                            <button onClick={() => generateEmailForIndex(currentIndex, true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Regenerate</button>
                            <button onClick={handleSend} className="px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">Approve & Send</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}