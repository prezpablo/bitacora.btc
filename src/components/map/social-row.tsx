import { keyFromUrl, SOCIALS, type SocialKey } from "@/domain/socials";
import { useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function Glyph({ k }: { k: SocialKey }) {
  const p = { fill: "currentColor", viewBox: "0 0 24 24", className: "size-3.5", "aria-hidden": true as const };
  switch (k) {
    case "x":
      return (
        <svg {...p}>
          <path d="M18.2 3H21l-6.5 7.4L22 21h-6.2l-4.3-5.6L6.4 21H3.6l7-8L2 3h6.3l3.9 5.2L18.2 3Zm-1.1 16.2h1.7L7 4.7H5.2l11.9 14.5Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...p}>
          <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm9.2 1.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...p}>
          <path d="M14.2 21v-7.2h2.4l.4-2.8h-2.8V9.3c0-.8.2-1.4 1.4-1.4H17V5.4A19 19 0 0 0 14.5 5c-2.4 0-4 1.5-4 4.2v1.8H8v2.8h2.5V21h3.7Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...p}>
          <path d="M14.2 3h2.3c.2 2 1.4 3.6 3.5 4v2.4c-1.2 0-2.3-.3-3.3-.9v6.7A6.3 6.3 0 1 1 9.2 9c.2 0 .5 0 .7.1v2.5A3.8 3.8 0 1 0 14.2 15V3Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...p}>
          <path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.3 5.4 12 5.4 12 5.4s-7.3 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.5.4 8.8.4 8.8.4s7.3 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM9.8 15.6V8.8l6.2 3.4-6.2 3.4Z" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...p}>
          <path d="M21.5 4.4 18.7 20c-.2 1-1.2 1.3-2 .8l-5.5-4.1-2.6 2.5c-.3.3-.8.1-.9-.3l-.7-5.8L3 11.2c-1-.3-1-1.7.1-2l17-6.8c.9-.4 1.8.5 1.4 2Z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...p}>
          <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.32 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.04c5.46 0 9.89-4.4 9.89-9.83C21.97 6.4 17.5 2 12.04 2Zm5.75 14.09c-.24.68-1.39 1.3-1.93 1.38-.49.08-1.1.11-1.77-.11-.41-.13-.93-.3-1.62-.59-2.85-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.36.24-.26.64-.41.95-.41h.68c.22 0 .51-.02.78.6.28.64.95 2.22 1.03 2.38.08.16.14.35-.06.56l-.45.52c-.2.23-.41.41-.18.8.23.4.9 1.48 1.93 2.4 1.33 1.18 2.45 1.55 2.8 1.73.35.17.55.15.76-.09.2-.24.87-.99 1.1-1.33.23-.34.47-.28.78-.16.32.11 2 .94 2.35 1.11.10.0.1.2.47.38.11.18.11.67-.13 1.35Z" />
        </svg>
      );
    case "discord":
      return (
        <svg {...p}>
          <path d="M19.3 5.2A18 18 0 0 0 14.8 4l-.4.8a16 16 0 0 1 3.6 1.4 13 13 0 0 0-13 0A16 16 0 0 1 8.6 4L8.2 4a18 18 0 0 0-4.5 1.2C1.3 9.3.6 13.3.9 17.2A18 18 0 0 0 6.5 20l.8-1.3a12 12 0 0 1-1.9-1l.2-.1c3.6 1.6 7.5 1.6 11 0l.3.1c-.6.4-1.2.8-1.9 1l.8 1.3a18 18 0 0 0 5.6-2.8c.4-4.5-.6-8.4-2.1-12ZM8.3 14.6c-1 0-1.9-1-1.9-2.1 0-1.2.8-2.2 1.9-2.2s2 1 1.9 2.2c0 1.2-.8 2.1-1.9 2.1Zm7.4 0c-1.1 0-2-1-2-2.1 0-1.2.9-2.2 2-2.2s1.9 1 1.9 2.2c0 1.2-.8 2.1-1.9 2.1Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...p}>
          <path d="M6.5 9H4V20h2.5V9ZM5.2 4A1.6 1.6 0 1 0 5.3 7.2 1.6 1.6 0 0 0 5.2 4ZM20 20h-2.5v-5.6c0-1.6-.6-2.5-1.8-2.5-1 0-1.5.7-1.8 1.4-.1.2-.1.6-.1.9V20H11V9h2.5v1.5c.5-.8 1.5-2 3.6-2 2.5 0 4 1.6 4 5.1V20Z" />
        </svg>
      );
    case "github":
      return (
        <svg {...p}>
          <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.2-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.5.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7 1 .7 2v2.3c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
        </svg>
      );
    case "twitch":
      return (
        <svg {...p}>
          <path d="M4 3 3 6.5V19h4v3h2.2L12.4 19H16l5-5V3H4Zm15 10-2.5 2.5H13l-3.2 3v-3H7V5h12v8Zm-2.5-5.5h-2V12h2V7.5Zm-5 0h-2V12h2V7.5Z" />
        </svg>
      );
    case "snapchat":
      return (
        <svg {...p}>
          <path d="M12 3c2.4 0 4.4 1.7 4.4 5 0 1.2.2 1.9.7 2.3.3.3.8.3 1.2.4.4 0 .8.2.8.6 0 .6-1.1 1-1.7 1.2-.2.1-.3.2-.2.4.3 1 1.4 2.2 2.5 2.6.3.1.4.3.3.6-.2.5-1 .7-1.5.8-.3 0-.4.1-.4.4 0 1.3-2.3 2.7-6.1 2.7S5.9 20.6 5.9 19.3c0-.3-.1-.4-.4-.4-.5-.1-1.3-.3-1.5-.8-.1-.3 0-.5.3-.6 1.1-.4 2.2-1.6 2.5-2.6.1-.2 0-.3-.2-.4C6 12.3 4.9 11.9 4.9 11.3c0-.4.4-.6.8-.6.4-.1.9-.1 1.2-.4.5-.4.7-1.1.7-2.3C7.6 4.7 9.6 3 12 3Z" />
        </svg>
      );
    case "nostr":
      return (
        <svg {...p}>
          <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 2.3 5.5 3.1v1.8L12 7.2 6.5 10.4V8.6L12 5.3Zm-5.5 6.1L12 8.5l5.5 2.9v.9L12 15.2 6.5 12.3v-.9Zm0 3.3L12 17.6l5.5-2.9v1.7L12 19l-5.5-3.1v-1.2Z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M10.6 13.4a5 5 0 0 1 0-7.1l2.1-2.1a5 5 0 0 1 7.1 7.1l-1.2 1.2-1.4-1.4 1.2-1.2a3 3 0 1 0-4.2-4.2l-2.1 2.1a3 3 0 0 0 0 4.2l-1.5 1.4Zm2.8-2.8a5 5 0 0 1 0 7.1l-2.1 2.1a5 5 0 1 1-7.1-7.1l1.2-1.2 1.4 1.4-1.2 1.2a3 3 0 1 0 4.2 4.2l2.1-2.1a3 3 0 0 0 0-4.2l1.5-1.4Z" />
        </svg>
      );
  }
}

