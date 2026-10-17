// Sends label photos to the AI with the real prompt, parser and timeout, and records how it did.
// Usage: node scripts/test-prompt.mjs <image> [image ...]
// Reads AI_API_KEY from .env. Writes scripts/prompt-results.md (gitignored).

import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { MODEL, scanLabel } from '../api/_ai.js'

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

function readKey() {
  try {
    const match = readFileSync('.env', 'utf8').match(/^AI_API_KEY=(.*)$/m)
    return match?.[1].trim()
  } catch {
    return undefined
  }
}

const apiKey = readKey()
const images = process.argv.slice(2)
if (!apiKey) {
  console.error('Add AI_API_KEY to .env first.')
  process.exit(1)
}
if (images.length === 0) {
  console.error('Usage: node scripts/test-prompt.mjs <image> [image ...]')
  process.exit(1)
}

function cell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const rows = []
for (const path of images) {
  const mimeType = MIME[extname(path).toLowerCase()]
  if (!mimeType) {
    console.error(`Skipping ${path}: unsupported file type`)
    continue
  }
  const started = performance.now()
  const result = await scanLabel({
    imageBase64: readFileSync(path).toString('base64'),
    mimeType,
    language: 'English',
    apiKey,
  })
  const seconds = (performance.now() - started) / 1000
  const data = result.data ?? {}
  const row = {
    file: basename(path),
    kb: Math.round(statSync(path).size / 1024),
    name: data.name,
    strength: data.strength,
    expiry: data.expiry_date,
    confidence: data.confidence,
    status: result.ok ? 'ok' : [result.error, result.detail].filter(Boolean).join(' '),
    attempts: result.attempts,
    seconds,
    raw: result.raw,
  }
  rows.push(row)
  console.log(`${row.file}: ${row.status} in ${seconds.toFixed(1)}s (${row.attempts} attempt(s))`)
}

const times = rows.map((r) => r.seconds)
const lines = [
  `# Prompt test results`,
  '',
  `Model: \`${MODEL}\` · ${new Date().toISOString()}`,
  '',
  `Median ${median(times).toFixed(1)}s · max ${Math.max(...times).toFixed(1)}s`,
  '',
  '| File | KB | Name | Strength | Expiry | Confidence | Result | Tries | Seconds |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(
    (r) =>
      `| ${cell(r.file)} | ${r.kb} | ${cell(r.name)} | ${cell(r.strength)} | ${cell(r.expiry)} | ${cell(r.confidence)} | ${cell(r.status)} | ${r.attempts} | ${r.seconds.toFixed(1)} |`,
  ),
  '',
  '## Raw replies',
  '',
  ...rows.flatMap((r) => [`### ${r.file}`, '', '```', r.raw ?? r.status, '```', '']),
]
writeFileSync('scripts/prompt-results.md', lines.join('\n'))
console.log('Wrote scripts/prompt-results.md')
