import type { AppLang } from "@/lib/locale";

export type LegalBlock = {
  id?: string;
  title: string;
  body: string;
  table?: { head: string[]; rows: string[][] };
};

const es: { lead: string; blocks: LegalBlock[] } = {
  lead: "Bitácora.btc es una bitácora comunitaria impulsada desde Colonia del Sacramento, Uruguay. No es un exchange, no custodia fondos y no abre cuentas. El régimen primario es la Ley n.º 18.331 de Protección de Datos Personales y Acción de Habeas Data, reglamentada por el Decreto n.º 414/009, con control de la URCDP. Si nos escribís o publicás desde el Espacio Económico Europeo, además aplican el RGPD (UE 2016/679) y la Directiva ePrivacy. Este texto cumple el deber de información del art. 13 de la Ley 18.331. Describe lo que el sitio hace hoy: no es un certificado de conformidad ni un dictamen jurídico.",
  blocks: [
    {
      title: "Aviso legal · responsable",
      id: "aviso",
      body: "La marca del sitio es Bitácora.btc. El responsable del tratamiento es una persona física, con domicilio en Colonia del Sacramento, Departamento de Colonia, República Oriental del Uruguay, en el marco de la iniciativa Consciencia Bitcoin by LATAM Cripto Mom. La identidad civil consta en la inscripción ante la URCDP y se facilita a quien ejerza derechos, acreditando la suya, por el formulario de Contacto.\n\nNo hay Delegado de Protección de Datos designado: no resulta obligatorio para este volumen y esta finalidad. No hay representante en la Unión Europea (art. 27 RGPD). El servicio se ofrece desde Uruguay a la comunidad bitcoiner de Latinoamérica; si se dirigiera de forma efectiva al mercado del EEE, se designará representante.\n\nEl canal para notificaciones y para ejercer derechos es el formulario de Contacto de este sitio. No hay registro de usuarios, no hay autenticación, no hay custodia de fondos ni vinculación de billeteras.",
    },
    {
      title: "Qué datos se tratan y para qué",
      id: "privacidad",
      body: "Se aplica el principio de minimización (arts. 7 y 8 de la Ley 18.331): solo lo necesario para cada finalidad, veraz y no excesivo. No hay scoring de personas, no se venden datos y no hay publicidad comportamental.\n\nNo recabamos contraseñas, documentos de identidad, datos biométricos, historial financiero ni claves de criptoactivos. El directorio público no incluye correo ni teléfono de particulares: solo redes sociales o identificadores que vos publicás.",
      table: {
        head: ["Interacción", "Datos", "Base (Ley 18.331)", "Conservación"],
        rows: [
          [
            "Contacto",
            "Nombre, correo, motivo y mensaje",
            "Consentimiento libre, previo, expreso e informado (art. 9), documentado con la casilla del formulario",
            "Hasta 12 meses, salvo reclamo o obligación legal",
          ],
          [
            "Mapa / fichas",
            "Nombre del lugar, descripción, dirección, horarios, redes, URL de logo, coordenadas, votos",
            "Consentimiento al publicar un directorio abierto (art. 9). Lo que cargás se hace público",
            "Mientras la ficha exista. El historial de GitHub puede persistir",
          ],
          [
            "Anuncios comunitarios",
            "Nombre, texto, URL de prueba y redes, código CARGA",
            "Consentimiento al publicar, con caducidad semanal",
            "7 días en el tablero. El código queda en el servidor, no en el CSV público",
          ],
          [
            "Ubicación GPS",
            "Coordenadas del dispositivo",
            "Consentimiento del navegador. No se activa sola",
            "No se guarda en el servidor; solo centra el mapa en tu sesión",
          ],
          [
            "Ciudad por IP",
            "Ciudad aproximada (GeoJS / ipwho.is)",
            "Consentimiento: extras del dispositivo o el botón de ubicación",
            "No se persiste. La IP de abuso se reduce a un hash",
          ],
          [
            "Seguridad",
            "Hash de IP, ticket de captcha, tope de envíos",
            "Necesario para prestar el servicio y mitigar spam o ataques (no es telemetría ni analítica)",
            "Ventana corta del tope (horas). El captcha caduca",
          ],
          [
            "Este dispositivo",
            "Idioma; si aceptás, apodo y caché del mapa",
            "Idioma: necesario para mostrar el sitio. El resto, consentimiento del banner (ePrivacy)",
            "Hasta que borres los datos del navegador o elijas «Solo necesario»",
          ],
        ],
      },
    },
    {
      title: "Transferencias, terceros e inmutabilidad",
      body: "El tratamiento se hace en un servidor contratado (VPS Njalla) y en tu navegador. Hay encargados y destinatarios fuera de Uruguay y, en algunos casos, fuera del Espacio Económico Europeo:\n\nGitHub (EE.UU.) aloja el CSV público del mapa y de los anuncios, sin códigos CARGA ni correos. FormSubmit reenvía el formulario de Contacto hacia Gmail. Nominatim/OpenStreetMap resuelve direcciones. GeoJS o ipwho.is estiman ciudad si lo autorizás. APIs de mercado y de eventos alimentan el desk (precio, on-chain, agenda). No hay Cláusulas Contractuales Tipo ni evaluación de impacto de transferencias documentada: si hay titulares en la UE, esa es una brecha a cerrar. La casilla de privacidad documenta tu consentimiento a estas transferencias (art. 23 A de la Ley 18.331).\n\nLo que publicás en el mapa, en GitHub o en una red pública (Nostr, Lightning, cadena) no se puede borrar del todo. El derecho de supresión se ejerce sobre nuestras copias; el historial abierto y las redes públicas escapan a un olvido absoluto. Eso se informa antes de publicar.",
    },
    {
      title: "Derechos",
      body: "Podés ejercer acceso, rectificación, actualización, inclusión y supresión (arts. 14 a 16 de la Ley 18.331) y, si el RGPD resulta aplicable, también limitación, portabilidad y oposición, y a no ser objeto de una decisión automatizada: aquí no hay scoring de personas.\n\nEl pedido se hace por el formulario de Contacto, acreditando identidad. Responderemos en los plazos legales. Reclamo ante la URCDP (Uruguay) y, en la UE, ante la autoridad de control del art. 77 RGPD.\n\nLa inscripción de la base de contacto y de seguridad ante la URCDP está en trámite de presentación. El directorio del mapa, por ser un listado público que vos mismo publicás, se informa como tal en esa presentación.",
    },
    {
      title: "Almacenamiento en el terminal (cookies)",
      id: "cookies",
      body: "No usamos cookies de analítica, de publicidad ni de redes sociales de terceros. No hay gtag, píxel ni CMP de marketing.\n\nSí hay localStorage: el idioma (necesario para prestar el servicio) y, solo si aceptás en el aviso de este dispositivo, el apodo y la caché del mapa. Eso es almacenamiento en el terminal (art. 5.3 ePrivacy). El banner permite «Solo necesario» o aceptar la caché. Las tipografías se sirven desde este sitio (no Google Fonts). La ciudad por IP no se pide hasta que aceptás extras o usás el botón de ubicación.\n\nPara retirar el consentimiento: «Solo necesario» en el aviso, o borrar los datos de este sitio en el navegador.",
    },
    {
      title: "Accesibilidad",
      id: "accesibilidad",
      body: "La soberanía tecnológica incluye poder usar el sitio con teclado y lector de pantalla. No declaramos conformidad WCAG 2.2 AA ni con la Directiva (UE) 2019/882: hay brechas abiertas y este texto no es un certificado.\n\nHoy: enlace de salto al contenido, selector de idioma con aria, landmarks parciales, QR con texto alternativo y navegación etiquetada.\n\nBrechas en curso: el captcha es visual y no tiene alternativa no visual (WCAG 1.1.1 / 1.4.5); el globo 3D y el gráfico de velas no son usables con teclado ni lector; imágenes de eventos con alt vacío; errores de formulario no ligados al campo (3.3.1); algunos controles pueden fallar el tamaño mínimo de 24 px (2.5.8); el globo no respeta prefers-reduced-motion.\n\nPlan: avisos aria-live en formularios, captcha no visual (pregunta o Turnstile), alternativa textual al globo y a las velas, reduced-motion y contraste verificado del naranja Bitcoin.",
    },
    {
      title: "Menores",
      body: "El servicio no está dirigido a menores de 18 años (mayoría de edad en Uruguay) ni, para visitantes del EEE, a menores de 16 (art. 8 RGPD). No verificamos edad. Si un adulto acredita que recabamos datos de un menor, los suprimimos.",
    },
  ],
};

