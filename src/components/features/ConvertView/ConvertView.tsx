import { useState, useCallback, useEffect } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { FileList } from '../../common/FileList/FileList';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { FeatureViewShell } from '../../common/FeatureViewShell';
import { ErrorBanner } from '../../common/ErrorBanner';
import { useWorkerPDFOperation } from '../../../hooks/useWorkerPDFOperation';
import { usePreview } from '../../../hooks/usePreview';
import { downloadBlob } from '../../../utils/downloadUtils';
import { validateImageFile } from '../../../utils/fileUtils';
import { ConvertToPDFOptions } from '../../../services/pdf/convertOperation';
import styles from './ConvertView.module.css';

interface FileItem {
  id: string;
  file: File;
}

const PAGE_SIZE_OPTIONS: { value: ConvertToPDFOptions['pageSize']; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'original', label: 'Original' },
];

const ORIENTATION_OPTIONS: { value: ConvertToPDFOptions['orientation']; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
];

const FIT_MODE_OPTIONS: { value: ConvertToPDFOptions['fitMode']; label: string }[] = [
  { value: 'fit', label: 'Fit' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'original', label: 'Original' },
];

export function ConvertView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [convertOptions, setConvertOptions] = useState<ConvertToPDFOptions>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 20,
    fitMode: 'fit',
  });
  const [pendingAction, setPendingAction] = useState<'download' | 'preview' | null>(null);
  const { isPreviewOpen, previewFile, openPreview, closePreview } = usePreview();

  const {
    startConvertToPDF,
    isProcessing,
    progress,
    error,
    result,
    reset,
  } = useWorkerPDFOperation({ useWorker: true });

  const fileList = files.map(f => f.file);

  useEffect(() => {
    if (!result || !(result instanceof Blob) || !pendingAction) return;

    const convertedFile = new File([result], 'converted-preview.pdf', { type: 'application/pdf' });

    if (pendingAction === 'download') {
      downloadBlob(result, 'converted.pdf');
    } else if (pendingAction === 'preview') {
      openPreview(convertedFile);
    }

    setPendingAction(null);
  }, [result, pendingAction, openPreview]);

  const handleFilesDropped = useCallback((droppedFiles: File[]) => {
    const validFiles = droppedFiles.filter(validateImageFile);
    const newFiles = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setIsAddingMore(false);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleConvert = useCallback(() => {
    if (files.length === 0) return;
    reset();
    setPendingAction('download');
    startConvertToPDF(fileList, convertOptions);
  }, [files, fileList, convertOptions, reset, startConvertToPDF]);

  const handlePreview = useCallback(() => {
    if (files.length === 0) return;
    reset();
    setPendingAction('preview');
    startConvertToPDF(fileList, convertOptions);
  }, [files, fileList, convertOptions, reset, startConvertToPDF]);

  const handleClear = useCallback(() => {
    setFiles([]);
    reset();
    closePreview();
  }, [reset, closePreview]);

  const handleOptionChange = useCallback(<K extends keyof ConvertToPDFOptions>(
    key: K,
    value: ConvertToPDFOptions[K]
  ) => {
    setConvertOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const shell = (
    <FeatureViewShell
      title="Convert to PDF"
      description="Convert images (PNG, JPEG) to a PDF document."
      isEmpty={files.length === 0}
      emptyView={
        <DropZone
          onFilesDropped={handleFilesDropped}
          message="Drag and drop images here to convert to PDF"
          accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
        />
      }
      workspace={(
        <>
          <FileList files={files} onRemove={handleRemoveFile} showPageCount={false} />

          <div className={styles.options}>
            <div className={styles.optionGroup}>
              <label htmlFor="pageSize">Page Size</label>
              <select
                id="pageSize"
                value={convertOptions.pageSize}
                onChange={(e) => handleOptionChange('pageSize', e.target.value as ConvertToPDFOptions['pageSize'])}
                disabled={isProcessing}
              >
                {PAGE_SIZE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.optionGroup}>
              <label htmlFor="orientation">Orientation</label>
              <select
                id="orientation"
                value={convertOptions.orientation}
                onChange={(e) => handleOptionChange('orientation', e.target.value as ConvertToPDFOptions['orientation'])}
                disabled={isProcessing}
              >
                {ORIENTATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.optionGroup}>
              <label htmlFor="fitMode">Image Fit</label>
              <select
                id="fitMode"
                value={convertOptions.fitMode}
                onChange={(e) => handleOptionChange('fitMode', e.target.value as ConvertToPDFOptions['fitMode'])}
                disabled={isProcessing}
              >
                {FIT_MODE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.optionGroup}>
              <label htmlFor="margin">Margin (pt)</label>
              <input
                id="margin"
                type="number"
                min={0}
                max={100}
                value={convertOptions.margin}
                onChange={(e) => handleOptionChange('margin', Math.max(0, parseInt(e.target.value, 10) || 0))}
                disabled={isProcessing}
              />
            </div>
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          <ErrorBanner message={error} onDismiss={reset} />

          <div className={styles.actions}>
            {isAddingMore ? (
              <DropZone
                onFilesDropped={handleFilesDropped}
                message="Add more images"
                accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
              />
            ) : (
              <Button
                label="Add More"
                variant="outline"
                onClick={() => setIsAddingMore(true)}
                disabled={isProcessing}
              />
            )}
            <Button label="Clear All" variant="outline" onClick={handleClear} disabled={isProcessing} />
            <Button label="Preview PDF" variant="outline" onClick={handlePreview} disabled={isProcessing || files.length === 0} loading={isProcessing && pendingAction === 'preview'} />
            <Button label={`Convert ${files.length} Image${files.length > 1 ? 's' : ''} to PDF`} variant="primary" onClick={handleConvert} disabled={isProcessing} loading={isProcessing && pendingAction === 'download'} />
          </div>
        </>
      )}
    />
  );

  return (
    <>
      {shell}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        file={previewFile}
        title="Preview - Converted PDF"
      />
    </>
  );
}
