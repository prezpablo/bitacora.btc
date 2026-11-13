export type CircLang = "es" | "en" | "pt";

type CircCopy = { city: Record<CircLang, string>; text: Record<CircLang, string> };

/** Fichas del archivo de Bitcoin Confederation. El CSV guarda el original. La ficha del mapa usa este texto. */
export const CIRCULAR_COPY: Record<string, CircCopy> = {
  "circ:bitcoin-makueni": {
    city: { es: "Makueni, Kenia", pt: "Makueni, Quênia", en: "Makueni, Kenya" },
    text: {
      es: "En el condado de Makueni, Kenia, enseñan qué es Bitcoin, cómo funciona y para qué puede servir en la vida diaria.",
      pt: "No condado de Makueni, no Quênia, ensinam o que é o Bitcoin, como funciona e para que pode servir no dia a dia.",
      en: "In Makueni County, Kenya, they teach what Bitcoin is, how it works and how it can be used in daily life.",
    },
  },
  "circ:abidjan-bitcoin-meetup": {
    city: { es: "Abiyán, Costa de Marfil", pt: "Abidjan, Costa do Marfim", en: "Abidjan, Côte d'Ivoire" },
    text: {
      es: "Comunidad sin fines de lucro en Abiyán. Enseña Bitcoin y junta a estudiantes y vecinos.",
      pt: "Comunidade sem fins lucrativos em Abidjan. Ensina Bitcoin e reúne estudantes e vizinhos.",
      en: "A nonprofit community in Abidjan. It teaches Bitcoin and brings students and neighbors together.",
    },
  },
  "circ:amityage-roatan-honduras": {
    city: { es: "Roatán, Honduras", pt: "Roatán, Honduras", en: "Roatán, Honduras" },
    text: {
      es: "Organización en Roatán. Enseña Bitcoin y abrió un centro de educación en la isla. Trabaja desde Próspera.",
      pt: "Organização em Roatán. Ensina Bitcoin e abriu um centro de educação na ilha. Atua a partir de Próspera.",
      en: "An organization in Roatán. It teaches Bitcoin and opened an education center on the island. It works from Próspera.",
    },
  },
  "circ:arnhem-bitcoinstad-netherlands": {
    city: { es: "Arnhem, Países Bajos", pt: "Arnhem, Países Baixos", en: "Arnhem, the Netherlands" },
    text: {
      es: "En el centro de Arnhem buscan que el día a día se pueda pagar con Bitcoin, también por Lightning. Hacen encuentros para quien empieza.",
      pt: "No centro de Arnhem buscam que o dia a dia possa ser pago com Bitcoin, também por Lightning. Fazem encontros para quem está começando.",
      en: "In central Arnhem they want everyday spending to work with Bitcoin, including Lightning. They hold meetups for beginners.",
    },
  },
  "circ:belgian-bitcoin-embassy": {
    city: { es: "Schaerbeek, Bélgica", pt: "Schaerbeek, Bélgica", en: "Schaerbeek, Belgium" },
    text: {
      es: "Punto de contacto en Bélgica para quien quiere aprender Bitcoin. Dan cursos y talleres a personas y comercios.",
      pt: "Ponto de contato na Bélgica para quem quer aprender Bitcoin. Oferecem cursos e oficinas a pessoas e comércios.",
      en: "A contact point in Belgium for people who want to learn Bitcoin. They offer courses and workshops for people and shops.",
    },
  },
  "circ:bitcoin-beach-el-salvador": {
    city: { es: "El Zonte, El Salvador", pt: "El Zonte, El Salvador", en: "El Zonte, El Salvador" },
    text: {
      es: "En El Zonte armaron una economía donde se paga con Bitcoin: la comida, el trabajo y el pueblo. Empezó con un donante anónimo.",
      pt: "Em El Zonte montaram uma economia em que se paga com Bitcoin: a comida, o trabalho e a vila. Começou com um doador anônimo.",
      en: "In El Zonte they built an economy where people pay with Bitcoin: food, work and the town. It started with an anonymous donor.",
    },
  },
  "circ:bitcoin-berlin-el-salvador": {
    city: { es: "Berlín, Usulután, El Salvador", pt: "Berlim, Usulután, El Salvador", en: "Berlin, Usulután, El Salvador" },
    text: {
      es: "Economía circular de Bitcoin en Berlín, Usulután, El Salvador.",
      pt: "Economia circular de Bitcoin em Berlim, Usulután, El Salvador.",
      en: "A Bitcoin circular economy in Berlin, Usulután, El Salvador.",
    },
  },
  "circ:bitcoin-birr-ethiopia": {
    city: { es: "Adís Abeba, Etiopía", pt: "Adis Abeba, Etiópia", en: "Addis Ababa, Ethiopia" },
    text: {
      es: "Proyecto abierto en Etiopía. Enseñan qué es el dinero, Bitcoin, el minado y la energía.",
      pt: "Projeto aberto na Etiópia. Ensinam o que é o dinheiro, o Bitcoin, a mineração e a energia.",
      en: "An open project in Ethiopia. They teach money, Bitcoin, mining and energy.",
    },
  },
  "circ:bitcoin-dada-nairobi": {
    city: { es: "Nairobi, Kenia", pt: "Nairóbi, Quênia", en: "Nairobi, Kenya" },
    text: {
      es: "En Nairobi enseñan Bitcoin a mujeres africanas y arman una red para que más mujeres participen.",
      pt: "Em Nairóbi ensinam Bitcoin a mulheres africanas e montam uma rede para mais mulheres participarem.",
      en: "In Nairobi they teach Bitcoin to African women and build a network so more women can take part.",
    },
  },
  "circ:bitcoin-ekasi-south-africa": {
    city: { es: "Mossel Bay, Sudáfrica", pt: "Mossel Bay, África do Sul", en: "Mossel Bay, South Africa" },
    text: {
      es: "En un township de Sudáfrica, el grupo Surfer Kids usa Bitcoin como en El Zonte: educación y pagos en la comunidad.",
      pt: "Num township da África do Sul, o grupo Surfer Kids usa Bitcoin como em El Zonte: educação e pagamentos na comunidade.",
      en: "In a South African township, the Surfer Kids group uses Bitcoin the way El Zonte did: education and payments in the community.",
    },
  },
  "circ:bitcoin-ikorodu": {
    city: { es: "Shagamu, estado de Ogun, Nigeria", pt: "Shagamu, estado de Ogun, Nigéria", en: "Shagamu, Ogun State, Nigeria" },
    text: {
      es: "Están armando una economía circular de Bitcoin en Ikorodu, Lagos, Nigeria. El pin publicado cae en Shagamu.",
      pt: "Estão montando uma economia circular de Bitcoin em Ikorodu, Lagos, Nigéria. O pin publicado cai em Shagamu.",
      en: "They are building a Bitcoin circular economy in Ikorodu, Lagos, Nigeria. The published pin falls on Shagamu.",
    },
  },
  "circ:bitcoin-island-philippines": {
    city: { es: "Borácay, Filipinas", pt: "Boracay, Filipinas", en: "Boracay, the Philippines" },
    text: {
      es: "En Borácay buscan que vecinos y visitantes paguen con Bitcoin. La ficha dice que más de 250 comercios ya lo aceptan.",
      pt: "Em Boracay buscam que moradores e visitantes paguem com Bitcoin. A ficha diz que mais de 250 comércios já aceitam.",
      en: "In Boracay they want locals and visitors to pay with Bitcoin. The listing says more than 250 shops already accept it.",
    },
  },
  "circ:bitcoin-jungle-costa-rica": {
    city: { es: "Uvita, Costa Rica", pt: "Uvita, Costa Rica", en: "Uvita, Costa Rica" },
    text: {
      es: "Proyecto abierto en Uvita y la zona cercana. Quieren una economía circular con pagos rápidos por Lightning.",
      pt: "Projeto aberto em Uvita e na zona próxima. Querem uma economia circular com pagamentos rápidos por Lightning.",
      en: "An open project in Uvita and the nearby area. They want a circular economy with fast Lightning payments.",
    },
  },
  "circ:bitcoin-kampala-uganda": {
    city: { es: "Bugiri, Uganda", pt: "Bugiri, Uganda", en: "Bugiri, Uganda" },
    text: {
      es: "Economía circular en Uganda, cerca de la Universidad de Makerere y de comunidades de Bugiri. Mezclan educación, comercios y ayuda social.",
      pt: "Economia circular em Uganda, perto da Universidade de Makerere e de comunidades de Bugiri. Misturam educação, comércios e ajuda social.",
      en: "A circular economy in Uganda, around Makerere University and communities in Bugiri. They mix education, shops and social help.",
    },
  },
  "circ:bitcoin-la-pirraya-el-salvador": {
    city: { es: "La Pirraya, Usulután, El Salvador", pt: "La Pirraya, Usulután, El Salvador", en: "La Pirraya, Usulután, El Salvador" },
    text: {
      es: "En la isla La Pirraya, Luis Contreras enseña Bitcoin y valores a niños y jóvenes, con su esposa y un equipo.",
      pt: "Na ilha La Pirraya, Luis Contreras ensina Bitcoin e valores a crianças e jovens, com a esposa e uma equipe.",
      en: "On La Pirraya island, Luis Contreras teaches Bitcoin and values to children and young people, with his wife and a team.",
    },
  },
  "circ:bitcoin-lake-guatemala": {
    city: { es: "Lago Atitlán, Guatemala", pt: "Lago Atitlán, Guatemala", en: "Lake Atitlán, Guatemala" },
    text: {
      es: "En el lago Atitlán muestran comercios de la zona que aceptan Bitcoin por Lightning.",
      pt: "No lago Atitlán mostram comércios da região que aceitam Bitcoin por Lightning.",
      en: "At Lake Atitlán they show local shops that accept Bitcoin over Lightning.",
    },
  },
  "circ:bitcoin-nextgen": {
    city: { es: "Akamkpa, Nigeria", pt: "Akamkpa, Nigéria", en: "Akamkpa, Nigeria" },
    text: {
      es: "En Akamkpa enseñan Bitcoin y ahorro a niños y adolescentes, desde los 8 años.",
      pt: "Em Akamkpa ensinam Bitcoin e poupança a crianças e adolescentes, a partir dos 8 anos.",
      en: "In Akamkpa they teach Bitcoin and saving to children and teenagers, from age 8.",
    },
  },
  "circ:bitcoin-tofo": {
    city: { es: "Tofo, Mozambique", pt: "Tofo, Moçambique", en: "Tofo, Mozambique" },
    text: {
      es: "En Tofo buscan que los comercios del pueblo cobren en Bitcoin y que la comunidad aprenda a usarlo.",
      pt: "Em Tofo buscam que os comércios da vila recebam em Bitcoin e que a comunidade aprenda a usar.",
      en: "In Tofo they want village shops to take Bitcoin and the community to learn how to use it.",
    },
  },
  "circ:bitcoin-witsand-south-africa": {
    city: { es: "Witsand, Sudáfrica", pt: "Witsand, África do Sul", en: "Witsand, South Africa" },
    text: {
      es: "En Witsand, un pueblo de la costa sur de Sudáfrica, buscan que la comunidad use Bitcoin en la vida diaria.",
      pt: "Em Witsand, uma vila no litoral sul da África do Sul, buscam que a comunidade use Bitcoin no dia a dia.",
      en: "In Witsand, a village on the south coast of South Africa, they want the community to use Bitcoin day to day.",
    },
  },
  "circ:bitfiasi": {
    city: { es: "Shai-Osudoku, Ghana", pt: "Shai-Osudoku, Gana", en: "Shai-Osudoku, Ghana" },
    text: {
      es: "Organización en Ghana. Enseñan Bitcoin a personas y pequeños comercios para que lo usen al ahorrar y al cobrar.",
      pt: "Organização em Gana. Ensinam Bitcoin a pessoas e pequenos comércios para que usem ao poupar e ao cobrar.",
      en: "An organization in Ghana. They teach Bitcoin to people and small shops so they can use it to save and to get paid.",
    },
  },
  "circ:cuba-bitcoin": {
    city: { es: "La Habana, Cuba", pt: "Havana, Cuba", en: "Havana, Cuba" },
    text: {
      es: "Comunidad en Cuba. Debaten y enseñan Bitcoin en línea y en encuentros presenciales, para que más gente lo use.",
      pt: "Comunidade em Cuba. Debatem e ensinam Bitcoin online e em encontros presenciais, para mais gente usar.",
      en: "A community in Cuba. They discuss and teach Bitcoin online and in person, so more people can use it.",
    },
  },
  "circ:enogtyve-danmark": {
    city: { es: "Viborg, Dinamarca", pt: "Viborg, Dinamarca", en: "Viborg, Denmark" },
    text: {
      es: "Red en Dinamarca. La gente se junta a aprender Bitcoin y a compartirlo con quien vive en el país.",
      pt: "Rede na Dinamarca. As pessoas se reúnem para aprender Bitcoin e compartilhar com quem vive no país.",
      en: "A network in Denmark. People meet to learn Bitcoin and share it with others in the country.",
    },
  },
  "circ:free-madeira-portugal": {
    city: { es: "Funchal, Madeira, Portugal", pt: "Funchal, Madeira, Portugal", en: "Funchal, Madeira, Portugal" },
    text: {
      es: "Organización en Madeira. Ayuda a comercios y vecinos de la isla a entender y usar Bitcoin.",
      pt: "Organização na Madeira. Ajuda comércios e vizinhos da ilha a entender e usar Bitcoin.",
      en: "An organization in Madeira. It helps shops and neighbors on the island understand and use Bitcoin.",
    },
  },
  "circ:lugano-plan-b": {
    city: { es: "Lugano, Suiza", pt: "Lugano, Suíça", en: "Lugano, Switzerland" },
    text: {
      es: "Plan de la ciudad de Lugano, junto con Tether, para usar Bitcoin en la vida diaria, incluso en impuestos. Incluye educación.",
      pt: "Plano da cidade de Lugano, junto com a Tether, para usar Bitcoin no dia a dia, inclusive em impostos. Inclui educação.",
      en: "A plan by the city of Lugano, with Tether, to use Bitcoin in daily life, including taxes. It includes education.",
    },
  },
  "circ:montanha-bitcoin-brazil": {
    city: { es: "São Tomé das Letras, Brasil", pt: "São Tomé das Letras, Brasil", en: "São Tomé das Letras, Brazil" },
    text: {
      es: "En São Tomé das Letras, Minas Gerais, buscan una economía circular de Bitcoin en el pueblo, al estilo de Praia Bitcoin.",
      pt: "Em São Tomé das Letras, Minas Gerais, buscam uma economia circular de Bitcoin na cidade, no estilo da Praia Bitcoin.",
      en: "In São Tomé das Letras, Minas Gerais, they want a Bitcoin circular economy in the town, in the style of Praia Bitcoin.",
    },
  },
  "circ:praia-bitcoin-brazil": {
    city: { es: "Jericoacoara, Brasil", pt: "Jericoacoara, Brasil", en: "Jericoacoara, Brazil" },
    text: {
      es: "En Jericoacoara, Ceará, buscan que el pueblo use Bitcoin en la vida diaria.",
      pt: "Em Jericoacoara, Ceará, buscam que a vila use Bitcoin no dia a dia.",
      en: "In Jericoacoara, Ceará, they want the village to use Bitcoin day to day.",
    },
  },
  "circ:puntabitcoin": {
    city: { es: "Punta del Este, Uruguay", pt: "Punta del Este, Uruguai", en: "Punta del Este, Uruguay" },
    text: {
      es: "En Punta del Este conectan Bitcoin con comercios, educación y proyectos del lugar. Forma parte de Bemlocal.",
      pt: "Em Punta del Este ligam o Bitcoin a comércios, educação e projetos do lugar. Faz parte da Bemlocal.",
      en: "In Punta del Este they connect Bitcoin with local shops, education and projects. It is part of Bemlocal.",
    },
  },
};

export function circularText(id: string, lang: CircLang): string {
  return CIRCULAR_COPY[id]?.text[lang] || CIRCULAR_COPY[id]?.text.es || "";
}

export function circularCity(id: string, lang: CircLang): string {
  return CIRCULAR_COPY[id]?.city[lang] || CIRCULAR_COPY[id]?.city.es || "";
}

export function circularMail(lang: CircLang): string {
  if (lang === "en") return "Email";
  if (lang === "pt") return "E-mail";
  return "Correo";
}

export function circularByline(lang: CircLang, name: string): string {
  if (lang === "en") return `Run by ${name}`;
  if (lang === "pt") return `Responsável: ${name}`;
  return `A cargo de ${name}`;
}
