import type { AppLang } from "@/lib/locale";

export type LegalBlock = {
  id?: string;
  title: string;
  body: string;
  clauses?: { title: string; body: string }[];
  table?: { head: string[]; rows: string[][] };
};

const es: { lead: string; blocks: LegalBlock[] } = {
  lead: "Bitácora.btc es una bitácora comunitaria impulsada desde Colonia del Sacramento, Uruguay. No es un exchange, no custodia fondos y no abre cuentas. El régimen primario es la Ley n.º 18.331 de Protección de Datos Personales y Acción de Habeas Data, reglamentada por el Decreto n.º 414/009, con control de la URCDP. Si nos escribís o publicás desde el Espacio Económico Europeo, además aplican el RGPD (UE 2016/679) y la Directiva ePrivacy. Este texto cumple el deber de información del art. 13 de la Ley 18.331. Describe lo que el sitio hace hoy: no es un certificado de conformidad ni un dictamen jurídico.",
  blocks: [
    {
      title: "Aviso legal · responsable",
      id: "aviso",
      body: "La marca del sitio es Bitácora.btc. El responsable del tratamiento es una persona física, con domicilio en Colonia del Sacramento, Departamento de Colonia, República Oriental del Uruguay, en el marco de la iniciativa Consciencia Bitcoin by LATAM Cripto Mom. La identidad civil y el domicilio de notificación figuran en esta página. La inscripción ante la URCDP sigue en trámite. Quien ejerza derechos escribe a privacidad@bitacorabtc.org, sin captcha, acreditando la suya.\n\nNo hay Delegado de Protección de Datos: no es obligatorio (Ley n.º 19.670 art. 40 y Decreto n.º 64/020) porque no somos entidad pública, no tratamos datos sensibles como actividad principal ni operamos a gran escala. No hay representante en la Unión Europea (art. 27 RGPD). El servicio se ofrece desde Uruguay a la comunidad bitcoiner de Latinoamérica; si se dirigiera de forma efectiva al mercado del EEE, se designará representante.\n\nEl canal para notificaciones y para ejercer derechos es privacidad@bitacorabtc.org, sin captcha. No hay registro de usuarios, no hay autenticación, no hay custodia de fondos ni vinculación de billeteras. Bitácora.btc no es un Proveedor de Servicios de Activos Virtuales (Ley n.º 20.345).",
    },
        {
      title: "Términos y condiciones",
      id: "terminos",
      body: "Estas nueve reglas son las condiciones de uso.",
      clauses: [
        { title: "1. Aceptación", body: "Al usar el sitio aceptás estas reglas." },
        { title: "2. Qué no es", body: "Bitácora.btc no custodia, no intermedia y no administra llaves (Ley n.º 20.345: no es PSAV)." },
        { title: "3. Contenido de terceros", body: "El contenido del mapa y de los anuncios lo publican terceros. El responsable puede retirarlo si es ilícito, engañoso o viola estas reglas." },
        { title: "4. Carga de un comercio", body: "Quien carga o modifica un comercio declara que los datos son ciertos y es responsable de mantenerlos actualizados." },
        { title: "5. Verificación", body: "La verificación no cambia: el código CARGA se publica en un enlace público y el mapa se actualiza solo cuando esa prueba se comprueba." },
        { title: "6. Aportes y mapas", body: "Los aportes propios al directorio se publican bajo CC BY 4.0: se pueden copiar citando a Bitácora.btc. Los datos geográficos de OSM y BTC Map siguen ODbL (© OpenStreetMap contributors). El programa sigue en AGPL-3.0." },
        { title: "7. Mercado", body: "El módulo Mercado es información educativa: no es asesoramiento financiero ni recomendación de inversión." },
        { title: "8. Estrella de verificado", body: "La estrella de verificado indica dos enlaces públicos, un promedio alto con votos o la allowlist de fundación. No es un sello del BCU ni una garantía comercial." },
        { title: "9. Ley y tribunales", body: "Ley aplicable: República Oriental del Uruguay. Jurisdicción: tribunales de Uruguay. Privacidad: esta misma página, ancla Privacidad." },
      ],
    },
    {
      title: "Anexo · Brasil, Argentina y Europa",
      id: "anexo",
      body: "Si estás en Brasil, también puede aplicar la Lei n.º 13.709/2018 (LGPD). Si estás en Argentina, la Ley n.º 25.326. Si estás en el Espacio Económico Europeo, el RGPD (UE 2016/679) y la Directiva ePrivacy, en lo que resulte aplicable. El régimen que ordena este texto sigue siendo el uruguayo (Ley 18.331). No hay representante en la Unión Europea ni un encargado distinto en Brasil o Argentina: el responsable sigue en Colonia del Sacramento.",
    },
    {
      title: "Qué datos se tratan y para qué",
      id: "privacidad",
      body: "Se aplica el principio de minimización (arts. 7 y 8 de la Ley 18.331): solo lo necesario para cada finalidad, veraz y no excesivo. No hay scoring de personas, no se venden datos y no hay publicidad comportamental.\n\nNo recabamos contraseñas, documentos de identidad, datos biométricos, historial financiero ni claves de criptoactivos. El directorio público no incluye correo ni teléfono de particulares: solo redes sociales o identificadores que vos publicás.\n\nEl art. 2 de la Ley 18.331 alcanza también, en cuanto corresponda, a las personas jurídicas. Las fichas y los votos de comercios son datos de un tercero con efecto reputacional: el comercio puede pedir rectificación a privacidad@bitacorabtc.org.\n\nInformación del art. 13. El responsable es una persona física en Colonia del Sacramento, Uruguay; el nombre civil no se publica aquí hasta que esté cargado en esta página. Las finalidades son responder el contacto, publicar el directorio y limitar el abuso. Los destinatarios están en la sección de terceros. En Contacto, nombre, correo y mensaje son obligatorios: sin ellos no hay respuesta. En el mapa, el nombre es obligatorio para publicar. Podés pedir acceso, rectificación, actualización, inclusión y supresión, gratis, en 5 días hábiles, a privacidad@bitacorabtc.org. Conservación: contacto, 12 meses; anuncio, 7 días; código CARGA, 30 días; ficha, mientras exista.",
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
            "7 días en el tablero. El código CARGA se conserva 30 días y no sale en el CSV público",
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
            "No se persiste. Si hay abuso, se guarda un HMAC-SHA256 truncado de la IP: dato seudonimizado, no la IP en claro",
          ],
          [
            "Seguridad",
            "HMAC-SHA256 truncado de la IP (dato seudonimizado), ticket de captcha, tope de envíos",
            "Necesario para prestar el servicio y mitigar spam o ataques (no es telemetría ni analítica)",
            "Ventana del tope: 2 horas. El captcha caduca",
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
      id: "terceros",
      body: "El tratamiento se hace en un servidor contratado (VPS Njalla) y en tu navegador. Hay encargados y destinatarios fuera de Uruguay y, en algunos casos, fuera del Espacio Económico Europeo. La lista, con nombre y país, está debajo.\n\nGitHub (EE.UU.) aloja el CSV público del mapa y de los anuncios, sin códigos CARGA ni correos. FormSubmit reenvía el formulario de Contacto hacia Gmail. Nominatim/OpenStreetMap resuelve direcciones. GeoJS o ipwho.is estiman ciudad si lo autorizás. APIs de mercado y de eventos alimentan el desk (precio, on-chain, agenda). La casilla de privacidad documenta tu consentimiento a estas transferencias (art. 23 A de la Ley 18.331).\n\nLo que publicás en el mapa, en GitHub o en una red pública (Nostr, Lightning, cadena) no se puede borrar del todo. El derecho de supresión se ejerce sobre nuestras copias; el historial abierto y las redes públicas escapan a un olvido absoluto. Eso se informa antes de publicar.",
    },
    {
      title: "Derechos",
      id: "derechos",
      body: "Podés ejercer acceso, rectificación, actualización, inclusión y supresión (arts. 14 a 16 de la Ley 18.331) y, si el RGPD resulta aplicable, también limitación, portabilidad y oposición, y a no ser objeto de una decisión automatizada: aquí no hay scoring de personas.\n\nEl pedido se hace escribiendo a privacidad@bitacorabtc.org, sin captcha, acreditando identidad. El plazo uruguayo es de 5 días hábiles (arts. 14 y 15). Reclamo ante la URCDP (Uruguay) y, en la UE, ante la autoridad de control del art. 77 RGPD.\n\nLa inscripción de la base de contacto y de seguridad ante la URCDP se presentó el 2 de setiembre de 2026. Número de trámite: en trámite. El número de inscripción se publicará aquí cuando esté aprobado. El directorio del mapa, por ser un listado público que vos mismo publicás, se informa como tal en esa presentación.\n\nSi una violación de seguridad afecta datos personales, se avisa a la URCDP y, cuando corresponda, a las personas afectadas, dentro de 72 horas de conocida.",
    },
    {
      title: "Almacenamiento en el terminal (cookies)",
      id: "cookies",
      body: "No usamos cookies de analítica, de publicidad ni de redes sociales de terceros. No hay gtag, píxel ni CMP de marketing.\n\nSí hay localStorage: el idioma (necesario para prestar el servicio) y, solo si aceptás en el aviso de este dispositivo, el apodo y la caché del mapa. Eso es almacenamiento en el terminal (art. 5.3 ePrivacy). El banner permite «Solo necesario» o aceptar la caché. Las tipografías se sirven desde este sitio (no Google Fonts). La ciudad por IP no se pide hasta que aceptás extras o usás el botón de ubicación.\n\nPara retirar el consentimiento: «Solo necesario» en el aviso, o borrar los datos de este sitio en el navegador.",
    },
    {
      title: "Accesibilidad",
      id: "accesibilidad",
      body: "La soberanía tecnológica incluye poder usar el sitio con teclado y lector de pantalla. Declaración de autoevaluación, 7 de setiembre de 2026: recorrido de código y teclado. No es auditoría externa ni certificado WCAG 2.2 AA ni Directiva (UE) 2019/882.\n\nHoy: enlace de salto al contenido (primer control al tabular, también en LABIF), selector de idioma con aria, landmarks, anillo de foco al tabular, barra de almacenamiento como región (no modal), QR con texto alternativo, navegación etiquetada, lista textual de lugares bajo el mapa, prefers-reduced-motion en el globo (sin auto-rotación) y en los vuelos del mapa, y captcha con audio y anuncio para lector (el dibujo es apoyo visual).\n\nBrechas en curso: el globo 3D y el gráfico de velas no son usables con teclado ni lector; algunos controles pueden fallar el tamaño mínimo de 24 px (2.5.8).\n\nPlan: avisos aria-live en todos los campos.",
    },
    {
      title: "Menores",
      id: "menores",
      body: "El sitio no está dirigido a niños. La Ley 18.331 no fija una edad de consentimiento digital: rige el Código de la Niñez y la Adolescencia y la capacidad progresiva; en general el consentimiento lo presta el representante legal. Para visitantes del EEE, además aplica el umbral de 16 años del art. 8 RGPD. No verificamos edad. Si un adulto acredita que recabamos datos de un menor, los suprimimos.",
    },
    {
      title: "Código · licencia",
      id: "codigo",
      body: "El programa de Bitácora.btc se publica bajo la GNU Affero General Public License v3 (AGPL-3.0). El código fuente correspondiente es el que sirve este sitio y el repositorio https://github.com/prezpablo/bitacora.btc. El texto íntegro está en /LICENSE. El aviso corto está en /COPYRIGHT. Los datos del mapa de OSM y BTC Map siguen ODbL.",
    },
  ],
};

