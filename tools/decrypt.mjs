// Recupera o código do app a partir do index.html publicado (para editar e gerar de novo).
// Uso: SOLARE_USER=... SOLARE_PASS=... node tools/decrypt.mjs > app.html
import { readFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const P = JSON.parse(html.match(/const PAYLOAD = (\{.*?\});/s)[1]);
const b = s => Buffer.from(s, "base64");
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(process.env.SOLARE_USER.trim().toLowerCase() + "\n" + process.env.SOLARE_PASS), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b(P.salt), iterations: P.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
const doc = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b(P.iv) }, key, b(P.data)));
process.stdout.write(doc.slice(doc.indexOf("<body>") + 6, doc.lastIndexOf("</body>")));
