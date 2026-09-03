/** Direcciones de aporte. Bitácora no custodia: el pago va a estas claves del operador. */

export const CONTRIBUTE_ONCHAIN = "bc1qe2f3fu7nwqnl00ankn2g22r8zv2frs4ckkk83t";
export const CONTRIBUTE_URI = `bitcoin:${CONTRIBUTE_ONCHAIN}`;

/** Oferta BOLT 12 (estática). No es factura lnbc: no vence. */
export const CONTRIBUTE_BOLT12 =
  "lno1pg5ywunpvd5kzueqwphhygrrdakxzcn0wfshygrrdahzqsnfwnp6zcm0wfsjucn5vvsppmsrse80qf0aara4slvcjxrvu6j2rp5ftmjy4yntlsmsutpkvkt6878s9y7z7vhded54wj9azktd59f8f06up5949v82kk4xv2aaga9xk8ezqgpmvn4u62hknpf7rwspxx6apt99zedsl4hhtl7lk4u0qy6zqygm42sqxwdve2q773v7yeas5y97hfqzr0t4e0l42aytdm2j7cf6nhfn4qsfkdwc8zk8820wqwgs9yh8rkldsz8yedzqxjznf7rr5q5ryzmw7ufktlz6f38fpn830r8q2u83qk553cjcljf9qqe07fqy7nffqypkt7g9sgxf594plnz4su06plvawt9rpwx2q7u2zs5nv227nv0zf2as73ss2ntr5u7lz5xq";
export const CONTRIBUTE_LN_URI = `lightning:${CONTRIBUTE_BOLT12}`;