const en: { lead: string; blocks: LegalBlock[] } = {
  lead: "Bitácora.btc is a community logbook run from Colonia del Sacramento, Uruguay. It is not an exchange, it does not custody funds and it does not open accounts. The primary law is Uruguay’s Act 18.331 on Personal Data Protection and Habeas Data, regulated by Decree 414/009, under the URCDP. If you write to us or publish from the European Economic Area, the GDPR (EU 2016/679) and the ePrivacy Directive also apply. This notice meets the information duty in art. 13 of Act 18.331. It describes what the site does today. It is not a certificate of compliance or legal advice.",
  blocks: [
    {
      title: "Legal notice · controller",
      id: "aviso",
      body: "The site’s brand is Bitácora.btc. The controller is a natural person, domiciled in Colonia del Sacramento, Department of Colonia, Oriental Republic of Uruguay, under the Consciencia Bitcoin by LATAM Cripto Mom initiative. The controller’s civil identity and notice address are on this page. The URCDP filing is still in progress. Anyone exercising their rights writes to privacidad@bitacorabtc.org, with no captcha, after proving their own identity.\n\nNo Data Protection Officer is appointed: it is not required (Act 19.670 art. 40 and Decree 64/020) because we are not a public body, we do not process sensitive data as a core activity and we do not operate at large scale. There is no EU representative (GDPR art. 27). The service is offered from Uruguay to the Latin-American bitcoiner community; if it is later aimed at the EEA market, a representative will be designated.\n\nNotices and rights requests go to privacidad@bitacorabtc.org, with no captcha. There is no user registration, no authentication, no custody of funds and no wallet linking. Bitácora.btc is not a Virtual Asset Service Provider (Act 20.345).",
    },
        {
      title: "Terms of use",
      id: "terminos",
      body: "These nine rules are the terms of use.",
      clauses: [
        { title: "1. Acceptance", body: "By using the site you accept these rules." },
        { title: "2. What it is not", body: "Bitácora.btc does not custody, intermediate or hold keys (Act 20.345: it is not a VASP)." },
        { title: "3. Third-party content", body: "Map and announcement content is published by third parties. The controller may take it down if it is unlawful, misleading or breaches these rules." },
        { title: "4. Loading a shop", body: "Whoever loads or edits a shop states that the data is accurate and is responsible for keeping it up to date." },
        { title: "5. Verification", body: "The check does not change: the CARGA code is published on a public link and the map updates only when that proof is confirmed." },
        { title: "6. Contributions and maps", body: "Directory contributions of our own are published under CC BY 4.0: they may be copied with attribution to Bitácora.btc. OSM and BTC Map geographic data remain under ODbL (© OpenStreetMap contributors). The program stays AGPL-3.0." },
        { title: "7. Market", body: "The Market module is educational information: it is not financial advice or an investment recommendation." },
        { title: "8. Verified star", body: "The verified star means two public links, a high average with votes, or the founding allowlist. It is not a BCU seal or a commercial warranty." },
        { title: "9. Law and courts", body: "Governing law: Oriental Republic of Uruguay. Jurisdiction: Uruguayan courts. Privacy: this page, Privacy anchor." },
      ],
    },
    {
      title: "Annex · Brazil, Argentina and Europe",
      id: "anexo",
      body: "If you are in Brazil, Lei n.º 13.709/2018 (LGPD) may also apply. If you are in Argentina, Act 25.326. If you are in the European Economic Area, the GDPR (EU 2016/679) and the ePrivacy Directive, where they apply. The regime that orders this text remains the Uruguayan one (Act 18.331). There is no representative in the European Union and no separate processor in Brazil or Argentina: the controller remains in Colonia del Sacramento.",
    },
    {
      title: "What data we process and why",
      id: "privacidad",
      body: "We apply data minimisation (arts. 7 and 8 of Act 18.331): only what is needed for each purpose, accurate and not excessive. We do not score people, sell data or run behavioural ads.\n\nWe do not collect passwords, identity documents, biometrics, financial history or crypto keys. The public directory does not include private email or phone numbers: only socials or identifiers you publish.\n\nArt. 2 of Act 18.331 also covers legal persons where it applies. Shop listings and votes are third-party data with reputational effect: the business may request rectification at privacidad@bitacorabtc.org.\n\nArt. 13 information. The controller is a natural person in Colonia del Sacramento, Uruguay; the civil name is not published here until it is filled in on this page. The purposes are to reply to contact, publish the directory and limit abuse. Recipients are in the third-party section. On Contact, name, email and message are required: without them there is no reply. On the map, the name is required to publish. You may request access, rectification, update, inclusion and erasure, free of charge, within 5 business days, at privacidad@bitacorabtc.org. Retention: contact, 12 months; announcement, 7 days; CARGA code, 30 days; listing, while it exists.",
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
            "7 days on the board. The CARGA code is kept 30 days and is not in the public CSV",
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
            "Not persisted. On abuse, a truncated HMAC-SHA256 of the IP is stored: pseudonymised data, not the IP in the clear",
          ],
          [
            "Security",
            "Truncated HMAC-SHA256 of the IP (pseudonymised), captcha ticket, send limits",
            "Necessary to run the service and mitigate spam or attacks (not telemetry or analytics)",
            "Rate-limit window: 2 hours. Captcha expires",
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
      id: "terceros",
      body: "Processing runs on a contracted server (Njalla VPS) and in your browser. Processors and recipients sit outside Uruguay and, in some cases, outside the EEA. The list, with name and country, is below.\n\nGitHub (US) hosts the public map and announcement CSV, without CARGA codes or emails. FormSubmit forwards the Contact form to Gmail. Nominatim/OpenStreetMap resolves addresses. GeoJS or ipwho.is estimate city if you allow it. Market and event APIs feed the desk. The privacy checkbox records your consent to these transfers (Act 18.331 art. 23 A).\n\nWhat you publish on the map, on GitHub or on a public network (Nostr, Lightning, chain) cannot be fully erased. Erasure applies to our copies; open history and public networks are beyond absolute oblivion. That is stated before you publish.",
    },
    {
      title: "Rights",
      id: "derechos",
      body: "You may exercise access, rectification, update, inclusion and erasure (arts. 14 to 16 of Act 18.331) and, where the GDPR applies, also restriction, portability and objection, and not to be subject to automated decision-making: we do not score people.\n\nRequests are made by writing to privacidad@bitacorabtc.org, with no captcha, and with proof of identity. The Uruguayan deadline is 5 business days (arts. 14 and 15). You may complain to the URCDP (Uruguay) and, in the EU, to the supervisory authority under GDPR art. 77.\n\nRegistration of the contact and security database with the URCDP was filed on 2 September 2026. Procedure number: in progress. The registration number will be published here when approved. The map directory, as a public listing you yourself publish, is disclosed as such in that filing.\n\nIf a security breach affects personal data, the URCDP and, where it applies, the people affected are told within 72 hours of it becoming known.",
    },
    {
      title: "Storage on the device (cookies)",
      id: "cookies",
      body: "We do not use analytics, advertising or third-party social cookies. There is no gtag, pixel or marketing CMP.\n\nWe do use localStorage: language (necessary to provide the service) and, only if you accept in the device notice, nick and map cache. That is terminal storage (ePrivacy art. 5.3). The banner lets you choose “Necessary only” or accept the cache. Fonts are served from this site (not Google Fonts). City-by-IP is not requested until you accept extras or use the locate button.\n\nTo withdraw consent: “Necessary only” on the notice, or clear this site’s data in the browser.",
    },
    {
      title: "Accessibility",
      id: "accesibilidad",
      body: "Technological sovereignty includes using the site with a keyboard and a screen reader. Self-assessment dated 7 September 2026: code and keyboard review. This is not an external audit or a WCAG 2.2 AA or Directive (EU) 2019/882 certificate.\n\nToday: skip link to main (first tab stop, including LABIF), language control with aria, landmarks, a focus ring when tabbing, the storage bar as a region (not a modal), QR alt text, labelled nav, a text list of places under the map, prefers-reduced-motion on the globe (no auto-rotate) and map flights, and a captcha with audio plus a screen-reader announcement (the drawing is visual support).\n\nOpen gaps: the 3D globe and candle chart are not keyboard- or screen-reader usable; some controls may fail the 24 px minimum (2.5.8).\n\nPlan: aria-live on every field.",
    },
    {
      title: "Children",
      id: "menores",
      body: "The site is not directed at children. Act 18.331 does not set a digital-consent age: the Code on Children and Adolescents and evolving capacity apply; as a rule a legal representative consents. For EEA visitors, GDPR art. 8’s age 16 also applies. We do not verify age. If an adult shows that we collected a child’s data, we erase it.",
    },
    {
      title: "Source · license",
      id: "codigo",
      body: "Bitácora.btc’s program is published under the GNU Affero General Public License v3 (AGPL-3.0). The corresponding source code is what this site serves and the repository https://github.com/prezpablo/bitacora.btc. The full text is at /LICENSE. The short notice is at /COPYRIGHT. OSM and BTC Map data remain under ODbL.",
    },
  ],
};

