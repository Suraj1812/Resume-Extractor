import { useRef } from "react";

type UploadBoxProps = {
  dragging: boolean;
  selectedFile: File | null;
  isLoading: boolean;
  onFileSelect: (file: File | null) => void;
  onExtract: () => void;
  onDragStateChange: (value: boolean) => void;
};

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadBox({
  dragging,
  selectedFile,
  isLoading,
  onFileSelect,
  onExtract,
  onDragStateChange,
}: UploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-title">Step 1</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Upload resume</h2>
        </div>
        <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
          PDF, DOCX, TXT
        </div>
      </div>

      <div
        className={`mt-6 rounded-[1.75rem] border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-orange-400 bg-orange-50/70" : "border-slate-200 bg-white/70"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          onDragStateChange(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          onDragStateChange(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          onDragStateChange(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDragStateChange(false);
          onFileSelect(event.dataTransfer.files.item(0));
        }}
      >
        <input
          ref={fileInputRef}
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(event) => onFileSelect(event.target.files?.item(0) ?? null)}
          type="file"
        />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Drag and drop
        </p>
        <h3 className="mt-4 font-display text-3xl text-ink">Resume goes here</h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Upload at the top, run parsing, and the extracted JSON will autofill the
          editable form below.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            className="action-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Choose file
          </button>
          <button className="ghost-button" onClick={() => onFileSelect(null)} type="button">
            Clear
          </button>
          <button
            className="ghost-button"
            disabled={!selectedFile || isLoading}
            onClick={onExtract}
            type="button"
          >
            {isLoading ? "Parsing..." : "Parse resume"}
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        {selectedFile ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            Selected: <strong>{selectedFile.name}</strong> · {formatFileSize(selectedFile.size)}
          </div>
        ) : (
          <p>Upload size defaults to 5 MB and can be changed with `MAX_UPLOAD_MB`.</p>
        )}
      </div>
    </section>
  );
}
