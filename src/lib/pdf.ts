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
  none: "",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
} as const;

const priorityColor = {
  none: "#cbd5e1",
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  urgent: "#ef4444",
} as const;

const tagPalette = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#059669",
  "#0891b2",
  "#d97706",
  "#dc2626",
  "#4f46e5",
];

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

function reminderLabel(value: number): string {
  if (value === 0) return "Na hora";
  if (value === 15) return "15 min antes";
  if (value === 60) return "1 hora antes";
  if (value === 1440) return "1 dia antes";

  if (value < 60) {
    return `${value} min antes`;
  }

  if (value % 1440 === 0) {
    const days = value / 1440;
    return `${days} ${days === 1 ? "dia" : "dias"} antes`;
  }

  if (value % 60 === 0) {
    const hours = value / 60;
    return `${hours} ${hours === 1 ? "hora" : "horas"} antes`;
  }

  return `${value} min antes`;
}

function recurrenceLabel(value: string): string {
  const labels: Record<string, string> = {
    daily: "Todos os dias",
    weekly: "Toda semana",
    monthly: "Todo mês",
    yearly: "Todo ano",
  };

  return labels[value] || value;
}

function tagColor(tag: string): string {
  let hash = 0;

  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }

  return tagPalette[hash % tagPalette.length];
}

