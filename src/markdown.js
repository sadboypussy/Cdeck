/** Rendu Markdown minimal — édition (backdrop) et lecture (prose). */

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineCodes(text) {
  return text.replace(/`([^`]+)`/g, (_, code) => `<code class="md-code">${escapeHtml(code)}</code>`);
}

export function inlineEdit(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="md-wikilink">[[$1]]</span>');
  html = html.replace(/(^|\s)(#[\w\-]+)/g, '$1<span class="md-tag">$2</span>');
  return inlineCodes(html);
}

export function inlineRead(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, label) => {
    const id = label.trim().replace(/ /g, "_");
    return `<button type="button" class="read-wikilink" data-note-id="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
  });
  html = html.replace(/(^|\s)(#[\w\-]+)/g, '$1<span class="read-tag">$2</span>');
  return inlineCodes(html);
}

export function bodyToReadHtml(body) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const fence = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        fence.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(`<pre class="read-pre"><code>${escapeHtml(fence.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      out.push("<hr class=\"read-hr\" />");
      i += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      out.push(`<h3 class="read-h3">${inlineRead(line.slice(4))}</h3>`);
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(`<h2>${inlineRead(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(`<h1>${inlineRead(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote.push(lines[i].slice(2));
        i += 1;
      }
      out.push(`<blockquote class="read-quote">${quote.map((l) => `<p>${inlineRead(l)}</p>`).join("")}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      out.push(`<ul class="read-list">${items.map((t) => `<li>${inlineRead(t)}</li>`).join("")}</ul>`);
      continue;
    }

    if (!line.trim()) {
      out.push('<p class="read-gap">&nbsp;</p>');
      i += 1;
      continue;
    }

    out.push(`<p>${inlineRead(line)}</p>`);
    i += 1;
  }

  return out.join("");
}

export function bodyToEditBackdrop(body) {
  return body
    .split("\n")
    .map((line) => {
      const html = inlineEdit(line);
      if (line.startsWith("# ")) return `<span class="md-h1">${html}</span>`;
      if (line.startsWith("## ")) return `<span class="md-h2">${html}</span>`;
      if (line.startsWith("### ")) return `<span class="md-h3">${html}</span>`;
      if (line.startsWith("> ")) return `<span class="md-quote">${html}</span>`;
      return html;
    })
    .join("\n");
}
