import type { AppLang } from "@/lib/locale";

export type RoadPhase = { id: string; title: string; when: string; items: string[]; checks: string[] };

type RoadCopy = {
  lead: string;
  note: string;
  done: string;
  bar: string[];
  phases: RoadPhase[];
};

const es: RoadCopy = {
  lead: "Hasta el halving de abril de 2028. Lo que ya corre en el VPS salió de esta lista. Queda lo que todavía no se puede señalar con el dedo: nodo propio, identidad sin custodia y cobro en bitcoin.",
  note: "Criterio permanente: se lee el mapa sin cuenta y sin billetera. No se venden cuentas. No se pide documento ni teléfono. Bitácora no custodia fondos.",
  done: "Contacto con acuse, captcha y código CARGA, topes de pines, globo y mapa sin CDN pago, teselas OSM, BTC Map más registro propio, precio y red en secciones distintas, POC semanal fijo al zoom, Instagram solo no verifica, QR de aporte en bitcoin, HTTPS en nip.io, SSH sin root.",
  bar: [
    "Lectura anónima: sin KYC, sin cookie de ads, sin billetera para consultar.",
    "Sin custodia: no se guardan llaves ni sats de terceros.",
    "Verificación pública: código CARGA en una red propia. Lightning (factura o LNURL) es opcional y posterior. Nunca un documento.",
    "Dinero nativo: aportes y pruebas solo en bitcoin (on-chain / Lightning). Nada de tarjetas.",
    "Nodo propio: Umbrel en Colonia alimenta Red cuando está sincronizado. Si está apagado, fallback público y el sitio no cae.",
    "Host que controlamos (VPS Njalla). IPFS / app en Umbrel queda para el tramo al halving. No se exige wallet para el mapa.",
  ],
  phases: [
    {
      id: "q1",
      title: "Q1 · Nodo en casa",
      when: "sep 2026 – ene 2027",
      items: [
        "Encender un Umbrel en Colonia (Bitcoin Core y Mempool) para leer altura de bloque y comisiones en casa.",
      ],
      checks: [
        "Con el Umbrel sincronizado, la altura en Red coincide con el Mempool local (± 1 bloque).",
        "Con el Umbrel apagado, mapa, historia y contacto siguen; Red usa el explorer público.",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Claridad y acceso",
      when: "feb 2027 – jun 2027",
      items: [
        "Bajar el peso del globo, el mapa y las velas en telefonía 4G.",
        "Si una fuente de velas no responde, el gráfico sigue con otra; el resto de la bitácora no se cae.",
      ],
      checks: [
        "En un teléfono con datos, el mapa 2D se usa sin montar el globo 3D.",
        "Cortar Binance no deja el gráfico en blanco (cae a OKX u otra serie).",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identidad sin custodia",
      when: "jul 2027 – nov 2027",
      items: [
        "Altas y valoraciones con perfil público o dirección Lightning como firma, nunca para guardar fondos.",
        "Opcional: factura Lightning de pocos sats al Umbrel para demostrar control de la dirección. Bitácora no retiene el saldo.",
      ],
      checks: [
        "Un pin se verifica con CARGA en X, Nostr, lnk.bio o web; Lightning es extra, no un KYC.",
        "La factura, si existe, se paga a la wallet de la iniciativa y no queda saldo a nombre del visitante.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Cercanía con la red",
      when: "dic 2027 – abr 2028 · halving",
      items: [
        "Comisión de red y próximo bloque leídos del Mempool del Umbrel cuando esté encendido.",
        "Aporte al proyecto con BTCPay (on-chain y Lightning) en el mismo nodo, además del QR estático.",
        "Si una ficha del mapa se sella, es constancia de existencia, no un activo para vender.",
      ],
      checks: [
        "Fees y próximo bloque coinciden con el Mempool local; si el nodo está apagado, salen del fallback público.",
        "El QR / BTCPay cobra en bitcoin, no con tarjeta.",
      ],
    },
  ],
};

const en: RoadCopy = {
  lead: "Through the April 2028 halving. What already runs on the VPS left this list. What remains is what you can still point at as missing: our own node, identity without custody, and bitcoin payments.",
  note: "Standing rule: the map is read with no account and no wallet. We do not sell accounts. No ID or phone. Bitácora does not hold funds.",
  done: "Contact with acknowledgement, captcha and CARGA code, pin caps, globe and map with no paid CDN, OSM tiles, BTC Map plus our register, price and network in separate sections, weekly POC fixed on zoom, Instagram-only does not verify, bitcoin contribute QR, HTTPS on nip.io, SSH with root login disabled.",
  bar: [
    "Anonymous reading: no KYC, no ad cookies, no wallet to browse.",
    "No custody: we do not hold keys or third-party sats.",
    "Public verification: CARGA code on a network you control. Lightning (invoice or LNURL) is optional and later. Never a document.",
    "Native money: contributions and proofs in bitcoin only (on-chain / Lightning). No cards.",
    "Own node: Umbrel in Colonia feeds Network when synced. If it is off, public fallback and the site stays up.",
    "A host we control (Njalla VPS). IPFS / Umbrel app waits for the run-up to the halving. The map never requires a wallet.",
  ],
  phases: [
    {
      id: "q1",
      title: "Q1 · Node at home",
      when: "Sep 2026 – Jan 2027",
      items: [
        "Turn on an Umbrel in Colonia (Bitcoin Core and Mempool) to read block height and fees at home.",
      ],
      checks: [
        "With Umbrel synced, Network height matches the local Mempool (± 1 block).",
        "With Umbrel off, map, history and contact still work; Network uses the public explorer.",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Clarity and access",
      when: "Feb 2027 – Jun 2027",
      items: [
        "Cut globe, map and candle weight on 4G phones.",
        "If one candle source fails, the chart continues on another; the rest of the logbook does not go down.",
      ],
      checks: [
        "On a phone on mobile data, the 2D map is usable without mounting the 3D globe.",
        "If Binance is down, the chart is not blank (it falls to OKX or another series).",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identity without custody",
      when: "Jul 2027 – Nov 2027",
      items: [
        "Listings and ratings with a public profile or Lightning address as a signature, never to hold funds.",
        "Optional: a small Lightning invoice to the Umbrel to prove control of the address. Bitácora does not keep the balance.",
      ],
      checks: [
        "A pin verifies with CARGA on X, Nostr, lnk.bio or a website; Lightning is extra, not KYC.",
        "If an invoice exists, it is paid to the initiative’s wallet and no visitor balance is held.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Closer to the network",
      when: "Dec 2027 – Apr 2028 · halving",
      items: [
        "Network fee and next block from the Umbrel Mempool when it is on.",
        "Project contributions via BTCPay (on-chain and Lightning) on the same node, besides the static QR.",
        "If a map listing is stamped, it is a record of existence, not an asset for sale.",
      ],
      checks: [
        "Fees and next block match the local Mempool; if the node is off, they come from the public fallback.",
        "QR / BTCPay charges in bitcoin, not by card.",
      ],
    },
  ],
};

const pt: RoadCopy = {
  lead: "Até o halving de abril de 2028. O que já corre no VPS saiu desta lista. Fica o que ainda se pode apontar como em falta: nó próprio, identidade sem custódia e cobrança em bitcoin.",
  note: "Critério permanente: lê-se o mapa sem conta e sem carteira. Não se vendem contas. Não se pede documento nem telefone. A Bitácora não custodia fundos.",
  done: "Contato com aviso, captcha e código CARGA, tetos de pins, globo e mapa sem CDN pago, tiles OSM, BTC Map mais registro próprio, preço e rede em seções distintas, POC semanal fixo no zoom, Instagram sozinho não verifica, QR de contribuição em bitcoin, HTTPS em nip.io, SSH sem root.",
  bar: [
    "Leitura anônima: sem KYC, sem cookie de anúncios, sem carteira para consultar.",
    "Sem custódia: não se guardam chaves nem sats de terceiros.",
    "Verificação pública: código CARGA numa rede própria. Lightning (fatura ou LNURL) é opcional e posterior. Nunca um documento.",
    "Dinheiro nativo: contributos e provas só em bitcoin (on-chain / Lightning). Nada de cartões.",
    "Nó próprio: Umbrel em Colonia alimenta Rede quando está sincronizado. Se estiver desligado, fallback público e o sítio não cai.",
    "Host que controlamos (VPS Njalla). IPFS / app no Umbrel fica para o trecho até o halving. O mapa nunca exige carteira.",
  ],
  phases: [
    {
      id: "q1",
      title: "Q1 · Nó em casa",
      when: "set 2026 – jan 2027",
      items: [
        "Ligar um Umbrel em Colonia (Bitcoin Core e Mempool) para ler altura de bloco e comissões em casa.",
      ],
      checks: [
        "Com o Umbrel sincronizado, a altura em Rede coincide com o Mempool local (± 1 bloco).",
        "Com o Umbrel desligado, mapa, história e contato continuam; Rede usa o explorer público.",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Clareza e acesso",
      when: "fev 2027 – jun 2027",
      items: [
        "Baixar o peso do globo, do mapa e das velas em 4G.",
        "Se uma fonte de velas não responder, o gráfico continua com outra; o resto da bitácora não cai.",
      ],
      checks: [
        "Num celular com dados, o mapa 2D usa-se sem montar o globo 3D.",
        "Cortar a Binance não deixa o gráfico em branco (cai para OKX ou outra série).",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identidade sem custódia",
      when: "jul 2027 – nov 2027",
      items: [
        "Altas e avaliações com perfil público ou endereço Lightning como assinatura, nunca para guardar fundos.",
        "Opcional: fatura Lightning de poucos sats no Umbrel para provar o controlo do endereço. A Bitácora não retém o saldo.",
      ],
      checks: [
        "Um pin verifica-se com CARGA em X, Nostr, lnk.bio ou web; Lightning é extra, não um KYC.",
        "A fatura, se existir, paga-se à carteira da iniciativa e não fica saldo em nome do visitante.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Proximidade com a rede",
      when: "dez 2027 – abr 2028 · halving",
      items: [
        "Comissão de rede e próximo bloco lidos do Mempool do Umbrel quando estiver ligado.",
        "Contributo ao projeto com BTCPay (on-chain e Lightning) no mesmo nó, além do QR estático.",
        "Se uma ficha do mapa for selada, é constância de existência, não um ativo para vender.",
      ],
      checks: [
        "Fees e próximo bloco coincidem com o Mempool local; se o nó estiver desligado, vêm do fallback público.",
        "O QR / BTCPay cobra em bitcoin, não com cartão.",
      ],
    },
  ],
};

export const ROADMAP_WEB3: Record<AppLang, RoadCopy> = { es, en, pt };
