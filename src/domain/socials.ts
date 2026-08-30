export const SOCIAL_KEYS = [
  "web",
  "x",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "telegram",
  "whatsapp",
  "discord",
  "nostr",
  "linkedin",
  "snapchat",
  "twitch",
  "github",
] as const;

export type SocialKey = (typeof SOCIAL_KEYS)[number];

export type SocialLink = { key: SocialKey; label: string; url: string };

export const SOCIALS: { key: SocialKey; label: string; hint: string }[] = [
  { key: "web", label: "Web / bio", hint: "https://…" },
  { key: "x", label: "X", hint: "@usuario o URL" },
  { key: "instagram", label: "Instagram", hint: "@usuario" },
  { key: "facebook", label: "Facebook", hint: "URL de la página" },
  { key: "tiktok", label: "TikTok", hint: "@usuario" },
  { key: "youtube", label: "YouTube", hint: "@canal o URL" },
  { key: "telegram", label: "Telegram", hint: "@canal" },
  { key: "whatsapp", label: "WhatsApp", hint: "5989…" },
  { key: "discord", label: "Discord", hint: "Invite o URL" },
  { key: "nostr", label: "Nostr", hint: "npub… o URL" },
  { key: "linkedin", label: "LinkedIn", hint: "URL" },
  { key: "snapchat", label: "Snapchat", hint: "usuario" },
  { key: "twitch", label: "Twitch", hint: "usuario" },
  { key: "github", label: "GitHub", hint: "usuario" },
];

function safeUrl(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

function handle(raw: string) {
  return raw.trim().replace(/^@/, "");
}

export function urlFor(key: SocialKey, raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v) || v.includes(".")) {
    if (key === "nostr" && v.startsWith("npub")) return `https://njump.me/${v}`;
    return safeUrl(v);
  }
  const h = handle(v);
  switch (key) {
    case "x":
      return `https://x.com/${h}`;
    case "instagram":
      return `https://instagram.com/${h}`;
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "youtube":
      return `https://www.youtube.com/@${h}`;
    case "telegram":
      return `https://t.me/${h}`;
    case "whatsapp":
      return `https://wa.me/${h.replace(/\D/g, "")}`;
    case "snapchat":
      return `https://www.snapchat.com/add/${h}`;
    case "twitch":
      return `https://www.twitch.tv/${h}`;
    case "github":
      return `https://github.com/${h}`;
    case "facebook":
      return `https://www.facebook.com/${h}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${h}`;
    case "discord":
      return `https://discord.gg/${h}`;
    case "nostr":
      return `https://njump.me/${h.replace(/^nostr:/, "")}`;
    default:
      return safeUrl(v);
  }
}

export function linksFromPicked(picked: SocialKey[], handles: Partial<Record<SocialKey, string>>): SocialLink[] {
  const rows: SocialLink[] = [];
  for (const key of picked) {
    const url = urlFor(key, handles[key] || "");
    if (!url) continue;
    const label = SOCIALS.find((s) => s.key === key)?.label || key;
    rows.push({ key, label, url });
  }
  return rows;
}

export function keyFromUrl(url: string): SocialKey {
  const u = url.toLowerCase();
  if (u.includes("x.com") || u.includes("twitter.com")) return "x";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("facebook.com")) return "facebook";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("t.me") || u.includes("telegram.")) return "telegram";
  if (u.includes("wa.me") || u.includes("whatsapp")) return "whatsapp";
  if (u.includes("discord")) return "discord";
  if (u.includes("njump.me") || u.includes("nostr")) return "nostr";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("snapchat.com")) return "snapchat";
  if (u.includes("twitch.tv")) return "twitch";
  if (u.includes("github.com")) return "github";
  return "web";
}
