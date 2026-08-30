import type { AppLang } from "@/lib/locale";

export type LegalBlock = { title: string; body: string };

const es: { lead: string; blocks: LegalBlock[] } = {
  lead: "Bitácora.btc se ofrece desde Uruguay. Si nos escribís o usás el mapa desde la Unión Europea, aplican el RGPD (UE 2016/679), la Directiva ePrivacy y, para el servicio digital, la Directiva de accesibilidad de productos y servicios (UE 2019/882) con EN 301 549 / WCAG 2.2 AA. Esto describe lo que el sitio hace hoy, no un certificado de conformidad.",
  blocks: [
    {
      title: "Responsable",
      body: "Iniciativa Bitacora.btc · Conciencia Bitcoin by Latam Cripto Mom, Colonia del Sacramento, Uruguay. No hay Delegado de Protección de Datos nombrado. El canal es el formulario de Contacto. No hay representante en la UE (art. 27 RGPD): si el servicio se dirige de forma efectiva a personas en la Unión, hay que designarlo.",
    },
    {
      title: "Datos que tratamos",
      body: "Contacto: nombre, email, motivo y mensaje. Mapa (si publicás): nombre del lugar, descripción, dirección, horarios, redes, logo (URL), puntuación y recuento de votos. Anuncios comunitarios: nombre, texto, URL de prueba y redes, con caducidad semanal. Geolocalización: coordenadas del dispositivo, solo con permiso del navegador (no usamos la IP para situarte). Técnico: idioma y caché del mapa en localStorage; apodo de colaborador. No vendemos datos. No hay publicidad comportamental.",
    },
    {
      title: "Bases jurídicas (art. 6 RGPD)",
      body: "Consentimiento: enviar el formulario, permitir la ubicación, publicar una ficha. Interés legítimo: seguridad (captcha, límite de envíos, registro anti-abuso) y funcionamiento del sitio. Interés público / consentimiento al publicar: el mapa es un directorio abierto; lo que cargás se publica. Podés retirar el consentimiento dejando de usar la ubicación o pidiendo el borrado de tu ficha por Contacto.",
    },
    {
      title: "Transferencias fuera de la UE (cap. V)",
      body: "GitHub (EE.UU.) aloja el CSV público del mapa. El envío de correo pasa por un relé de formularios (hoy FormSubmit) hacia Gmail. Nominatim/OSM, APIs de mercado y de eventos están fuera de Uruguay y a menudo fuera de la UE. No hay Cláusulas Contractuales Tipo ni evaluación de impacto de transferencias documentada: es un incumplimiento si hay interesados en la UE. Recomendado: relé de mail en el EEE, minimizar el CSV público (nada de email de particulares) y un DPA con el host.",
    },
    {
      title: "Conservación",
      body: "Fichas del mapa: mientras la comunidad las mantenga; el historial de GitHub puede persistir tras un borrado aparente. Anuncios: 7 días. Mensajes de contacto: en el relé de correo y, de forma efímera, en el servidor. localStorage: hasta que lo borres en el navegador. No hay plazo de supresión automática del contacto: hay que definirlo (p. ej. 12 meses).",
    },
    {
      title: "Derechos",
      body: "Acceso, rectificación, supresión, limitación, portabilidad, oposición y a no ser objeto de una decisión automatizada (aquí no hay scoring de personas). Reclamación ante una autoridad de control de la UE (art. 77) y, en Uruguay, ante la URCDP. El CSV público hace difícil el olvido absoluto: hay que dejarlo escrito.",
    },
    {
      title: "Cookies y ePrivacy",
      body: "No usamos cookies de analítica ni de ads. Sí localStorage: idioma, apodo, caché del mapa. Eso, en muchos criterios, es almacenamiento en el terminal (art. 5.3 ePrivacy): hace falta información clara y, si no es estrictamente técnico, consentimiento. El idioma puede ser estrictamente necesario; el apodo y la caché, no. Falta un aviso de almacenamiento y un control para borrar esos datos.",
    },
    {
      title: "Accesibilidad (EAA / WCAG 2.2 AA)",
      body: "Hoy: selector de idioma con aria, landmarks parciales, QR con alt, nav etiquetada. Brechas: el captcha visual no tiene alternativa no visual (1.1.1, 1.4.5); el globo y el gráfico de velas no son usables con teclado ni lector; imágenes de eventos con alt vacío; errores del formulario no van ligados al campo (3.3.1); no hay skip-link; el captcha y controles chicos pueden fallar el tamaño mínimo 24 px (2.5.8); no se respeta prefers-reduced-motion en el globo. Plan: skip-link y main, aria-live en contacto, captcha accesible (pregunta o Turnstile), alternativa textual al globo, reduced-motion, contraste verificado en naranja Bitcoin.",
    },
    {
      title: "Menores",
      body: "El servicio no está dirigido a menores de 16 años (art. 8 RGPD). No verificamos edad. No recabamos datos de menores de forma intencional.",
    },
  ],
};

