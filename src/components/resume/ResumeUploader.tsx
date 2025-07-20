import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import useAppStore from '../../store';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
// For DOCX parsing, include mammoth.browser.min.js in public/index.html
// <script src="https://unpkg.com/mammoth/mammoth.browser.min.js"></script>

interface ResumeUploaderProps {
  onUploadComplete?: (fileUrl: string, fileName: string, resumeText: string) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { isLoading, setIsLoading } = useAppStore();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      // Check if file is PDF or DOC/DOCX
      const fileType = selectedFile.type;
      if (
        fileType === 'application/pdf' ||
        fileType === 'application/msword' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setFile(selectedFile);
        setUploadStatus('idle');
        setErrorMessage('');
      } else {
        setErrorMessage('Please upload a PDF, DOC, or DOCX file.');
        setUploadStatus('error');
      }
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });
  
  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus('uploading');
    setIsLoading(true);
    try {
      // Extract text from the file
      let resumeText = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textContent += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        resumeText = textContent;
      } else if (
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        resumeText = result.value;
      }
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      const fileUrl = URL.createObjectURL(file);
      setUploadStatus('success');
      if (onUploadComplete) {
        onUploadComplete(fileUrl, file.name, resumeText);
      }
    } catch (error) {
      console.error('Error uploading or parsing file:', error);
      setUploadStatus('error');
      setErrorMessage('Failed to upload or parse file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetUpload = () => {
    setFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Resume Upload</h3>
      {uploadStatus !== 'success' ? (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : errorMessage
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              {errorMessage ? (
                <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
              ) : (
                <Upload className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'} mb-3`} />
              )}
              {errorMessage ? (
                <p className="text-red-500 font-medium">{errorMessage}</p>
              ) : file ? (
                <>
                  <p className="text-gray-700 font-medium">File selected:</p>
                  <div className="flex items-center mt-2 p-2 bg-gray-100 rounded-md">
                    <FileText className="text-gray-500 mr-2" size={20} />
                    <span className="text-gray-800 text-sm truncate max-w-xs">{file.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-700 font-medium">
                    {isDragActive ? 'Drop the resume file here' : 'Drag & drop a resume file here'}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">or click to browse files</p>
                  <p className="text-gray-400 text-xs mt-4">Supports PDF, DOC, DOCX (Max 5MB)</p>
                </>
              )}
            </div>
          </div>
          {file && !errorMessage && (
            <div className="mt-4 flex justify-end space-x-3">
              <Button variant="outline" onClick={resetUpload} icon={<X size={16} />}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading' || isLoading}
                className="relative"
              >
                {uploadStatus === 'uploading' || isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>Upload Resume</>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900">Upload Successful!</h3>
          <p className="text-gray-600 mt-2">
            Resume has been uploaded and is being processed.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={resetUpload}
          >
            Upload Another Resume
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ResumeUploader;