import { FolderOpen, Globe, KeyRound, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const STEPS = [
  {
    icon: Terminal,
    title: "Build the extension",
    body: (
      <>
        In the repo, run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          cd extensions/chrome
        </code>
        , then{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          npm install
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          npm run build
        </code>
        .
      </>
    ),
  },
  {
    icon: FolderOpen,
    title: "Load it in Chrome",
    body: (
      <>
        Open{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          chrome://extensions
        </code>
        , turn on{" "}
        <span className="font-medium text-foreground">Developer mode</span>, click{" "}
        <span className="font-medium text-foreground">Load unpacked</span> and
        select the{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          extensions/chrome
        </code>{" "}
        folder.
      </>
    ),
  },
  {
    icon: KeyRound,
    title: "Connect it to your backend",
    body: (
      <>
        Open the extension's service-worker console and set your backend URL and
        API key:
        <code className="mt-2 block overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground">
          {`chrome.storage.local.set({\n  "config:base-url": "http://localhost:8000",\n  "config:auth-token": "<FLOWSYNC_API_KEY>"\n})`}
        </code>
        Use the key from your backend{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          .env
        </code>
        . The extension does not sync until a key is set.
      </>
    ),
  },
];

export function ExtensionSetupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            Chrome extension setup
          </DialogTitle>
          <DialogDescription>
            FlowSync Capture is not published on the Chrome Web Store yet. You
            can build the extension from this repo and load it locally.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-3">
                <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">
                    {index + 1}. {step.title}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          This is a developer build. The Chrome Web Store listing and a packaged
          installer do not exist yet.
        </div>
      </DialogContent>
    </Dialog>
  );
}
