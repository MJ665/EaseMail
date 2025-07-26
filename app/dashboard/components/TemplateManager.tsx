'use client';
import { useState, useEffect } from 'react';

type Template = { id: string; name: string; subject: string; body: string };

// Accept className as a prop
export default function TemplateManager({ onTemplateCreated, className = '' }: { onTemplateCreated: () => void, className?: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = async () => {
    const response = await fetch('/api/templates');
    if (response.ok) setTemplates(await response.json());
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTemplate),
    });

    if (response.ok) {
      setNewTemplate({ name: '', subject: '', body: '' });
      setShowForm(false);
      await fetchTemplates(); // Refresh the list
      onTemplateCreated(); // **CALL THE NEW PROP HERE**
    } else {
      alert('Failed to create template');
    }
    setIsSaving(false);
  };

 return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Email Templates</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text" placeholder="Template Name (e.g., 'Internship Application')"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            className="w-full p-2 border rounded" required
          />
          <input
            type="text" placeholder="Subject Line"
            value={newTemplate.subject}
            onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
            className="w-full p-2 border rounded" required
          />
          <textarea
            placeholder="Email Body. Use placeholders like {Full Name} and {Company Name}."
            value={newTemplate.body}
            onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
            className="w-full p-2 border rounded" rows={8} required
          />
          <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 rounded-md disabled:bg-gray-400">
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </form>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-medium">Your Saved Templates</h3>
        <div className="mt-2 space-y-2 h-32 overflow-y-auto">
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">No templates created yet.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-gray-600 truncate">Subject: {t.subject}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}