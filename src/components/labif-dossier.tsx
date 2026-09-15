import { BitcoinMark } from "@/components/dashboard/brand-mark";
import { SkipLink } from "@/components/skip-link";

export function LabifDossier() {
  return (
    <div className="labif-doc min-h-dvh bg-white text-[#1d1d1b]">
      <style>{`
        .labif-doc { font-family: Ubuntu, "Segoe UI", system-ui, sans-serif; line-height: 1.618; color: #1d1d1b; }
        .labif-doc h1, .labif-doc h2, .labif-doc h3 { font-weight: 500; letter-spacing: -0.02em; line-height: 1.236; }
        .labif-doc h1 { font-size: clamp(1.618rem, 4vw, 2.618rem); }
        .labif-doc h2 { font-size: 1.272rem; color: #1d1d1b; border-bottom: 2px solid #F7931A; padding-bottom: 0.382rem; margin: 2.618rem 0 1rem; }
        .labif-doc h3 { font-size: 1.1rem; margin: 1.618rem 0 0.618rem; }
        .labif-doc .kicker { color: #F7931A; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }
        .labif-doc table { width: 100%; border-collapse: collapse; font-size: 0.95rem; margin: 0.618rem 0 1.618rem; }
        .labif-doc th, .labif-doc td { border-bottom: 1px solid #e6e6e6; padding: 0.5rem 0.618rem; text-align: left; vertical-align: top; }
        .labif-doc th { color: #5c6370; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }
        .labif-doc ul { margin: 0.382rem 0 1rem; padding-left: 1.272rem; }
        .labif-doc li { margin: 0.25rem 0; }
        .labif-doc .rule { height: 3px; background: #F7931A; border: 0; margin: 0; }
        @media print {
          .labif-noprint { display: none !important; }
          .labif-doc h2 { break-after: avoid; }
          .labif-doc table, .labif-doc p { break-inside: avoid; }
        }
      `}</style>

      <SkipLink />
      <header className="border-b border-[#e6e6e6]">
        <div className="mx-auto flex max-w-[46rem] items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-[0.14em] font-display text-2xl font-medium tracking-tight sm:text-3xl">
            <BitcoinMark className="h-[1em] w-[1em] shrink-0" />
            <span>
              itacora<span className="text-[#9a5600]">.btc</span>
            </span>
          </div>
          <p className="kicker m-0">LABIF 2026</p>
        </div>
        <hr className="rule" />
      </header>

      <main id="contenido" className="mx-auto max-w-[46rem] px-6 py-10 sm:py-14">
        <p className="labif-noprint mb-6 text-sm text-[#5c6370]">
          Documento para imprimir o guardar como PDF (Ctrl+P). Estética Bitácora / bitcoin.org.
        </p>

        <p className="kicker">Proyecto escrito · Latin America Bitcoin Impact Fund</p>
        <h1 className="mt-2">Bitácora.btc</h1>
        <p className="mt-3 text-lg text-[#5c6370]">
          El nodo que te une al mundo Bircoiner. Iniciativa de Consciencia Bitcoin, Colonia del Sacramento, Uruguay.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border border-[#e6e6e6] bg-[#f6f6f6] px-5 py-4">
          <figure className="m-0 flex flex-col items-center gap-2">
            <BitcoinMark className="size-14" />
            <figcaption className="text-xs tracking-wide text-[#5c6370] uppercase">Bitácora.btc</figcaption>
          </figure>
          <figure className="m-0 flex flex-col items-center gap-2">
            <img src="/logos/conciencia-bitcoin.png" alt="Consciencia Bitcoin" className="h-14 w-14 rounded-full object-cover" />
            <figcaption className="text-xs tracking-wide text-[#5c6370] uppercase">Consciencia Bitcoin</figcaption>
          </figure>
          <figure className="m-0 flex flex-col items-center gap-2">
            <img src="/latam-cripto-mom.jpg" alt="LATAM Cripto Mom" className="h-14 w-14 rounded-full object-cover" />
            <figcaption className="text-xs tracking-wide text-[#5c6370] uppercase">LATAM Cripto Mom</figcaption>
          </figure>
        </div>

        <h2>1. Nota de presentación</h2>
        <p>Colonia del Sacramento, 29 de agosto de 2026</p>
        <p>
          Al comité del Latin America Bitcoin Impact Fund (LABIF)
          <br />
          Fundación Bitcoin Iberoamérica · Paystand · Bitcoin Beach · Geyser
        </p>
        <p>Estimadas y estimados:</p>
        <p>
          Bitcoin no crece solo con tecnología. Crece cuando hay personas, comunidades y proyectos que construyen
          soluciones reales. Esa es la premisa de LABIF y es, también, el origen de Bitácora.btc.
        </p>
        <p>
          Somos una iniciativa comunitaria nacida en Colonia del Sacramento, Uruguay, en el marco de Consciencia Bitcoin
          y con el respaldo de LATAM Cripto Mom. No somos un exchange. No custodiamos fondos. No vendemos cuentas. No
          pedimos documento de identidad para leer el mapa. Bitácora.btc es una hoja de ruta viva: un mapa de comercios
          y comunidades que aceptan bitcoin, una agenda de encuentros, una línea de historia verificable y datos
          públicos de la red, en español, portugués e inglés.
        </p>
        <p>
          El problema que atendemos es concreto. En Latinoamérica hay nodos, meetups, plazas bitcoin y comercios que ya
          cobran en sats. Están dispersos. Quien da el primer paso no sabe a quién preguntar. Quien organiza un
          encuentro no tiene un tablero común. Bitácora reúne eso en un solo lugar, abierto y colaborativo, con el tono
          de bitcoin.org: claro, naranja Bitcoin, sin ruido.
        </p>
        <p>
          El producto ya está en marcha. Pedimos al fondo no para inventar una idea, sino para sostener y extender una
          que ya funciona: que más ciudades del continente vean que <strong>ya no están solas</strong>.
        </p>
        <p>
          Con respeto y en bitcoin,
          <br />
          <strong>Consciencia Bitcoin</strong>
          <br />
          Iniciativa Bitácora.btc · Colonia del Sacramento, Uruguay
          <br />
          <em>Consciencia Bitcoin by LATAM Cripto Mom</em>
        </p>

        <h2>2. Resumen ejecutivo</h2>
        <table>
          <tbody>
            <tr>
              <th>Qué es</th>
              <td>Bitácora comunitaria, abierta y sin custodia, para visibilizar nodos, comercios, eventos y educación Bitcoin en Latinoamérica.</td>
            </tr>
            <tr>
              <th>Para quién</th>
              <td>Comunidades ya activas; familias y personas que dan el primer paso; comercios que aceptan bitcoin; educadores.</td>
            </tr>
            <tr>
              <th>Qué hay hoy</th>
              <td>Sitio trilingüe con mapa + globo, altas colaborativas, verificación sin KYC, eventos, historia, pulso y datos de mercado.</td>
            </tr>
            <tr>
              <th>Qué no es</th>
              <td>Empresa, exchange, custodio, token, ni producto para vender perfiles.</td>
            </tr>
            <tr>
              <th>Pedido a LABIF</th>
              <td>Apoyo 2026–2028 para operación, infraestructura soberana, verificación territorial y presencia en comunidades.</td>
            </tr>
            <tr>
              <th>Código</th>
              <td>https://github.com/prezpablo/bitacora.btc</td>
            </tr>
          </tbody>
        </table>

        <h2>2.1 Cifras reales · 29 ago 2026</h2>
        <p>No inflamos visitas. Distinguimos lo propio de lo que el mapa lee en directorios abiertos.</p>
        <h3>Lo propio</h3>
        <table>
          <thead>
            <tr>
              <th>Dato</th>
              <th>Cifra</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Comunidad fundadora</td>
              <td>1</td>
              <td>Consciencia Bitcoin, Colonia del Sacramento</td>
            </tr>
            <tr>
              <td>Overlay map.csv</td>
              <td>1 + 1</td>
              <td>1 comunidad; 1 ficha de comercio aún no contada como adopción Latam</td>
            </tr>
            <tr>
              <td>Anuncios de 7 días</td>
              <td>0 activos</td>
              <td>Tablero listo</td>
            </tr>
            <tr>
              <td>Idiomas</td>
              <td>3</td>
              <td>ES · PT · EN · 400 cadenas por idioma</td>
            </tr>
            <tr>
              <td>Secciones</td>
              <td>10</td>
              <td>Mapa, Consciencia, Roadmap, Comunidad, Pulso hoy, Historia, Red, Mercado, Privacidad, Contacto</td>
            </tr>
            <tr>
              <td>Hitos de historia</td>
              <td>21</td>
              <td>Con relato y llamado a la acción</td>
            </tr>
            <tr>
              <td>Origen de datos</td>
              <td>14 bloques</td>
              <td>Cada fuente se declara</td>
            </tr>
            <tr>
              <td>Fases al halving</td>
              <td>4</td>
              <td>Q1 sep 2026 → Q4 abr 2028</td>
            </tr>
            <tr>
              <td>Exchanges (liquidaciones)</td>
              <td>10</td>
              <td>Promedio de perps</td>
            </tr>
            <tr>
              <td>Código</td>
              <td>49 / 80</td>
              <td>Componentes / módulos TypeScript · repo 25 ago 2026</td>
            </tr>
          </tbody>
        </table>
        <h3>Lo federado (BTC Map)</h3>
        <p>
          El mapa no clona el directorio: lo lee en vivo (caché 6 h). Orden de magnitud: unos 25.000 comercios y unas
          690 comunidades en el mundo. Bitácora suma el overlay de Colonia. El impacto que pedimos crecer: que ese
          overlay Latam pase de una ficha a decenas de comunidades verificadas.
        </p>

        <h2>3. El problema</h2>
        <p>
          En la región hay más Bitcoin de lo que se ve. Los mapas globales no siempre cuentan el meetup de un barrio, la
          plaza o el comercio Lightning que no está en un directorio. Quien da el primer paso tropieza con hilos o con
          plataformas que exigen cuenta. Falta un punto de encuentro territorial y humano, en los idiomas de la región,
          que no custodie nada y que se pueda auditar.
        </p>

        <h2>4. La solución</h2>
        <p>
          Bitácora.btc es mapa, agenda, historia y datos públicos. Principios no negociables: sin custodia; sin KYC para
          leer; ES / PT / EN; aporte solo en bitcoin; el mercado no se presenta como el estado de la red; el mapa se mira
          sin conectar una billetera.
        </p>

        <h2>5. Qué está construido</h2>
        <h3>Territorio</h3>
        <ul>
          <li>Globo de primera visita y mapa de calle.</li>
          <li>BTC Map + registro propio para comunidades y excepciones de Latam.</li>
          <li>Alta con dirección, horarios, pagos (on-chain, Lightning, sin contacto) y redes.</li>
          <li>Calificación 1 a 5; verificación sin documento (código público o reputación). Marca naranja.</li>
          <li>Búsqueda con autocompletar. GPS a pedido, no por IP.</li>
          <li>Anuncios comunitarios de siete días.</li>
        </ul>
        <h3>Comunidad y tiempo</h3>
        <ul>
          <li>Agenda con filtros de cercanía, país, continente y plataforma.</li>
          <li>Historia con significado y llamados a la acción (White Paper, PizzaDAO, LABITCONF).</li>
          <li>Pulso hoy: titulares en el idioma elegido. Contacto sin exponer el correo.</li>
        </ul>
        <h3>Datos y oficio</h3>
        <ul>
          <li>Velas, liquidaciones, ETF, miedo/codicia: con fuente, y no como “estado de la red”.</li>
          <li>Tres idiomas en menús y legal. Diseño blanco y naranja Bitcoin. Roadmap público hasta abril 2028.</li>
        </ul>

        <h2>6. A quién sirve</h2>
        <table>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Qué encuentra</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Primer paso</td>
              <td>Mapa, comunidad cerca, historia, White Paper</td>
            </tr>
            <tr>
              <td>Quien organiza un nodo</td>
              <td>Punto, redes, horarios</td>
            </tr>
            <tr>
              <td>Comercio</td>
              <td>Ficha, pagos, reputación</td>
            </tr>
            <tr>
              <td>Educador / familia</td>
              <td>Relato claro en ES / PT / EN</td>
            </tr>
            <tr>
              <td>Bitcoiner exigente</td>
              <td>Sin custodia, sin KYC de lectura, aporte en sats</td>
            </tr>
          </tbody>
        </table>

        <h2>7. Impacto</h2>
        <p>
          <strong>Educación.</strong> Cada hito explica qué significó y ofrece un acto. El pulso acerca noticias al
          idioma de la persona.
        </p>
        <p>
          <strong>Innovación.</strong> Registro colaborativo verificable sin plataforma de identidad. Economía circular:
          se encuentra el comercio, se visita, se paga en bitcoin.
        </p>
        <p>
          <strong>Adopción.</strong> El globo dice “ya no estás solo”. El mapa baja a la cuadra. Eso es adopción de uso,
          no de cotización. El portugués es el puente con Brasil.
        </p>

        <h2>8. Gobernanza y uso del apoyo</h2>
        <p>
          Iniciativa de Consciencia Bitcoin, respaldo de LATAM Cripto Mom. Sin accionistas de un producto financiero.
          Aportes actuales: QR bitcoin. No hay pasarela de tarjetas. No tokenizamos, no vendemos datos, no exigimos
          cuenta para leer.
        </p>
        <ol>
          <li>Mantener el sitio con copias que no dependan de un solo proveedor.</li>
          <li>Nodo propio (Bitcoin + Lightning).</li>
          <li>Curaduría y verificación humana de puntos Latam.</li>
          <li>Agenda y experiencia en el celular.</li>
          <li>Presencia en encuentros (taller y alta de puntos, no stand de venta).</li>
          <li>Revisión nativa ES / PT / EN.</li>
        </ol>
        <p>Los montos se ajustan al instrumento de LABIF. Este texto no inventa una cifra.</p>

        <h2>9. Hoja de ruta · hasta el halving (abr 2028)</h2>
        <table>
          <thead>
            <tr>
              <th>Fase</th>
              <th>Período</th>
              <th>Enfoque</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Q1 · Consolidación</td>
              <td>sep 2026 – ene 2027</td>
              <td>Contacto fiable, menos abusos, mercado ≠ red</td>
            </tr>
            <tr>
              <td>Q2 · Claridad y acceso</td>
              <td>feb 2027 – jun 2027</td>
              <td>Carga en el celular; el sitio sigue si falla una fuente</td>
            </tr>
            <tr>
              <td>Q3 · Identidad sin custodia</td>
              <td>jul 2027 – nov 2027</td>
              <td>Alta y voto con perfil o Lightning como firma</td>
            </tr>
            <tr>
              <td>Q4 · Cercanía con la red</td>
              <td>dic 2027 – abr 2028</td>
              <td>Comisión y próximo bloque; el mapa nunca pide billetera</td>
            </tr>
          </tbody>
        </table>

        <h2>10. Riesgos</h2>
        <table>
          <thead>
            <tr>
              <th>Riesgo</th>
              <th>Mitigación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spam y altas falsas</td>
              <td>Captcha, límites, prueba de control, votos</td>
            </tr>
            <tr>
              <td>Dependencia de un mapa global</td>
              <td>BTC Map como base; CSV propio</td>
            </tr>
            <tr>
              <td>Un solo host o correo</td>
              <td>Plan de soberanía; nodo propio</td>
            </tr>
            <tr>
              <td>Confundir precio con red</td>
              <td>Copy explícito</td>
            </tr>
            <tr>
              <td>Grant a marketing</td>
              <td>Infraestructura, curaduría, territorio. Cero pauta invasiva</td>
            </tr>
          </tbody>
        </table>

        <h2>11. Pedido a LABIF</h2>
        <ol>
          <li>Inclusión en la red LABIF (Geyser u el canal que definan).</li>
          <li>Acompañamiento de Bitcoin Beach / Fundación Bitcoin Iberoamérica en economía circular.</li>
          <li>Capital de operación 12–18 meses, según el tramo para iniciativas ya construidas.</li>
          <li>Puente con comunidades iberoamericanas para verificar puntos fuera de Uruguay.</li>
        </ol>
        <p>
          A cambio: sin custodia, sin KYC de lectura, tres idiomas; informe simple de puntos y ciudades; la bitácora
          disponible para otras comunidades de la red, sin licencia de pago.
        </p>

        <h2>12. Cierre</h2>
        <p>
          Bitácora.btc no promete un protocolo nuevo. Promete algo más escaso: que una persona en Colonia, en Recife o
          en Medellín pueda ver un punto naranja, llegar a un encuentro y pagar un café en bitcoin, sin entregar el
          pasaporte a una web.
        </p>
        <p>Eso es impacto. Eso es lo que pedimos sostener.</p>
      </main>

      <footer className="border-t border-[#e6e6e6]">
        <hr className="rule" />
        <div className="mx-auto flex max-w-[46rem] flex-col items-center gap-4 px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-lg font-medium">
              <BitcoinMark className="size-8" />
              <span>
                itacora<span className="text-[#9a5600]">.btc</span>
              </span>
            </div>
            <img src="/logos/conciencia-bitcoin.png" alt="Consciencia Bitcoin" className="size-16 rounded-full object-cover" />
            <img src="/latam-cripto-mom.jpg" alt="LATAM Cripto Mom" className="size-16 rounded-full object-cover" />
          </div>
          <p className="text-center text-sm text-[#5c6370]">
            Una iniciativa de Consciencia Bitcoin by LATAM Cripto Mom
            <br />
            Colonia del Sacramento, Uruguay · Agosto 2026
          </p>
          <nav aria-label="Textos legales" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            <a href="/legal#aviso" className="text-[#1d1d1b] underline-offset-2 hover:underline">
              Aviso legal
            </a>
            <a href="/legal#privacidad" className="text-[#1d1d1b] underline-offset-2 hover:underline">
              Privacidad
            </a>
            <a href="/legal#cookies" className="text-[#1d1d1b] underline-offset-2 hover:underline">
              Cookies
            </a>
            <a href="/legal#accesibilidad" className="text-[#1d1d1b] underline-offset-2 hover:underline">
              Accesibilidad
            </a>
            <a href="/legal#terminos" className="text-[#1d1d1b] underline-offset-2 hover:underline">
              Términos
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
