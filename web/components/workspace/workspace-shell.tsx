"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Code2,
  FileText,
  History,
  ListChecks,
  type LucideIcon,
  Menu,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { AiHelpDockPanel } from "@/app/[locale]/contests/_components/ai-dialog";
import { AiHelpDockProvider } from "@/app/[locale]/contests/_components/ai-help-dock";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ActionsPanel, CompactActions } from "./actions-panel";
import { ConsoleBody } from "./console-panel";
import { SettingsDrawer } from "./settings-drawer";
import { SubmissionHistory } from "./submission-history";
import { TestCasesPanel } from "./test-cases-panel";
import { useWorkspace } from "./workspace-context";

export type RailItem = {
  key: string;
  label: string;
  /** An icon, or a short text such as a contest problem letter. */
  icon: LucideIcon | string;
  href?: string;
  /** Opens the drawer with this key (`?panel=`). */
  panel?: string;
  active?: boolean;
  /** Marks e.g. a solved contest problem. */
  done?: boolean;
};

export type WorkspaceDrawer = {
  title: string;
  description?: string;
  content: ReactNode;
  /** For wide content such as the leaderboard table. */
  wide?: boolean;
};

const CONSOLE_KEY = "workspace-console-collapsed";
const noopSubscribe = () => () => {};

/**
 * Fullscreen editor workspace (editor-workspace-shell spec): top bar, icon
 * rail, statement + console on the left, editor + test cases + actions on the
 * right. Below 1024px one view at a time with a bottom switcher. Context
 * adapters fill the slots; state lives in `WorkspaceProvider`.
 */
export function WorkspaceShell({
  title,
  status,
  back,
  rail = [],
  drawers = {},
  statement,
  editor,
}: {
  title: ReactNode;
  status?: ReactNode;
  back: { href: string; label: string };
  /** Context items, placed between Back and Submissions/Settings. */
  rail?: RailItem[];
  drawers?: Record<string, WorkspaceDrawer>;
  statement: ReactNode;
  editor: ReactNode;
}) {
  const t = useTranslations("Workspace");
  const isWide = useMediaQuery("(min-width: 1024px)");
  // The server can't know the width: render the body only on the client, so
  // the editor isn't mounted in the narrow layout and then remounted.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [panel, setPanel] = useQueryState("panel", parseAsString);

  const items: RailItem[] = [
    { key: "back", label: t("Rail.back"), icon: ArrowLeft, href: back.href },
    ...rail,
    {
      key: "submissions",
      label: t("Rail.submissions"),
      icon: History,
      panel: "submissions",
    },
    {
      key: "settings",
      label: t("Rail.settings"),
      icon: Settings,
      panel: "settings",
    },
  ];
  const allDrawers: Record<string, WorkspaceDrawer> = {
    ...drawers,
    submissions: {
      title: t("History.title"),
      content: <SubmissionHistory onLoaded={() => setPanel(null)} />,
    },
    settings: { title: t("Settings.title"), content: <SettingsDrawer /> },
  };
  const drawer = panel ? allDrawers[panel] : undefined;

  return (
    // The AI help dialog can dock its hints as a panel right of the editor.
    <AiHelpDockProvider>
      <div className="fixed inset-0 z-40 flex h-dvh flex-col bg-background">
        <header className="flex h-11 shrink-0 items-center gap-3 border-b px-3">
          {!isWide && <RailMenu items={items} onPanel={setPanel} />}
          <h1 className="min-w-0 truncate font-semibold text-sm sm:text-base">
            {title}
          </h1>
          <div className="ml-auto flex shrink-0 items-center gap-3 text-sm">
            {status}
          </div>
        </header>

        {!mounted ? (
          <div className="flex-1" />
        ) : isWide ? (
          <div className="flex min-h-0 flex-1">
            <Rail items={items} onPanel={setPanel} panel={panel} />
            <WideBody editor={editor} statement={statement} />
          </div>
        ) : (
          <NarrowBody editor={editor} statement={statement} />
        )}

        <Sheet onOpenChange={(open) => !open && setPanel(null)} open={!!drawer}>
          <SheetContent
            className={cn(drawer?.wide && "sm:max-w-5xl")}
            side="left"
          >
            {drawer && (
              <>
                <SheetHeader>
                  <SheetTitle>{drawer.title}</SheetTitle>
                  {drawer.description && (
                    <SheetDescription>{drawer.description}</SheetDescription>
                  )}
                </SheetHeader>
                <div className="min-w-0 overflow-x-auto">{drawer.content}</div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AiHelpDockProvider>
  );
}

function RailIcon({ icon }: { icon: RailItem["icon"] }) {
  if (typeof icon === "string") {
    return <span className="font-bold text-base leading-none">{icon}</span>;
  }
  const Icon = icon;
  return <Icon className="size-5" />;
}

function Rail({
  items,
  panel,
  onPanel,
}: {
  items: RailItem[];
  panel: string | null;
  onPanel: (panel: string) => void;
}) {
  return (
    <nav className="flex w-16 shrink-0 flex-col items-stretch gap-1 overflow-y-auto border-r py-2">
      {items.map((item) => {
        const className = cn(
          "relative flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          (item.active || (item.panel && item.panel === panel)) &&
            "bg-muted text-foreground",
          item.done && "text-green-600 dark:text-green-400",
        );
        const body = (
          <>
            <RailIcon icon={item.icon} />
            <span className="max-w-full truncate">{item.label}</span>
          </>
        );
        return item.href ? (
          <Link className={className} href={item.href} key={item.key}>
            {body}
          </Link>
        ) : (
          <button
            className={className}
            key={item.key}
            onClick={() => item.panel && onPanel(item.panel)}
            type="button"
          >
            {body}
          </button>
        );
      })}
    </nav>
  );
}

function RailMenu({
  items,
  onPanel,
}: {
  items: RailItem[];
  onPanel: (panel: string) => void;
}) {
  const t = useTranslations("Workspace.Rail");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={t("menu")} size="icon" variant="ghost">
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map((item) =>
          item.href ? (
            <DropdownMenuItem asChild key={item.key}>
              <Link href={item.href}>
                <RailIcon icon={item.icon} />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={item.key}
              onSelect={() => item.panel && onPanel(item.panel)}
            >
              <RailIcon icon={item.icon} />
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useConsoleCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(CONSOLE_KEY) === "1");
    } catch {}
  }, []);
  // `persist: false` for automatic opens, which shouldn't change the
  // viewer's preference (and may run during render).
  function set(next: boolean, persist = true) {
    setCollapsed(next);
    if (!persist) return;
    try {
      localStorage.setItem(CONSOLE_KEY, next ? "1" : "0");
    } catch {}
  }
  return [collapsed, set] as const;
}

