"use client";

import { Copy, Download, FileJson, Loader, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useImportProblems } from "@/hooks/use-import-problems";
import {
  IMPORT_FIELDS,
  IMPORT_TEMPLATE,
  type ImportIssue,
  type ParseImportResult,
  parseImportPayload,
} from "@/lib/problem-import/schema";

const TEMPLATE_JSON = JSON.stringify(IMPORT_TEMPLATE, null, 2);
const MAX_SHOWN_ERRORS = 50;

type Validation =
  | { kind: "empty" }
  | { kind: "syntax"; message: string }
  | ({ kind: "parsed" } & ParseImportResult);

function validate(text: string): Validation {
  if (!text.trim()) return { kind: "empty" };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    return {
      kind: "syntax",
      message: err instanceof Error ? err.message : String(err),
    };
  }
  return { kind: "parsed", ...parseImportPayload(data) };
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_JSON], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "whyrunner-problems-template.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportProblems() {
  const t = useTranslations("ImportProblems");
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("upload");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [debouncedText, setDebouncedText] = useState("");
  const [serverErrors, setServerErrors] = useState<ImportIssue[] | null>(null);
  const importMutation = useImportProblems();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedText(text), 300);
    return () => clearTimeout(id);
  }, [text]);

  const validation = useMemo(() => validate(debouncedText), [debouncedText]);
  const isStale = text !== debouncedText;
  const problems =
    validation.kind === "parsed" && validation.ok ? validation.problems : null;
  const errors =
    serverErrors ??
    (validation.kind === "parsed" && !validation.ok ? validation.errors : []);

  function reset() {
    setText("");
    setDebouncedText("");
    setFileName(null);
    setServerErrors(null);
    setTab("upload");
    if (fileRef.current) fileRef.current.value = "";
  }

  function updateText(value: string) {
    setText(value);
    setServerErrors(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setFileName(file.name);
    updateText(content);
    // Validate immediately instead of waiting for the debounce.
    setDebouncedText(content);
  }

  async function copyTemplate() {
    await navigator.clipboard.writeText(TEMPLATE_JSON);
    toast.success(t("copied"));
  }

  function handleImport() {
    if (!problems) return;
    importMutation.mutate(JSON.parse(debouncedText), {
      onSuccess: (result) => {
        if (!result.ok) {
          setServerErrors(result.errors);
          return;
        }
        toast.success(t("success", { count: result.count }));
        setOpen(false);
        reset();
      },
      onError: (err) => {
        toast.error(t("failed"), {
          description: err instanceof Error ? err.message : undefined,
        });
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (importMutation.isPending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="min-w-0">
          <TabsList>
            <TabsTrigger value="upload">{t("tabs.upload")}</TabsTrigger>
            <TabsTrigger value="paste">{t("tabs.paste")}</TabsTrigger>
            <TabsTrigger value="format">{t("tabs.format")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <FileJson className="size-8" />
              <span>{fileName ?? t("chooseFile")}</span>
            </button>
            <Button
              variant="link"
              size="sm"
              className="self-start px-0"
              onClick={downloadTemplate}
            >
              <Download />
              {t("downloadTemplate")}
            </Button>
          </TabsContent>

          <TabsContent value="paste">
            <Textarea
              value={text}
              onChange={(e) => {
                setFileName(null);
                updateText(e.target.value);
              }}
              placeholder={t("pastePlaceholder")}
              spellCheck={false}
              className="font-mono text-xs min-h-48 max-h-80"
            />
          </TabsContent>

          <TabsContent value="format" className="flex flex-col gap-4 min-w-0">
            <p className="text-sm text-muted-foreground">{t("formatIntro")}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.name")}</TableHead>
                  <TableHead>{t("fields.type")}</TableHead>
                  <TableHead>{t("fields.details")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {IMPORT_FIELDS.map((field) => (
                  <TableRow key={field.name}>
                    <TableCell className="align-top font-mono text-xs">
                      {field.name}
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top font-mono text-xs whitespace-nowrap">
                      {field.type}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal text-xs">
                      <p>{t(`fieldDocs.${field.name}`)}</p>
                      {field.default !== undefined && (
                        <p className="text-muted-foreground">
                          {t("fields.default")}:{" "}
                          <code className="font-mono">{field.default}</code>
                        </p>
                      )}
                      {field.values && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {field.values.map((v) => (
                            <Badge
                              key={v}
                              variant="secondary"
                              className="font-mono text-[10px]"
                            >
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> {t("requiredNote")}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("example")}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyTemplate}>
                  <Copy />
                  {t("copy")}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download />
                  {t("downloadTemplate")}
                </Button>
              </div>
            </div>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
              {TEMPLATE_JSON}
            </pre>
          </TabsContent>
        </Tabs>

        {tab !== "format" && (
          <ImportPreview
            validation={validation}
            errors={errors}
            showServerErrors={serverErrors !== null}
          />
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={importMutation.isPending}
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            disabled={
              !problems ||
              isStale ||
              serverErrors !== null ||
              importMutation.isPending
            }
            onClick={handleImport}
          >
            {importMutation.isPending ? (
              <Loader className="animate-spin" />
            ) : (
              <Upload />
            )}
            {problems
              ? t("importCount", { count: problems.length })
              : t("importButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportPreview({
  validation,
  errors,
  showServerErrors,
}: {
  validation: Validation;
  errors: ImportIssue[];
  showServerErrors: boolean;
}) {
  const t = useTranslations("ImportProblems");

  if (validation.kind === "empty") return null;

  if (validation.kind === "syntax") {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
        <p className="font-medium text-destructive">{t("invalidJson")}</p>
        <p className="font-mono text-xs">{validation.message}</p>
      </div>
    );
  }

  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_SHOWN_ERRORS);
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
        <p className="mb-2 font-medium text-destructive">
          {showServerErrors
            ? t("serverRejected")
            : t("errorCount", { count: errors.length })}
        </p>
        <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto font-mono text-xs">
          {shown.map((err, i) => (
            <li key={i}>{formatIssue(err)}</li>
          ))}
        </ul>
        {errors.length > shown.length && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("moreErrors", { count: errors.length - shown.length })}
          </p>
        )}
      </div>
    );
  }

  if (!validation.ok) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {t("previewTitle", { count: validation.problems.length })}
      </p>
      <div className="max-h-60 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("preview.title")}</TableHead>
              <TableHead>{t("preview.difficulty")}</TableHead>
              <TableHead>{t("preview.tests")}</TableHead>
              <TableHead>{t("preview.examples")}</TableHead>
              <TableHead>{t("preview.tags")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validation.problems.map((p, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="max-w-56 truncate">{p.title}</TableCell>
                <TableCell>{p.difficulty ?? "—"}</TableCell>
                <TableCell>{p.inputs.length}</TableCell>
                <TableCell>{p.exampleCount}</TableCell>
                <TableCell className="max-w-48 truncate font-mono text-xs">
                  {p.tags.join(", ") || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatIssue(issue: ImportIssue): string {
  const location = [
    issue.index !== undefined ? `#${issue.index + 1}` : null,
    issue.title ? JSON.stringify(issue.title) : null,
  ]
    .filter(Boolean)
    .join(" ");
  const target = issue.field ? `${issue.field}: ` : "";
  return location
    ? `${location} → ${target}${issue.message}`
    : `${target}${issue.message}`;
}
