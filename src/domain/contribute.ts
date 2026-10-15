import { addrEnds, addrGroups, addrHint, bech32CharsetOk, bech32Ok } from "./bech32.ts";

/** Direcciones de aporte. Bitácora no custodia: el pago va a estas claves del operador. */

export const CONTRIBUTE_ONCHAIN = "bc1qe2f3fu7nwqnl00ankn2g22r8zv2frs4ckkk83t";
export const CONTRIBUTE_URI = `bitcoin:${CONTRIBUTE_ONCHAIN}`;

/** Oferta BOLT 12 (estática). No es factura lnbc: no vence. */
export const CONTRIBUTE_BOLT12 =
  "lno1pgqppmsrse80qf0aara4slvcjxrvu6j2rp5ftmjy4yntlsmsutpkvkt6878s9ygzva7f3x458snn2vpcrtefhrdn576glrywyyck8a5etsxvrtlrqgptzqej4jvuvtp40lw4u7mzjzq3kghtvg7ndgvxt6kxglkvrjj57gqqxdpvq0mgmmdyl250yfjz44cv6lywhff9pn3vc3hu0gw33qykn8v0hahnawqesthat7yww0sjlx65c9vvx4vq8p4pg9scr3py6g7rsc62rf7l2hed9vd76h2sph4jkl34ndr9y8sjqqeyx0qsp68kqa0pfxy7tlwd82hnege3klnhzkqcp8elh6pyrsz6kxexxswxn5vf533nj6ngw9vhunsft5cs";
export const CONTRIBUTE_LN_URI = `lightning:${CONTRIBUTE_BOLT12}`;

export function contributeValid(rail: "onchain" | "ln"): boolean {
  return rail === "ln" ? bech32CharsetOk(CONTRIBUTE_BOLT12, "lno", 80) : bech32Ok(CONTRIBUTE_ONCHAIN, "bc");
}

export function contributePayload(rail: "onchain" | "ln") {
  const value = rail === "ln" ? CONTRIBUTE_BOLT12 : CONTRIBUTE_ONCHAIN;
  return {
    value,
    href: rail === "ln" ? CONTRIBUTE_LN_URI : CONTRIBUTE_URI,
    grouped: rail === "ln" ? addrEnds(value) : addrGroups(value),
    hint: addrHint(value),
    ok: contributeValid(rail),
  };
}

export { addrEnds, addrGroups, addrHint, bech32CharsetOk, bech32Ok };
