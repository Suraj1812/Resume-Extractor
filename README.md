# Resume Extractor

Production-ready end-to-end resume extractor built with:

- Next.js App Router + TypeScript + TailwindCSS
- FastAPI + Python 3.11+
- PyTorch + HuggingFace Transformers + spaCy-aware chunking
- pdfplumber + python-docx
- Single-service Railway deployment through the root Dockerfile

## Architecture

```text
[ Next.js Frontend ]
        ↓
[ FastAPI Backend ]
        ↓
[ Resume Parsing Pipeline ]
        ↓
[ ML NER Model ]
        ↓
[ Structured JSON Output ]
        ↓
[ Autofill Editable Form UI ]
```

## Folder structure

```text
.
├── backend
│   ├── app
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── models
│   │   │   └── schema.py
│   │   ├── routes
│   │   │   ├── health.py
│   │   │   └── resume.py
│   │   ├── services
│   │   │   ├── ner.py
│   │   │   └── parser.py
│   │   └── utils
│   │       ├── file_handler.py
│   │       ├── logger.py
│   │       └── validators.py
│   ├── requirements.txt
│   └── tests
│       ├── test_health.py
│       └── test_parser.py
├── frontend
│   ├── app
│   │   ├── components
│   │   │   ├── Loader.tsx
│   │   │   ├── ResultForm.tsx
│   │   │   └── UploadBox.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib
│   │   ├── api.ts
│   │   └── types.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Features

- Drag-and-drop resume upload
- PDF, DOCX, and TXT parsing
- Transformer-based NER with regex fallback
- Structured extraction for:
  `name`, `email`, `phone`, `skills`, `education`, `experience`
- Editable autofilled form UI
- SVG logo, favicon, and social preview assets
- Robots, sitemap, manifest, and JSON-LD metadata for stronger SEO
- Railway-ready single-service deployment

## API

- `GET /health`
- `POST /api/parse-resume`

### Response shape

```json
{
  "name": "",
  "email": "",
  "phone": "",
  "title": "",
  "location": "",
  "summary": "",
  "skills": [],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field_of_study": "",
      "start_date": "",
      "end_date": "",
      "grade": "",
      "location": "",
      "details": []
    }
  ],
  "experience": [
    {
      "company": "",
      "title": "",
      "start_date": "",
      "end_date": "",
      "location": "",
      "summary": "",
      "highlights": []
    }
  ]
}
```

## Local setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Open `http://localhost:3000`.

## Docker

```bash
docker build -t resume-extractor .
docker run --env-file .env.example -p 8000:8000 resume-extractor
```

Open `http://localhost:8000`.

The Docker image installs the CPU-only PyTorch wheel for Linux so Railway does not pull the multi-gigabyte CUDA runtime packages that exceed smaller plan limits.

## docker-compose

```bash
docker compose up --build
```

## Railway deployment

1. Push this repository to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Railway will detect the root `Dockerfile`.
4. Add any environment variables you want to override from `.env.example`.
5. Deploy.
6. Open the generated Railway URL.

The exported Next.js frontend is served directly by FastAPI inside the same container, so you only need one Railway service.

If your Railway service has a public domain, the Docker build can automatically derive `NEXT_PUBLIC_SITE_URL` from Railway's `RAILWAY_PUBLIC_DOMAIN` variable, which improves canonical, sitemap, and social metadata without extra code changes.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8000` | Runtime port for Railway and Docker |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed CORS origins for local split frontend/backend development |
| `MAX_UPLOAD_MB` | `5` | Maximum upload size |
| `MODEL_NAME` | `dslim/bert-base-NER` | HuggingFace NER model |
| `MODEL_MAX_CHARS` | `5000` | Maximum characters passed to the NER chunker |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8000` | Frontend dev API base URL |
| `NEXT_PUBLIC_SITE_URL` | empty | Public site URL used for canonical tags, sitemap, and richer SEO metadata |
| `PRELOAD_MODEL` | `false` | Preload the transformer model during backend startup |
| `LOG_LEVEL` | `INFO` | Application log level |

## Tests

```bash
cd backend
pytest tests -q
```

## Notes

- The parser pipeline is modular:
  `parse_file -> extract_text -> clean_text -> run_ner -> postprocess -> validate`
- Email and phone extraction always have regex fallback.
- Transformer model loading is lazy to keep startup fast.
