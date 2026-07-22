"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CropImageDialog } from "@/components/crop-image-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useUploadProfileImage } from "@/hooks/use-upload-profile-image";
import { useUserSkills } from "@/hooks/use-user-skills";

const COVER_TEXT_SHADOW =
  "[text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_10px_rgba(0,0,0,0.75)]";

const SWATCH_CLASSES = [
  "bg-slate-500",
  "bg-red-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-neutral-300",
];

function FactRow({
  label,
  value,
  onCover,
}: {
  label: string;
  value: ReactNode;
  onCover: boolean;
}) {
  return (
    <div className="flex gap-2 text-sm leading-relaxed">
      <span
        className={`shrink-0 font-semibold text-indigo-400 ${onCover ? COVER_TEXT_SHADOW : ""}`}
      >
        {label}:
      </span>
      <span
        className={`break-words ${onCover ? `text-white/90 ${COVER_TEXT_SHADOW}` : "text-foreground/90"}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Profile({
  userId,
  isOwner,
}: {
  userId: string;
  isOwner: boolean;
}) {
  const t = useTranslations("ProfilePage");
  const { data, isPending } = useProfile(userId);
  const { data: skills } = useUserSkills(userId);
  const { mutateAsync: uploadImage, isPending: isUploading } =
    useUploadProfileImage(userId);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarImageSrc, setAvatarImageSrc] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverImageSrc, setCoverImageSrc] = useState<string | null>(null);
  const [coverDim, setCoverDim] = useState(60);

  function readFileAsDataUrl(file: File, onLoaded: (src: string) => void) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      onLoaded(reader.result as string);
    });
    reader.readAsDataURL(file);
  }

  async function handleConfirmUpload(blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, "avatar.webp");
    formData.append("kind", "avatar");
    try {
      await uploadImage(formData);
      toast(t("avatarUpdated"));
    } catch {
      toast(t("uploadFailed"));
    }
  }

  async function handleConfirmCoverUpload(blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, "cover.webp");
    formData.append("kind", "cover");
    formData.append("dim", String(coverDim));
    try {
      await uploadImage(formData);
      toast(t("coverUpdated"));
    } catch {
      toast(t("uploadFailed"));
    }
  }

  if (isPending) {
    return (
      <Card className="w-full overflow-hidden border-none shadow-md">
        <CardContent className="flex flex-col sm:flex-row gap-6 p-6">
          <Skeleton className="h-32 w-32 rounded-none shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    redirect("/auth/signin");
  }

  const onCover = Boolean(data.coverImage);

  return (
    <Card className="w-full overflow-hidden border shadow-sm group relative isolate">
      {data.coverImage && (
        <>
          <Image
            src={data.coverImage}
            alt={t("coverAlt")}
            fill
            className="object-cover -z-20"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 -z-10 bg-black"
            style={{ opacity: data.coverDim / 100 }}
          />
        </>
      )}
      <CardContent className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
        {/* Avatar / logo block */}
        <div className="relative shrink-0 self-start h-32 w-32 sm:h-40 sm:w-40">
          <div className="rounded-none border-4 border-background bg-background shadow-xl overflow-hidden h-full w-full relative z-10 transition-transform duration-500 group-hover:scale-105">
            <Image
              src={
                data.image ||
                `https://api.dicebear.com/9.x/glass/svg?seed=${data.name}`
              }
              fill
              alt={t("avatarAlt")}
              className="object-cover"
              sizes="(max-width: 768px) 128px, 160px"
            />
          </div>
          {isOwner && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readFileAsDataUrl(file, setAvatarImageSrc);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 z-20 flex h-9 w-9 items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-transform hover:scale-110 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Camera className="h-5 w-5" />
                <span className="sr-only">{t("changeAvatar")}</span>
              </button>
            </>
          )}
          <div className="absolute inset-0 rounded-none bg-indigo-500/40 blur-xl -z-10 animate-pulse"></div>
        </div>

        {/* Fact-row list */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div>
            <h1
              className={`text-2xl font-extrabold tracking-tight ${onCover ? `text-white ${COVER_TEXT_SHADOW}` : "text-foreground"}`}
            >
              {data.name}
            </h1>
            <div
              className={`mt-2 border-t ${onCover ? "border-white/40" : ""}`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FactRow
              onCover={onCover}
              label={t("bio")}
              value={data.bio || t("defaultBio")}
            />
            {data.location && (
              <FactRow
                onCover={onCover}
                label={t("location")}
                value={data.location}
              />
            )}
            {data.website && (
              <FactRow
                onCover={onCover}
                label={t("website")}
                value={<span className="text-indigo-400">{data.website}</span>}
              />
            )}
            {data.createdAt && (
              <FactRow
                onCover={onCover}
                label={t("joined")}
                value={new Date(data.createdAt).toLocaleDateString()}
              />
            )}
            <FactRow onCover={onCover} label={t("contests")} value="4" />
            <FactRow onCover={onCover} label={t("problems")} value="12" />
            {skills && skills.themeSkills.length > 0 && (
              <FactRow
                onCover={onCover}
                label={t("Skills.themesTitle")}
                value={
                  <span className="flex flex-wrap gap-1.5">
                    {skills.themeSkills.map((s) => (
                      <Badge
                        key={s.theme}
                        variant="outline"
                        className={
                          onCover
                            ? `text-white border-white/50 ${COVER_TEXT_SHADOW}`
                            : undefined
                        }
                      >
                        {s.theme}: {s.value}
                      </Badge>
                    ))}
                  </span>
                }
              />
            )}
            {skills && skills.languageSkills.length > 0 && (
              <FactRow
                onCover={onCover}
                label={t("Skills.languagesTitle")}
                value={
                  <span className="flex flex-wrap gap-1.5">
                    {skills.languageSkills.map((s) => (
                      <Badge
                        key={s.language}
                        variant="outline"
                        className={
                          onCover
                            ? `text-white border-white/50 ${COVER_TEXT_SHADOW}`
                            : undefined
                        }
                      >
                        {s.language}: {s.value}
                      </Badge>
                    ))}
                  </span>
                }
              />
            )}
          </div>

          {/* Decorative color-swatch footer */}
          <div
            className={`flex gap-1.5 mt-2 pt-3 border-t ${onCover ? "border-white/40" : ""}`}
          >
            {SWATCH_CLASSES.map((cls) => (
              <span
                key={cls}
                className={`h-4 w-4 rounded-none ${cls}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </CardContent>

      {isOwner && (
        <>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCoverDim(data.coverDim ?? 60);
                readFileAsDataUrl(file, setCoverImageSrc);
              }
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => coverInputRef.current?.click()}
            className={`absolute bottom-3 left-3 z-20 flex h-9 w-9 items-center justify-center transition-transform hover:scale-110 disabled:opacity-50 disabled:pointer-events-none ${onCover ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" : "text-foreground"}`}
          >
            <Camera className="h-5 w-5" />
            <span className="sr-only">{t("changeCover")}</span>
          </button>

          <CropImageDialog
            isOpen={avatarImageSrc !== null}
            onClose={() => setAvatarImageSrc(null)}
            imageSrc={avatarImageSrc}
            aspect={1}
            cropShape="round"
            title={t("adjustAvatar")}
            onConfirm={handleConfirmUpload}
          />

          <CropImageDialog
            isOpen={coverImageSrc !== null}
            onClose={() => setCoverImageSrc(null)}
            imageSrc={coverImageSrc}
            aspect={16 / 9}
            cropShape="rect"
            title={t("adjustCover")}
            onConfirm={handleConfirmCoverUpload}
            extraControls={
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cover-dim"
                  className="text-xs text-muted-foreground"
                >
                  {t("coverDim")}
                </label>
                <input
                  id="cover-dim"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={coverDim}
                  onChange={(e) => setCoverDim(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            }
          />
        </>
      )}
    </Card>
  );
}
