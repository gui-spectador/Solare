// Gera o index.html protegido: o app inteiro vai criptografado (AES-GCM, chave PBKDF2 de usuário + senha).
// Uso: SOLARE_USER=... SOLARE_PASS=... node tools/build.mjs caminho/do/app.html
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const [src] = process.argv.slice(2);
const user = process.env.SOLARE_USER, pass = process.env.SOLARE_PASS;
if (!src || !user || !pass) { console.error("Uso: SOLARE_USER=... SOLARE_PASS=... node tools/build.mjs app.html"); process.exit(1); }

const ITER = 600000;
const app = readFileSync(src, "utf8");
const doc = `<!doctype html><html lang="pt-BR" data-locked="1"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#06060a">` +
  `<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` +
  `<link rel="apple-touch-icon" href="icon-180.png"><link rel="manifest" href="manifest.webmanifest">` +
  `<style>html,body{margin:0}</style></head><body>${app}</body></html>`;

const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(user.trim().toLowerCase() + "\n" + pass), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(doc));
const b64 = u => Buffer.from(u).toString("base64");
const payload = JSON.stringify({ iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) });

const tpl = readFileSync(new URL("./login.html", import.meta.url), "utf8");
writeFileSync(new URL("../index.html", import.meta.url), tpl.replace("/*PAYLOAD*/null/*END*/", payload));
console.log("index.html gerado:", Math.round(payload.length / 1024), "KB criptografados");
