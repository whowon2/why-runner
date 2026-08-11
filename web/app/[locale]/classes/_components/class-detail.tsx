"use client";

import { Copy, Lock, School } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useClass } from "@/hooks/use-class";
import { useClassTracks } from "@/hooks/use-tracks";
import { CreateTrackButton } from "./create-track-button";
import { EditClassDialog } from "./edit-class-dialog";

export function ClassDetail({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const tTracks = useTranslations("TracksPage");
  const { data: classData, isPending: isClassPending } = useClass(classroomId);
  const { data: tracks, isPending: isTracksPending } =
    useClassTracks(classroomId);

  if (isClassPending) return <Skeleton className="h-32 w-full" />;
  if (!classData) return null;

  const { classroom, isOwner, memberCount, members } = classData;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        action={
          isOwner ? (
            <>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(classroom.joinCode);
                  toast.success(t("codeCopied"));
                }}
                variant="outline"
              >
                <Copy className="size-4" />
                {t("joinCode")}: {classroom.joinCode}
              </Button>
              <EditClassDialog
                classroomId={classroomId}
                name={classroom.name}
              />
              <CreateTrackButton classroomId={classroomId} />
            </>
          ) : undefined
        }
        icon={School}
        subtitle={t("memberCount", { count: memberCount })}
        title={classroom.name}
      />

      {isOwner && (
        <Card className="bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{t("students")}</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("noStudentsYet")}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {members.map((m) => (
                  <li key={m.id}>
                    <Link
                      className="text-sm hover:underline"
                      href={`/user/${m.username}`}
                    >
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {isTracksPending ? (
        <Skeleton className="h-24 w-full" />
      ) : !tracks || tracks.length === 0 ? (
        <p className="text-muted-foreground">{tTracks("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tracks.map((track) => (
            <Link href={`/roadmap/${track.id}`} key={track.id}>
              <Card className="h-full bg-muted/30 transition-colors hover:bg-muted/60">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-lg">
                    {track.title}
                    {!track.isPublished && (
                      <Badge variant="outline">
                        <Lock className="size-3" />
                        {tTracks("unpublished")}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                {track.description && (
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {track.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
