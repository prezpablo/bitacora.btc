/** Un SVG servido en este origen se ejecutaría al abrirlo como página. */
export function isSvgPayload(type: string, buf: Buffer) {
  if (/svg|\+xml|\/xml|text\/xml/i.test(type)) return true;
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return false;
  if (buf.length >= 8 && buf.subarray(0, 8).toString("latin1") === "\x89PNG\r\n\x1a\n") return false;
  if (buf.length >= 6 && (buf.subarray(0, 6).toString("latin1") === "GIF87a" || buf.subarray(0, 6).toString("latin1") === "GIF89a")) return false;
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return false;
  const head = buf.subarray(0, 400).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<svg") || head.startsWith("<?xml") || /<svg[\s>]/.test(head);
}
