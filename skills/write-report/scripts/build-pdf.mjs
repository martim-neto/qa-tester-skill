#!/usr/bin/env node
// Builds test-report.pdf for a QA run folder — no AI tokens, no npm packages.
//
//   node build-pdf.mjs <run-folder>
//
// Reads test-report.md, defects.md, use-cases.md and test-results.md from the
// run folder, writes test-report.html (screenshots linked relatively) and prints
// it to test-report.pdf with a locally installed Chrome or Edge in headless mode.
// Set QA_PDF_BROWSER to a browser executable to override the search.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const runDir = path.resolve(process.argv[2] ?? "");
if (!process.argv[2] || !fs.existsSync(runDir)) {
  fail("Usage: node build-pdf.mjs <run-folder>");
}

const read = (name, required = true) => {
  const p = path.join(runDir, name);
  if (!fs.existsSync(p)) {
    if (required) fail(`Missing ${name} in ${runDir}`);
    return "";
  }
  return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "");
};

const report = read("test-report.md");
const defects = read("defects.md");
const useCases = read("use-cases.md");
const results = read("test-results.md");

// ---------- tiny Markdown → HTML (covers what the qa-tester formats use) ----------

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(text) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(esc(c)) - 1}\u0000`);
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
  return s;
}

const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function md(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("```")) {
      const buf = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) buf.push(lines[i]);
      i++;
      out.push(`<pre>${esc(buf.join("\n"))}</pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const n = Math.min(h[1].length + 1, 6); out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { out.push("<hr>"); i++; continue; }
    if (line.trim().startsWith("|") && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]));
      out.push(
        `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${badge(inline(c))}</td>`).join("")}</tr>`).join("") +
          "</tbody></table>"
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${md(buf.join("\n"))}</blockquote>`);
      continue;
    }
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (m) { items.push(m[3]); i++; continue; }
        if (lines[i].trim() && /^\s{2,}/.test(lines[i])) { items[items.length - 1] += " " + lines[i].trim(); i++; continue; }
        break;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\||>|```|\s*([-*]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++].trim());
    if (!buf.length) { buf.push(lines[i++].trim()); }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

// Colour result words in table cells.
function badge(html) {
  const map = [
    [/^(<strong>)?Pass with caveat(<\/strong>)?$/, "caveat"],
    [/^(<strong>)?Pass(<\/strong>)?$/, "pass"],
    [/^(<strong>)?Fail(<\/strong>)?$/, "fail"],
    [/^(<strong>)?Blocked.*$/, "blocked"],
    [/^(<strong>)?Not run(<\/strong>)?$/, "blocked"],
    [/^(<strong>)?Critical(<\/strong>)?$/, "fail"],
    [/^(<strong>)?Major(<\/strong>)?$/, "major"],
    [/^(<strong>)?Verified(<\/strong>)?$/, "pass"],
    [/^(<strong>)?Failed(<\/strong>)?$/, "fail"],
    [/^(<strong>)?Not verified(<\/strong>)?$/, "caveat"],
  ];
  for (const [re, cls] of map) if (re.test(html)) return `<span class="badge ${cls}">${html.replace(/<\/?strong>/g, "")}</span>`;
  return html;
}

// ---------- split documents ----------

