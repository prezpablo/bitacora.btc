import type { AppLang } from "@/lib/locale";

export type QuizOption = {
  id: string;
  correct: boolean;
  es: string;
  en: string;
  pt: string;
};

export type QuizQuestion = {
  id: string;
  multi: boolean;
  es: string;
  en: string;
  pt: string;
  options: QuizOption[];
};

export const QUIZ_POSTERS = Array.from({ length: 21 }, (_, i) => `/repaso/v/${String(i + 1).padStart(2, "0")}.jpg`);

const o = (id: string, correct: boolean, es: string, en: string, pt: string): QuizOption => ({
  id,
  correct,
  es,
  en,
  pt,
});

export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: "bitacora",
    multi: false,
    es: "¿Qué es Bitácora?",
    en: "What is Bitácora?",
    pt: "O que é a Bitácora?",
    options: [
      o("open", true, "Un espacio abierto para aprender, ver y contactar comunidades y comercios, y participar de eventos, estés donde estés.", "An open space to learn, see and contact communities and shops, and join events, wherever you are.", "Um espaço aberto para aprender, ver e contactar comunidades e comércios, e participar de eventos, esteja onde estiver."),
      o("exchange", false, "Una casa de cambio.", "An exchange.", "Uma casa de câmbio."),
      o("bank", false, "Un banco.", "A bank.", "Um banco."),
      o("wallet", false, "Una billetera que guarda tus monedas.", "A wallet that holds your coins.", "Uma carteira que guarda as suas moedas."),
    ],
  },
  {
    id: "colonia",
    multi: false,
    es: "¿Dónde empezó Consciencia Bitcoin?",
    en: "Where did Consciencia Bitcoin start?",
    pt: "Onde começou a Consciencia Bitcoin?",
    options: [
      o("colonia", true, "En Colonia del Sacramento, Uruguay.", "In Colonia del Sacramento, Uruguay.", "Em Colonia del Sacramento, Uruguai."),
      o("zonte", false, "En El Zonte.", "In El Zonte.", "Em El Zonte."),
      o("madrid", false, "En Madrid.", "In Madrid.", "Em Madrid."),
      o("only-ba", false, "Solo en Buenos Aires.", "Only in Buenos Aires.", "Só em Buenos Aires."),
    ],
  },
  {
    id: "genesis",
    multi: false,
    es: "¿Qué quedó escrito en el bloque génesis?",
    en: "What was written into the genesis block?",
    pt: "O que ficou escrito no bloco gênese?",
    options: [
      o("times", true, "Un titular sobre el rescate a los bancos.", "A headline about the bank bailout.", "Uma manchete sobre o resgate aos bancos."),
      o("pizza", false, "El precio de una pizza.", "The price of a pizza.", "O preço de uma pizza."),
      o("bill", false, "Una boleta de luz.", "A power bill.", "Uma conta de luz."),
      o("hal", false, "El nombre de Hal Finney.", "Hal Finney's name.", "O nome de Hal Finney."),
    ],
  },
  {
    id: "first-tx",
    multi: false,
    es: "¿Cuál fue la primera transacción?",
    en: "What was the first transaction?",
    pt: "Qual foi a primeira transação?",
    options: [
      o("hal", true, "Satoshi envió 10 BTC a Hal Finney.", "Satoshi sent 10 BTC to Hal Finney.", "Satoshi enviou 10 BTC a Hal Finney."),
      o("pizza", false, "Laszlo pagó 10.000 BTC por 2 pizzas.", "Laszlo paid 10,000 BTC for 2 pizzas.", "Laszlo pagou 10.000 BTC por 2 pizzas."),
      o("half", false, "El premio bajó de 50 a 25 BTC.", "The prize fell from 50 to 25 BTC.", "O prêmio caiu de 50 para 25 BTC."),
      o("machine", false, "Alguien compró una máquina.", "Someone bought a machine.", "Alguém comprou uma máquina."),
    ],
  },
  {
    id: "pizza",
    multi: false,
    es: "¿Qué pasó el 22 de mayo de 2010?",
    en: "What happened on 22 May 2010?",
    pt: "O que aconteceu em 22 de maio de 2010?",
    options: [
      o("pizza", true, "Laszlo pagó 10.000 BTC por 2 pizzas.", "Laszlo paid 10,000 BTC for 2 pizzas.", "Laszlo pagou 10.000 BTC por 2 pizzas."),
      o("hal", false, "Satoshi envió 10 BTC a Hal Finney.", "Satoshi sent 10 BTC to Hal Finney.", "Satoshi enviou 10 BTC a Hal Finney."),
      o("half", false, "El premio del bloque pasó de 50 a 25 BTC.", "The block prize went from 50 to 25 BTC.", "O prêmio do bloco passou de 50 para 25 BTC."),
      o("colony", false, "Empezó Consciencia Bitcoin en Colonia.", "Consciencia Bitcoin started in Colonia.", "A Consciencia Bitcoin começou em Colonia."),
    ],
  },
  {
    id: "halving",
    multi: false,
    es: "¿Qué hizo el primer halving?",
    en: "What did the first halving do?",
    pt: "O que fez o primeiro halving?",
    options: [
      o("cut", true, "Bajó el premio del bloque de 50 a 25 BTC.", "It cut the block prize from 50 to 25 BTC.", "Baixou o prêmio do bloco de 50 para 25 BTC."),
      o("double", false, "Duplicó el premio.", "It doubled the prize.", "Duplicou o prêmio."),
      o("off", false, "Apagó las máquinas.", "It turned the machines off.", "Desligou as máquinas."),
      o("free", false, "Dejó la luz gratis.", "It made power free.", "Deixou a luz de graça."),
    ],
  },
  {
    id: "mine",
    multi: false,
    es: "¿Qué hace un equipo de minado?",
    en: "What does a mining machine do?",
    pt: "O que faz um equipamento de mineração?",
    options: [
      o("list", true, "Anota en la cadena quién le pagó a quién. No imprime billetes.", "It records on the chain who paid whom. It does not print bills.", "Anota na cadeia quem pagou a quem. Não imprime notas."),
      o("print", false, "Fabrica billetes.", "It prints bills.", "Fabrica notas."),
      o("wage", false, "Paga un sueldo todos los días.", "It pays a wage every day.", "Paga um salário todo dia."),
      o("fx", false, "Fija el precio del dólar.", "It sets the dollar price.", "Define o preço do dólar."),
    ],
  },
  {
    id: "search",
    multi: false,
    es: "¿Qué hace el equipo para encontrar un bloque?",
    en: "What does the machine do to find a block?",
    pt: "O que o equipamento faz para achar um bloco?",
    options: [
      o("try", true, "Prueba números hasta que uno sirve.", "It tries numbers until one works.", "Testa números até um servir."),
      o("solve", false, "Resuelve una cuenta difícil.", "It solves a hard equation.", "Resolve uma conta difícil."),
      o("key", false, "Adivina tu clave.", "It guesses your key.", "Adivinha a sua chave."),
      o("copy", false, "Copia la boleta de luz.", "It copies the power bill.", "Copia a conta de luz."),
    ],
  },
  {
    id: "prize",
    multi: false,
    es: "¿Cuál es el premio al minar hoy?",
    en: "What is the mining prize today?",
    pt: "Qual é o prêmio ao minerar hoje?",
    options: [
      o("three", true, "Un poco más de 3 bitcoins, más una propina.", "A bit more than 3 bitcoin, plus a tip.", "Um pouco mais de 3 bitcoins, mais uma gorjeta."),
      o("print", false, "Lo que la máquina quiera imprimir.", "Whatever the machine wants to print.", "O que a máquina quiser imprimir."),
      o("double", false, "Siempre el doble.", "Always double.", "Sempre o dobro."),
      o("power", false, "Una parte de tu luz.", "A share of your power bill.", "Uma parte da sua luz."),
    ],
  },
  {
    id: "2028",
    multi: false,
    es: "¿Qué pasará cerca de 2028?",
    en: "What will happen around 2028?",
    pt: "O que vai acontecer perto de 2028?",
    options: [
      o("half", true, "El premio se reduce a la mitad. Es el halving.", "The prize is cut in half. That is the halving.", "O prêmio cai pela metade. É o halving."),
      o("double", false, "El premio se duplica.", "The prize doubles.", "O prêmio dobra."),
      o("off", false, "Se apagan todas las máquinas.", "Every machine turns off.", "Todas as máquinas desligam."),
      o("end", false, "Bitcoin deja de existir.", "Bitcoin stops existing.", "O Bitcoin deixa de existir."),
    ],
  },
  {
    id: "kwh",
    multi: false,
    es: "¿Qué es un kWh?",
    en: "What is a kWh?",
    pt: "O que é um kWh?",
    options: [
      o("hour", true, "La unidad de la boleta: una hora de consumo. No es un watt.", "The unit on the bill: one hour of use. Not a watt.", "A unidade da conta: uma hora de consumo. Não é um watt."),
      o("watt", false, "Un watt de la máquina.", "One watt of the machine.", "Um watt da máquina."),
      o("btc", false, "Un bitcoin.", "One bitcoin.", "Um bitcoin."),
      o("usd", false, "El precio del dólar.", "The dollar price.", "O preço do dólar."),
    ],
  },
  {
    id: "dear",
    multi: false,
    es: "Si la electricidad es cara, ¿qué pasa?",
    en: "If electricity is expensive, what happens?",
    pt: "Se a eletricidade está cara, o que acontece?",
    options: [
      o("bill", true, "La boleta de la máquina sale más cara que lo que entra.", "The machine's bill costs more than what comes in.", "A conta da máquina sai mais cara do que entra."),
      o("always", false, "Siempre alcanza para pagar la máquina.", "It always covers the machine.", "Sempre dá para pagar a máquina."),
      o("print", false, "Minar imprime la diferencia.", "Mining prints the difference.", "Minerar imprime a diferença."),
      o("raise", false, "El premio sube para cubrir la luz.", "The prize rises to cover the power.", "O prêmio sobe para cobrir a luz."),
    ],
  },
  {
    id: "flags",
    multi: true,
    es: "Si te ofrecen una inversión en minado, ¿cuáles de estas no son minería?",
    en: "If someone offers you a mining investment, which of these are not mining?",
    pt: "Se oferecerem um investimento em mineração, quais destas não são mineração?",
    options: [
      o("daily", true, "Te promete plata todos los días.", "It promises you money every day.", "Promete dinheiro todo dia."),
      o("withdraw", true, "Te pide plata para poder sacar la tuya.", "It asks for money before you can take yours out.", "Pede dinheiro para você poder sacar o seu."),
      o("try", false, "La máquina prueba números.", "The machine tries numbers.", "A máquina testa números."),
      o("kwh", false, "La luz se cobra por kWh.", "Power is billed per kWh.", "A luz é cobrada por kWh."),
    ],
  },
  {
    id: "today",
    multi: false,
    es: "¿Qué muestra la sección Bitcoin hoy?",
    en: "What does the Bitcoin today section show?",
    pt: "O que mostra a seção Bitcoin hoje?",
    options: [
      o("news", true, "Noticias del día, traducidas. El original queda entre paréntesis.", "The day's news, translated. The original stays in parentheses.", "Notícias do dia, traduzidas. O original fica entre parênteses."),
      o("tomorrow", false, "El precio de mañana.", "Tomorrow's price.", "O preço de amanhã."),
      o("bill", false, "Tu boleta de luz.", "Your power bill.", "A sua conta de luz."),
      o("map", false, "El mapa de comercios.", "The shop map.", "O mapa de comércios."),
    ],
  },
  {
    id: "paper",
    multi: false,
    es: "¿Qué publicó Satoshi en 2008?",
    en: "What did Satoshi publish in 2008?",
    pt: "O que Satoshi publicou em 2008?",
    options: [
      o("text", true, "Un texto de 9 páginas: dinero entre personas, sin banco.", "A 9-page text: money between people, with no bank.", "Um texto de 9 páginas: dinheiro entre pessoas, sem banco."),
      o("company", false, "Una empresa con jefe.", "A company with a boss.", "Uma empresa com chefe."),
      o("bank", false, "Un banco nuevo.", "A new bank.", "Um banco novo."),
      o("bill", false, "Una boleta de luz.", "A power bill.", "Uma conta de luz."),
    ],
  },
  {
    id: "cap",
    multi: false,
    es: "¿Cuántos bitcoin puede haber?",
    en: "How many bitcoin can there be?",
    pt: "Quantos bitcoin pode haver?",
    options: [
      o("max", true, "Como máximo 21 millones. Nadie puede imprimir más.", "21 million at most. Nobody can print more.", "No máximo 21 milhões. Ninguém pode imprimir mais."),
      o("bank", false, "Los que decida un banco.", "Whatever a bank decides.", "Os que um banco decidir."),
      o("double", false, "El doble cada año.", "Double every year.", "O dobro a cada ano."),
      o("machine", false, "Los que la máquina quiera.", "Whatever the machine wants.", "Os que a máquina quiser."),
    ],
  },
  {
    id: "block",
    multi: false,
    es: "¿Qué es un bloque?",
    en: "What is a block?",
    pt: "O que é um bloco?",
    options: [
      o("list", true, "La lista de pagos que anota la máquina que gana.", "The list of payments written by the machine that wins.", "A lista de pagamentos que o equipamento vencedor anota."),
      o("bill", false, "Un billete.", "A bill.", "Uma nota."),
      o("power", false, "Una boleta de luz.", "A power bill.", "Uma conta de luz."),
      o("fx", false, "El precio del dólar.", "The dollar price.", "O preço do dólar."),
    ],
  },
  {
    id: "light",
    multi: false,
    es: "¿Qué es Lightning?",
    en: "What is Lightning?",
    pt: "O que é a Lightning?",
    options: [
      o("pay", true, "Pagos rápidos encima de Bitcoin. No es otra moneda.", "Fast payments on top of Bitcoin. Not another coin.", "Pagamentos rápidos por cima do Bitcoin. Não é outra moeda."),
      o("bank", false, "Un banco.", "A bank.", "Um banco."),
      o("exchange", false, "Una casa de cambio.", "An exchange.", "Uma casa de câmbio."),
      o("coin", false, "Otra moneda, distinta de Bitcoin.", "Another coin, different from Bitcoin.", "Outra moeda, diferente do Bitcoin."),
    ],
  },
  {
    id: "keys",
    multi: false,
    es: "¿Qué quiere decir “no son tus llaves”?",
    en: "What does “not your keys” mean?",
    pt: "O que quer dizer “não são as suas chaves”?",
    options: [
      o("yours", true, "Si otro guarda tus bitcoin, no son tuyos.", "If someone else holds your bitcoin, they are not yours.", "Se outra pessoa guarda os seus bitcoin, eles não são seus."),
      o("power", false, "Que la electricidad está cara.", "That electricity is expensive.", "Que a eletricidade está cara."),
      o("double", false, "Que el premio se duplica.", "That the prize doubles.", "Que o prêmio dobra."),
      o("end", false, "Que Bitcoin deja de existir.", "That Bitcoin stops existing.", "Que o Bitcoin deixa de existir."),
    ],
  },
  {
    id: "beach",
    multi: false,
    es: "¿Qué mostró Bitcoin Beach, en El Zonte?",
    en: "What did Bitcoin Beach, in El Zonte, show?",
    pt: "O que o Bitcoin Beach, em El Zonte, mostrou?",
    options: [
      o("town", true, "Que un pueblo puede vivir usando bitcoin, sin banco.", "That a town can live using bitcoin, with no bank.", "Que um povoado pode viver usando bitcoin, sem banco."),
      o("colonia", false, "Que ahí empezó Consciencia Bitcoin.", "That Consciencia Bitcoin started there.", "Que a Consciencia Bitcoin começou ali."),
      o("half", false, "Que el premio pasó de 50 a 25.", "That the prize went from 50 to 25.", "Que o prêmio passou de 50 para 25."),
      o("name", false, "Que Satoshi firmó con su nombre.", "That Satoshi signed with his name.", "Que Satoshi assinou com o seu nome."),
    ],
  },
  {
    id: "logo",
    multi: false,
    es: "¿De dónde sale el logo naranja de Bitcoin?",
    en: "Where does Bitcoin's orange logo come from?",
    pt: "De onde vem o logo laranja do Bitcoin?",
    options: [
      o("bitboy", true, "El 1 de noviembre de 2010 bitboy lo publicó en BitcoinTalk y lo dejó en dominio público.", "On 1 November 2010 bitboy posted it on BitcoinTalk and released it into the public domain.", "A 1 de novembro de 2010 bitboy publicou no BitcoinTalk e deixou em domínio público."),
      o("paper", false, "Está dibujado en el white paper de 2008.", "It is drawn in the 2008 white paper.", "Está desenhado no white paper de 2008."),
      o("company", false, "Lo registró una empresa y cobra copyright.", "A company registered it and charges copyright.", "Uma empresa registrou e cobra copyright."),
      o("bank", false, "Lo impuso un banco como marca oficial.", "A bank imposed it as the official brand.", "Um banco impôs como marca oficial."),
    ],
  },
];

function shuffle<T>(items: T[], rand: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function drawQuiz(bank: QuizQuestion[], n: number, rand: () => number = Math.random): QuizQuestion[] {
  return shuffle(bank, rand)
    .slice(0, n)
    .map((q) => ({ ...q, options: shuffle(q.options, rand) }));
}

export function answerIsRight(question: QuizQuestion, picked: readonly string[]): boolean {
  const correct = question.options.filter((item) => item.correct).map((item) => item.id);
  if (picked.length !== correct.length) return false;
  return correct.every((id) => picked.includes(id));
}

export function quizPassed(score: number, total: number): boolean {
  return total > 0 && score / total > 0.5;
}

export function quizText(question: QuizQuestion | QuizOption, lang: AppLang): string {
  return question[lang];
}

/** Dígitos del contador retro. Rellena con ceros; si pasa el ancho, no recorta. */
export function tallyDigits(n: number, width = 6): string {
  const v = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  return String(v).padStart(width, "0");
}
