import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SocialAvatar = {
  name: string;
  imageUrl: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SocialProofSection() {
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");

  const avatars: SocialAvatar[] = [
    { name: "Clara Martin", imageUrl: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Noah Petit", imageUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Lea Robert", imageUrl: "https://randomuser.me/api/portraits/women/68.jpg" },
    { name: "Adam Garcia", imageUrl: "https://randomuser.me/api/portraits/men/46.jpg" },
    { name: "Nina Lopez", imageUrl: "https://randomuser.me/api/portraits/women/33.jpg" },
    { name: "Tom Leroy", imageUrl: "https://randomuser.me/api/portraits/men/22.jpg" },
    { name: "Sarah Dubois", imageUrl: "https://randomuser.me/api/portraits/women/17.jpg" },
    { name: "Yanis Morel", imageUrl: "https://randomuser.me/api/portraits/men/60.jpg" },
  ];

  const line = isFr
    ? "170+ professionnels l'utilisent déjà"
    : "170+ professionals already using it";

  return (
    <section className="relative z-10 px-4 pt-0 pb-0">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-0 sm:flex-row sm:justify-center sm:gap-4">
        <p className="text-center text-xs font-medium text-foreground/70 sm:text-left sm:text-sm">
          {line}
        </p>

        <div className="flex -space-x-2">
          {avatars.map((avatar, index) => (
            <Avatar
              key={avatar.name}
              className="h-8 w-8 border-2 border-background shadow-sm sm:h-9 sm:w-9"
              style={{ zIndex: avatars.length - index }}
            >
              <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
              <AvatarFallback>{getInitials(avatar.name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </section>
  );
}
