/* ─── WhatsApp Chat Parser & Export ──────────────────────────────── */

function detectFormat(text) {
  if (/^\[\d{4}-\d{2}-\d{2}/m.test(text)) return 'ios';
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}/m.test(text)) return 'android';
  return 'unknown';
}

function parseWhatsAppChat(text) {
  const clean = text.replace(/\r\n/g, '\n').replace(/‎|‏/g, '');
  const format = detectFormat(clean);
  if (format === 'unknown') return { format:'unknown', entries:[], totalEntries:0 };

  const lines = clean.split('\n');
  const entries = [];
  let current = null;
  let idx = 0;
  const iosRe = /^\[(\d{4}-\d{2}-\d{2},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s+(.*)$/;
  const androidRe = /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*[-–]\s+(.*)$/;

  const systemTriggers = [
    /created (this )?group/i, /added /i, /removed /i, /left /i,
    /changed (the )?(group )?(subject|name|icon|description|settings)/i,
    /Messages and calls are end-to-end encrypted/i,
    /security code changed/i, /joined using this group/i,
    /,+\s+me/i, /you were added/i, /disappearing messages/i,
  ];

  function isSystemMsg(text) {
    return systemTriggers.some(p => p.test(text));
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const re = format === 'ios' ? iosRe : androidRe;
    const m = line.match(re);

    if (m) {
      if (current) entries.push(current);
      const timestamp = m[1].trim();
      const content = m[2].trim();
      const ci = content.indexOf(': ');

      let sender = '', message = content, isSystem = false;

      if (ci > 0) {
        const potentialSender = content.slice(0, ci);
        const potentialMsg = content.slice(ci + 2);
        // User message if sender name is reasonable length and not a system pattern
        if (potentialSender.length > 0 && potentialSender.length < 60 &&
            !isSystemMsg(potentialMsg) && !/^\d+$/.test(potentialSender)) {
          sender = potentialSender;
          message = potentialMsg;
        } else {
          isSystem = true;
        }
      } else {
        isSystem = true;
      }

      idx++;
      current = {
        index: idx,
        timestamp,
        sender,
        message,
        isSystem,
        isMedia: /<(Media|image|video|audio|document|sticker|gif)\s+omitted>/i.test(message) ||
                 /(image|video|audio|document)\s+omitted/i.test(message),
      };
    } else if (current) {
      current.message += '\n' + line;
    }
  }
  if (current) entries.push(current);

  // Gather senders
  const senders = [...new Set(entries.filter(e => !e.isSystem).map(e => e.sender))].sort();

  // Per-sender stats
  const senderStats = {};
  for (const e of entries) {
    if (e.isSystem) continue;
    if (!senderStats[e.sender]) senderStats[e.sender] = { count: 0, chars: 0, mediaCount: 0 };
    senderStats[e.sender].count++;
    senderStats[e.sender].chars += e.message.length;
    if (e.isMedia) senderStats[e.sender].mediaCount++;
  }

  return {
    format,
    entries,
    totalEntries: entries.length,
    senders,
    senderStats,
  };
}

function filterByDateRange(entries, startDate, endDate) {
  if (!startDate && !endDate) return entries;
  return entries.filter(e => {
    // Extract just the date part from timestamp for comparison
    const ts = e.timestamp;
    let d;
    if (ts.match(/^\d{4}-\d{2}-\d{2}/)) {
      // iOS format: YYYY-MM-DD
      d = ts.slice(0, 10);
    } else {
      // Android: M/D/YY or M/D/YYYY
      const parts = ts.split(',')[0].trim().split('/');
      if (parts.length === 3) {
        let y = parts[2];
        if (y.length === 2) y = '20' + y;
        d = `${y}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
      } else {
        return true; // can't parse, include
      }
    }
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });
}

/* ─── Export ─────────────────────────────────────────────────────── */

function exportPlainText(entries) {
  return entries.map(e =>
    e.isSystem ? `— ${e.message} —` : `[${e.timestamp}] ${e.sender}: ${e.message}`
  ).join('\n');
}

function exportMarkdown(entries, chatName) {
  let md = `# ${escMd(chatName || 'WhatsApp Chat')}\n\n`;
  md += `*Exported ${new Date().toISOString().split('T')[0]}*\n\n---\n\n`;
  for (const e of entries) {
    if (e.isSystem) {
      md += `> *${escMd(e.message)}*\n\n`;
    } else {
      md += `**${escMd(e.sender)}** — _${e.timestamp}_\n`;
      if (e.isMedia) md += `📎 *${escMd(e.message)}*\n`;
      else md += `${escMd(e.message)}\n`;
      md += '\n---\n\n';
    }
  }
  return md;
}

function escMd(s) { return s.replace(/_/g, '\\_').replace(/\*/g, '\\*'); }

function exportHTML(entries, chatName) {
  const dateStr = new Date().toISOString().split('T')[0];
  let h = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(chatName||'WhatsApp Chat')}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#e5ddd5;padding:20px}
.container{max-width:800px;margin:0 auto}
.header{background:#075e54;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;position:sticky;top:0;z-index:10}
.header h1{font-size:18px}
.header p{font-size:12px;opacity:.8}
.messages{background:#e5ddd5 url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" opacity="0.05"><rect width="200" height="200" fill="white"/></svg>');padding:12px 16px;min-height:400px}
.sys{text-align:center;color:#888;font-size:12px;padding:8px 0;font-style:italic}
.msg{margin:4px 0;display:flex;animation:fadeIn .2s}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.bub{max-width:80%;padding:7px 10px;border-radius:8px;position:relative;font-size:14.5px;line-height:1.45;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.bub .s{font-weight:600;font-size:13px;margin-bottom:2px}
.bub .t{font-size:11px;color:#999;text-align:right;margin-top:3px}
.media{color:#667;font-style:italic}
.footer{text-align:center;padding:12px;color:#999;font-size:11px;background:#f0f0f0;border-radius:0 0 8px 8px}
@media print{body{background:#fff}.header{background:#075e54!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.messages{background:#fff!important}}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>${escHtml(chatName||'WhatsApp Chat')}</h1><p>Exported ${dateStr} · ${entries.length} messages</p></div>
<div class="messages">\n`;

  for (const e of entries) {
    if (e.isSystem) {
      h += `<div class="sys">— ${escHtml(e.message)} —</div>\n`;
    } else {
      h += `<div class="msg"><div class="bub" style="background:${e.isMedia?'#f0f0f0':'#dcf8c6'}">
<div class="s" style="color:#075e54">${escHtml(e.sender)}</div>
<div${e.isMedia?' class="media"':''}>${escHtml(e.message).replace(/\n/g,'<br>')}</div>
<div class="t">${escHtml(e.timestamp)}</div>
</div></div>\n`;
    }
  }

  h += `</div><div class="footer">Generated by WhatsApp Chat Formatter</div></div></body></html>`;
  return h;
}

function exportCSV(entries) {
  let csv = '﻿"Index","Date","Sender","Message","Type"';
  for (const e of entries) {
    const t = e.isSystem ? 'System' : (e.isMedia ? 'Media' : 'Text');
    csv += `\n${e.index},"${csvEsc(e.timestamp)}","${csvEsc(e.sender)}","${csvEsc(e.message)}","${t}"`;
  }
  return csv;
}

function csvEsc(s) { return (s||'').replace(/"/g,'""'); }

function exportJSON(entries) {
  return JSON.stringify(entries.map(e=>({
    index:e.index, timestamp:e.timestamp, sender:e.sender,
    message:e.message, type:e.isSystem?'system':(e.isMedia?'media':'text')
  })), null, 2);
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
