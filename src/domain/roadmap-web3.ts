import type { AppLang } from "@/lib/locale";

export type RoadPhase = { id: string; title: string; when: string; items: string[] };

const es: { lead: string; note: string; phases: RoadPhase[] } = {
  lead: "Plan de trabajo hasta el próximo halving de Bitcoin, previsto hacia abril de 2028. Cuatro etapas para consolidar Bitácora.btc como bitácora comunitaria: mapa, educación y datos públicos, sin custodia de fondos y sin exigir una billetera para consultar el sitio.",
  note: "El mapa y la historia se consultan sin iniciar sesión. No se venden cuentas. Los datos de mercado no se presentan como el estado de la red Bitcoin.",
  phases: [
    {
      id: "q1",
      title: "Q1 · Consolidación",
      when: "sep 2026 – ene 2027",
      items: [
        "Garantizar que el formulario de contacto entregue el mensaje a la iniciativa y el acuse a quien escribe.",
        "Limitar cargas automáticas y valoraciones ficticias, con verificación humana y tope de envíos.",
        "Apoyar el mapa mundial en directorios abiertos ya existentes; el registro propio cubre comunidades y excepciones de Latinoamérica.",
        "Distinguir con claridad el precio y los derivados de lo que ocurre en la red Bitcoin.",
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
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identidad sin custodia",
      when: "jul 2027 – nov 2027",
      items: [
        "Permitir altas y valoraciones con un perfil público o una dirección Lightning, como firma, nunca para custodiar fondos.",
        "La marca de verificado se obtiene publicando el código en una red propia o firmando un mensaje. No se solicita documentación personal.",
        "Respuestas automáticas de contacto en el idioma de quien escribe, con la firma de la iniciativa.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Cercanía con la red",
      when: "dic 2027 – abr 2028 · halving",
      items: [
        "Mostrar la comisión de red y el tiempo al próximo bloque: información propia de Bitcoin.",
        "Mantener el aporte al proyecto en bitcoin (on-chain y Lightning), sin pasarelas de tarjetas.",
        "Si se deja constancia de una ficha del mapa, será un sello de existencia, no un activo para comercializar.",
        "No se exigirá conectar una billetera para usar el mapa.",
      ],
    },
  ],
};

const en: { lead: string; note: string; phases: RoadPhase[] } = {
  lead: "A work plan through the next Bitcoin halving, expected around April 2028. Four stages to consolidate Bitácora.btc as a community logbook: map, education and public data, with no custody of funds and no wallet required to read the site.",
  note: "The map and the history can be consulted without signing in. We do not sell accounts. Market figures are not presented as the state of the Bitcoin network.",
  phases: [
    {
      id: "q1",
      title: "Q1 · Consolidation",
      when: "Sep 2026 – Jan 2027",
      items: [
        "Ensure the contact form delivers the message to the initiative and an acknowledgement to the sender.",
        "Limit automated listings and fictitious ratings, with human verification and send caps.",
        "Ground the world map in existing open directories; our own register covers communities and Latin American exceptions.",
        "Draw a clear line between price and derivatives, and what happens on the Bitcoin network.",
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
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identity without custody",
      when: "Jul 2027 – Nov 2027",
      items: [
        "Allow listings and ratings with a public profile or a Lightning address, as a signature, never to hold funds.",
        "The verified mark is earned by publishing the code on a network you control or by signing a message. No personal documents are requested.",
        "Automatic contact replies in the writer’s language, with the initiative’s signature.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Closer to the network",
      when: "Dec 2027 – Apr 2028 · halving",
      items: [
        "Show the network fee and the time to the next block: information that belongs to Bitcoin.",
        "Keep project contributions in bitcoin (on-chain and Lightning), with no card processors.",
        "If a map listing is ever recorded, it will be a stamp of existence, not an asset for sale.",
        "A wallet will never be required to use the map.",
      ],
    },
  ],
};

const pt: { lead: string; note: string; phases: RoadPhase[] } = {
  lead: "Plano de trabalho até ao próximo halving do Bitcoin, previsto para abril de 2028. Quatro etapas para consolidar a Bitácora.btc como bitácora comunitária: mapa, educação e dados públicos, sem custódia de fundos e sem exigir uma carteira para consultar o sítio.",
  note: "O mapa e a história consultam-se sem iniciar sessão. Não se vendem contas. Os dados de mercado não se apresentam como o estado da rede Bitcoin.",
  phases: [
    {
      id: "q1",
      title: "Q1 · Consolidação",
      when: "set 2026 – jan 2027",
      items: [
        "Garantir que o formulário de contacto entrega a mensagem à iniciativa e o aviso a quem escreve.",
        "Limitar cargas automáticas e avaliações fictícias, com verificação humana e teto de envios.",
        "Apoiar o mapa mundial em diretórios abertos já existentes; o registo próprio cobre comunidades e exceções da América Latina.",
        "Distinguir com clareza o preço e os derivados do que ocorre na rede Bitcoin.",
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
      ],
    },
    {
      id: "q3",
      title: "Q3 · Identidade sem custódia",
      when: "jul 2027 – nov 2027",
      items: [
        "Permitir altas e avaliações com um perfil público ou um endereço Lightning, como assinatura, nunca para custodiar fundos.",
        "A marca de verificado obtém-se publicando o código numa rede própria ou assinando uma mensagem. Não se pede documentação pessoal.",
        "Respostas automáticas de contacto no idioma de quem escreve, com a assinatura da iniciativa.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Proximidade com a rede",
      when: "dez 2027 – abr 2028 · halving",
      items: [
        "Mostrar a comissão de rede e o tempo até ao próximo bloco: informação própria do Bitcoin.",
        "Manter o contributo ao projeto em bitcoin (on-chain e Lightning), sem passagens de cartão.",
        "Se se deixar constância de uma ficha do mapa, será um selo de existência, não um ativo para comercializar.",
        "Não se exigirá ligar uma carteira para usar o mapa.",
      ],
    },
  ],
};

export const ROADMAP_WEB3: Record<AppLang, { lead: string; note: string; phases: RoadPhase[] }> = { es, en, pt };