const dropTitle = (text) => text.replace(/^#\s+.*\n/, "");
const firstHeading = (text) => (text.match(/^#\s+(.*)$/m) ?? [, "Test report"])[1];

function ucBlocks(text) {
  const map = new Map();
  const re = /^## (UC-\d+)\s+—\s+(.*)$/gm;
  const marks = [...text.matchAll(re)];
  marks.forEach((m, k) => {
    // A case ends at the next case, or at the next non-case "## " heading (e.g. Traceability matrix).
    const start = m.index + m[0].length;
    let stop = k + 1 < marks.length ? marks[k + 1].index : text.length;
    const other = text.slice(start).search(/^## (?!UC-)/m);
    if (other >= 0) stop = Math.min(stop, start + other);
    const body = text.slice(start, stop).trim().replace(/\n---$/, "").trim();
    map.set(m[1], { title: m[2].trim(), body });
  });
  return map;
}

const cases = ucBlocks(useCases);
const runs = ucBlocks(results);

// Case classes from the report's "Case results" table (Pass with caveat, Blocked by defect, …)
const classes = new Map();
for (const line of report.split("\n")) {
  const c = line.startsWith("| UC-") ? cells(line) : null;
  if (c && c.length >= 3) classes.set(c[0], { result: c[2], defect: c[3] ?? "" });
}

const field = (body, name) => (body.match(new RegExp(`^- \\*\\*${name}:\\*\\*\\s*(.*)$`, "m")) ?? [, ""])[1].trim();
const section = (body, name) => {
  const m = body.match(new RegExp(`\\*\\*${name}\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*[A-Z][^*]*\\*\\*\\s*\\n|$)`));
  return m ? m[1].trim() : "";
};

function evidence(body) {
  const seen = new Set();
  const imgs = [];
  for (const m of body.matchAll(/\[([^\]]+)\]\(([^)\s]+\.(?:png|jpe?g))\)/gi)) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    const row = body.split("\n").find((l) => l.includes(m[2]) && l.startsWith("|"));
    const caption = row ? `${cells(row)[0]} — ${m[1]}` : m[1];
    const exists = fs.existsSync(path.join(runDir, m[2]));
    imgs.push({ src: m[2], caption, exists });
  }
  return imgs.sort((a, b) => a.src.localeCompare(b.src, "en", { numeric: true }));
}

function caseSection(id) {
  const uc = cases.get(id);
  const run = runs.get(id);
  const cls = classes.get(id);
  const result = cls?.result || (run ? field(run.body, "Result").replace(/\s*\(.*$/, "") : "Not run");
  const title = uc?.title ?? run?.title ?? "";
  const meta = uc
    ? [
        ["Requirements", field(uc.body, "Requirements")],
        ["Type", field(uc.body, "Type")],
        ["Priority", field(uc.body, "Priority")],
        ["Preconditions", field(uc.body, "Preconditions")],
        ["Test data", field(uc.body, "Test data")],
        ["Assumptions", field(uc.body, "Assumptions")],
      ].filter(([, v]) => v)
    : [];
  let html = `<section class="case"><h2>${esc(id)} — ${inline(title)} ${badge(esc(result))}</h2>`;
  if (cls?.defect) html += `<p class="defect-ref">Related defect: <strong>${inline(cls.defect)}</strong></p>`;
  if (meta.length) html += `<table class="meta"><tbody>${meta.map(([k, v]) => `<tr><th>${k}</th><td>${inline(v)}</td></tr>`).join("")}</tbody></table>`;
  if (uc) {
    html += `<div class="cols"><div><h3>Steps</h3>${md(section(uc.body, "Steps"))}</div>`;
    html += `<div><h3>Expected result</h3>${md(section(uc.body, "Expected result"))}</div></div>`;
  }
  if (run) {
    const setup = field(run.body, "Setup done");
    if (setup) html += `<h3>Setup done</h3><p>${inline(setup)}</p>`;
    const table = run.body.split("\n").filter((l) => l.startsWith("|")).join("\n");
    if (table) html += `<h3>Checkpoints</h3>${md(table)}`;
    const other = run.body.match(/\*\*Other observations:\*\*\s*([\s\S]*)$/);
    if (other && other[1].trim() && other[1].trim().toLowerCase() !== "none") html += `<h3>Other observations</h3>${md(other[1].trim())}`;
    const imgs = evidence(run.body);
    if (imgs.length) {
      html += `<h3>Evidence</h3><div class="evidence">`;
      for (const im of imgs) {
        html += im.exists
          ? `<figure><img src="${esc(im.src)}"><figcaption>${inline(im.caption)}</figcaption></figure>`
          : `<figure class="missing"><div>Missing file: ${esc(im.src)}</div><figcaption>${inline(im.caption)}</figcaption></figure>`;
      }
      html += `</div>`;
    }
  } else {
    html += `<p class="note">This case has no result in test-results.md.</p>`;
  }
  return html + "</section>";
}

const ids = [...new Set([...runs.keys(), ...[...cases.entries()].filter(([, v]) => /^- \*\*Status:\*\*\s*approved/m.test(v.body)).map(([k]) => k)])].sort();

// ---------- assemble ----------

const title = firstHeading(report);
const css = `
@page { size: A4; margin: 16mm 14mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.45 "Segoe UI", Arial, sans-serif; color: #1d2433; }
h1 { font-size: 22pt; margin: 0 0 4mm; }
h2 { font-size: 14pt; border-bottom: 2px solid #1d2433; padding-bottom: 2px; margin-top: 7mm; }
h3 { font-size: 11pt; margin: 4mm 0 1mm; color: #3a4a66; }
h4, h5, h6 { font-size: 10.5pt; }
table { border-collapse: collapse; width: 100%; margin: 2mm 0 3mm; font-size: 9pt; }
th, td { border: 1px solid #c9d0dc; padding: 3px 5px; vertical-align: top; text-align: left; }
th { background: #eef1f6; }
tr { break-inside: avoid; }
table.meta th { width: 26%; }
code { font: 9pt Consolas, monospace; background: #f1f3f7; padding: 0 3px; border-radius: 3px; }
pre { background: #f1f3f7; padding: 3mm; font-size: 8.5pt; white-space: pre-wrap; }
blockquote { border-left: 3px solid #c9d0dc; margin: 2mm 0; padding-left: 3mm; color: #4a556b; }
a { color: #1f5fbf; text-decoration: none; }
hr { border: 0; border-top: 1px solid #dfe3ea; margin: 4mm 0; }
.cover { break-after: page; }
.cover .sub { color: #4a556b; margin-bottom: 8mm; }
.part { break-before: page; }
.part > h1 { font-size: 18pt; border-bottom: 3px solid #1d2433; padding-bottom: 2mm; }
.case { break-before: page; }
.case h2 { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 9px; font-size: 8.5pt; font-weight: 600; white-space: nowrap; }
.badge.pass { background: #dff3e4; color: #17652f; }
.badge.fail { background: #fbe0e0; color: #9b1c1c; }
.badge.major { background: #fdebd3; color: #8a4b08; }
.badge.blocked { background: #e7e9ef; color: #3f4859; }
.badge.caveat { background: #fff4c7; color: #7a5b00; }
.defect-ref { margin: 1mm 0 2mm; }
.evidence figure { margin: 3mm 0; break-inside: avoid; border: 1px solid #c9d0dc; padding: 2mm; }
.evidence img { max-width: 100%; max-height: 120mm; display: block; margin: 0 auto; }
.evidence figcaption { font-size: 8.5pt; color: #4a556b; margin-top: 1mm; }
.missing div { color: #9b1c1c; padding: 6mm; text-align: center; }
.note { color: #4a556b; font-style: italic; }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>
<div class="cover"><h1>${inline(title)}</h1><p class="sub">QA tester — test report with evidence</p>${md(dropTitle(report))}</div>
<div class="part"><h1>Defects</h1>${defects ? md(dropTitle(defects)) : "<p>No defects.md in this run.</p>"}</div>
<div class="part"><h1>Use cases and evidence</h1><p>One section per use case: what it checks, the steps, what was observed at each checkpoint, and the screenshots taken as evidence.</p></div>
${ids.map(caseSection).join("\n")}
</body></html>`;

const htmlPath = path.join(runDir, "test-report.html");
const pdfPath = path.join(runDir, "test-report.pdf");
fs.writeFileSync(htmlPath, html, "utf8");

// ---------- print with Chrome / Edge ----------

const candidates = [
  process.env.QA_PDF_BROWSER,
  process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google/Chrome/Application/chrome.exe"),
  process.env["PROGRAMFILES(X86)"] && path.join(process.env["PROGRAMFILES(X86)"], "Google/Chrome/Application/chrome.exe"),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  process.env["PROGRAMFILES(X86)"] && path.join(process.env["PROGRAMFILES(X86)"], "Microsoft/Edge/Application/msedge.exe"),
  process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Microsoft/Edge/Application/msedge.exe"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) fail(`No Chrome or Edge found. HTML written to ${htmlPath}; set QA_PDF_BROWSER to a browser executable, or open the HTML and print it to PDF.`);

if (fs.existsSync(pdfPath)) fs.rmSync(pdfPath);
const profile = fs.mkdtempSync(path.join(runDir, ".pdf-profile-"));
try {
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-pdf-header-footer",
    "--allow-file-access-from-files",
    `--user-data-dir=${profile}`,
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: "ignore", timeout: 120000 });
} catch (e) {
  if (!fs.existsSync(pdfPath)) fail(`Browser failed to print: ${e.message}. HTML is at ${htmlPath}.`);
} finally {
  fs.rmSync(profile, { recursive: true, force: true });
}
if (!fs.existsSync(pdfPath)) fail(`PDF was not created. HTML is at ${htmlPath}.`);

const missing = ids.flatMap((id) => (runs.get(id) ? evidence(runs.get(id).body) : [])).filter((e) => !e.exists).length;
console.log(`OK ${pdfPath}`);
console.log(`Cases: ${ids.length} · size: ${(fs.statSync(pdfPath).size / 1024).toFixed(0)} KB · missing screenshots: ${missing}`);

function fail(msg) {
  console.error(`ERROR ${msg}`);
  process.exit(1);
}
