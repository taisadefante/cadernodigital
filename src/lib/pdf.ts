"use client";

import type { Note } from "@/types/note";

type PrintableChecklistItem = {
  text: string;
  done: boolean;
};

type PrintableNote = Note & {
  checklist?: PrintableChecklistItem[];
};

const priorityLabel = {
  none: "Sem prioridade",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
} as const;

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function brDate(value: string | null | undefined): string {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function preserveBreaks(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function renderChecklist(note: PrintableNote): string {
  if (!note.checklist?.length) {
    return "";
  }

  const items = note.checklist
    .map(
      (item) => `
        <li class="check-item">
          <span class="check-box">${item.done ? "✓" : ""}</span>

          <span class="${item.done ? "check-done" : ""}">
            ${escapeHtml(item.text)}
          </span>
        </li>
      `
    )
    .join("");

  return `
    <div class="section">
      <div class="section-title">Checklist</div>
      <ul class="checklist">${items}</ul>
    </div>
  `;
}

function renderTags(note: PrintableNote): string {
  if (!note.tags?.length) {
    return "";
  }

  return `
    <div class="tags">
      ${note.tags
        .map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`)
        .join("")}
    </div>
  `;
}

function renderNote(note: PrintableNote, index: number): string {
  const priority =
    priorityLabel[note.priority as keyof typeof priorityLabel] ??
    "Sem prioridade";

  const meta: string[] = [
    `<span><strong>Prioridade:</strong> ${escapeHtml(priority)}</span>`,
    `<span><strong>Categoria:</strong> ${escapeHtml(
      note.category || "Geral"
    )}</span>`,
  ];

  if (note.date) {
    meta.push(
      `<span><strong>Data:</strong> ${escapeHtml(brDate(note.date))}${
        note.time ? ` às ${escapeHtml(note.time)}` : ""
      }</span>`
    );
  }

  if (note.completed) {
    meta.push(`<span><strong>Status:</strong> Concluída</span>`);
  }

  if (note.pinned) {
    meta.push(`<span><strong>Fixada:</strong> Sim</span>`);
  }

  if (note.favorite) {
    meta.push(`<span><strong>Favorita:</strong> Sim</span>`);
  }

  return `
    <article class="note">
      <div class="note-number">${index + 1}</div>

      <div class="note-content">
        <h2>${escapeHtml(note.title || "Sem título")}</h2>

        <div class="meta">
          ${meta.join("")}
        </div>

        ${
          note.content
            ? `<div class="body-text">${preserveBreaks(note.content)}</div>`
            : ""
        }

        ${renderTags(note)}
        ${renderChecklist(note)}
      </div>
    </article>
  `;
}

function createPrintDocument(notes: PrintableNote[], title: string): string {
  const generatedAt = new Date().toLocaleString("pt-BR");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>${escapeHtml(title)}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #172033;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;
    }

    body {
      padding: 14mm;
      font-size: 10.5pt;
      line-height: 1.5;
    }

    .document-header {
      margin-bottom: 10mm;
      padding-bottom: 5mm;
      border-bottom: 2px solid #1d4ed8;
    }

    .document-header h1 {
      margin: 0 0 2mm;
      font-size: 21pt;
      line-height: 1.15;
      color: #0f172a;
    }

    .document-subtitle {
      color: #64748b;
      font-size: 9pt;
    }

    .note {
      display: flex;
      gap: 4mm;
      position: relative;
      margin: 0 0 7mm;
      padding: 5mm;
      border: 1px solid #dbe2ea;
      border-left: 4px solid #2563eb;
      border-radius: 3mm;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #ffffff;
    }

    .note-number {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 8mm;
      height: 8mm;
      border-radius: 50%;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 9pt;
      font-weight: 700;
    }

    .note-content {
      min-width: 0;
      flex: 1;
    }

    h2 {
      margin: 0 0 2.5mm;
      color: #0f172a;
      font-size: 15pt;
      line-height: 1.25;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm 5mm;
      margin-bottom: 3.5mm;
      color: #475569;
      font-size: 8.8pt;
    }

    .body-text {
      margin: 0;
      color: #1e293b;
      overflow-wrap: anywhere;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5mm;
      margin-top: 4mm;
    }

    .tag {
      display: inline-block;
      padding: 1mm 2.4mm;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      color: #475569;
      font-size: 8pt;
      background: #f8fafc;
    }

    .section {
      margin-top: 4mm;
    }

    .section-title {
      margin-bottom: 2mm;
      font-weight: 700;
      color: #334155;
    }

    .checklist {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .check-item {
      display: flex;
      gap: 2mm;
      align-items: flex-start;
      margin-bottom: 1.5mm;
    }

    .check-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 4.5mm;
      height: 4.5mm;
      border: 1px solid #94a3b8;
      border-radius: 1mm;
      font-size: 8pt;
      font-weight: 700;
    }

    .check-done {
      text-decoration: line-through;
      color: #64748b;
    }

    .footer-info {
      margin-top: 8mm;
      padding-top: 4mm;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 8pt;
      text-align: center;
    }

    @page {
      size: A4 portrait;
      margin: 12mm;
    }

    @media print {
      html,
      body {
        width: 100%;
        background: white !important;
      }

      body {
        padding: 0;
      }

      .note {
        box-shadow: none;
      }
    }
  </style>
</head>

<body>
  <header class="document-header">
    <h1>${escapeHtml(title)}</h1>

    <div class="document-subtitle">
      ${notes.length} anotação(ões) • Gerado em ${escapeHtml(generatedAt)}
    </div>
  </header>

  <main>
    ${notes.map((note, index) => renderNote(note, index)).join("")}
  </main>

  <footer class="footer-info">
    Meu Caderno Digital
  </footer>
</body>
</html>`;
}

function removeExistingPrintFrame(): void {
  const existing = document.getElementById("caderno-print-frame");

  if (existing) {
    existing.remove();
  }
}

export async function exportNotesToPdf(
  notes: Note[],
  title = "Meu Caderno Digital"
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error(
      "A impressão só pode ser executada no navegador."
    );
  }

  if (!notes.length) {
    throw new Error("Não há anotações para imprimir.");
  }

  removeExistingPrintFrame();

  const iframe = document.createElement("iframe");

  iframe.id = "caderno-print-frame";

  iframe.setAttribute("aria-hidden", "true");

  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "1px",
    height: "1px",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });

  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframe.contentDocument;

  if (!iframeWindow || !iframeDocument) {
    iframe.remove();

    throw new Error(
      "Não foi possível preparar a impressão."
    );
  }

  const printableNotes = notes as PrintableNote[];

  iframeDocument.open();

  iframeDocument.write(
    createPrintDocument(printableNotes, title)
  );

  iframeDocument.close();

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.remove();
      }
    }, 500);
  };

  iframeWindow.addEventListener(
    "afterprint",
    cleanup,
    { once: true }
  );

  // Dá tempo para o navegador montar o documento dentro do iframe.
  window.setTimeout(() => {
    try {
      iframeWindow.focus();
      iframeWindow.print();
    } catch (error) {
      cleanup();

      console.error(
        "Erro ao abrir a impressão:",
        error
      );
    }
  }, 300);

  // Fallback de limpeza caso o navegador não dispare afterprint.
  window.setTimeout(() => {
    if (iframe.parentNode) {
      iframe.remove();
    }
  }, 60_000);
}
