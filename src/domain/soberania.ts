import type { AppLang } from "@/lib/locale";

export type SovBlock = { title: string; body: string };

const es: { lead: string; gmail: string; blocks: SovBlock[] } = {
  lead: "Propuesta para acercar Bitácora.btc al arquetipo bitcoiner sin tirar la estética (blanco, naranja Bitcoin, bitcoin.org). El mapa, la historia y el QR se quedan. Se recorta dependencia, no el diseño.",
  gmail: "No aplicamos la API de Gmail. Meter OAuth de Google en el sitio es lo contrario de soberanía: KYC de Google, ToS, y un interruptor en Mountain View. El buzón de Latam Cripto Mom puede seguir siendo Gmail —eso es decisión del operador, no del visitante—. El sitio no debe hablar la API de Google. Contacto: relé sin Google (Web3Forms/SMTP propio) o, mejor, npub Nostr / lightning:. El mail llega a la casilla; Google no entra al código.",
  blocks: [
    {
      title: "Qué no se toca (estética y relato)",
      body: "Tipografía, naranja Bitcoin, globo de primera visita, mapa Leaflet, fichas, historia, i18n ES/PT/EN, QR de contribución, Consciencia Bitcoin. El visitante sigue viendo la misma bitácora. El globo y Mercado pasan a ser opt-in (modo ligero por defecto en redes lentas), no se eliminan.",
    },
    {
      title: "Dónde hospedar",
      body: "Tres capas, no un único AWS. 1) Lectura soberana: build estático del front (mapa + historia + conciencia) pinneado en IPFS (nodo propio, o Pinata/web3.storage como muleta) y un CID publicado. 2) Conveniencia: el mismo build en un VPS chico fuera de Big Tech (Njalla, FlokiNET, o un nodo Umbrel/Start9 en Colonia) con el dominio actual. 3) Espejo .onion cuando el estático esté limpio. GitHub queda como backup de código, no como único origen. Si cae el VPS, el CID de IPFS sigue sirviendo la bitácora.",
    },
    {
      title: "Cómo es soberana de verdad",
      body: "Soberana para el visitante = leer sin cuenta, sin pixel, sin KYC. Soberana para el operador = poder publicar un mirror sin pedir permiso a GitHub ni a Gmail. Eso exige: front estático + CSV clonable + QR on-chain/LN. Las server functions (velas, Nominatim, scrape) son un BFF opcional: si mueren, el sitio no muere, solo se apaga Mercado y la geocodificación. El CSV se firma (commit GPG o evento Nostr) para que un mirror no mienta.",
    },
    {
      title: "Cambios concretos, sin rediseñar",
      body: "Modo ligero: sin Three.js ni heat hasta que el usuario los pida. Contacto: email opcional; campo npub o lightning address. Contribución: mismo QR + URI bitcoin: y lightning: debajo, sin procesador. Login nunca; si hay firma, BIP-322 o nota Nostr, no Google. Eventos: el tablero propio primero, Luma como enlace, no como dueño. IP del rate-limit se hashea y se caduca. Cero Firebase en el bundle de producción.",
    },
    {
      title: "Pagos",
      body: "Única pasarela: Bitcoin. Corto plazo: URI bitcoin: del QR actual + LNURL/BTCPay (self-host o Blink) para sats chicos. Nada de Gmail Pay, Stripe ni Mercado Pago. El sitio no custodia.",
    },
    {
      title: "Orden de aplicación",
      body: "A) No Gmail API. B) Modo ligero + URIs de pago en el QR (se ve igual). C) Contacto con npub opcional y relé sin Google. D) Export estático y pin IPFS (CID en el pie). E) VPS propio / nodo, GitHub solo git. F) Firma del CSV y .onion. Estética intacta en A–C; D–F no se ven, se sienten cuando apagan el host.",
    },
  ],
};

