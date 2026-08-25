"use client";
import { useState } from "react";
import { Library, X, Image as ImageIcon, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentLibrary } from "@/hooks/use-queries";
import { youtubeThumbnailUrl } from "@/lib/youtube";
import type { ContentLibraryType } from "@/types/domain";

const TYPE_ICONS: Record<ContentLibraryType, React.ReactNode> = {
  imagem: <ImageIcon className="h-4 w-4" />, video_youtube: <Video className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />, logo: <ImageIcon className="h-4 w-4" />, outro: <FileText className="h-4 w-4" />,
};

export function MediaLibraryPicker({
  onPick, onlyTypes,
}: { onPick: (url: string) => void; onlyTypes?: ContentLibraryType[] }) {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useContentLibrary();
  const filtered = onlyTypes ? items.filter((i) => onlyTypes.includes(i.type)) : items;

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setOpen(true)}>
        <Library className="h-3.5 w-3.5" /> Da biblioteca
      </Button>

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-navy">Escolher da biblioteca</p>
              <button onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm italic text-muted-foreground">Nada cadastrado ainda na Biblioteca de Arquivos.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filtered.map((item) => {
                  const thumb = item.type === "video_youtube" ? youtubeThumbnailUrl(item.url) : (item.type === "imagem" || item.type === "logo") ? item.url : null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onPick(item.url); setOpen(false); }}
                      className="overflow-hidden rounded-md border text-left hover:border-gold"
                    >
                      {thumb ? (
                        <img src={thumb} alt={item.title} className="h-20 w-full object-cover" />
                      ) : (
                        <div className="grid h-20 w-full place-items-center bg-muted/40 text-muted-foreground">{TYPE_ICONS[item.type]}</div>
                      )}
                      <p className="truncate p-1.5 text-xs font-medium text-navy">{item.title}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
