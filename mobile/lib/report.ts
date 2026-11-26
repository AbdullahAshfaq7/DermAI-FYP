/**
 * The scan report as a PDF: drawn as HTML (so it reuses the app's own copy and colours), printed on the
 * phone with expo-print, then handed to the share sheet so it can be saved to Files or sent to a doctor.
 * Nothing leaves the phone unless the person shares it.
 */
import * as LegacyFS from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import logo from '@/assets/logo.json';
import { CONCERNS, FITZ_ROMAN } from '@/data/seed';
import type { ConcernKey, ConcernLevel, Scan, ZoneKey } from '@/data/types';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth, time } from '@/lib/format';
import { previousScan, summaryLine, zoneName } from '@/lib/selectors';
import type { AppState } from '@/store/state';
import { concernHue, lightColors as c } from '@/theme/colors';

const LEVEL_COLOR: Record<ConcernLevel, string> = { Clear: '#17855A', Mild: '#2F67C9', Moderate: '#D45A2A', High: '#C8363A' };
const ZONES: ZoneKey[] = ['forehead', 'nose', 'leftCheek', 'rightCheek', 'chin'];

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string);

function logoSvg(size: number): string {
  const grad = (id: string, p: { from: number[]; to: number[]; stops: string[] }) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${p.from[0]}" y1="${p.from[1]}" x2="${p.to[0]}" y2="${p.to[1]}"><stop offset="0" stop-color="${p.stops[0]}"/><stop offset="1" stop-color="${p.stops[1]}"/></linearGradient>`;
  const squares = logo.squares.map((q) => `<rect x="${q.x}" y="${q.y}" width="${q.s}" height="${q.s}" rx="${q.s * 0.22}" fill="${q.fill}"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48"><defs>${grad('lf', logo.leaf)}${grad('hd', logo.head)}</defs><path d="${logo.leaf.d}" fill="url(#lf)"/><path d="${logo.head.d}" fill="url(#hd)"/>${squares}</svg>`;
}

function ring(score: number): string {
  const r = 52;
  const len = 2 * Math.PI * r;
  return `<svg width="132" height="132" viewBox="0 0 132 132">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.brand}"/><stop offset="1" stop-color="${c.brandAlt}"/></linearGradient></defs>
    <circle cx="66" cy="66" r="${r}" stroke="${c.surfaceMuted}" stroke-width="12" fill="none"/>
    <circle cx="66" cy="66" r="${r}" stroke="url(#rg)" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${(len * score) / 100} ${len}" transform="rotate(-90 66 66)"/>
    <text x="66" y="70" text-anchor="middle" font-size="36" font-weight="800" fill="${c.textPrimary}">${score}</text>
    <text x="66" y="92" text-anchor="middle" font-size="11" fill="${c.textMuted}">out of 100</text></svg>`;
}

function concernRow(scan: Scan, k: ConcernKey): string {
  const r = scan.concerns[k];
  const where = (scan.where[k] ?? []).map(zoneName).join(', ') || '—';
  return `<tr>
    <td><span class="dot" style="background:${concernHue[k]}"></span>${CONCERNS[k].label}</td>
    <td class="num" style="color:${concernHue[k]}">${r.pct}%</td>
    <td><div class="bar"><div style="width:${r.pct}%;background:${concernHue[k]}"></div></div></td>
    <td><span class="lvl" style="color:${LEVEL_COLOR[r.level]};border-color:${LEVEL_COLOR[r.level]}">${r.level}</span></td>
    <td class="muted">${esc(where)}</td></tr>`;
}

function advice(scan: Scan, k: ConcernKey): string {
  const info = CONCERNS[k];
  const helps = info.helps.map((h) => `<li><b>${esc(h.title)}</b> — ${esc(h.subtitle)}</li>`).join('');
  return `<div class="advice"><h3><span class="dot" style="background:${concernHue[k]}"></span>${info.label} · ${scan.concerns[k].level}</h3>
    <p class="muted">${esc(info.toneNote)}</p>
    <p class="label">What helps</p><ul>${helps}</ul>
    <p class="doctor">${esc(info.doctorHint)}</p></div>`;
}

export function reportHtml(state: AppState, scan: Scan): string {
  const prev = previousScan(state, scan);
  const delta = prev ? scan.score - prev.score : null;
  const ranked = rankedConcerns(scan);
  const focus = ranked.filter((k) => scan.concerns[k].level !== 'Clear');
  const name = state.session?.name ?? 'DermAI user';
  const p = state.profile;
  const history = [...state.scans].filter((s) => s.date <= scan.date).slice(0, 6).reverse();
  const zones = ZONES.map((z) => `<div class="zone"><span>${zoneName(z)}</span><b style="color:${LEVEL_COLOR[scan.zones[z]]}">${scan.zones[z]}</b></div>`).join('');
  const hist = history.length > 1 ? `<h2>Score history</h2><div class="hist">${history.map((s) => `<div><div class="hbar" style="height:${s.score}px"></div><b>${s.score}</b><span>${dayMonth(s.date)}</span></div>`).join('')}</div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { margin: 28px; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .newpage { page-break-before: always; break-before: page; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: ${c.textPrimary}; font-size: 12px; margin: 0; }
  .head { display:flex; align-items:center; gap:10px; border-bottom: 2px solid ${c.brandWash}; padding-bottom: 12px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; } .brand i { font-style: normal; color: ${c.brand}; }
  .meta { margin-left:auto; text-align:right; color:${c.textSecondary}; line-height:1.5; }
  .hero { display:flex; gap:20px; align-items:center; background: linear-gradient(135deg, ${c.brandWash}, #E0F3F5); border-radius:16px; padding:16px 20px; margin:16px 0; }
  .hero h1 { font-size:18px; margin:0 0 6px; } .chips span { display:inline-block; background:#fff; border-radius:99px; padding:3px 10px; margin:4px 6px 0 0; color:${c.textSecondary}; }
  h2 { font-size:14px; margin:18px 0 8px; } .newpage { margin-top:0; } h3 { font-size:13px; margin:0 0 4px; }
  table { width:100%; border-collapse: collapse; } td { padding:7px 6px; border-bottom:1px solid ${c.hairline}; vertical-align: middle; }
  .num { font-weight:700; width:44px; } .bar { height:6px; background:${c.surfaceMuted}; border-radius:9px; width:120px; overflow:hidden; } .bar div { height:6px; border-radius:9px; }
  .lvl { border:1px solid; border-radius:99px; padding:1px 8px; font-weight:600; font-size:11px; }
  .dot { display:inline-block; width:9px; height:9px; border-radius:5px; margin-right:7px; vertical-align: middle; }
  .muted { color:${c.textSecondary}; } .label { font-weight:700; margin:8px 0 2px; }
  .zones { display:flex; gap:8px; } .zone { flex:1; background:${c.surfaceMuted}; border-radius:10px; padding:8px; text-align:center; } .zone span { display:block; color:${c.textSecondary}; margin-bottom:2px; }
  .advice { border:1px solid ${c.border}; border-radius:12px; padding:9px 12px; margin-bottom:7px; page-break-inside: avoid; } ul { margin:2px 0 0 16px; padding:0; } li { margin:2px 0; }
  .doctor { background:${c.clinicianWash}; color:${c.clinicianDeep}; border-radius:8px; padding:6px 8px; margin:6px 0 0; }
  .hist { display:flex; align-items:flex-end; gap:14px; height:130px; } .hist div { text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; }
  .hbar { width:22px; background: linear-gradient(${c.brand}, ${c.brandAlt}); border-radius:6px 6px 0 0; } .hist span { color:${c.textMuted}; font-size:10px; }
  .profile { display:flex; gap:24px; } .profile div b { display:block; }
  .foot { margin-top:10px; padding-top:8px; border-top:1px solid ${c.hairline}; color:${c.textMuted}; font-size:10px; }
  </style></head><body>
  <div class="head">${logoSvg(34)}<div class="brand">derm<i>AI</i></div>
    <div class="meta"><b>Skin scan report</b><br>${esc(name)}<br>${dayMonth(scan.date)}, ${time(scan.date)}</div></div>

  <div class="hero">${ring(scan.score)}<div><h1>${esc(summaryLine(scan))}</h1>
    <div class="chips"><span>${delta == null ? 'First scan' : `${delta >= 0 ? '+' : ''}${delta} since last scan`}</span><span>${scan.confidence ?? 80}% confidence</span><span>${scan.quality === 'dim' ? 'Dim photo, scored with caution' : 'Good photo'}</span></div></div></div>

  <h2>Six concerns</h2><table>${ranked.map((k) => concernRow(scan, k)).join('')}</table>
  <h2>Face zones</h2><div class="zones">${zones}</div>
  ${hist}
  <h2>Your skin profile</h2><div class="profile">
    <div><span class="muted">Skin tone</span><b>${p.tone == null ? 'Not set' : `Type ${FITZ_ROMAN[p.tone]}`}</b></div>
    <div><span class="muted">Skin type</span><b>${esc(p.feel ?? 'Not set')}</b></div>
    <div><span class="muted">Keep out of routine</span><b>${p.avoid.length ? esc(p.avoid.join(', ')) : 'Nothing listed'}</b></div></div>
  ${focus.length ? `<h2 class="newpage">What to focus on</h2>${focus.map((k) => advice(scan, k)).join('')}` : ''}
  <div class="foot">DermAI gives guidance, not a diagnosis. Readings come from AI models on a single photo and can be affected by light and camera. See a dermatologist for anything painful, spreading or changing. Report ${esc(scan.id)}.</div>
  </body></html>`;
}

/** Print the report to a PDF and open the share sheet (Save to Files, Mail, WhatsApp...). */
export async function exportReport(state: AppState, scan: Scan): Promise<void> {
  try {
    const { uri } = await Print.printToFileAsync({ html: reportHtml(state, scan) });
    const day = scan.date.slice(0, 10);
    const target = `${LegacyFS.cacheDirectory}DermAI-report-${day}.pdf`;
    await LegacyFS.deleteAsync(target, { idempotent: true });
    await LegacyFS.moveAsync({ from: uri, to: target });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(target, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'DermAI skin report' });
    } else {
      Alert.alert('Report saved', 'Sharing is not available on this device.');
    }
  } catch {
    Alert.alert('Could not create the report', 'Please try again.');
  }
}
