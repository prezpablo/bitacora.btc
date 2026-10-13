/**
 * Datos del responsable. Un valor entre corchetes no es un dato: Pablo lo completa.
 * No inventar nombre, domicilio, expediente ni país del VPS.
 */
export const LEGAL = {
  controllerName: "[NOMBRE Y APELLIDO]",
  address: "[DOMICILIO]",
  privacyEmail: "privacidad@bitacorabtc.org",
  a11yEmail: "accesibilidad@bitacorabtc.org",
  contributionLicense: "[LICENCIA_CONTRIBUCIONES]",
  vpsCountry: "[PAÍS_VPS]",
  translator: "[PROVEEDOR_TRADUCCION]",
  expediente: "[N.º EXPEDIENTE URCDP]",
  inscription: "[N.º INSCRIPCIÓN]",
  vigencia: "[FECHA_VIGENCIA]",
  consentVersion: "2.0",
} as const;

export function legalFilled(value: string) {
  return Boolean(value) && !value.startsWith("[");
}