const en: { lead: string; blocks: LegalBlock[] } = {
  lead: "Bitácora.btc is a community logbook run from Colonia del Sacramento, Uruguay. It is not an exchange, it does not custody funds and it does not open accounts. The primary law is Uruguay’s Act 18.331 on Personal Data Protection and Habeas Data, regulated by Decree 414/009, under the URCDP. If you write to us or publish from the European Economic Area, the GDPR (EU 2016/679) and the ePrivacy Directive also apply. This notice meets the information duty in art. 13 of Act 18.331. It describes what the site does today. It is not a certificate of compliance or legal advice.",
  blocks: [
    {
      title: "Legal notice · controller",
      id: "aviso",
      body: "The site’s brand is Bitácora.btc. The controller is a natural person, domiciled in Colonia del Sacramento, Department of Colonia, Oriental Republic of Uruguay, under the Consciencia Bitcoin by LATAM Cripto Mom initiative. The controller’s civil identity is filed with the URCDP and is provided to anyone exercising their rights, after proving their own identity, via the Contact form.\n\nNo Data Protection Officer is appointed: it is not required at this scale. There is no EU representative (GDPR art. 27). The service is offered from Uruguay to the Latin-American bitcoiner community; if it is later aimed at the EEA market, a representative will be designated.\n\nNotices and rights requests go through this site’s Contact form. There is no user registration, no authentication, no custody of funds and no wallet linking.",
    },
    {
      title: "What data we process and why",
      id: "privacidad",
      body: "We apply data minimisation (arts. 7 and 8 of Act 18.331): only what is needed for each purpose, accurate and not excessive. We do not score people, sell data or run behavioural ads.\n\nWe do not collect passwords, identity documents, biometrics, financial history or crypto keys. The public directory does not include private email or phone numbers: only socials or identifiers you publish.",
      table: {
        head: ["Interaction", "Data", "Legal basis (Act 18.331)", "Retention"],
        rows: [
          [
            "Contact",
            "Name, email, topic and message",
            "Free, prior, express and informed consent (art. 9), recorded by the form checkbox",
            "Up to 12 months, unless a claim or legal duty requires more",
          ],
          [
            "Map / listings",
            "Place name, description, address, hours, socials, logo URL, coordinates, votes",
            "Consent to publish an open directory (art. 9). What you upload is public",
            "While the listing exists. GitHub history may persist",
          ],
          [
            "Community announcements",
            "Name, text, proof URL and socials, CARGA code",
            "Consent to publish, weekly TTL",
            "7 days on the board. The code stays on the server, not in the public CSV",
          ],
          [
            "GPS location",
            "Device coordinates",
            "Browser permission. It does not run on its own",
            "Not stored on the server; it only centres the map in your session",
          ],
          [
            "City by IP",
            "Approximate city (GeoJS / ipwho.is)",
            "Consent: device extras or the locate button",
            "Not persisted. Abuse IPs are reduced to a hash",
          ],
          [
            "Security",
            "IP hash, captcha ticket, send limits",
            "Necessary to run the service and mitigate spam or attacks (not telemetry or analytics)",
            "Short rate-limit window (hours). Captcha expires",
          ],
          [
            "This device",
            "Language; if you accept, nick and map cache",
            "Language: necessary to render the site. The rest, banner consent (ePrivacy)",
            "Until you clear site data or choose “Necessary only”",
          ],
        ],
      },
    },
    {
      title: "Transfers, processors and immutability",
      body: "Processing runs on a contracted server (Njalla VPS) and in your browser. Processors and recipients sit outside Uruguay and, in some cases, outside the EEA:\n\nGitHub (US) hosts the public map and announcement CSV, without CARGA codes or emails. FormSubmit forwards the Contact form to Gmail. Nominatim/OpenStreetMap resolves addresses. GeoJS or ipwho.is estimate city if you allow it. Market and event APIs feed the desk. No Standard Contractual Clauses or transfer impact assessment are on file: if there are EU data subjects, that is a gap. The privacy checkbox records your consent to these transfers (Act 18.331 art. 23 A).\n\nWhat you publish on the map, on GitHub or on a public network (Nostr, Lightning, chain) cannot be fully erased. Erasure applies to our copies; open history and public networks are beyond absolute oblivion. That is stated before you publish.",
    },
    {
      title: "Rights",
      body: "You may exercise access, rectification, update, inclusion and erasure (arts. 14 to 16 of Act 18.331) and, where the GDPR applies, also restriction, portability and objection, and not to be subject to automated decision-making: we do not score people.\n\nRequests go through the Contact form, with proof of identity. We will answer within the legal time limits. You may complain to the URCDP (Uruguay) and, in the EU, to the supervisory authority under GDPR art. 77.\n\nRegistration of the contact and security database with the URCDP is being prepared. The map directory, as a public listing you yourself publish, is disclosed as such in that filing.",
    },
    {
      title: "Storage on the device (cookies)",
      id: "cookies",
      body: "We do not use analytics, advertising or third-party social cookies. There is no gtag, pixel or marketing CMP.\n\nWe do use localStorage: language (necessary to provide the service) and, only if you accept in the device notice, nick and map cache. That is terminal storage (ePrivacy art. 5.3). The banner lets you choose “Necessary only” or accept the cache. Fonts are served from this site (not Google Fonts). City-by-IP is not requested until you accept extras or use the locate button.\n\nTo withdraw consent: “Necessary only” on the notice, or clear this site’s data in the browser.",
    },
    {
      title: "Accessibility",
      id: "accesibilidad",
      body: "Technological sovereignty includes using the site with a keyboard and a screen reader. We do not declare WCAG 2.2 AA or Directive (EU) 2019/882 conformity: gaps remain and this text is not a certificate.\n\nToday: skip link to main, language control with aria, partial landmarks, QR alt text and a labelled nav.\n\nOpen gaps: the captcha is visual with no non-visual alternative (WCAG 1.1.1 / 1.4.5); the 3D globe and candle chart are not keyboard- or screen-reader usable; event images with empty alt; form errors not tied to fields (3.3.1); some controls may fail the 24 px minimum (2.5.8); the globe ignores prefers-reduced-motion.\n\nPlan: aria-live on forms, a non-visual captcha (question or Turnstile), a text alternative to the globe and candles, reduced-motion and a contrast check on Bitcoin orange.",
    },
    {
      title: "Children",
      body: "The service is not directed at persons under 18 (age of majority in Uruguay) nor, for EEA visitors, at persons under 16 (GDPR art. 8). We do not verify age. If an adult shows that we collected a child’s data, we erase it.",
    },
  ],
};

