# Mavericks Certify

**AI-powered Certificate Generation, Verification, Fraud Detection & Recognition platform for Hexaware Mavericks.**

A cinematic, enterprise-grade frontend that automates the complete certificate lifecycle — generation, personalization, verification, fraud detection, and achievement recognition — with role-based access for Mavericks, HR, L&D, Admins, and external Verifiers.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 18 (JSX) + Vite 5 |
| Styling | Tailwind CSS 3 (custom futuristic design system) |
| Animation | Framer Motion 11 |
| Icons | Lucide React |
| Routing | React Router 6 |
| State | Zustand (auth, toasts) |
| Charts | Recharts |

> The backend is **mocked** (localStorage + simulated latency) so the entire product is runnable with zero infrastructure. Every service is isolated behind `src/services/*` so it can be swapped for real APIs without touching the UI.

---

## Getting started

```bash
npm install
npm run dev      # starts Vite (http://localhost:5173, or next free port)
npm run build    # production build → dist/
npm run preview  # preview the production build
```

### Demo accounts (password: `demo1234`)

| Role | Email | Lands on |
| --- | --- | --- |
| Maverick (Fresher) | `maverick@hexaware.com` | My Overview |
| HR Admin | `hr@hexaware.com` | Command Center |
| L&D Manager | `lnd@hexaware.com` | Command Center |
| Super Admin | `admin@hexaware.com` | Command Center |
| External Verifier | `verify@acme.com` | Verify Portal |

The login screen has one-click buttons to autofill each demo account.

---

## Feature map

| Feature | Route | Notes |
| --- | --- | --- |
| Cinematic landing | `/` | Hero, floating certificates, animated stats, glowing AI sphere |
| Auth (login/signup/forgot/OTP) | `/login` `/signup` `/forgot-password` `/verify-otp` | Mock JWT, persistent session, enterprise SSO UI |
| Public verification portal | `/verify` | No login required — for clients & recruiters |
| Maverick dashboard | `/app/overview` | Achievements, timeline, leaderboard rank, growth stats |
| AI Certificate Generator | `/app/generate` | 4-step flow: details → AI narrative → smart design → issue |
| Approval queue | `/app/approvals` | Single + bulk approvals with live preview |
| Fraud detection | `/app/fraud` | Multi-signal AI forensic scan with risk model |
| In-app verification | `/app/verify` | By ID/QR or file upload, confidence + ledger checks |
| Analytics | `/app/analytics` | Trends, department distribution, fraud breakdown, AI insights |
| Leaderboard | `/app/leaderboard` | Podium + full ranking |
| User management | `/app/users` | Role/department directory |
| My certificates | `/app/certificates` | Searchable grid, detail modal, HTML/PDF export |
| Settings | `/app/settings` | Profile, notifications, security, appearance |

---

## Architecture

```
src/
├── main.jsx                 # entry + BrowserRouter
├── App.jsx                  # route tree, guards, ambient layers
├── index.css                # Tailwind layers + glass/glow utilities
├── config/roles.js          # roles, permission matrix, nav model
├── data/mockData.js         # seed users, certs, templates, analytics
├── lib/                     # utils, certificate export
├── hooks/                   # useCountUp, useMousePosition
├── services/                # authService, certificateService,
│                            #   verificationService, fraudService, aiService
├── store/                   # authStore, toastStore (Zustand)
├── routes/ProtectedRoute.jsx# auth + role + permission guard
├── components/
│   ├── ui/                  # Button, GlassCard, Input, Select, Modal,
│   │                        #   Badge, Spinner, Toaster, StatCard, PageHeader
│   ├── background/          # AnimatedBackground, Particles, CursorGlow
│   ├── layout/              # DashboardLayout, Sidebar, Topbar
│   ├── charts/              # recharts wrappers (glassy/glowing)
│   └── certificate/         # CertificatePreview, CertificateCard,
│                            #   CertificateModal, QRCode
└── pages/
    ├── Landing / PublicVerify / NotFound
    ├── auth/                # AuthLayout + 4 auth pages
    └── app/                 # all authenticated workspace pages
```

### Role-based access control
`config/roles.js` is the single source of truth: it defines roles, a `PERMISSIONS` matrix, and a `NAV_ITEMS` model gated by both role and permission. `ProtectedRoute` enforces auth → role → permission, redirecting unauthorized users to their role home. The sidebar renders only the nav each role is allowed to see.

---

## Deployment

The app is a static SPA — build once, host anywhere.

```bash
npm run build      # outputs dist/
```

**Vercel / Netlify:** point to the repo, build command `npm run build`, output dir `dist`. Add an SPA rewrite so client routes work:

- **Netlify** (`netlify.toml` or `_redirects`): `/*  /index.html  200`
- **Vercel** (`vercel.json`): `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

**Static host / S3 + CloudFront / Nginx:** serve `dist/` and rewrite all unknown paths to `index.html`.

### Going to production (replace the mock)
1. Implement real endpoints behind the same signatures in `src/services/*`.
2. Move JWT issuance to the backend; store tokens in httpOnly secure cookies (see Security).
3. Point `aiService` at a server endpoint that calls an LLM (e.g. Claude) — never expose model keys in the client.
4. Replace the simulated ledger hash with a real signing/anchoring service.

---

## Scalability recommendations

- **Code-split by route** with `React.lazy` + `Suspense` to shrink the initial bundle (currently the analytics/charts and generator are the heaviest — lazy-load them). Configure `manualChunks` to split `recharts` and `framer-motion` vendor chunks.
- **Server state**: adopt TanStack Query for caching, retries, and background refetch once real APIs exist; keep Zustand for pure client/UI state.
- **Bulk generation** should be a backend job queue (e.g. SQS + workers) with progress streamed via WebSocket/SSE; the UI already models bulk issuance.
- **Verification at scale**: cache verification results at the edge (CDN) keyed by certificate ID; anchor hashes in batches rather than per-cert.
- **Multi-tenancy**: namespace data by tenant and resolve SSO/branding per tenant at login.
- **Design system**: the UI primitives in `components/ui` are framework-agnostic and ready to extract into a shared package.

## Security recommendations

- **Tokens**: issue JWTs server-side, deliver via `Secure`, `HttpOnly`, `SameSite=Strict` cookies — not `localStorage` (the mock uses localStorage purely for the offline demo). Keep access tokens short-lived with refresh rotation.
- **Authorization**: enforce the `PERMISSIONS` matrix on the **server** for every mutation; client guards are UX, not security.
- **AI keys**: all LLM calls go through an authenticated backend proxy; never ship provider keys to the browser.
- **Verification integrity**: sign certificates with an asymmetric key; the public portal verifies signatures so authenticity never depends on a trusted client.
- **Fraud pipeline**: run document forensics server-side; rate-limit and CAPTCHA the public upload/verify endpoints.
- **Hardening**: strict Content-Security-Policy, input validation/sanitization at every boundary, audit logging on issuance/approval/revocation, and dependency scanning in CI.

---

© 2026 Hexaware Technologies · Mavericks Certify
