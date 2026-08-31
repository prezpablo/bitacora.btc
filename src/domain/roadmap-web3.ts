import type { AppLang } from "@/lib/locale";

export type RoadPhase = { id: string; title: string; when: string; items: string[]; checks: string[] };

const es: { lead: string; note: string; phases: RoadPhase[] } = {
  lead: "Plan de trabajo hasta el próximo halving de Bitcoin, previsto hacia abril de 2028. Cuatro etapas para consolidar Bitácora.btc como bitácora comunitaria: mapa, educación y datos públicos, sin custodia de fondos y sin exigir una billetera para consultar el sitio. Cada etapa se da por cumplida cuando se pueden comprobar las verificaciones listadas.",
  note: "El mapa y la historia se consultan sin iniciar sesión. No se venden cuentas. Los datos de mercado no se presentan como el estado de la red Bitcoin. Las verificaciones no piden documento ni teléfono.",
  phases: [
    {
      id: "q1",
      title: "Q1 · Consolidación",
      when: "sep 2026 – ene 2027",
      items: [
        "Garantizar que el formulario de contacto entregue el mensaje a la iniciativa y el acuse a quien escribe.",
        "Limitar cargas automáticas y valoraciones ficticias, con captcha, código público y tope de envíos.",
        "Apoyar el mapa mundial en directorios abiertos ya existentes; el registro propio cubre comunidades y excepciones de Latinoamérica.",
        "Publicar en el servidor el build al día: globo con mapa de países propio, teselas sin clave paga, anuncios con código CARGA.",
        "Encender un nodo Umbrel en Colonia (Bitcoin Core y Mempool) para verificar altura de bloque y comisiones en casa, no en un explorer ajeno.",
        "Distinguir con claridad el precio y los derivados de lo que ocurre en la red Bitcoin.",
      ],
      checks: [
        "Un mensaje de prueba en Contacto llega a la iniciativa y el acuse al correo de quien escribe.",
        "Sin captcha o sin URL pública, un comercio o un anuncio no se publica.",
        "El globo y el mapa abren en un teléfono con datos, sin pedir un archivo a un CDN externo.",
        "En Red, la altura de bloque del sitio coincide con un explorer público (± 1 bloque).",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Claridad y acceso",
      when: "feb 2027 – jun 2027",
      items: [
        "Mejorar los tiempos de carga del globo, el mapa y el gráfico, en especial en telefonía móvil.",
        "Mantener el nivel de mayor liquidación anclado a velas semanales, independiente del zoom.",
        "Si una fuente externa no responde, el resto de la bitácora permanece disponible.",
        "Presentar las velas con la misma claridad que un gráfico de referencia.",
        "Si el nodo Umbrel está apagado, Red y Pulso siguen con la fuente pública; no se cae la bitácora.",
      ],
      checks: [
        "El punto de control semanal (POC) no cambia al hacer zoom: la cifra es la misma en velas de 1S.",
        "Si se corta una fuente de velas, el gráfico sigue con otra.",
        "Un anuncio con Instagram como única prueba no se verifica; el mismo código en X, Nostr o una web sí.",
        "Con el Umbrel desconectado, el sitio sigue sirviendo mapa, historia y contacto.",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identidad sin custodia",
      when: "jul 2027 – nov 2027",
      items: [
        "Permitir altas y valoraciones con un perfil público o una dirección Lightning, como firma, nunca para custodiar fondos.",
        "La marca de verificado se obtiene publicando el código CARGA en una red propia o firmando un mensaje. No se solicita documentación personal.",
        "Opcional: una factura Lightning de pocos sats, cobrada en el nodo Umbrel, demuestra el control de la dirección. Bitácora no guarda esos fondos.",
        "Respuestas automáticas de contacto en el idioma de quien escribe, con la firma de la iniciativa.",
      ],
      checks: [
        "Un pin con CARGA-XXXX visible en lnk.bio, X o Nostr se prende; Instagram solo no alcanza.",
        "No hay campo de documento, teléfono ni cuenta bancaria en ningún formulario.",
        "Si se usa Lightning como prueba, la factura se paga a la wallet de la iniciativa y no queda saldo a nombre del visitante.",
        "El acuse de Contacto llega en el idioma elegido (ES, PT o EN).",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Cercanía con la red",
      when: "dic 2027 – abr 2028 · halving",
      items: [
        "Mostrar la comisión de red y el tiempo al próximo bloque leídos, cuando esté encendido, del Mempool del Umbrel de Colonia.",
        "Mantener el aporte al proyecto en bitcoin (on-chain y Lightning, p. ej. BTCPay en el mismo nodo), sin pasarelas de tarjetas.",
        "Si se deja constancia de una ficha del mapa, será un sello de existencia, no un activo para comercializar.",
        "No se exigirá conectar una billetera para usar el mapa.",
      ],
      checks: [
        "Con el Umbrel sincronizado, fees y próximo bloque de Bitácora coinciden con el Mempool local.",
        "Si el Umbrel está apagado, esos números salen del fallback público y el resto de la página sigue.",
        "El QR de contribuir genera un cobro en bitcoin, no un formulario de tarjeta.",
        "Se recorre mapa, historia y mercado de punta a punta sin conectar una billetera.",
      ],
    },
  ],
};

const en: { lead: string; note: string; phases: RoadPhase[] } = {
  lead: "A work plan through the next Bitcoin halving, expected around April 2028. Four stages to consolidate Bitácora.btc as a community logbook: map, education and public data, with no custody of funds and no wallet required to read the site. A stage is done when the checks below can be shown.",
  note: "The map and the history can be consulted without signing in. We do not sell accounts. Market figures are not presented as the state of the Bitcoin network. Checks never ask for ID or a phone number.",
  phases: [
    {
      id: "q1",
      title: "Q1 · Consolidation",
      when: "Sep 2026 – Jan 2027",
      items: [
        "Ensure the contact form delivers the message to the initiative and an acknowledgement to the sender.",
        "Limit automated listings and fictitious ratings, with captcha, a public code and send caps.",
        "Ground the world map in existing open directories; our own register covers communities and Latin American exceptions.",
        "Ship the current build on the public server: globe with a local country file, tiles with no paid key, announcements with a CARGA code.",
        "Turn on an Umbrel node in Colonia (Bitcoin Core and Mempool) to check block height and fees at home, not on someone else’s explorer.",
        "Draw a clear line between price and derivatives, and what happens on the Bitcoin network.",
      ],
      checks: [
        "A test Contact message reaches the initiative and the acknowledgement reaches the sender.",
        "Without captcha or a public URL, a shop or an announcement is not published.",
        "Globe and map open on a phone on mobile data, without fetching a country file from an outside CDN.",
        "On Network, the site’s block height matches a public explorer (± 1 block).",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Clarity and access",
      when: "Feb 2027 – Jun 2027",
      items: [
        "Improve load times for the globe, the map and the chart, especially on mobile connections.",
        "Keep the main liquidation level anchored to weekly candles, independent of zoom.",
        "If an outside source fails, the rest of the logbook remains available.",
        "Present candles with the same clarity as a reference chart.",
        "If the Umbrel node is off, Network and Pulse keep using the public source; the logbook does not go down.",
      ],
      checks: [
        "The weekly control point (POC) does not change when zooming: the figure is the same on 1W candles.",
        "If one candle source drops, the chart continues on another.",
        "An announcement with Instagram as the only proof does not verify; the same code on X, Nostr or a website does.",
        "With Umbrel offline, the site still serves map, history and contact.",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identity without custody",
      when: "Jul 2027 – Nov 2027",
      items: [
        "Allow listings and ratings with a public profile or a Lightning address, as a signature, never to hold funds.",
        "The verified mark is earned by publishing the CARGA code on a network you control or by signing a message. No personal documents are requested.",
        "Optional: a small Lightning invoice, paid to the Umbrel node, proves control of the address. Bitácora does not keep those funds.",
        "Automatic contact replies in the writer’s language, with the initiative’s signature.",
      ],
      checks: [
        "A pin with CARGA-XXXX visible on lnk.bio, X or Nostr lights up; Instagram alone is not enough.",
        "No form asks for ID, phone or a bank account.",
        "If Lightning is used as proof, the invoice is paid to the initiative’s wallet and no balance is held for the visitor.",
        "The Contact acknowledgement arrives in the chosen language (ES, PT or EN).",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Closer to the network",
      when: "Dec 2027 – Apr 2028 · halving",
      items: [
        "Show the network fee and time to the next block from the Colonia Umbrel Mempool when it is on.",
        "Keep project contributions in bitcoin (on-chain and Lightning, e.g. BTCPay on the same node), with no card processors.",
        "If a map listing is ever recorded, it will be a stamp of existence, not an asset for sale.",
        "A wallet will never be required to use the map.",
      ],
      checks: [
        "With Umbrel synced, Bitácora fees and next-block time match the local Mempool.",
        "If Umbrel is off, those figures come from the public fallback and the rest of the page still works.",
        "The contribute QR produces a bitcoin payment, not a card form.",
        "Map, history and market can be used end to end without connecting a wallet.",
      ],
    },
  ],
};

const pt: { lead: string; note: string; phases: RoadPhase[] } = {
  lead: "Plano de trabalho até ao próximo halving do Bitcoin, previsto para abril de 2028. Quatro etapas para consolidar a Bitácora.btc como bitácora comunitária: mapa, educação e dados públicos, sem custódia de fundos e sem exigir uma carteira para consultar o sítio. Uma etapa está cumprida quando se podem mostrar as verificações abaixo.",
  note: "O mapa e a história consultam-se sem iniciar sessão. Não se vendem contas. Os dados de mercado não se apresentam como o estado da rede Bitcoin. As verificações não pedem documento nem telefone.",
  phases: [
    {
      id: "q1",
      title: "Q1 · Consolidação",
      when: "set 2026 – jan 2027",
      items: [
        "Garantir que o formulário de contacto entrega a mensagem à iniciativa e o aviso a quem escreve.",
        "Limitar cargas automáticas e avaliações fictícias, com captcha, código público e teto de envios.",
        "Apoiar o mapa mundial em diretórios abertos já existentes; o registo próprio cobre comunidades e exceções da América Latina.",
        "Publicar no servidor o build atual: globo com ficheiro de países próprio, teselas sem chave paga, anúncios com código CARGA.",
        "Ligar um nó Umbrel em Colonia (Bitcoin Core e Mempool) para verificar altura de bloco e comissões em casa, não num explorer alheio.",
        "Distinguir com clareza o preço e os derivados do que ocorre na rede Bitcoin.",
      ],
      checks: [
        "Uma mensagem de teste em Contacto chega à iniciativa e o aviso ao correio de quem escreve.",
        "Sem captcha ou sem URL pública, um comércio ou um anúncio não se publica.",
        "O globo e o mapa abrem num telemóvel com dados, sem pedir um ficheiro a um CDN externo.",
        "Em Rede, a altura de bloco do sítio coincide com um explorer público (± 1 bloco).",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Clareza e acesso",
      when: "fev 2027 – jun 2027",
      items: [
        "Melhorar os tempos de carga do globo, do mapa e do gráfico, em especial no telemóvel.",
        "Manter o nível de maior liquidação ancorado às velas semanais, independente do zoom.",
        "Se uma fonte externa não responder, o resto da bitácora permanece disponível.",
        "Apresentar as velas com a mesma clareza de um gráfico de referência.",
        "Se o nó Umbrel estiver desligado, Rede e Pulso continuam com a fonte pública; a bitácora não cai.",
      ],
      checks: [
        "O ponto de controlo semanal (POC) não muda ao fazer zoom: a cifra é a mesma em velas de 1S.",
        "Se uma fonte de velas cair, o gráfico continua com outra.",
        "Um anúncio com Instagram como única prova não verifica; o mesmo código em X, Nostr ou um site sim.",
        "Com o Umbrel desligado, o sítio continua a servir mapa, história e contacto.",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identidade sem custódia",
      when: "jul 2027 – nov 2027",
      items: [
        "Permitir altas e avaliações com um perfil público ou um endereço Lightning, como assinatura, nunca para custodiar fundos.",
        "A marca de verificado obtém-se publicando o código CARGA numa rede própria ou assinando uma mensagem. Não se pede documentação pessoal.",
        "Opcional: uma fatura Lightning de poucos sats, cobrada no nó Umbrel, prova o controlo do endereço. A Bitácora não guarda esses fundos.",
        "Respostas automáticas de contacto no idioma de quem escreve, com a assinatura da iniciativa.",
      ],
      checks: [
        "Um pin com CARGA-XXXX visível em lnk.bio, X ou Nostr acende; Instagram sozinho não chega.",
        "Nenhum formulário pede documento, telefone ou conta bancária.",
        "Se se usar Lightning como prova, a fatura paga-se à carteira da iniciativa e não fica saldo em nome do visitante.",
        "O aviso de Contacto chega no idioma escolhido (ES, PT ou EN).",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Proximidade com a rede",
      when: "dez 2027 – abr 2028 · halving",
      items: [
        "Mostrar a comissão de rede e o tempo até ao próximo bloco lidos, quando estiver ligado, do Mempool do Umbrel de Colonia.",
        "Manter o contributo ao projeto em bitcoin (on-chain e Lightning, p.ex. BTCPay no mesmo nó), sem passagens de cartão.",
        "Se se deixar constância de uma ficha do mapa, será um selo de existência, não um ativo para comercializar.",
        "Não se exigirá ligar uma carteira para usar o mapa.",
      ],
      checks: [
        "Com o Umbrel sincronizado, as fees e o próximo bloco da Bitácora coincidem com o Mempool local.",
        "Se o Umbrel estiver desligado, esses números vêm do fallback público e o resto da página continua.",
        "O QR de contribuir gera um pagamento em bitcoin, não um formulário de cartão.",
        "Percorre-se mapa, história e mercado de ponta a ponta sem ligar uma carteira.",
      ],
    },
  ],
};

export const ROADMAP_WEB3: Record<AppLang, { lead: string; note: string; phases: RoadPhase[] }> = { es, en, pt };
