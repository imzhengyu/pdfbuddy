import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { CONST_ERROR_MESSAGES, CONST_PDF_CONFIG } from '../../../config';
import { PDFProcessingError } from '../../../services/pdf/types';
import styles from './DropZone.module.css';

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  onError?: (error: PDFProcessingError) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  message?: string;
  maxSize?: number;
}

export function DropZone({
  onFilesDropped,
  onError,
  accept = { [CONST_PDF_CONFIG.supportedMimeTypes[0]]: [...CONST_PDF_CONFIG.supportedExtensions] },
  multiple = true,
  message = 'Drag and drop PDF files here, or click to select',
  maxSize = CONST_PDF_CONFIG.dropzoneMaxSize
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const rejectedNames = rejectedFiles.map((rejection) => rejection.file.name).join(', ');
        const error = new PDFProcessingError(
          CONST_ERROR_MESSAGES.unsupportedFiles(rejectedNames),
          'FILE_VALIDATION',
          'Please check the file format and size'
        );
        onError?.(error);
      }

      if (acceptedFiles.length > 0) {
        const oversized = acceptedFiles.filter(f => f.size > maxSize);
        if (oversized.length > 0) {
          const oversizedNames = oversized.map((f) => f.name).join(', ');
          const error = new PDFProcessingError(
            CONST_ERROR_MESSAGES.oversizedFiles(oversizedNames, Math.round(maxSize / 1024 / 1024)),
            'FILE_SIZE',
            'Try splitting the file into smaller parts'
          );
          onError?.(error);
          return;
        }

        onFilesDropped(multiple ? acceptedFiles : [acceptedFiles[0]]);
      }
    },
    [onFilesDropped, onError, multiple, maxSize]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    multiple,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false)
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
      data-testid="dropzone"
    >
      <input {...getInputProps()} />
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className={styles.message}>{message}</p>
        <p className={styles.hint}>Click to browse files</p>
      </div>
    </div>
  );
}