const pt: { lead: string; blocks: LegalBlock[] } = {
  lead: "A Bitácora.btc é uma bitácora comunitária impulsionada a partir de Colonia del Sacramento, Uruguai. Não é um exchange, não custodia fundos e não abre contas. O regime primário é a Lei n.º 18.331 de Proteção de Dados Pessoais e Ação de Habeas Data, regulamentada pelo Decreto n.º 414/009, com controlo da URCDP. Se nos escreves ou publicas a partir do Espaço Económico Europeu, aplicam-se também o RGPD (UE 2016/679) e a Diretiva ePrivacy. Este texto cumpre o dever de informação do art. 13.º da Lei 18.331. Descreve o que o sítio faz hoje: não é um certificado de conformidade nem aconselhamento jurídico.",
  blocks: [
    {
      title: "Aviso legal · responsável",
      id: "aviso",
      body: "A marca do sítio é Bitácora.btc. O responsável pelo tratamento é uma pessoa física, com domicílio em Colonia del Sacramento, Departamento de Colonia, República Oriental do Uruguai, no âmbito da iniciativa Consciencia Bitcoin by LATAM Cripto Mom. A identidade civil e o endereço para notificações constam nesta página. A inscrição na URCDP continua em tramitação. Quem exerce direitos escreve para privacidad@bitacorabtc.org, sem captcha, comprovando a própria.\n\nNão há Encarregado de Proteção de Dados: não é obrigatório (Lei n.º 19.670 art. 40.º e Decreto n.º 64/020) porque não somos entidade pública, não tratamos dados sensíveis como atividade principal nem operamos em grande escala. Não há representante na União Europeia (art. 27.º RGPD). O serviço oferece-se a partir do Uruguai à comunidade bitcoiner da América Latina; se se dirigir de forma efetiva ao mercado do EEE, será designado representante.\n\nO canal para notificações e para exercer direitos é privacidad@bitacorabtc.org, sem captcha. Não há registo de utilizadores, não há autenticação, não há custódia de fundos nem vinculação de carteiras. A Bitácora.btc não é um Prestador de Serviços de Ativos Virtuais (Lei n.º 20.345).",
    },
        {
      title: "Termos e condições",
      id: "terminos",
      body: "Estas nove regras são as condições de uso.",
      clauses: [
        { title: "1. Aceitação", body: "Ao usar o site você aceita estas regras." },
        { title: "2. O que não é", body: "A Bitácora.btc não custodia, não intermedia e não administra chaves (Lei n.º 20.345: não é PSAV)." },
        { title: "3. Conteúdo de terceiros", body: "O conteúdo do mapa e dos anúncios é publicado por terceiros. O responsável pode retirá-lo se for ilícito, enganoso ou violar estas regras." },
        { title: "4. Carga de um comércio", body: "Quem carrega ou modifica um comércio declara que os dados são verdadeiros e é responsável por mantê-los atualizados." },
        { title: "5. Verificação", body: "A verificação não muda: o código CARGA é publicado num link público e o mapa só se atualiza quando essa prova se confirma." },
        { title: "6. Aportes e mapas", body: "Os aportes próprios ao diretório são publicados sob CC BY 4.0: podem ser copiados citando a Bitácora.btc. Os dados geográficos de OSM e BTC Map seguem a ODbL (© OpenStreetMap contributors). O programa continua na AGPL-3.0." },
        { title: "7. Mercado", body: "O módulo Mercado é informação educativa: não é aconselhamento financeiro nem recomendação de investimento." },
        { title: "8. Estrela de verificado", body: "A estrela de verificado indica dois links públicos, uma média alta com votos ou a allowlist de fundação. Não é um selo do BCU nem garantia comercial." },
        { title: "9. Lei e tribunais", body: "Lei aplicável: República Oriental do Uruguai. Jurisdição: tribunais do Uruguai. Privacidade: esta mesma página, âncora Privacidade." },
      ],
    },
    {
      title: "Anexo · Brasil, Argentina e Europa",
      id: "anexo",
      body: "Se você está no Brasil, também pode valer a Lei n.º 13.709/2018 (LGPD). Se você está na Argentina, a Lei n.º 25.326. Se você está no Espaço Econômico Europeu, o RGPD (UE 2016/679) e a Diretiva ePrivacy, no que for aplicável. O regime que ordena este texto continua sendo o uruguaio (Lei 18.331). Não há representante na União Europeia nem um encarregado distinto no Brasil ou na Argentina: o responsável continua em Colonia del Sacramento.",
    },
    {
      title: "Que dados se tratam e para quê",
      id: "privacidad",
      body: "Aplica-se o princípio de minimização (arts. 7.º e 8.º da Lei 18.331): só o necessário para cada finalidade, veraz e não excessivo. Não há scoring de pessoas, não se vendem dados e não há publicidade comportamental.\n\nNão recolhemos palavras-passe, documentos de identidade, biometria, historial financeiro nem chaves de criptoativos. O diretório público não inclui correio nem telefone de particulares: só redes sociais ou identificadores que tu publicas.\n\nO art. 2.º da Lei 18.331 também alcança, quando corresponda, as pessoas jurídicas. As fichas e os votos de comércios são dados de um terceiro com efeito reputacional: o comércio pode pedir retificação em privacidad@bitacorabtc.org.\n\nInformação do art. 13. O responsável é uma pessoa física em Colonia del Sacramento, Uruguai; o nome civil não é publicado aqui até estar carregado nesta página. As finalidades são responder o contato, publicar o diretório e limitar o abuso. Os destinatários estão na seção de terceiros. No Contato, nome, e-mail e mensagem são obrigatórios: sem eles não há resposta. No mapa, o nome é obrigatório para publicar. Você pode pedir acesso, retificação, atualização, inclusão e apagamento, de graça, em 5 dias úteis, em privacidad@bitacorabtc.org. Conservação: contato, 12 meses; anúncio, 7 dias; código CARGA, 30 dias; ficha, enquanto existir.",
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
            "7 dias no quadro. O código CARGA fica 30 dias e não sai no CSV público",
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
            "Não se persiste. Em caso de abuso, guarda-se um HMAC-SHA256 truncado do IP: dado pseudonimizado, não o IP em claro",
          ],
          [
            "Segurança",
            "HMAC-SHA256 truncado do IP (dado pseudonimizado), ticket de captcha, limite de envios",
            "Necessário para prestar o serviço e mitigar spam ou ataques (não é telemetria nem analítica)",
            "Janela do limite: 2 horas. O captcha caduca",
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
      id: "terceros",
      body: "O tratamento faz-se num servidor contratado (VPS Njalla) e no teu browser. Há encarregados e destinatários fora do Uruguai e, em alguns casos, fora do EEE. A lista, com nome e país, está abaixo.\n\nO GitHub (EUA) aloja o CSV público do mapa e dos anúncios, sem códigos CARGA nem correios. O FormSubmit reenvia o formulário de Contacto para o Gmail. O Nominatim/OpenStreetMap resolve moradas. O GeoJS ou o ipwho.is estimam a cidade se o autorizares. APIs de mercado e de eventos alimentam o desk. A caixa de privacidade documenta o teu consentimento a estas transferências (art. 23.º A da Lei 18.331).\n\nO que publicas no mapa, no GitHub ou numa rede pública (Nostr, Lightning, cadeia) não se pode apagar por completo. O direito de apagamento exerce-se sobre as nossas cópias; o histórico aberto e as redes públicas escapam a um esquecimento absoluto. Isso informa-se antes de publicar.",
    },
    {
      title: "Direitos",
      id: "derechos",
      body: "Podes exercer acesso, retificação, atualização, inclusão e apagamento (arts. 14.º a 16.º da Lei 18.331) e, se o RGPD for aplicável, também limitação, portabilidade e oposição, e a não ser objeto de uma decisão automatizada: aqui não há scoring de pessoas.\n\nO pedido é feito escrevendo para privacidad@bitacorabtc.org, sem captcha, com prova de identidade. O prazo uruguaio é de 5 dias úteis (arts. 14.º e 15.º). Reclamação perante a URCDP (Uruguai) e, na UE, perante a autoridade de controlo do art. 77.º RGPD.\n\nA inscrição da base de contacto e de segurança perante a URCDP foi apresentada a 2 de setembro de 2026. Número de trâmite: em tramitação. O número de inscrição publicar-se-á aqui quando estiver aprovado. O diretório do mapa, por ser uma lista pública que tu próprio publicas, informa-se como tal nessa apresentação.\n\nSe uma violação de segurança afetar dados pessoais, a URCDP e, quando couber, as pessoas afetadas são avisadas em até 72 horas depois de sabido.",
    },
    {
      title: "Armazenamento no terminal (cookies)",
      id: "cookies",
      body: "Não usamos cookies de analítica, de publicidade nem de redes sociais de terceiros. Não há gtag, pixel nem CMP de marketing.\n\nHá localStorage: o idioma (necessário para prestar o serviço) e, só se aceitares no aviso deste dispositivo, a alcunha e a cache do mapa. Isso é armazenamento no terminal (art. 5.º, n.º 3 ePrivacy). O aviso permite «Só necessário» ou aceitar a cache. As tipografias vêm deste sítio (não Google Fonts). A cidade por IP não se pede até aceitares extras ou usares o botão de localização.\n\nPara retirar o consentimento: «Só necessário» no aviso, ou apagar os dados deste sítio no browser.",
    },
    {
      title: "Acessibilidade",
      id: "accesibilidad",
      body: "A soberania tecnológica inclui poder usar o sítio com teclado e leitor de ecrã. Declaração de autoavaliação, 7 de setembro de 2026: revisão de código e teclado. Não é auditoria externa nem certificado WCAG 2.2 AA nem Diretiva (UE) 2019/882.\n\nHoje: ligação de salto para o conteúdo (primeiro controlo ao tabular, também no LABIF), seletor de idioma com aria, landmarks, anel de foco ao tabular, barra de armazenamento como região (não modal), QR com texto alternativo, navegação etiquetada, lista textual de lugares sob o mapa, prefers-reduced-motion no globo (sem auto-rotação) e nos voos do mapa, e captcha com áudio e anúncio para leitor (o desenho é apoio visual).\n\nFalhas em curso: o globo 3D e o gráfico de velas não são usáveis com teclado nem leitor; alguns controlos podem falhar os 24 px (2.5.8).\n\nPlano: avisos aria-live em todos os campos.",
    },
    {
      title: "Menores",
      id: "menores",
      body: "O sítio não se dirige a crianças. A Lei 18.331 não fixa uma idade de consentimento digital: aplica-se o Código da Infância e da Adolescência e a capacidade progressiva; em regra consente o representante legal. Para visitantes do EEE, aplica-se também o limiar de 16 anos do art. 8.º RGPD. Não verificamos idade. Se um adulto provar que recolhemos dados de um menor, apagamo-los.",
    },
    {
      title: "Código · licença",
      id: "codigo",
      body: "O programa da Bitácora.btc é publicado sob a GNU Affero General Public License v3 (AGPL-3.0). O código-fonte correspondente é o que este site entrega e o repositório https://github.com/prezpablo/bitacora.btc. O texto integral está em /LICENSE. O aviso curto está em /COPYRIGHT. Os dados de OSM e BTC Map seguem a ODbL.",
    },
  ],
};

export const LEGAL_EU: Record<AppLang, { lead: string; blocks: LegalBlock[] }> = { es, en, pt };
