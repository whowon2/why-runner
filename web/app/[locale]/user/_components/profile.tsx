"use client";

import type { User } from "better-auth";
import { Calendar, Camera, Link as LinkIcon, MapPin } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CropImageDialog } from "@/components/crop-image-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useUploadProfileImage } from "@/hooks/use-upload-profile-image";
import { useUserSkills } from "@/hooks/use-user-skills";

export default function Profile({ user }: { user: User }) {
  const t = useTranslations("ProfilePage");
  const { data, isPending } = useProfile(user.id);
  const { data: skills } = useUserSkills(user.id);
  const { mutateAsync: uploadImage, isPending: isUploading } =
    useUploadProfileImage(user.id);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarImageSrc, setAvatarImageSrc] = useState<string | null>(null);
  const [coverImageSrc, setCoverImageSrc] = useState<string | null>(null);

  function readFileAsDataUrl(file: File, onLoaded: (src: string) => void) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      onLoaded(reader.result as string);
    });
    reader.readAsDataURL(file);
  }

  async function handleConfirmUpload(kind: "avatar" | "cover", blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, `${kind}.webp`);
    formData.append("kind", kind);
    try {
      await uploadImage(formData);
      toast(t(kind === "avatar" ? "avatarUpdated" : "coverUpdated"));
    } catch {
      toast(t("uploadFailed"));
    }
  }

  if (isPending) {
    return (
      <Card className="w-full overflow-hidden border-none shadow-md">
        <Skeleton className="h-48 w-full rounded-none" />
        <CardContent className="relative px-6 pb-6">
          <Skeleton className="absolute -top-16 left-6 h-32 w-32 rounded-none border-4 border-background" />
          <div className="mt-20 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    redirect("/auth/signin");
  }

  return (
    <Card className="w-full overflow-hidden border shadow-sm group">
      {/* Cover Image / Gradient Banner */}
      <div className="h-48 w-full relative">
        {data.coverImage ? (
          <Image
            src={data.coverImage}
            alt={t("coverAlt")}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            {/* Optional: Pattern Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[20px_20px]"></div>
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFileAsDataUrl(file, setCoverImageSrc);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-none bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Camera className="h-4 w-4" />
          {t("changeCover")}
        </button>
      </div>

      <CardContent className="relative px-6 pb-8 sm:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Avatar breakout */}
          <div className="relative -mt-16 sm:-mt-20 inline-block shrink-0">
            <div className="rounded-none border-4 border-background bg-background shadow-xl overflow-hidden h-32 w-32 sm:h-40 sm:w-40 relative z-10 transition-transform duration-500 group-hover:scale-105">
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
              className="absolute bottom-1 right-1 z-20 flex h-9 w-9 items-center justify-center rounded-none bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Camera className="h-4 w-4" />
              <span className="sr-only">{t("changeAvatar")}</span>
            </button>
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 rounded-none bg-indigo-500/40 blur-xl -z-10 animate-pulse"></div>
          </div>

          {/* Top Actions (Follow, Edit Profile, etc) can go here */}
          <div className="pt-2 sm:pt-0">
            {/* Stub button space for future "Edit Profile" */}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {/* User Info */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {data.name}
            </h1>
          </div>

          <p className="text-base leading-relaxed max-w-2xl text-foreground/90">
            {data.bio || t("defaultBio")}
          </p>

          {/* User Meta tags */}
          <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-muted-foreground font-medium">
            {data.location && (
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                <MapPin className="w-4 h-4" />
                <span>{data.location}</span>
              </div>
            )}
            {data.website && (
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                <LinkIcon className="w-4 h-4" />
                <span className="text-indigo-500 hover:text-indigo-400">
                  {data.website}
                </span>
              </div>
            )}
            {data.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {t("joined")} {new Date(data.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex gap-8 mt-4 pt-6 border-t">
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl">4</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {t("contests")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl">12</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {t("problems")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-rose-500">
                1st
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {t("globalRank")}
              </span>
            </div>
          </div>

          {/* Skills */}
          {skills &&
            (skills.themeSkills.length > 0 ||
              skills.languageSkills.length > 0) && (
              <div className="flex flex-col gap-4 pt-6 border-t">
                {skills.themeSkills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {t("Skills.themesTitle")}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {skills.themeSkills.map((s) => (
                        <Badge key={s.theme} variant="outline">
                          {s.theme}: {s.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {skills.languageSkills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {t("Skills.languagesTitle")}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {skills.languageSkills.map((s) => (
                        <Badge key={s.language} variant="outline">
                          {s.language}: {s.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </CardContent>

      <CropImageDialog
        isOpen={avatarImageSrc !== null}
        onClose={() => setAvatarImageSrc(null)}
        imageSrc={avatarImageSrc}
        aspect={1}
        cropShape="round"
        title={t("adjustAvatar")}
        onConfirm={(blob) => handleConfirmUpload("avatar", blob)}
      />
      <CropImageDialog
        isOpen={coverImageSrc !== null}
        onClose={() => setCoverImageSrc(null)}
        imageSrc={coverImageSrc}
        aspect={4}
        cropShape="rect"
        title={t("adjustCover")}
        onConfirm={(blob) => handleConfirmUpload("cover", blob)}
      />
    </Card>
  );
}
