import { LEARN_HUB } from "@/domain/nav";
import { HubIndex } from "./hub-index";
import type { CopyKey } from "@/lib/i18n";

const HUB_COPY: Record<string, CopyKey> = {
  conciencia: "learnWhat",
  historia: "navHistoria",
  pulso: "learnToday",
  minado: "learnMine",
  repaso: "learnReview",
};

export function LearnIndex() {
  return <HubIndex kicker="navAprender" items={LEARN_HUB} labels={HUB_COPY} fallbackHash="conciencia" parentHash="aprender" />;
}