function renderTags(note: PrintableNote): string {
  if (!note.tags?.length) {
    return "";
  }

  return `
    <div class="tags-inline">
      ${note.tags
        .map(
          (tag) => `
            <span
              class="tag"
              style="background:${tagColor(tag)}"
            >
              #${escapeHtml(tag)}
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPriority(note: PrintableNote): string {
  if (!note.priority || note.priority === "none") {
    return "";
  }

  const label =
    priorityLabel[note.priority as keyof typeof priorityLabel] || "";

  const color =
    priorityColor[note.priority as keyof typeof priorityColor] || "#cbd5e1";

  return `
    <div class="priority">
      <span
        class="priority-dot"
        style="background:${color}"
      ></span>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function renderDate(note: PrintableNote): string {
  if (!note.date && !note.appointment) {
    return "";
  }

  return `
    <div class="date-group">
      ${
        note.appointment
          ? `<span class="appointment">Compromisso</span>`
          : ""
      }

      ${
        note.date
          ? `<span class="date-text">
              ${escapeHtml(brDate(note.date))}
              ${note.time ? ` às ${escapeHtml(note.time)}` : ""}
            </span>`
          : ""
      }
    </div>
  `;
}

function renderDetails(note: PrintableNote): string {
  const items: string[] = [];

  if (note.recurrence && note.recurrence !== "none") {
    items.push(
      `<span>${escapeHtml(recurrenceLabel(note.recurrence))}</span>`
    );
  }

  if (
    note.reminderMinutes !== null &&
    note.reminderMinutes !== undefined
  ) {
    items.push(
      `<span class="reminder">${escapeHtml(
        reminderLabel(note.reminderMinutes)
      )}</span>`
    );
  }

  if (note.checklist?.length) {
    const done = note.checklist.filter((item) => item.done).length;

    items.push(
      `<span class="check-progress">Checklist ${done}/${note.checklist.length}</span>`
    );
  }

  if (note.completed) {
    items.push(`<span class="completed">Concluída</span>`);
  }

  if (!items.length) {
    return "";
  }

  return `<div class="details">${items.join("")}</div>`;
}

function renderChecklist(note: PrintableNote): string {
  if (!note.checklist?.length) {
    return "";
  }

  return `
    <div class="checklist-row">
      <strong class="checklist-label">Checklist:</strong>

      <div class="checklist-items">
        ${note.checklist
          .map(
            (item) => `
              <span class="check-chip ${item.done ? "done" : ""}">
                <span class="check-circle">${item.done ? "✓" : ""}</span>
                ${escapeHtml(item.text)}
              </span>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderNote(note: PrintableNote, index: number): string {
  const borderColor =
    priorityColor[note.priority as keyof typeof priorityColor] ||
    "#cbd5e1";

  const title = note.title?.trim() || "Sem título";
  const content = note.content?.trim() || "";

  const contentLines = content
    ? content.split(/\r?\n/)
    : [];

  const isLongContent =
    content.length > 180 ||
    contentLines.length > 3;

  return `
    <article
      class="note-row ${index % 2 === 0 ? "row-even" : "row-odd"}"
      style="border-left-color:${borderColor}"
    >
      <div class="note-grid">
        <div class="cell annotation-cell">
          <div class="title-line">
            <strong>${escapeHtml(title)}</strong>

            ${note.pinned ? `<span class="pin">◆</span>` : ""}
            ${note.favorite ? `<span class="favorite">★</span>` : ""}
          </div>

          ${
            content && !isLongContent
              ? `<div class="note-text">${preserveBreaks(content)}</div>`
              : ""
          }
        </div>

        <div class="cell tag-priority-cell">
          ${renderTags(note)}
          ${renderPriority(note)}
        </div>

        <div class="cell date-cell">
          ${renderDate(note)}
        </div>

        <div class="cell details-cell">
          ${renderDetails(note)}
        </div>
      </div>

      ${
        content && isLongContent
          ? `
            <div class="full-note-text">
              ${preserveBreaks(content)}
            </div>
          `
          : ""
      }

      ${renderChecklist(note)}
    </article>
  `;
}

function createPrintDocument(
  notes: PrintableNote[],
  title: string
): string {
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
      color: #1f2937;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;
    }

    body {
      font-size: 8.4pt;
      line-height: 1.3;
    }

    .document-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8mm;
      margin-bottom: 4mm;
      padding-bottom: 3mm;
      border-bottom: 1.5px solid #0f172a;
    }

    .document-title h1 {
      margin: 0;
      color: #0f172a;
      font-size: 17pt;
      line-height: 1.1;
    }

    .document-subtitle {
      margin-top: 1mm;
      color: #64748b;
      font-size: 7.5pt;
    }

    .count {
      padding: 1.3mm 3mm;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 7.5pt;
      font-weight: 700;
    }

    .list {
      width: 100%;
      border: 1px solid #dbe2ea;
      border-radius: 2.5mm;
      overflow: hidden;
    }

    .list-header {
      display: grid;
      grid-template-columns: 42% 18% 18% 22%;
      align-items: center;
      min-height: 8mm;
      padding: 0 3mm;
      background: #e2e8f0;
      border-bottom: 2px solid #94a3b8;
      color: #64748b;
      font-size: 6.8pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    .list-header > div:not(:first-child) {
      text-align: center;
    }

    .note-row {
      border-left: 3.5px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .note-row:last-child {
      border-bottom: 0;
    }

    .row-even {
      background: #ffffff;
    }

    .row-odd {
      background: #eef2f7;
    }

    .note-grid {
      display: grid;
      grid-template-columns: 42% 18% 18% 22%;
      align-items: start;
      min-height: 15mm;
    }

    .cell {
      min-width: 0;
      padding: 3mm;
    }

    .tag-priority-cell,
    .date-cell,
    .details-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5mm;
      text-align: center;
    }

    .title-line {
      display: flex;
      align-items: center;
      gap: 1.5mm;
      min-width: 0;
      color: #0f172a;
      font-size: 9.5pt;
    }

    .title-line strong {
      overflow-wrap: anywhere;
    }

    .pin {
      color: #2563eb;
      font-size: 7pt;
    }

    .favorite {
      color: #eab308;
      font-size: 9pt;
    }

    .note-text {
      margin-top: 1.5mm;
      color: #64748b;
      font-size: 7.8pt;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .full-note-text {
      width: auto;
      margin: 0 3mm 2.5mm 3mm;
      padding: 2.5mm 3mm;
      border-top: 1px dashed #dbe2ea;
      color: #334155;
      font-size: 8pt;
      line-height: 1.42;
      overflow-wrap: anywhere;
      word-break: break-word;
      background: rgba(255,255,255,.38);
    }

    .tags-inline {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1mm;
    }

    .tag {
      display: inline-block;
      padding: .6mm 1.8mm;
      border-radius: 999px;
      color: #ffffff;
      font-size: 6.6pt;
      font-weight: 700;
    }

    .priority {
      display: inline-flex;
      align-items: center;
      gap: 1mm;
      color: #64748b;
      font-size: 7.2pt;
    }

    .priority-dot {
      display: inline-block;
      width: 1.6mm;
      height: 1.6mm;
      border-radius: 50%;
    }

    .date-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
      font-size: 7.3pt;
    }

    .appointment {
      color: #2563eb;
      font-weight: 700;
    }

    .date-text {
      color: #334155;
    }

    .details {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
      color: #475569;
      font-size: 7.2pt;
    }

    .reminder {
      color: #a16207;
    }

    .check-progress {
      color: #15803d;
    }

    .completed {
      color: #15803d;
      font-weight: 700;
    }

    .checklist-row {
      display: flex;
      align-items: center;
      gap: 2mm;
      padding: 2mm 3mm 2.5mm;
      margin-left: 3mm;
      border-top: 1px dashed #dbe2ea;
    }

    .checklist-label {
      flex: 0 0 auto;
      color: #475569;
      font-size: 7pt;
    }

    .checklist-items {
      display: flex;
      flex-wrap: wrap;
      gap: 1mm;
    }

    .check-chip {
      display: inline-flex;
      align-items: center;
      gap: .8mm;
      padding: .6mm 1.7mm;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      background: #ffffff;
      color: #64748b;
      font-size: 6.6pt;
    }

    .check-chip.done {
      border-color: #86efac;
      background: #dcfce7;
      color: #166534;
      text-decoration: line-through;
    }

    .check-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3mm;
      height: 3mm;
      border: 1px solid currentColor;
      border-radius: 50%;
      font-size: 5.5pt;
      line-height: 1;
    }

    .footer {
      margin-top: 4mm;
      padding-top: 2mm;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      text-align: center;
      font-size: 6.5pt;
    }

    @page {
      size: A4 portrait;
      margin: 9mm 10mm;
    }

    @media print {
      html,
      body {
        width: 100%;
        background: #ffffff !important;
      }

      .row-odd,
      .row-even,
      .tag,
      .count,
      .check-chip,
      .priority-dot {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>

<body>
  <header class="document-header">
    <div class="document-title">
      <h1>${escapeHtml(title)}</h1>

      <div class="document-subtitle">
        Gerado em ${escapeHtml(generatedAt)}
      </div>
    </div>

    <div class="count">
      ${notes.length} ${notes.length === 1 ? "anotação" : "anotações"}
    </div>
  </header>

  <main class="list">
    <div class="list-header">
      <div>Anotação</div>
      <div>Tags / Prioridade</div>
      <div>Data</div>
      <div>Detalhes</div>
    </div>

    ${notes.map((note, index) => renderNote(note, index)).join("")}
  </main>

  <footer class="footer">
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
  if (
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
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

  window.setTimeout(() => {
    if (iframe.parentNode) {
      iframe.remove();
    }
  }, 60_000);
}
