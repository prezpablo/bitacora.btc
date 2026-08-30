import { PAYS, type PayKey } from "@/domain/pays";
import { useT, type CopyKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PAY_COPY: Record<PayKey, CopyKey> = {
  onchain: "payOnchain",
  lightning: "payLightning",
  nfc: "payNfc",
};

function PayGlyph({ k }: { k: PayKey }) {
  const p = { fill: "currentColor", viewBox: "0 0 24 24", className: "size-4", "aria-hidden": true as const };
  if (k === "lightning") {
    return (
      <svg {...p}>
        <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
      </svg>
    );
  }
  if (k === "nfc") {
    return (
      <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 8c2.2 2.2 2.2 5.8 0 8" />
        <path d="M11 5.5c3.6 3.6 3.6 9.4 0 13" />
        <path d="M14 3c5 5 5 13 0 18" />
        <circle cx="6.2" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return <span className="text-[15px] font-bold leading-none">₿</span>;
}

export function PayMark({ k, title }: { k: PayKey; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-white"
    >
      <PayGlyph k={k} />
    </span>
  );
}

export function PayRow({ methods }: { methods: PayKey[] }) {
  const t = useT();
  if (!methods.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PAYS.filter((p) => methods.includes(p.key)).map((p) => (
        <span key={p.key} className="inline-flex items-center gap-2 text-sm">
          <PayMark k={p.key} title={t(PAY_COPY[p.key])} />
          <span>{t(PAY_COPY[p.key])}</span>
        </span>
      ))}
    </div>
  );
}

export function PayPicker({
  value,
  onChange,
}: {
  value: PayKey[];
  onChange: (next: PayKey[]) => void;
}) {
  const t = useT();
  function toggle(k: PayKey) {
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{t("fldPay")}</p>
      {PAYS.map((p) => {
        const on = value.includes(p.key);
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => toggle(p.key)}
            className="flex w-full items-center gap-3 rounded-md px-1 py-1 text-left text-sm"
          >
            <span
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-sm border",
                on ? "border-primary bg-primary" : "border-foreground/30 bg-card",
              )}
            >
              {on ? <span className="block size-2 rounded-[1px] bg-white" /> : null}
            </span>
            <PayMark k={p.key} />
            <span>{t(PAY_COPY[p.key])}</span>
          </button>
        );
      })}
    </div>
  );
}
