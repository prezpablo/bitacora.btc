/**
 * Datos del responsable. Un valor entre corchetes no es un dato: Pablo lo completa.
 * No inventar nombre, domicilio, expediente ni país del VPS.
 */
export const VPS_COUNTRY = { es: "Finlandia", en: "Finland", pt: "Finlândia" } as const;

export const LEGAL = {
  controllerName: "Pablo Daniel Perez Correa",
  /** Ciudad del responsable. No es un domicilio de notificación. */
  city: "Colonia del Sacramento, Colonia, Uruguay",
  /** Domicilio constituido para notificaciones. Un corchete no se publica. */
  address: "[DOMICILIO_NOTIFICACIONES]",
  privacyEmail: "privacidad@bitacorabtc.org",
  a11yEmail: "accesibilidad@bitacorabtc.org",
  contributionLicense: "CC BY 4.0",
  vpsCountry: VPS_COUNTRY.es,
  translator: "[PROVEEDOR_TRADUCCION]",
  /** Número de trámite URCDP. Un corchete no es un número. */
  expediente: "[N.º TRÁMITE]",
  inscription: "[N.º INSCRIPCIÓN]",
  /** Fecha de presentación. No se publica hasta que Pablo la confirme. */
  filingDate: "[FECHA_PRESENTACION]",
  vigencia: "[FECHA_VIGENCIA]",
  consentVersion: "2.16",
} as const;

export const LEGAL_CITY = {
  es: "Colonia del Sacramento, Colonia, Uruguay",
  en: "Colonia del Sacramento, Colonia, Uruguay",
  pt: "Colonia del Sacramento, Colonia, Uruguai",
} as const;

export function legalFilled(value: string) {
  return Boolean(value) && !value.startsWith("[");
}
