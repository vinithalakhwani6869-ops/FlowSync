# FlowSync

Your editor knows your code. Your browser knows your research. FlowSync knows what's actually happening.

FlowSync is a **developer workflow intelligence engine** — it captures what happens in the gaps between your tools, which no single tool can see because it lives across all of them.

Your editor knows your code.
Your browser knows your research.
Your terminal knows your errors.
FlowSync knows what's actually happening across all three simultaneously.

## The Core Problem FlowSync Solves

Every dev tool is siloed. Your editor doesn't know what you were reading in your browser. Your browser doesn't know what your terminal threw. No tool sees the full picture.

The result:

- You copy paste errors into AI and explain everything from scratch
- You come back after a break with zero clue where you were
- You visit the same Stack Overflow page 3 times and nobody notices
- You stop typing for 20 minutes and every tool stays silent

FlowSync fixes this by watching the gaps between your tools silently.

## What FlowSync Captures

### Cross-environment signals

- Time spent on a docs page → you're stuck on that concept
- Terminal error → connected to what you edited 10 mins ago
- Same Stack Overflow page opened 3 times → recurring blocker flagged

### Friction patterns

- Stopped typing for 20+ minutes → invisible to every tool you use
- Switched files 6 times in 2 minutes → context switching detected
- Same error copy pasted twice → first solution didn't work

### Intent signals

- Which docs you read → what you're trying to build
- Which GitHub issues you opened → what's blocking you
- Combined with editor activity → goal + blocker + attempted solutions known simultaneously

## How FlowSync Is Different From Everything Else

| Tool | What it knows |
|------|--------------|
| GitHub Copilot | Your code |
| Cursor | Your code + AI conversation |
| FaultLine | Facts you explicitly told your AI |
| OpenCode | Your terminal + codebase |
| **FlowSync** | **The gaps between all of them** |

## Components

1. **Chrome Extension** → watches browser activity
2. **VS Code Extension** → watches editor activity
3. **FastAPI Backend** → connects everything, runs the AI layer

## Screens

| Screen | Description |
|---|---|
| **Landing** | Product overview with feature highlights and flow diagram |
| **Dashboard** | Overview of recovered sessions, hours saved, and retrieval accuracy |
| **Live Capture** | Real-time activity feed showing captured events during a debugging session |
| **VS Code Extension** | Mockup of the in-editor FlowSync panel with match confidence and recovered knowledge |
| **Recovered Sessions** | Timeline view of a past debugging session with recovered commands and links |
| **Privacy Center** | Data handling principles, cloud sync controls, and privacy audit log |
| **Settings** | Capture preferences, appearance, and keyboard shortcuts |
| **Architecture** | System diagram showing the full pipeline from input to retrieval |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS v4, shadcn/ui components
- **Icons:** Lucide React
- **Build Tool:** Vite with `@tailwindcss/vite` and `@vitejs/plugin-react`

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## License

MIT