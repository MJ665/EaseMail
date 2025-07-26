'use client';
import { useState, useEffect } from 'react';

type Attachment = { id: string; fileName: string; filePath: string };

// Accept className as a prop
export default function AttachmentManager({ onUploadSuccess, className = '' }: { onUploadSuccess: () => void, className?: string }) {
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
      await fetchAttachments(); // Re-fetch to update the list
      onUploadSuccess(); // Notify the parent component
      setFile(null); // Clear the file input
    } else {
      alert('Upload failed. Please try again.');
    }
    setIsUploading(false);
  };

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold text-slate-800">My Attachments</h2>
      <p className="mt-1 text-sm text-gray-500">Upload your Resume, CV, Transcript, etc.</p>
      <div className="mt-4 space-y-3">
        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      <h3 className="mt-6 text-lg font-medium">Uploaded Files</h3>
      <ul className="mt-2 space-y-2 h-32 overflow-y-auto">
        {attachments.length > 0 ? attachments.map((att) => (
          <li key={att.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
            <span className="text-sm truncate">{att.fileName}</span>
            <a href={att.filePath} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
              View
            </a>
          </li>
        )) : <p className="text-sm text-gray-400">No files uploaded yet.</p>}
      </ul>
    </div>
  );
}