const en: { lead: string; blocks: LegalBlock[] } = {
  lead: "Bitácora.btc is offered from Uruguay. If you write to us or use the map from the European Union, the GDPR (EU 2016/679), the ePrivacy Directive and, for the digital service, the European Accessibility Act (EU 2019/882) with EN 301 549 / WCAG 2.2 AA apply. This describes what the site does today. It is not a certificate of compliance.",
  blocks: [
    {
      title: "Controller",
      body: "Iniciativa Bitacora.btc · Conciencia Bitcoin by Latam Cripto Mom, Colonia del Sacramento, Uruguay. No Data Protection Officer is appointed. The channel is the Contact form. No EU representative (GDPR art. 27): if the service is aimed at people in the Union, one must be designated.",
    },
    {
      title: "Data we process",
      body: "Contact: name, email, topic and message. Map (if you publish): place name, description, address, hours, socials, logo URL, score and vote count. Community announcements: name, text, proof URL and socials, weekly TTL. Geolocation: device coordinates, only with browser permission (we do not place you by IP). Technical: language and map cache in localStorage; collaborator nick. We do not sell data. No behavioural ads.",
    },
    {
      title: "Legal bases (GDPR art. 6)",
      body: "Consent: submitting the form, enabling location, publishing a listing. Legitimate interest: security (captcha, send limits, anti-abuse log) and running the site. Public directory / consent to publish: the map is open; what you upload is published. You may withdraw consent by turning off location or asking for erasure via Contact.",
    },
    {
      title: "Transfers outside the EU (ch. V)",
      body: "GitHub (US) hosts the public map CSV. Mail goes through a form relay (today FormSubmit) to Gmail. Nominatim/OSM, market and event APIs sit outside Uruguay and often outside the EU. No Standard Contractual Clauses or transfer impact assessment are on file: that is a gap if there are data subjects in the EU. Recommended: an EEA mail relay, no private emails in the public CSV, and a DPA with the host.",
    },
    {
      title: "Retention",
      body: "Map listings: while the community keeps them; GitHub history may outlive an apparent delete. Announcements: 7 days. Contact messages: in the mail relay and ephemerally on the server. localStorage: until you clear it. There is no automatic deletion window for contact mail: one must be set (e.g. 12 months).",
    },
    {
      title: "Rights",
      body: "Access, rectification, erasure, restriction, portability, objection, and not to be subject to automated decision-making (we do not score people). Complaint to an EU supervisory authority (art. 77) and, in Uruguay, URCDP. The public CSV makes absolute erasure hard: that must stay explicit.",
    },
    {
      title: "Cookies and ePrivacy",
      body: "No analytics or ad cookies. We do use localStorage: language, nick, map cache. Under many readings that is terminal storage (ePrivacy art. 5.3): clear information is required and, if it is not strictly technical, consent. Language can be strictly necessary; nick and cache are not. Missing: a storage notice and a control to wipe those keys.",
    },
    {
      title: "Accessibility (EAA / WCAG 2.2 AA)",
      body: "Today: language control with aria, partial landmarks, QR alt text, labelled nav. Gaps: visual captcha with no non-visual alternative (1.1.1, 1.4.5); globe and candle chart are not keyboard- or screen-reader usable; event images with empty alt; form errors not tied to fields (3.3.1); no skip link; small controls may fail 24 px (2.5.8); globe ignores prefers-reduced-motion. Plan: skip link and main, aria-live on contact, accessible captcha (question or Turnstile), text alternative to the globe, reduced-motion, contrast check on Bitcoin orange.",
    },
    {
      title: "Children",
      body: "The service is not directed at children under 16 (GDPR art. 8). We do not verify age. We do not intentionally collect children’s data.",
    },
  ],
};

