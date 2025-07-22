'use client';

import { useState, useEffect } from 'react';

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

  const fetchTemplates = async () => {
    const response = await fetch('/api/templates');
    if (response.ok) setTemplates(await response.json());
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTemplate),
    });

    if (response.ok) {
      setNewTemplate({ name: '', subject: '', body: '' });
      setShowForm(false);
      fetchTemplates();
    } else {
      alert('Failed to create template');
    }
  };

  return (
    <div className="p-6 my-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Email Templates</h2>
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
            type="text"
            placeholder="Template Name"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Subject"
            value={newTemplate.subject}
            onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            placeholder="Body"
            value={newTemplate.body}
            onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
            className="w-full p-2 border rounded"
            rows={8}
            required
          />
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md">Save</button>
        </form>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-medium">Your Templates</h3>
        {templates.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No templates yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="p-3 bg-gray-50 rounded">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-gray-600">Subject: {t.subject}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}