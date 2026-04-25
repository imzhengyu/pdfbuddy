import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { useSplit } from '../../../hooks/useSplit';
import { downloadBlob, downloadBlobsAsZip } from '../../../utils/downloadUtils';
import { PageRange } from '../../../services/pdf/types';
import styles from './SplitView.module.css';

export function SplitView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageRanges, setPageRanges] = useState<string>('');
  const { split, isProcessing, progress, error, clearError } = useSplit();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file) return;

    const ranges: PageRange[] = pageRanges.split(',').map(r => {
      const trimmed = r.trim();
      const parts = trimmed.split('-');
      return {
        start: parseInt(parts[0], 10),
        end: parts[1] === 'end' ? -1 : parseInt(parts[1], 10)
      };
    });

    const results = await split(file, ranges);
    if (results && results.length > 0) {
      const baseName = file.name.replace('.pdf', '');
      if (results.length === 1) {
        downloadBlob(results[0], `${baseName}_part1.pdf`);
      } else {
        const zipBlobs = results.map((blob, i) => ({ name: `${baseName}_part${i + 1}.pdf`, blob }));
        await downloadBlobsAsZip(zipBlobs, `${baseName}_split.zip`);
      }
    }
  }, [file, pageRanges, split]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Split PDF</h2>
        <p className={styles.description}>
          Split a PDF into separate files by page ranges. Example: "1-3, 4-6, 7-end"
        </p>
      </div>

      {!file ? (
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to split"
          multiple={false}
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong></span>
            <Button label="Change File" variant="outline" size="sm" onClick={() => setFile(null)} />
          </div>

          <PageThumbnails file={file} />

          <div className={styles.inputGroup}>
            <label htmlFor="pageRanges">Page Ranges:</label>
            <input
              id="pageRanges"
              type="text"
              value={pageRanges}
              onChange={(e) => setPageRanges(e.target.value)}
              placeholder="e.g., 1-3, 4-6, 7-end"
              className={styles.input}
            />
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Split PDF"
              variant="primary"
              onClick={handleSplit}
              disabled={!pageRanges.trim() || isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}