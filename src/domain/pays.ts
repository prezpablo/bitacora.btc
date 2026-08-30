export const PAY_KEYS = ["onchain", "lightning", "nfc"] as const;
export type PayKey = (typeof PAY_KEYS)[number];

export const PAYS: { key: PayKey; label: string; labelEn: string; labelPt: string }[] = [
  { key: "onchain", label: "On-chain", labelEn: "On-chain", labelPt: "On-chain" },
  { key: "lightning", label: "Lightning", labelEn: "Lightning", labelPt: "Lightning" },
  { key: "nfc", label: "Sin contacto", labelEn: "Contactless", labelPt: "Sem contato" },
];
