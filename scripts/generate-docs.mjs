#!/usr/bin/env node
/**
 * Generate Starlight section/block reference pages from LuminOS Liquid schemas.
 * Preserves content between <!-- MANUAL:START --> and <!-- MANUAL:END -->.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, '..');
const THEME_ROOT = path.resolve(
  process.env.LUMINOS_THEME_PATH || path.join(DOCS_ROOT, '..', 'LuminOS New')
);
const SECTIONS_OUT = path.join(DOCS_ROOT, 'src', 'content', 'docs', 'sections');

const BLOCK_INCLUDE =
  /lumin|quantity-break|frequently-bought|sibling|free-shipping|mega-menu|waitlist|cart-drawer|gift/i;

const MANUAL_START = '<!-- MANUAL:START -->';
const MANUAL_END = '<!-- MANUAL:END -->';

function stripJsonComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function loadTranslations() {
  const localePath = path.join(THEME_ROOT, 'locales', 'en.default.schema.json');
  if (!fs.existsSync(localePath)) return {};
  try {
    return JSON.parse(stripJsonComments(fs.readFileSync(localePath, 'utf8')));
  } catch (err) {
    console.warn('Could not parse en.default.schema.json:', err.message);
    return {};
  }
}

function getByPath(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function resolveLabel(value, translations) {
  if (typeof value !== 'string') return value == null ? '' : String(value);
  if (!value.startsWith('t:')) return value;
  const key = value.slice(2);
  const found = getByPath(translations, key);
  return typeof found === 'string' ? found : key.split('.').pop() || value;
}

function extractSchema(liquidSource) {
  const match = liquidSource.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    return { __parseError: err.message };
  }
}

function detectRequirements(schema, liquidSource) {
  const blob = `${JSON.stringify(schema)}\n${liquidSource}`.toLowerCase();
  const notes = [];
  if (blob.includes('lumin discount') || blob.includes('lumin_discount')) {
    notes.push('Lumin Discount App (checkout discounts)');
  }
  if (blob.includes('lumin kit') || blob.includes('app proxy') || blob.includes('/apps/lumin')) {
    notes.push('Lumin Kit app');
  }
  if (blob.includes('metaobject') || blob.includes('lumin_review')) {
    notes.push('Shopify metaobjects (e.g. lumin_review)');
  }
  if (blob.includes('metafield')) {
    notes.push('Product or shop metafields');
  }
  return [...new Set(notes)];
}

function escapeCell(text) {
  return String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n+/g, ' ')
    .trim();
}

function settingsTable(settings, translations) {
  const rows = [];
  for (const setting of settings || []) {
    if (!setting || setting.type === 'header' || setting.type === 'paragraph') {
      if (setting?.type === 'header') {
        rows.push(
          `| *${escapeCell(resolveLabel(setting.content, translations))}* | — | Section header |`
        );
      }
      continue;
    }
    const label = resolveLabel(setting.label || setting.id || setting.type, translations);
    const id = setting.id || '—';
    const type = setting.type || '—';
    rows.push(`| ${escapeCell(label)} | \`${escapeCell(id)}\` | ${escapeCell(type)} |`);
  }
  if (!rows.length) return '_No merchant settings exposed in schema._';
  return ['| Setting | ID | Type |', '| --- | --- | --- |', ...rows].join('\n');
}

function blocksList(blocks, translations) {
  if (!blocks?.length) return '_No nested blocks._';
  return blocks
    .map((block) => {
      const name = resolveLabel(block.name || block.type, translations);
      return `- **${name}** (\`${block.type}\`)`;
    })
    .join('\n');
}

function extractManual(existing) {
  if (!existing) return '';
  const start = existing.indexOf(MANUAL_START);
  const end = existing.indexOf(MANUAL_END);
  if (start === -1 || end === -1 || end < start) return '';
  return existing.slice(start, end + MANUAL_END.length);
}

function defaultManual() {
  return `${MANUAL_START}
## Video

Replace \`VIDEO_ID\` with your Loom or YouTube embed when ready:

\`\`\`html
<iframe
  src="https://www.loom.com/embed/VIDEO_ID"
  frameborder="0"
  allowFullScreen
  style="width: 100%; height: 400px; border-radius: 8px;"
></iframe>
\`\`\`

## Tips

- Add merchant tips, common mistakes, and related guide links here.
${MANUAL_END}`;
}

function buildPage({ handle, kind, schema, liquidSource, translations, manual }) {
  const name = resolveLabel(schema.name || handle, translations);
  const requirements = detectRequirements(schema, liquidSource);
  const title = name || handle;

  const reqBlock = requirements.length
    ? `:::note[Requirements]\n${requirements.join('; ')}\n:::`
    : `:::note[Requirements]\nNone beyond the LuminOS theme.\n:::`;

  return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(`LuminOS ${kind} reference: ${title}`)}
---

{/* Generated from theme schema. Edit only inside MANUAL markers. */}

\`${kind}/${handle}\`

Reference for the LuminOS **${title}** ${kind}.

${reqBlock}

## Settings

${settingsTable(schema.settings, translations)}

## Blocks

${blocksList(schema.blocks, translations)}

${manual || defaultManual()}
`;
}

function listLiquidFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.liquid') && !f.startsWith('.'))
    .map((f) => path.join(dir, f));
}

function processFile(filePath, kind, translations) {
  const handle = path.basename(filePath, '.liquid');
  if (kind === 'block' && !BLOCK_INCLUDE.test(handle)) return null;

  const liquidSource = fs.readFileSync(filePath, 'utf8');
  const schema = extractSchema(liquidSource);
  if (!schema) return null;
  if (schema.__parseError) {
    console.warn(`Schema parse error in ${kind}/${handle}: ${schema.__parseError}`);
    return null;
  }

  const outName = kind === 'block' ? `block-${handle}` : handle;
  // Use .md (not .mdx) so HTML MANUAL markers and raw tables parse reliably.
  const outPath = path.join(SECTIONS_OUT, `${outName}.md`);
  const legacyMdx = path.join(SECTIONS_OUT, `${outName}.mdx`);
  const existingPath = fs.existsSync(outPath)
    ? outPath
    : fs.existsSync(legacyMdx)
      ? legacyMdx
      : null;
  const existing = existingPath ? fs.readFileSync(existingPath, 'utf8') : '';
  const manual = extractManual(existing) || defaultManual();

  fs.writeFileSync(
    outPath,
    buildPage({ handle, kind, schema, liquidSource, translations, manual }),
    'utf8'
  );
  if (existingPath === legacyMdx) fs.unlinkSync(legacyMdx);
  return outName;
}

function main() {
  if (!fs.existsSync(THEME_ROOT)) {
    console.error(`Theme not found at: ${THEME_ROOT}`);
    console.error('Set LUMINOS_THEME_PATH to the LuminOS New theme directory.');
    process.exit(1);
  }

  fs.mkdirSync(SECTIONS_OUT, { recursive: true });
  const translations = loadTranslations();
  let count = 0;

  for (const file of listLiquidFiles(path.join(THEME_ROOT, 'sections'))) {
    if (processFile(file, 'section', translations)) count += 1;
  }
  for (const file of listLiquidFiles(path.join(THEME_ROOT, 'blocks'))) {
    if (processFile(file, 'block', translations)) count += 1;
  }

  console.log(`Generated ${count} pages into src/content/docs/sections/ from ${THEME_ROOT}`);
}

main();