const en: { lead: string; gmail: string; blocks: SovBlock[] } = {
  lead: "A proposal to move Bitácora.btc toward the bitcoiner archetype without throwing away the look (white, Bitcoin orange, bitcoin.org). Map, history and QR stay. We cut dependence, not design.",
  gmail: "We do not apply the Gmail API. Putting Google OAuth in the site is the opposite of sovereignty: Google KYC, ToS, and a kill switch in Mountain View. Latam Cripto Mom may keep a Gmail inbox — that is the operator’s choice, not the visitor’s. The site must not speak Google’s API. Contact: a non-Google relay (Web3Forms/self-hosted SMTP) or, better, a Nostr npub / lightning:. Mail can still arrive in that inbox; Google stays out of the code.",
  blocks: [
    {
      title: "What we do not touch (look and story)",
      body: "Type, Bitcoin orange, first-visit globe, Leaflet map, listings, history, ES/PT/EN, contribution QR, Consciencia Bitcoin. Visitors still see the same logbook. Globe and Market become opt-in (lite mode by default on slow links); they are not deleted.",
    },
    {
      title: "Where to host",
      body: "Three layers, not one AWS box. 1) Sovereign reading: static front (map + history + conciencia) pinned on IPFS (own node, or Pinata/web3.storage as a crutch) with a published CID. 2) Convenience: the same build on a small VPS outside Big Tech (Njalla, FlokiNET, or an Umbrel/Start9 node in Colonia) on the current domain. 3) A .onion mirror once the static build is clean. GitHub stays a code backup, not the only origin. If the VPS dies, the IPFS CID still serves the logbook.",
    },
    {
      title: "What sovereignty actually means",
      body: "Sovereign for the visitor = read with no account, no pixel, no KYC. Sovereign for the operator = publish a mirror without asking GitHub or Gmail. That needs: static front + cloneable CSV + on-chain/LN QR. Server functions (candles, Nominatim, scrape) are an optional BFF: if they die, the site does not; only Market and geocoding go dark. Sign the CSV (GPG commit or Nostr event) so a mirror cannot lie.",
    },
    {
      title: "Concrete changes, no redesign",
      body: "Lite mode: no Three.js or heat until the user asks. Contact: email optional; npub or lightning address field. Contribution: same QR plus bitcoin: and lightning: URIs, no processor. Never a login; if there is a signature, BIP-322 or a Nostr note, not Google. Events: our board first, Luma as a link, not the owner. Hash and expire rate-limit IPs. Zero Firebase in the production bundle.",
    },
    {
      title: "Payments",
      body: "Only gateway: Bitcoin. Near term: bitcoin: URI from the current QR + LNURL/BTCPay (self-host or Blink) for small sats. No Gmail Pay, Stripe or Mercado Pago. The site does not take custody.",
    },
    {
      title: "Order of work",
      body: "A) No Gmail API. B) Lite mode + payment URIs on the QR (looks the same). C) Contact with optional npub and a non-Google relay. D) Static export and IPFS pin (CID in the footer). E) Own VPS/node, GitHub as git only. F) CSV signature and .onion. Look stays intact in A–C; D–F are invisible until someone kills the host.",
    },
  ],
};

const pt: { lead: string; gmail: string; blocks: SovBlock[] } = {
  lead: "Proposta para aproximar a Bitácora.btc do arquétipo bitcoiner sem deitar abaixo a estética (branco, laranja Bitcoin, bitcoin.org). Mapa, história e QR ficam. Corta-se dependência, não o design.",
  gmail: "Não aplicamos a API do Gmail. Meter OAuth da Google no sítio é o contrário de soberania: KYC da Google, ToS, e um interruptor em Mountain View. A caixa da Latam Cripto Mom pode continuar a ser Gmail — decisão da operadora, não do visitante. O sítio não deve falar a API da Google. Contacto: relé sem Google (Web3Forms/SMTP próprio) ou, melhor, npub Nostr / lightning:. O mail pode chegar à caixa; a Google não entra no código.",
  blocks: [
    {
      title: "O que não se toca (estética e relato)",
      body: "Tipografia, laranja Bitcoin, globo na primeira visita, mapa Leaflet, fichas, história, i18n ES/PT/EN, QR de contribuição, Consciencia Bitcoin. O visitante continua a ver a mesma bitácora. Globo e Mercado passam a opt-in (modo leve por defeito em redes lentas); não se apagam.",
    },
    {
      title: "Onde hospedar",
      body: "Três camadas, não um único AWS. 1) Leitura soberana: build estático do front (mapa + história + conciencia) pinned em IPFS (nó próprio, ou Pinata/web3.storage como muleta) com CID publicado. 2) Conveniência: o mesmo build num VPS pequeno fora da Big Tech (Njalla, FlokiNET, ou um nó Umbrel/Start9 em Colonia) no domínio atual. 3) Espelho .onion quando o estático estiver limpo. GitHub fica backup de código, não origem única. Se o VPS cair, o CID do IPFS continua a servir a bitácora.",
    },
    {
      title: "Como é soberana de verdade",
      body: "Soberana para o visitante = ler sem conta, sem pixel, sem KYC. Soberana para a operadora = publicar um mirror sem pedir licença ao GitHub nem ao Gmail. Isso exige: front estático + CSV clonável + QR on-chain/LN. As server functions (velas, Nominatim, scrape) são um BFF opcional: se morrerem, o sítio não morre; só se apagam Mercado e a geocodificação. Assina-se o CSV (commit GPG ou evento Nostr) para um mirror não mentir.",
    },
    {
      title: "Mudanças concretas, sem redesenhar",
      body: "Modo leve: sem Three.js nem heat até o utilizador pedir. Contacto: email opcional; campo npub ou lightning address. Contribuição: o mesmo QR + URI bitcoin: e lightning:, sem processador. Nunca login; se houver assinatura, BIP-322 ou nota Nostr, não Google. Eventos: o nosso quadro primeiro, Luma como link, não como dono. IP do rate-limit com hash e caducidade. Zero Firebase no bundle de produção.",
    },
    {
      title: "Pagamentos",
      body: "Única pasarela: Bitcoin. Curto prazo: URI bitcoin: do QR atual + LNURL/BTCPay (self-host ou Blink) para sats pequenos. Nada de Gmail Pay, Stripe ou Mercado Pago. O sítio não custodia.",
    },
    {
      title: "Ordem de aplicação",
      body: "A) Sem API Gmail. B) Modo leve + URIs de pagamento no QR (vê-se igual). C) Contacto com npub opcional e relé sem Google. D) Export estático e pin IPFS (CID no rodapé). E) VPS/nó próprio, GitHub só git. F) Assinatura do CSV e .onion. Estética intacta em A–C; D–F não se veem, sentem-se quando desligam o host.",
    },
  ],
};

export const SOBERANIA: Record<AppLang, { lead: string; gmail: string; blocks: SovBlock[] }> = { es, en, pt };
