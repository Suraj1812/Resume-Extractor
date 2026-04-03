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
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Step 1</p>
          <h1 className="mt-1 text-lg font-semibold text-slate-950">Upload resume</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drop a file to extract candidate details and prefill the editable form.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          PDF, DOCX, TXT
        </div>
      </div>

      <div
        className={`mt-5 rounded-2xl border border-dashed p-8 text-center transition duration-150 sm:p-10 ${
          dragging
            ? "border-slate-400 bg-slate-50"
            : "border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-white"
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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 16V7m0 0-3 3m3-3 3 3M5.75 15.75v1.5A1.75 1.75 0 0 0 7.5 19h9a1.75 1.75 0 0 0 1.75-1.75v-1.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-base font-medium text-slate-950">
          Drag and drop resume or click to upload
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Supported formats: PDF, DOCX, TXT
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            className="action-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Choose file
          </button>
          <button
            className="secondary-button"
            disabled={!selectedFile || isLoading}
            onClick={onExtract}
            type="button"
          >
            {isLoading ? "Parsing..." : "Extract data"}
          </button>
          <button
            className="secondary-button"
            onClick={() => onFileSelect(null)}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        {selectedFile ? (
          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <span className="truncate">
              <span className="font-medium text-slate-950">{selectedFile.name}</span>
            </span>
            <span className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</span>
          </div>
        ) : (
          <p>Files are validated before parsing. Adjust size limits with `MAX_UPLOAD_MB`.</p>
        )}
      </div>
    </section>
  );
}
