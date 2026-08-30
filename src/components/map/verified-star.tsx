import { cn } from "@/lib/utils";

export function VerifiedStar({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      aria-label={title}
      role="img"
    >
      <path
        fill="#F7931A"
        d="M12 1.6 14.9 8l7.1.8-5.3 4.8 1.5 7L12 17.2 5.8 20.6l1.5-7L2 8.8 9.1 8 12 1.6Z"
      />
      <text
        x="12"
        y="14.2"
        textAnchor="middle"
        fill="#fff"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ₿
      </text>
    </svg>
  );
}

export const VERIFIED_STAR_HTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path fill="#F7931A" stroke="#fff" stroke-width="1.2" d="M12 1.6 14.9 8l7.1.8-5.3 4.8 1.5 7L12 17.2 5.8 20.6l1.5-7L2 8.8 9.1 8 12 1.6Z"/>
  <text x="12" y="14.2" text-anchor="middle" fill="#fff" font-size="8.5" font-weight="700" font-family="ui-sans-serif,system-ui,sans-serif">₿</text>
</svg>`;
