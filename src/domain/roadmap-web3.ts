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
  lead: "El destino no es una lista de herramientas: es una bitácora que se sostenga sola, abierta a cualquiera y sin un dueño que pueda cerrarla. Hasta el halving de abril de 2028 vamos soltando dependencias para que la comunidad lea, sume y se encuentre sin permiso de una empresa.",
  note: "Regla de siempre: se entra, se lee y se participa sin cuenta, sin documento y sin que nadie guarde tus llaves. Bitácora no custodia fondos ni vende accesos.",
  done: "Hoy el mapa, las comunidades, el contacto y el sitio público ya están en el aire. Lo que sigue es independencia: que esto no dependa de un intermediario para existir.",
  bar: [
    "Abierta: cualquiera mira el mapa y se informa sin registrarse.",
    "Comunitaria: no hay lista de espera ni un comité que decida quién entra.",
    "Sin custodia: no pedimos llaves, ni sats, ni datos de identidad para usar la bitácora.",
    "Autosustentable: se sostiene con aportes en bitcoin y con trabajo de la comunidad, no con un patrocinador que pueda cortar el grifo.",
    "Difícil de apagar: copias y un nodo propio, para que un servidor o una red social no sean el único interruptor.",
  ],
  phases: [
    {
      id: "q1",
      title: "Q1 · Datos en casa",
      when: "sep 2026 – ene 2027",
      items: [
        "Que la bitácora deje de pedir prestada toda la información de la red: un nodo en Colonia lee la cadena en casa.",
        "Si ese nodo se apaga, el sitio sigue. El mapa y la comunidad no dependen de una sola máquina.",
      ],
      checks: [
        "Se puede señalar el nodo propio y ver que el sitio no se cae cuando descansa.",
        "Nadie de afuera entra a esa máquina: es de la iniciativa, no un servicio público abierto.",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Que llegue a todos",
      when: "feb 2027 – jun 2027",
      items: [
        "Que abuela, estudiante o viajero puedan usar el mapa con datos del celular, sin esperar un aparato potente.",
        "Si una fuente de precios o noticias falla, el resto de la bitácora sigue en pie.",
      ],
      checks: [
        "En un teléfono sencillo el mapa se entiende y se usa.",
        "Un corte de un proveedor no deja la página en blanco.",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Confianza sin papeles",
      when: "jul 2027 – nov 2027",
      items: [
        "Sumar un comercio o una comunidad se prueba en público (tu red, tu web), no con documento ni teléfono.",
        "Quien quiera, puede dejar una señal en bitcoin. Es prueba de presencia, no una cuenta ni un saldo nuestro.",
      ],
      checks: [
        "Sigue sin haber KYC. Quien no quiera bitcoin igual puede participar.",
        "Bitácora no se queda con dinero de nadie.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Que se sostenga sola",
      when: "dic 2027 – abr 2028 · halving",
      items: [
        "Aportes al proyecto en bitcoin, de persona a persona, además del QR de siempre.",
        "La bitácora se acerca a la red: lo que muestra de bloques y comisiones nace de nuestro nodo cuando está encendido.",
        "Lo publicado en el mapa es memoria comunitaria, no un producto para vender.",
      ],
      checks: [
        "Se puede contribuir sin tarjeta ni plataforma que congele fondos.",
        "Si el nodo propio descansa, el sitio no se apaga: usa un respaldo público.",
      ],
    },
    {
      id: "tutor",
      title: "Más adelante · Guía soberana",
      when: "cuando el nodo en casa esté firme · no calendarizado",
      items: [
        "Una guía que explique Bitcoin, Bitácora, Consciencia Bitcoin y LATAM Cripto Mom en castellano, portugués e inglés, con palabras sencillas, sin salirse de Satoshi: soberanía, no custodia, verificar.",
        "No corre en el mismo servidor que el mapa. Vive en el nodo de casa o no se publica. Nada de OpenAI, Google ni Groq.",
        "Primero un índice de textos propios (whitepaper, conciencia, legal). Después, si hay máquina, un modelo chico que cita esas fuentes. Sin agente, sin llaves, sin consejo financiero.",
      ],
      checks: [
        "Si la guía se apaga, el mapa sigue.",
        "No hay API de un tercero en el chat. Quien no quiera usarla igual lee el sitio.",
      ],
    },
  ],
};

const en: RoadCopy = {
  lead: "The goal is not a stack of tools. It is a logbook that can stand on its own, open to anyone, with no owner who can shut it down. Through the April 2028 halving we drop dependencies so the community can read, join and meet without asking a company for permission.",
  note: "Standing rule: you come in, you read and you take part with no account, no ID and no one holding your keys. Bitácora does not custody funds or sell access.",
  done: "The map, the communities, contact and the public site are already live. What remains is independence: this should not need a middleman in order to exist.",
  bar: [
    "Open: anyone can read the map and learn without signing up.",
    "Communal: no waiting list and no committee that decides who gets in.",
    "No custody: we do not ask for keys, sats or identity papers to use the logbook.",
    "Self-sustaining: it lives on bitcoin contributions and community work, not a sponsor who can close the tap.",
    "Hard to switch off: our own node and copies, so one server or one social network is never the only switch.",
  ],
  phases: [
    {
      id: "q1",
      title: "Q1 · Data at home",
      when: "Sep 2026 – Jan 2027",
      items: [
        "Stop borrowing all network data: a node in Colonia reads the chain at home.",
        "If that node rests, the site stays up. The map and the community do not hang on a single machine.",
      ],
      checks: [
        "You can point to our own node and see that the site does not fall when it sleeps.",
        "No one from the public internet walks into that machine.",
      ],
    },
    {
      id: "q2",
      title: "Q2 · It has to reach everyone",
      when: "Feb 2027 – Jun 2027",
      items: [
        "Grandparent, student or traveller can use the map on phone data, without a powerful device.",
        "If a price or news source fails, the rest of the logbook stays standing.",
      ],
      checks: [
        "On a simple phone the map is clear and usable.",
        "One vendor outage does not leave a blank page.",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Trust without papers",
      when: "Jul 2027 – Nov 2027",
      items: [
        "Adding a shop or a community is proven in public (your network, your site), not with an ID or a phone number.",
        "Anyone who wants can leave a small bitcoin signal. It is proof of presence, not an account and not a balance we keep.",
      ],
      checks: [
        "Still no KYC. Anyone who does not want bitcoin can still take part.",
        "Bitácora does not hold anyone’s money.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · It stands on its own",
      when: "Dec 2027 – Apr 2028 · halving",
      items: [
        "Contributions to the project in bitcoin, peer to peer, besides the usual QR.",
        "The logbook moves closer to the network: blocks and fees come from our node when it is on.",
        "What is on the map is community memory, not a product for sale.",
      ],
      checks: [
        "You can contribute with no card and no platform that can freeze funds.",
        "If our node rests, the site does not go dark: it uses a public backup.",
      ],
    },
    {
      id: "tutor",
      title: "Later · Sovereign guide",
      when: "once the home node is steady · not scheduled",
      items: [
        "A guide that explains Bitcoin, Bitácora, Consciencia Bitcoin and LATAM Cripto Mom in Spanish, Portuguese and English, in plain words, without leaving Satoshi: sovereignty, no custody, verify.",
        "It does not run on the same server as the map. It lives on the home node or it is not published. No OpenAI, Google or Groq.",
        "First an index of our own texts (white paper, conciencia, legal). Then, if there is a machine, a small model that cites those sources. No agent, no keys, no financial advice.",
      ],
      checks: [
        "If the guide goes dark, the map stays up.",
        "No third-party API in the chat. Anyone who skips it can still read the site.",
      ],
    },
  ],
};

const pt: RoadCopy = {
  lead: "O destino não é uma lista de ferramentas: é uma bitácora que se sustente sozinha, aberta a qualquer pessoa e sem um dono que possa fechá-la. Até o halving de abril de 2028 soltamos dependências para que a comunidade leia, some e se encontre sem pedir licença a uma empresa.",
  note: "Regra de sempre: você entra, lê e participa sem conta, sem documento e sem que ninguém guarde as suas chaves. A Bitácora não custodia fundos nem vende acessos.",
  done: "Hoje o mapa, as comunidades, o contato e o site público já estão no ar. O que segue é independência: isto não deve precisar de um intermediário para existir.",
  bar: [
    "Aberta: qualquer pessoa vê o mapa e se informa sem se cadastrar.",
    "Comunitária: não há lista de espera nem um comitê que decida quem entra.",
    "Sem custódia: não pedimos chaves, sats nem dados de identidade para usar a bitácora.",
    "Autossustentável: vive de aportes em bitcoin e do trabalho da comunidade, não de um patrocinador que possa fechar a torneira.",
    "Difícil de desligar: cópias e um nó próprio, para que um servidor ou uma rede social não sejam o único interruptor.",
  ],
  phases: [
    {
      id: "q1",
      title: "Q1 · Dados em casa",
      when: "set 2026 – jan 2027",
      items: [
        "A bitácora deixa de pedir emprestada toda a informação da rede: um nó em Colonia lê a cadeia em casa.",
        "Se esse nó descansar, o site segue. O mapa e a comunidade não dependem de uma só máquina.",
      ],
      checks: [
        "Dá para apontar o nó próprio e ver que o site não cai quando ele descansa.",
        "Ninguém de fora entra nessa máquina: é da iniciativa, não um serviço público aberto.",
      ],
    },
    {
      id: "q2",
      title: "Q2 · Que chegue a todos",
      when: "fev 2027 – jun 2027",
      items: [
        "Avó, estudante ou viajante possam usar o mapa com dados do celular, sem esperar um aparelho potente.",
        "Se uma fonte de preços ou notícias falhar, o resto da bitácora continua de pé.",
      ],
      checks: [
        "Num celular simples o mapa se entende e se usa.",
        "O corte de um provedor não deixa a página em branco.",
      ],
    },
    {
      id: "q3",
      title: "Q3 · Confiança sem papéis",
      when: "jul 2027 – nov 2027",
      items: [
        "Somar um comércio ou uma comunidade se prova em público (sua rede, seu site), não com documento nem telefone.",
        "Quem quiser pode deixar um sinal em bitcoin. É prova de presença, não uma conta nem um saldo nosso.",
      ],
      checks: [
        "Continua sem KYC. Quem não quiser bitcoin igualmente pode participar.",
        "A Bitácora não fica com dinheiro de ninguém.",
      ],
    },
    {
      id: "q4",
      title: "Q4 · Que se sustente sozinha",
      when: "dez 2027 – abr 2028 · halving",
      items: [
        "Aportes ao projeto em bitcoin, de pessoa a pessoa, além do QR de sempre.",
        "A bitácora se aproxima da rede: o que mostra de blocos e comissões nasce do nosso nó quando está ligado.",
        "O que está no mapa é memória comunitária, não um produto para vender.",
      ],
      checks: [
        "Dá para contribuir sem cartão e sem plataforma que congele fundos.",
        "Se o nó próprio descansar, o site não apaga: usa um respaldo público.",
      ],
    },
    {
      id: "tutor",
      title: "Mais adiante · Guia soberana",
      when: "quando o nó em casa estiver firme · não calendarizado",
      items: [
        "Uma guia que explique Bitcoin, Bitácora, Consciencia Bitcoin e LATAM Cripto Mom em espanhol, português e inglês, com palavras simples, sem sair de Satoshi: soberania, sem custódia, verificar.",
        "Não corre no mesmo servidor que o mapa. Vive no nó de casa ou não se publica. Nada de OpenAI, Google nem Groq.",
        "Primeiro um índice de textos próprios (whitepaper, consciência, legal). Depois, se houver máquina, um modelo pequeno que cita essas fontes. Sem agente, sem chaves, sem conselho financeiro.",
      ],
      checks: [
        "Se a guia apagar, o mapa segue.",
        "Não há API de um terceiro no chat. Quem não quiser usá-la igualmente lê o site.",
      ],
    },
  ],
};

export const ROADMAP_WEB3: Record<AppLang, RoadCopy> = { es, en, pt };
