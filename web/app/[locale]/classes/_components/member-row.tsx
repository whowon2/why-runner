import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type RosterMember = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  ra?: string | null;
};

/** "Beatriz Lima" → "BL", "user" → "US". */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2)
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

export function MemberAvatar({
  member,
  className,
}: {
  member: RosterMember;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8 shrink-0", className)}>
      {member.image && <AvatarImage alt="" src={member.image} />}
      <AvatarFallback className="text-[10px]">
        {initials(member.name)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * One roster line: avatar, name, @username, RA and an optional badge. With
 * `onOpen` the identity part is a button (opens the student panel),
 * otherwise a link to the member's profile. The actions sit inside the same
 * highlighted row so they read as its own.
 */
export function MemberRow({
  member,
  badge,
  actions,
  onOpen,
}: {
  member: RosterMember;
  badge?: ReactNode;
  actions?: ReactNode;
  onOpen?: () => void;
}) {
  const identity = (
    <>
      <MemberAvatar member={member} />
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{member.name}</span>
          {badge}
        </span>
        <span className="text-muted-foreground flex min-w-0 flex-wrap gap-x-2 text-xs">
          <span className="truncate">@{member.username}</span>
          {member.ra && <span className="font-mono">{member.ra}</span>}
        </span>
      </span>
    </>
  );

  return (
    <li className="hover:bg-muted/50 flex items-center gap-2 px-2 py-2 transition-colors">
      {onOpen ? (
        <button
          className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 rounded-sm text-left outline-none focus-visible:ring-[3px]"
          onClick={onOpen}
          type="button"
        >
          {identity}
        </button>
      ) : (
        <Link
          className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 rounded-sm outline-none focus-visible:ring-[3px]"
          href={`/user/${member.username}`}
        >
          {identity}
        </Link>
      )}
      {actions}
    </li>
  );
}