const pt: { lead: string; blocks: LegalBlock[] } = {
  lead: "A Bitácora.btc é uma bitácora comunitária impulsionada a partir de Colonia del Sacramento, Uruguai. Não é um exchange, não custodia fundos e não abre contas. O regime primário é a Lei n.º 18.331 de Proteção de Dados Pessoais e Ação de Habeas Data, regulamentada pelo Decreto n.º 414/009, com controlo da URCDP. Se nos escreves ou publicas a partir do Espaço Económico Europeu, aplicam-se também o RGPD (UE 2016/679) e a Diretiva ePrivacy. Este texto cumpre o dever de informação do art. 13.º da Lei 18.331. Descreve o que o sítio faz hoje: não é um certificado de conformidade nem aconselhamento jurídico.",
  blocks: [
    {
      title: "Aviso legal · responsável",
      id: "aviso",
      body: "A marca do sítio é Bitácora.btc. O responsável pelo tratamento é uma pessoa física, com domicílio em Colonia del Sacramento, Departamento de Colonia, República Oriental do Uruguai, no âmbito da iniciativa Consciencia Bitcoin by LATAM Cripto Mom. A identidade civil consta da inscrição perante a URCDP e faculta-se a quem exercer direitos, mediante prova da sua, pelo formulário de Contacto.\n\nNão há Encarregado de Proteção de Dados nomeado: não é obrigatório neste volume. Não há representante na União Europeia (art. 27.º RGPD). O serviço oferece-se a partir do Uruguai à comunidade bitcoiner da América Latina; se se dirigir de forma efetiva ao mercado do EEE, será designado representante.\n\nO canal para notificações e para exercer direitos é o formulário de Contacto deste sítio. Não há registo de utilizadores, não há autenticação, não há custódia de fundos nem vinculação de carteiras.",
    },
    {
      title: "Que dados se tratam e para quê",
      id: "privacidad",
      body: "Aplica-se o princípio de minimização (arts. 7.º e 8.º da Lei 18.331): só o necessário para cada finalidade, veraz e não excessivo. Não há scoring de pessoas, não se vendem dados e não há publicidade comportamental.\n\nNão recolhemos palavras-passe, documentos de identidade, biometria, historial financeiro nem chaves de criptoativos. O diretório público não inclui correio nem telefone de particulares: só redes sociais ou identificadores que tu publicas.",
      table: {
        head: ["Interação", "Dados", "Base (Lei 18.331)", "Conservação"],
        rows: [
          [
            "Contacto",
            "Nome, correio, motivo e mensagem",
            "Consentimento livre, prévio, expresso e informado (art. 9.º), documentado com a caixa do formulário",
            "Até 12 meses, salvo reclamação ou obrigação legal",
          ],
          [
            "Mapa / fichas",
            "Nome do lugar, descrição, morada, horários, redes, URL do logo, coordenadas, votos",
            "Consentimento ao publicar um diretório aberto (art. 9.º). O que carregas torna-se público",
            "Enquanto a ficha existir. O histórico do GitHub pode persistir",
          ],
          [
            "Anúncios comunitários",
            "Nome, texto, URL de prova e redes, código CARGA",
            "Consentimento ao publicar, com caducidade semanal",
            "7 dias no quadro. O código fica no servidor, não no CSV público",
          ],
          [
            "Localização GPS",
            "Coordenadas do dispositivo",
            "Consentimento do browser. Não se ativa sozinha",
            "Não se guarda no servidor; só centra o mapa na sessão",
          ],
          [
            "Cidade por IP",
            "Cidade aproximada (GeoJS / ipwho.is)",
            "Consentimento: extras do dispositivo ou o botão de localização",
            "Não se persiste. O IP de abuso reduz-se a um hash",
          ],
          [
            "Segurança",
            "Hash de IP, ticket de captcha, limite de envios",
            "Necessário para prestar o serviço e mitigar spam ou ataques (não é telemetria nem analítica)",
            "Janela curta do limite (horas). O captcha caduca",
          ],
          [
            "Este dispositivo",
            "Idioma; se aceitares, alcunha e cache do mapa",
            "Idioma: necessário para mostrar o sítio. O resto, consentimento do aviso (ePrivacy)",
            "Até apagares os dados do browser ou escolheres «Só necessário»",
          ],
        ],
      },
    },
    {
      title: "Transferências, terceiros e imutabilidade",
      body: "O tratamento faz-se num servidor contratado (VPS Njalla) e no teu browser. Há encarregados e destinatários fora do Uruguai e, em alguns casos, fora do EEE:\n\nO GitHub (EUA) aloja o CSV público do mapa e dos anúncios, sem códigos CARGA nem correios. O FormSubmit reenvia o formulário de Contacto para o Gmail. O Nominatim/OpenStreetMap resolve moradas. O GeoJS ou o ipwho.is estimam a cidade se o autorizares. APIs de mercado e de eventos alimentam o desk. Não há Cláusulas Contratuais-Tipo nem avaliação de impacto de transferências documentada: se houver titulares na UE, essa é uma falha a fechar. A caixa de privacidade documenta o teu consentimento a estas transferências (art. 23.º A da Lei 18.331).\n\nO que publicas no mapa, no GitHub ou numa rede pública (Nostr, Lightning, cadeia) não se pode apagar por completo. O direito de apagamento exerce-se sobre as nossas cópias; o histórico aberto e as redes públicas escapam a um esquecimento absoluto. Isso informa-se antes de publicar.",
    },
    {
      title: "Direitos",
      body: "Podes exercer acesso, retificação, atualização, inclusão e apagamento (arts. 14.º a 16.º da Lei 18.331) e, se o RGPD for aplicável, também limitação, portabilidade e oposição, e a não ser objeto de uma decisão automatizada: aqui não há scoring de pessoas.\n\nO pedido faz-se pelo formulário de Contacto, com prova de identidade. Responderemos nos prazos legais. Reclamação perante a URCDP (Uruguai) e, na UE, perante a autoridade de controlo do art. 77.º RGPD.\n\nA inscrição da base de contacto e de segurança perante a URCDP está em preparação. O diretório do mapa, por ser uma lista pública que tu próprio publicas, informa-se como tal nessa apresentação.",
    },
    {
      title: "Armazenamento no terminal (cookies)",
      id: "cookies",
      body: "Não usamos cookies de analítica, de publicidade nem de redes sociais de terceiros. Não há gtag, pixel nem CMP de marketing.\n\nHá localStorage: o idioma (necessário para prestar o serviço) e, só se aceitares no aviso deste dispositivo, a alcunha e a cache do mapa. Isso é armazenamento no terminal (art. 5.º, n.º 3 ePrivacy). O aviso permite «Só necessário» ou aceitar a cache. As tipografias vêm deste sítio (não Google Fonts). A cidade por IP não se pede até aceitares extras ou usares o botão de localização.\n\nPara retirar o consentimento: «Só necessário» no aviso, ou apagar os dados deste sítio no browser.",
    },
    {
      title: "Acessibilidade",
      id: "accesibilidad",
      body: "A soberania tecnológica inclui poder usar o sítio com teclado e leitor de ecrã. Não declaramos conformidade WCAG 2.2 AA nem com a Diretiva (UE) 2019/882: há falhas abertas e este texto não é um certificado.\n\nHoje: ligação de salto para o conteúdo, seletor de idioma com aria, landmarks parciais, QR com texto alternativo e navegação etiquetada.\n\nFalhas em curso: o captcha é visual e não tem alternativa não visual (WCAG 1.1.1 / 1.4.5); o globo 3D e o gráfico de velas não são usáveis com teclado nem leitor; imagens de eventos com alt vazio; erros de formulário não ligados ao campo (3.3.1); alguns controlos podem falhar os 24 px (2.5.8); o globo ignora prefers-reduced-motion.\n\nPlano: avisos aria-live nos formulários, captcha não visual (pergunta ou Turnstile), alternativa textual ao globo e às velas, reduced-motion e contraste verificado do laranja Bitcoin.",
    },
    {
      title: "Menores",
      body: "O serviço não se dirige a menores de 18 anos (maioridade no Uruguai) nem, para visitantes do EEE, a menores de 16 (art. 8.º RGPD). Não verificamos idade. Se um adulto provar que recolhemos dados de um menor, apagamo-los.",
    },
  ],
};

export const LEGAL_EU: Record<AppLang, { lead: string; blocks: LegalBlock[] }> = { es, en, pt };
