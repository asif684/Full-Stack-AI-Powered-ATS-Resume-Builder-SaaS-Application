# Resume Builder AI

A full-stack resume builder application with AI-powered keyword extraction and resume generation using multiple LLM providers.

## Features

- **Authentication**: Secure JWT-based auth with refresh tokens
- **Profile Management**: Complete profile with education, experience, projects, certificates, skills
- **AI-Powered Keyword Extraction**: Extract ATS keywords from job descriptions
- **Multiple LLM Providers**: Support for 10+ providers (OpenAI, Anthropic, Gemini, Groq, Cerebras, OpenRouter, Together AI, etc.)
- **Free/Low-Latency Options**: Prioritizes free models with ultra-fast inference (Groq, Cerebras, Together AI)
- **Flexible API Key Management**: Use same or different API keys for keyword extraction vs resume generation
- **Three Prompt Options**: System prompt, custom LLM, or custom prompt template
- **Project Selection**: AI-suggested projects based on job relevance
- **Chat-Format Resume Output**: Generated resume displayed in chat format with section editing
- **Future-Ready**: Scaffold for PDF/Word generation

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Headless UI patterns
- React Hook Form + Zod validation
- TanStack Query for server state
- Zustand for client state
- React Router v6

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT authentication
- Multiple LLM provider abstraction
- Rate limiting, helmet, CORS

## Project Structure

```
resume-builder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # API client, utilities
│   │   └── hooks/         # Custom hooks
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/        # Environment, LLM providers, prompts
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (LLM service)
│   │   ├── utils/         # Crypto, Prisma, logger
│   │   └── validators/    # Zod schemas
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── docker-compose.yml      # PostgreSQL + Redis
├── package.json            # Root workspace
└── README.md
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
# From root directory
npm install

# This installs both client and server dependencies via workspaces
```

### 2. Start Database

```bash
# Option A: Docker (recommended)
docker-compose up -d

# Option B: Local PostgreSQL
# Create database 'resume_builder' and update DATABASE_URL in server/.env
```

### 3. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your settings:
# - DATABASE_URL (if not using Docker defaults)
# - JWT_SECRET (generate a secure 32+ char string)
# - ENCRYPTION_KEY (exactly 32 characters)
# - System API keys (optional, for "System Prompt" option)
```

### 4. Setup Database

```bash
cd server
npx prisma db push
npx prisma generate
```

### 5. Start Development Servers

```bash
# From root directory - runs both client and server
npm run dev

