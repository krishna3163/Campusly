# 🎓 Campusly

**The Unified Operating System for Student Life.**

🌐 **Live Demo:** [https://campusly.insforge.site](https://campusly.insforge.site)

Campusly is a high-performance, local-first web application designed to centralize the fragmented Indian campus experience. Combining secure E2E-encrypted messaging, a collaborative study dashboard, and a corporate placement hub, Campusly is built to thrive in high-density hostel environments.

---

## 🚀 Key Features

- **Multi-Pane Chat**: A premium, desktop-native messaging experience with dual-pane views, reply threads, and voice notes.
- **E2E Encryption**: Zero-knowledge security for all direct and group conversations.
- **Academic Dashboard**: Track assignments, exams, and notes with an AI-integrated summary engine.
- **Placement Hub**: Access senior-junior interview logs, company prep channels, and resume review tools.
- **Campus Feed**: A categorized, community-driven social feed with anonymous posting capabilities.
- **Offline-First / P2P**: Seamless operation in low-connectivity zones using local mesh synchronization and P2P file fallback.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS + Custom Glassmorphism UI System
- **State Management**: Zustand (Global Store) + LocalStorage/IndexedDB (Offline Cache)
- **Icons**: Lucide React

### Backend (InsForge)
- **Realtime**: WebSocket-based pub/sub for instant messaging and presence.
- **Database**: PostgreSQL (via InsForge SDK) with OrgId-based tenancy.
- **Storage**: S3-compatible bucket with CDN integration.
- **Auth**: InsForge Auth (JWT-based, identity-locked).

---

## 📂 Project Structure

```bash
src/
├── components/         # Reusable UI (Buttons, Modals, Cards)
│   ├── layout/         # Desktop Sidebar & Mobile Nav
│   └── ui/             # Premium Glassmorphic components
├── pages/              # Primary route views
│   ├── chat/           # Dual-pane chat interface
│   ├── campus/         # Triple-column feed
│   ├── study/          # Academic dashboard
│   └── placement/      # Career & Interview hub
├── stores/             # Zustand global state (auth, sync, app)
├── lib/                # SDK initializers (InsForge)
├── services/           # Background workers (Sync, Realtime)
└── types/              # Global TypeScript definitions
```

---

## 🛠️ Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/campusly.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file in the root:
   ```env
   VITE_INSFORGE_BASE_URL=your_endpoint
   VITE_INSFORGE_ANON_KEY=your_public_token
   VITE_APP_ENV=development
   ```
4. **Run Developer Server**:
   ```bash
   npm run dev
   ```

---

## 🔒 Security Model

Campusly employs a multi-layered security approach:
- **At Rest**: Local data in IndexedDB is obfuscated.
- **In Transit**: All API calls utilize TLS 1.3.
- **Messaging**: RSA-2048/AES-256 E2E encryption for chats.
- **Identity**: Fingerprinted device sessions via InsForge Auth.

---

## 🗺️ Roadmap

- [x] Phase 1: Core Messaging & Feed (Mobile-First)
- [x] Phase 2: Desktop UI Overhaul & Placement Hub
- [ ] Phase 3: P2P File Mesh (Wider LAN Support)
- [ ] Phase 4: AI Study Buddy Integration (PDF Summaries)
- [ ] Phase 5: Institutional SSO & Faculty Portals

---

## 🤝 Contribution

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code style, branch naming, and PR processes.

**License**: MIT 
*Built with ❤️ by Campusly Labs.*
