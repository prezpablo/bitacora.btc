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

export const QUIZ_POSTERS = [
  "/repaso/1.jpg",
  "/repaso/2.jpg",
  "/repaso/3.jpg",
  "/repaso/4.jpg",
  "/repaso/5.jpg",
  "/repaso/6.jpg",
  "/repaso/7.jpg",
  "/repaso/8.jpg",
  "/repaso/9.jpg",
  "/repaso/10.jpg",
] as const;

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
      o("open", true, "Un espacio abierto para ver comunidades y comercios.", "An open space to see communities and shops.", "Um espaço aberto para ver comunidades e comércios."),
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
      o("pizza", false, "Laszlo pagó 10.000 BTC por una pizza.", "Laszlo paid 10,000 BTC for a pizza.", "Laszlo pagou 10.000 BTC por uma pizza."),
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
      o("pizza", true, "Laszlo pagó 10.000 BTC por pizza.", "Laszlo paid 10,000 BTC for pizza.", "Laszlo pagou 10.000 BTC por pizza."),
      o("hal", false, "Satoshi envió 10 BTC a Hal Finney.", "Satoshi sent 10 BTC to Hal Finney.", "Satoshi enviou 10 BTC a Hal Finney."),
      o("half", false, "El premio del bloque pasó de 50 a 25.", "The block prize went from 50 to 25.", "O prêmio do bloco passou de 50 para 25."),
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
    es: "¿Qué hace minar?",
    en: "What does mining do?",
    pt: "O que a mineração faz?",
    options: [
      o("list", true, "Anota quién le pagó a quién. No imprime billetes.", "It records who paid whom. It does not print bills.", "Anota quem pagou a quem. Não imprime notas."),
      o("print", false, "Fabrica billetes.", "It prints bills.", "Fabrica notas."),
      o("wage", false, "Paga un sueldo todos los días.", "It pays a wage every day.", "Paga um salário todo dia."),
      o("fx", false, "Fija el precio del dólar.", "It sets the dollar price.", "Define o preço do dólar."),
    ],
  },
  {
    id: "search",
    multi: false,
    es: "¿Qué hace la máquina al buscar?",
    en: "What does the machine do while searching?",
    pt: "O que a máquina faz ao buscar?",
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
    es: "¿Cuál es el premio de hoy?",
    en: "What is today's prize?",
    pt: "Qual é o prêmio de hoje?",
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
    es: "¿Qué pasa cerca de 2028?",
    en: "What happens around 2028?",
    pt: "O que acontece perto de 2028?",
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
    es: "Si la luz es cara, ¿qué pasa?",
    en: "If power is expensive, what happens?",
    pt: "Se a luz é cara, o que acontece?",
    options: [
      o("bill", true, "La boleta sale más cara que lo que entra.", "The bill costs more than what comes in.", "A conta sai mais cara do que entra."),
      o("always", false, "Siempre alcanza para pagar la máquina.", "It always covers the machine.", "Sempre dá para pagar a máquina."),
      o("print", false, "Minar imprime la diferencia.", "Mining prints the difference.", "Minerar imprime a diferença."),
      o("raise", false, "El premio sube para cubrir la luz.", "The prize rises to cover the power.", "O prêmio sobe para cobrir a luz."),
    ],
  },
  {
    id: "flags",
    multi: true,
    es: "Si te lo ofrecen para invertir en minado, ¿cuáles no son minería?",
    en: "If someone offers these as a mining investment, which ones are not mining?",
    pt: "Se oferecerem isto para investir em mineração, quais não são mineração?",
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
    es: "¿Qué muestra Bitcoin hoy?",
    en: "What does Bitcoin today show?",
    pt: "O que o Bitcoin hoje mostra?",
    options: [
      o("news", true, "Noticias del día, traducidas. El original queda entre paréntesis.", "The day's news, translated. The original stays in parentheses.", "Notícias do dia, traduzidas. O original fica entre parênteses."),
      o("tomorrow", false, "El precio de mañana.", "Tomorrow's price.", "O preço de amanhã."),
      o("bill", false, "Tu boleta de luz.", "Your power bill.", "A sua conta de luz."),
      o("map", false, "El mapa de comercios.", "The shop map.", "O mapa de comércios."),
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