# Or separately:
npm run dev:server  # Server on http://localhost:4000
npm run dev:client  # Client on http://localhost:3000
```

### 6. Open Application

Navigate to http://localhost:3000

## API Providers Supported

| Provider | Free Tier | Latency | Notes |
|----------|-----------|---------|-------|
| **Groq** | ✅ | ⚡⚡ Ultra-fast | Llama 3.1 8B/70B, Mixtral, Gemma |
| **Cerebras** | ✅ | ⚡⚡ Fastest | Llama 3.1 8B/70B |
| **Together AI** | ✅ | ⚡ Fast | Llama, Qwen Turbo models |
| **OpenRouter** | ✅ | ⚡ Fast | 300+ models including free Llama, Qwen, Mistral, Phi-3 |
| **Google Gemini** | ✅ | ⚡ Fast | Gemini 1.5 Flash/Pro, 2.0 Flash |
| **NVIDIA** | ✅ | ⚡ Fast | Nemotron models |
| **xAI Grok** | ❌ | Standard | Grok 2, Grok 2 Mini |
| **OpenAI** | ❌ | Standard | GPT-4o, GPT-4o-mini, GPT-3.5-turbo |
| **Anthropic** | ❌ | Standard | Claude 3.5 Sonnet, Haiku |
| **Custom** | ✅ | Varies | Any OpenAI-compatible endpoint |

## LLM Configuration Options

### Step 1: Keyword Extraction
1. **System Prompt** - Uses built-in ATS keyword extraction prompt (no API key needed if system keys configured)
2. **Custom LLM + API Key** - Choose provider, model, enter API key
3. **Custom Prompt** - Write your own extraction prompt template

### Step 5: Resume Generation
1. **Custom LLM + API Key** - Can use different provider/key than Step 1
   - "Use same API key as Step 1" (auto-filled)
   - "Use different API key" (enter new key)
2. **Pre-existing System Prompt** - Uses built-in resume generation prompt
3. **Custom Prompt** - Write your own generation prompt with placeholders

## Resume Generation Flow

1. **Job Description** → Enter JD + choose LLM for keyword extraction
2. **Keywords** → Review extracted keywords, keep/discard, add custom
3. **Profile** → Complete your profile (or use existing)
4. **Projects** → Select projects (AI suggestions available)
5. **Generate** → Choose generation method → Get chat-format resume
6. **Edit** → Inline edit any section, regenerate specific sections

## System Prompts (Built-in)

### Keyword Extraction
```
ATS keyword extraction expert. Analyze the JOB DESCRIPTION.
CATEGORIZE: Hard skills/tools/tech, Certs/education, Job titles, Jargon/acronyms, Soft skills
PRIORITY: CRITICAL/IMPORTANT/OPTIONAL based on frequency and placement
OUTPUT: Structured table with keyword, category, priority, frequency, exact phrasing, preferred form, placement
```

### Resume Generation
```
generate a resume in chat keep all the keywords given by you,
resume sequence: header -> summary -> skills -> exp -> proj -> cert -> educ

header: name, exact job title, phone/address/email, linkedin/github
summary: 3-4 lines
skills: prioritized sequence
experience: company, job title, 2 bullet points per role
projects: name, tech, pipeline (movie/apps), github, 2 bullet points
certificates: relevant only (Job Sim, Cisco, Euron)
education: same format as experience
```

## Database Schema

Key models:
- `User` - Authentication
- `Profile` - Complete professional profile
- `Education`, `Experience`, `Project`, `Certificate`, `Skill` - Profile sections
- `ResumeData` - Generated resumes with keywords, config, content
- `Session` - JWT sessions
- `ApiKey` - Encrypted user API keys per provider

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with short expiry + refresh rotation
- API keys encrypted at rest (AES-256-GCM)
- Rate limiting on all endpoints
- Helmet.js security headers
- CORS configured for frontend origin
- Input validation with Zod

## Development

### Run Tests
```bash
npm run test          # All workspaces
npm run test --workspace=server
npm run test --workspace=client
```

### Linting
```bash
npm run lint
```

### Database Operations
```bash
cd server
npx prisma studio      # Visual database browser
npx prisma db push     # Push schema changes
npx prisma migrate dev # Create migration
npx prisma generate    # Regenerate client
```

### Build for Production
```bash
npm run build
```

## Deployment

### Backend (Server)
- Build: `npm run build` in server/
- Run: `npm start` (serves dist/index.js)
- Environment variables required

### Frontend (Client)
- Build: `npm run build` in client/
- Deploy `dist/` to Vercel, Netlify, or any static host
- Configure `VITE_API_URL` for production API

### Database
- Use managed PostgreSQL (Railway, Render, Neon, Supabase, etc.)
- Run `npx prisma migrate deploy` on deploy

## Future Enhancements

- [ ] PDF generation (pdf-lib, puppeteer, or @react-pdf/renderer)
- [ ] Word document generation (docx)
- [ ] Resume templates/themes
- [ ] ATS scoring analysis
- [ ] Multiple resume versions
- [ ] Export history
- [ ] Collaboration/sharing
- [ ] Analytics dashboard
- [ ] OAuth (Google, GitHub)

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check DATABASE_URL in server/.env
- Verify database exists

### LLM API Errors
- Verify API keys are valid
- Check provider status pages
- Free tiers have rate limits

### CORS Errors
- Ensure CORS_ORIGIN matches frontend URL
- Check both client and server ports

## License

MIT