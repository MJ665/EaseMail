'use client';
import { useState, useEffect } from 'react';

type Attachment = {
  id: string;
  fileName: string;
  filePath: string;
};

export default function AttachmentManager() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAttachments = async () => {
    const response = await fetch('/api/attachments');
    if (response.ok) setAttachments(await response.json());
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/attachments', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      fetchAttachments();
      setFile(null);
    } else {
      alert('Upload failed');
    }
    setIsUploading(false);
  };

  return (
    <div className="p-6 my-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold">My Attachments</h2>
      <div className="mt-4 space-y-2">
        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {attachments.map((att) => (
          <li key={att.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
            <span>{att.fileName}</span>
            <a href={att.filePath} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
              View
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}