const pt: { lead: string; blocks: LegalBlock[] } = {
  lead: "A Bitácora.btc é oferecida a partir do Uruguai. Se nos escreves ou usas o mapa a partir da União Europeia, aplicam-se o RGPD (UE 2016/679), a Diretiva ePrivacy e, para o serviço digital, a Diretiva de acessibilidade (UE 2019/882) com EN 301 549 / WCAG 2.2 AA. Isto descreve o que o sítio faz hoje, não um certificado de conformidade.",
  blocks: [
    {
      title: "Responsável",
      body: "Iniciativa Bitacora.btc · Conciencia Bitcoin by Latam Cripto Mom, Colonia del Sacramento, Uruguai. Não há Encarregado de Proteção de Dados nomeado. O canal é o formulário de Contacto. Não há representante na UE (art. 27.º RGPD): se o serviço se dirigir a pessoas na União, é preciso designá-lo.",
    },
    {
      title: "Dados que tratamos",
      body: "Contacto: nome, email, motivo e mensagem. Mapa (se publicas): nome do lugar, descrição, morada, horários, redes, URL do logo, pontuação e votos. Anúncios: nome, texto, URL de prova e redes, com TTL semanal. Geolocalização: coordenadas do dispositivo, só com permissão do browser (não usamos o IP para te situar). Técnico: idioma e cache do mapa em localStorage; alcunha de colaborador. Não vendemos dados. Sem publicidade comportamental.",
    },
    {
      title: "Bases jurídicas (art. 6.º RGPD)",
      body: "Consentimento: enviar o formulário, permitir a localização, publicar uma ficha. Interesse legítimo: segurança (captcha, limite de envios, registo anti-abuso) e funcionamento do sítio. Diretório público / consentimento ao publicar: o mapa é aberto; o que carregas publica-se. Podes retirar o consentimento desligando a localização ou pedindo o apagamento da ficha por Contacto.",
    },
    {
      title: "Transferências fora da UE (cap. V)",
      body: "O GitHub (EUA) aloja o CSV público do mapa. O correio passa por um relé de formulários (hoje FormSubmit) para o Gmail. Nominatim/OSM, APIs de mercado e de eventos estão fora do Uruguai e muitas vezes fora da UE. Não há Cláusulas Contratuais-Tipo nem avaliação de impacto de transferências: é uma falha se houver titulares na UE. Recomendado: relé de mail no EEE, zero emails particulares no CSV público e um DPA com o host.",
    },
    {
      title: "Conservação",
      body: "Fichas do mapa: enquanto a comunidade as mantiver; o histórico do GitHub pode sobreviver a um apagamento aparente. Anúncios: 7 dias. Mensagens de contacto: no relé de correio e de forma efémera no servidor. localStorage: até o apagares no browser. Não há prazo automático para o contacto: é preciso defini-lo (p.ex. 12 meses).",
    },
    {
      title: "Direitos",
      body: "Acesso, retificação, apagamento, limitação, portabilidade, oposição e a não ser objeto de decisão automatizada (não há scoring de pessoas). Reclamação a uma autoridade de controlo da UE (art. 77.º) e, no Uruguai, à URCDP. O CSV público torna o esquecimento absoluto difícil: isso deve ficar escrito.",
    },
    {
      title: "Cookies e ePrivacy",
      body: "Sem cookies de analítica ou ads. Usamos localStorage: idioma, alcunha, cache do mapa. Em muitas leituras isso é armazenamento no terminal (art. 5.º, n.º 3 ePrivacy): exige informação clara e, se não for estritamente técnico, consentimento. O idioma pode ser estritamente necessário; a alcunha e a cache, não. Falta um aviso de armazenamento e um controlo para apagar essas chaves.",
    },
    {
      title: "Acessibilidade (EAA / WCAG 2.2 AA)",
      body: "Hoje: seletor de idioma com aria, landmarks parciais, alt no QR, nav etiquetada. Falhas: captcha visual sem alternativa (1.1.1, 1.4.5); globo e gráfico de velas sem teclado nem leitor; imagens de eventos com alt vazio; erros do formulário não ligados ao campo (3.3.1); sem skip-link; controlos pequenos podem falhar os 24 px (2.5.8); o globo ignora prefers-reduced-motion. Plano: skip-link e main, aria-live no contacto, captcha acessível (pergunta ou Turnstile), alternativa textual ao globo, reduced-motion, contraste no laranja Bitcoin.",
    },
    {
      title: "Menores",
      body: "O serviço não se dirige a menores de 16 anos (art. 8.º RGPD). Não verificamos idade. Não recolhemos dados de menores de forma intencional.",
    },
  ],
};

export const LEGAL_EU: Record<AppLang, { lead: string; blocks: LegalBlock[] }> = { es, en, pt };
