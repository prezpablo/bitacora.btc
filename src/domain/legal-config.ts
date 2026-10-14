/**
 * Datos del responsable. Un valor entre corchetes no es un dato: Pablo lo completa.
 * No inventar nombre, domicilio, expediente ni país del VPS.
 */
export const VPS_COUNTRY = { es: "Finlandia", en: "Finland", pt: "Finlândia" } as const;

export const LEGAL = {
  controllerName: "Pablo Daniel Perez Correa",
  address: "Colonia del Sacramento, Colonia, Uruguay",
  privacyEmail: "privacidad@bitacorabtc.org",
  a11yEmail: "accesibilidad@bitacorabtc.org",
  contributionLicense: "CC BY 4.0",
  vpsCountry: VPS_COUNTRY.es,
  translator: "[PROVEEDOR_TRADUCCION]",
  expediente: "en trámite",
  inscription: "[N.º INSCRIPCIÓN]",
  vigencia: "[FECHA_VIGENCIA]",
  consentVersion: "2.3",
} as const;

export function legalFilled(value: string) {
  return Boolean(value) && !value.startsWith("[");
}