export function SocialRow({ links }: { links: { label: string; url: string; key?: string }[] }) {
  if (!links.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {links.map((l) => {
        const k = (l.key as SocialKey) || keyFromUrl(l.url);
        return (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            title={l.label}
            aria-label={l.label}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md text-primary no-underline",
              "transition-opacity hover:opacity-80",
            )}
          >
            <Glyph k={k} />
          </a>
        );
      })}
    </div>
  );
}

export function SocialPicker({
  picked,
  handles,
  onToggle,
  onHandle,
}: {
  picked: SocialKey[];
  handles: Partial<Record<SocialKey, string>>;
  onToggle: (k: SocialKey) => void;
  onHandle: (k: SocialKey, v: string) => void;
}) {
  const t = useT();
  const hints: Record<SocialKey, CopyKey> = {
    web: "hintWeb",
    x: "hintX",
    instagram: "hintIg",
    facebook: "hintFb",
    tiktok: "hintTt",
    youtube: "hintYt",
    telegram: "hintTg",
    whatsapp: "hintWa",
    discord: "hintDc",
    nostr: "hintNostr",
    linkedin: "hintLi",
    snapchat: "hintSnap",
    twitch: "hintTwitch",
    github: "hintGh",
  };
  return (
    <div className="space-y-2">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("fldSocials")}</p>
      <div className="flex flex-wrap gap-1">
        {SOCIALS.map((s) => {
          const on = picked.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onToggle(s.key)}
              className={cn(
                "h-8 rounded-full px-2.5 text-xs",
                on ? "bg-primary text-white" : "bg-elevated text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {picked.map((k) => {
        const s = SOCIALS.find((x) => x.key === k);
        if (!s) return null;
        return (
          <input
            key={k}
            className="h-10 w-full rounded-md bg-elevated px-3 text-sm shadow-[var(--shadow-border)]"
            placeholder={`${s.label}: ${t(hints[k])}`}
            value={handles[k] || ""}
            onChange={(e) => onHandle(k, e.target.value)}
          />
        );
      })}
    </div>
  );
}
