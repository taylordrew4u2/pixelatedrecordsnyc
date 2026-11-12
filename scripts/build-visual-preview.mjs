// Build a portable, public-only preview from the actual UI components.
// It has no admin, server writes, credentials, or production deployment step.
import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const revision = process.env.GITHUB_SHA;
if (!/^[0-9a-f]{40}$/.test(revision || "")) throw new Error("A source commit is required");
const assetBase = `https://raw.githubusercontent.com/taylordrew4u2/pixelatedrecordsnyc/${revision}/public/assets/`;
const response = await fetch("https://pixelatedrecordsnyc.netlify.app/api/site");
if (!response.ok) throw new Error(`Public content: ${response.status}`);
const content = await response.json();
if (!Array.isArray(content.pages) || !content.brand) throw new Error("Invalid public content");

const fonts = [
  ["space-grotesk", 400], ["space-grotesk", 500], ["space-grotesk", 700],
  ["dm-sans", 400], ["dm-sans", 500], ["dm-sans", 600],
  ["barlow-condensed", 600],
];
let css = "";
for (const [family, weight] of fonts) {
  const folder = path.resolve(`node_modules/@fontsource/${family}`);
  let sheet = await readFile(path.join(folder, `${weight}.css`), "utf8");
  for (const match of [...sheet.matchAll(/url\(([^)]+)\)/g)]) {
    const file = match[1].replace(/["']/g, "");
    const bytes = await readFile(path.resolve(folder, file));
    const type = file.endsWith(".woff2") ? "font/woff2" : "font/woff";
    sheet = sheet.replace(match[0], `url(data:${type};base64,${bytes.toString("base64")})`);
  }
  css += sheet;
}
for (const name of ["globals", "public-theme", "pov-theme", "photo-layout"]) {
  css += await readFile(`src/app/${name}.css`, "utf8");
}
css = css.replaceAll("/assets/", assetBase);

const entry = `
import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PublicExperience} from './src/components/PublicExperience';
const content = ${JSON.stringify(content)};
function App(){
  const [route,setRoute]=useState(location.hash.slice(1)||'/');
  useEffect(()=>{const update=()=>setRoute(location.hash.slice(1)||'/');addEventListener('hashchange',update);return()=>removeEventListener('hashchange',update)},[]);
  const clean=route.split(/[?#]/)[0];
  const event=clean.startsWith('/events/')?content.events.find(e=>'/events/'+e.slug===clean):null;
  const page=content.pages.find(p=>p.path===clean)||content.pages.find(p=>p.id===(clean==='/'?'home':clean.slice(1)))||content.pages.find(p=>p.id==='home');
  return <PublicExperience key={route} content={content} pageId={event?'events':page.id} eventId={event?.id} preview={false} initialNow={new Date().toISOString()}/>;
}
createRoot(document.getElementById('root')).render(<App/>);
`;
const result = await build({
  stdin: { contents: entry, loader: "tsx", resolveDir: process.cwd() },
  bundle: true, write: false, minify: true, format: "iife", platform: "browser",
  jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
  tsconfig: "tsconfig.json",
  plugins: [{ name: "preview-navigation", setup(builder) {
    builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "preview" }));
    builder.onLoad({ filter: /.*/, namespace: "preview" }, () => ({
      contents: `import React from 'react'; export default function Link({href,onClick,children,...props}){return React.createElement('a',{...props,href:'#'+href,onClick:e=>{onClick?.(e);if(!e.defaultPrevented){e.preventDefault();location.hash=href}}},children)}`,
      loader: "js", resolveDir: process.cwd(),
    }));
  }}],
});
const js = result.outputFiles[0].text.replaceAll("/assets/", assetBase).replaceAll("</script", "<\\/script");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pixelated Records — saved update preview</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
await mkdir("visual-preview", { recursive: true });
await writeFile("visual-preview/pixelated-preview.html", html);
await writeFile("visual-preview/README.txt", `Public UI preview of ${revision}. Built from the existing React components and a read-only snapshot of published content. Internal navigation uses local hash routes. No admin or publishing backend is included. Images load from the same source commit on GitHub. This file is a preview, not a live deployment.\n`);
console.log(`Built portable visual preview: ${Buffer.byteLength(html)} bytes`);