function WideBody({
  statement,
  editor,
}: {
  statement: ReactNode;
  editor: ReactNode;
}) {
  const t = useTranslations("Workspace");
  const { maximized, attention } = useWorkspace();
  const [collapsed, setCollapsed] = useConsoleCollapsed();

  // A new run / play / submission result pulls the console open.
  const [seen, setSeen] = useState(attention);
  if (seen !== attention) {
    setSeen(attention);
    if (collapsed) setCollapsed(false, false);
  }

  return (
    <ResizablePanelGroup
      autoSaveId={maximized ? undefined : "workspace-columns"}
      className="min-w-0 flex-1"
      direction="horizontal"
    >
      {!maximized && (
        <>
          <ResizablePanel
            defaultSize={40}
            id="statement"
            minSize={25}
            order={1}
          >
            {collapsed ? (
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {statement}
                </div>
                <button
                  className="flex h-9 shrink-0 items-center justify-between border-t px-3 font-semibold text-sm hover:bg-muted"
                  onClick={() => setCollapsed(false)}
                  type="button"
                >
                  {t("Console.title")}
                  <ChevronUp className="size-4" />
                </button>
              </div>
            ) : (
              <ResizablePanelGroup
                autoSaveId="workspace-statement"
                direction="vertical"
              >
                <ResizablePanel
                  className="overflow-y-auto! p-4"
                  defaultSize={70}
                  id="statement-body"
                  minSize={20}
                  order={1}
                >
                  {statement}
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                  className="flex flex-col"
                  defaultSize={30}
                  id="console"
                  minSize={15}
                  order={2}
                >
                  <button
                    className="flex h-9 shrink-0 items-center justify-between border-y px-3 font-semibold text-sm hover:bg-muted"
                    onClick={() => setCollapsed(true)}
                    type="button"
                  >
                    {t("Console.title")}
                    <ChevronDown className="size-4" />
                  </button>
                  <ConsoleBody className="flex min-h-0 flex-1 flex-col p-2" />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}
      <ResizablePanel defaultSize={60} id="editor-side" minSize={35} order={2}>
        <ResizablePanelGroup
          autoSaveId={maximized ? undefined : "workspace-editor"}
          direction="vertical"
        >
          <ResizablePanel
            className="flex min-h-0 flex-col p-2"
            defaultSize={68}
            id="editor"
            minSize={30}
            order={1}
          >
            <div className="min-h-0 flex-1">{editor}</div>
            {maximized && <CompactActions />}
          </ResizablePanel>
          {!maximized && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={32}
                id="bottom"
                minSize={15}
                order={2}
              >
                <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(14rem,0.55fr)] divide-x border-t">
                  <TestCasesPanel />
                  <ActionsPanel />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </ResizablePanel>
      <AiHelpDockPanel order={3} />
    </ResizablePanelGroup>
  );
}

type NarrowView = "statement" | "code" | "results";

function NarrowBody({
  statement,
  editor,
}: {
  statement: ReactNode;
  editor: ReactNode;
}) {
  const t = useTranslations("Workspace.Views");
  const { attention } = useWorkspace();
  const [view, setView] = useState<NarrowView>("statement");

  // Run / play / submit from the Code view: show the result.
  const [seen, setSeen] = useState(attention);
  if (seen !== attention) {
    setSeen(attention);
    setView("results");
  }

  const views: { key: NarrowView; label: string; icon: LucideIcon }[] = [
    { key: "statement", label: t("statement"), icon: FileText },
    { key: "code", label: t("code"), icon: Code2 },
    { key: "results", label: t("results"), icon: ListChecks },
  ];

  return (
    <>
      <div className="min-h-0 flex-1">
        <div
          className={cn(
            "h-full overflow-y-auto p-4",
            view !== "statement" && "hidden",
          )}
        >
          {statement}
        </div>
        {/* Hidden, not unmounted: the one editor keeps its code and undo. */}
        <div
          className={cn(
            "flex h-full flex-col p-2",
            view !== "code" && "hidden",
          )}
        >
          {editor}
        </div>
        <div
          className={cn(
            "flex h-full flex-col gap-3 overflow-y-auto p-2",
            view !== "results" && "hidden",
          )}
        >
          <div className="border">
            <ActionsPanel />
          </div>
          <div className="border">
            <TestCasesPanel />
          </div>
          <div className="border p-2">
            <ConsoleBody className="flex flex-col" />
          </div>
        </div>
      </div>
      <nav className="grid h-14 shrink-0 grid-cols-3 border-t">
        {views.map(({ key, label, icon: Icon }) => (
          <button
            aria-pressed={view === key}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground",
              view === key && "bg-muted text-foreground",
            )}
            key={key}
            onClick={() => setView(key)}
            type="button"
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
