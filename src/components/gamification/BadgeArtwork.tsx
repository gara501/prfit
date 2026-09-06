import Image from "next/image";
import type { StreakLevel } from "@/lib/gamification/streak";
import { cn } from "@/lib/utils";

export function BadgeArtwork({
  level,
  unlocked = true,
  priority = false,
  className,
}: {
  level: StreakLevel;
  unlocked?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-square shrink-0 overflow-hidden",
        !unlocked && "grayscale opacity-30",
        className,
      )}
    >
      <Image
        alt=""
        className="object-contain"
        fill
        priority={priority}
        sizes="(max-width: 640px) 144px, 192px"
        src={level.imagePath}
      />
    </div>
  );
}
