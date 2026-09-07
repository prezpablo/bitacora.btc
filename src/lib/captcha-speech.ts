export function spokenCode(code: string) {
  return (code || "").toUpperCase().split("").join(". ");
}

export function speechLang(lang: string) {
  if (lang === "en") return "en-US";
  if (lang === "pt") return "pt-BR";
  return "es-UY";
}

export function speakChallenge(code: string, lang: string, synth?: SpeechSynthesis | null) {
  const engine = synth ?? (typeof window !== "undefined" ? window.speechSynthesis : null);
  if (!engine || !code) return false;
  engine.cancel();
  const text = spokenCode(code);
  const utter =
    typeof SpeechSynthesisUtterance === "function"
      ? new SpeechSynthesisUtterance(text)
      : ({ text, lang: "", rate: 1 } as SpeechSynthesisUtterance);
  utter.lang = speechLang(lang);
  utter.rate = 0.7;
  engine.speak(utter);
  return true;
}
