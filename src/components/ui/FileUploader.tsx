"use client";

import { useCallback, useState } from "react";
import { Upload, X, File as FileIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFamAttachments } from "@/hooks/useFamSupport";

interface FileUploaderProps {
  userId: string;
  caseId?: string;
  conversationId?: string;
  onUploadComplete?: (files: any[]) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploader({ 
  userId, 
  caseId, 
  conversationId, 
  onUploadComplete,
  accept = "image/*,application/pdf,audio/*,video/*,text/*",
  maxSizeMB = 50 
}: FileUploaderProps) {
  const [files, setFiles] = useState<{ file: File; preview?: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const { upload, uploading: hookUploading } = useFamAttachments();
  const isUploading = hookUploading || files.some(f => f.status === 'uploading');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    e.target.value = '';
  }, []);

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(f => {
      if (f.size > maxSizeMB * 1024 * 1024) return false;
      return true;
    });
    setFiles(prev => [...prev, ...valid.map(f => ({ 
      file: f, 
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      status: 'pending' as const 
    }))]);
  };

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    for (const f of pending) {
      setFiles(prev => prev.map(x => x === f ? { ...x, status: 'uploading' } : x));
      try {
        await upload(f.file, userId, caseId, conversationId);
        setFiles(prev => prev.map(x => x === f ? { ...x, status: 'done' } : x));
      } catch (e) {
        setFiles(prev => prev.map(x => x === f ? { ...x, status: 'error', error: (e as Error).message } : x));
      }
    }
    const done = files.filter(f => f.status === 'done').map(f => f.file);
    if (done.length) onUploadComplete?.(done);
  };

  const removeFile = (idx: number) => {
    if (files[idx].preview) URL.revokeObjectURL(files[idx].preview!);
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <Card className="border-fam-lavender">
      <CardContent className="p-4">
        <div className="border-2 border-dashed border-fam-lavender rounded-xl p-6 text-center cursor-pointer hover:bg-fam-soft-pink transition-colors"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input type="file" multiple accept={accept} onChange={handleSelect} className="hidden" id="fam-upload" />
          <label htmlFor="fam-upload" className="cursor-pointer">
            <Upload className="mx-auto h-10 w-10 text-fam-magenta/50 mb-2" />
            <p className="text-fam-deep-plum font-medium">Arraste arquivos ou clique para selecionar</p>
            <p className="text-xs text-fam-muted mt-1">PDF, imagens, áudio, vídeo até {maxSizeMB}MB</p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-fam-ivory-pink rounded-lg border border-fam-lavender">
                <div className="flex items-center gap-2">
                  {f.preview ? (
                    <img src={f.preview} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <FileIcon className="h-10 w-10 text-fam-dusty-rose" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fam-deep-plum truncate">{f.file.name}</p>
                    <p className="text-xs text-fam-muted">{(f.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {f.status === 'uploading' && <div className="h-4 w-4 animate-spin border-2 border-fam-magenta/30 border-t-fam-magenta rounded-full" />}
                  {f.status === 'done' && <CheckCircle2 className="h-5 w-5 text-fam-success" />}
                  {f.status === 'error' && <AlertCircle className="h-5 w-5 text-fam-danger" />}
                  <Button variant="ghost" size="icon" onClick={() => removeFile(i)} className="text-fam-muted">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {files.some(f => f.status === 'pending') && (
              <Button onClick={uploadAll} disabled={isUploading} className="w-full gap-2">
                <Upload className="h-4 w-4" /> Enviar {files.filter(f => f.status === 'pending').length} arquivo(s)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
