"use client";

import {
  useState,
} from "react";

import type {
  Note,
  NotePriority,
} from "@/types/note";

interface Props {
  note: Note;
  search: string;
  tagColors: Record<string, string>;
  onEdit: (
    note: Note
  ) => void;
  onDelete: (
    note: Note
  ) => void;
  onPatch: (
    note: Note,
    data: Partial<Note>
  ) => Promise<void>;
  onPdf?: (
    note: Note
  ) => void;
  onHistory: (
    note: Note
  ) => void;
}

const DEFAULT_TAG_COLOR = "#64748b";

function safeTagColor(value?: string): string {
  return /^#[0-9a-f]{6}$/i.test(value || "")
    ? String(value)
    : DEFAULT_TAG_COLOR;
}

function tagTextColor(hex: string): string {
  const clean = safeTagColor(hex).slice(1);
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.62 ? "#111827" : "#ffffff";
}

const priorityStyle: Record<
  NotePriority,
  {
    label: string;
    border: string;
    color: string;
    background: string;
  }
> = {
  none: {
    label: "",
    border: "#cbd5e1",
    color: "#64748b",
    background:
      "transparent",
  },

  low: {
    label: "Baixa",
    border: "#22c55e",
    color: "#15803d",
    background:
      "rgba(34,197,94,.035)",
  },

  medium: {
    label: "Média",
    border: "#eab308",
    color: "#a16207",
    background:
      "rgba(234,179,8,.04)",
  },

  high: {
    label: "Alta",
    border: "#f97316",
    color: "#c2410c",
    background:
      "rgba(249,115,22,.04)",
  },

  urgent: {
    label: "Urgente",
    border: "#ef4444",
    color: "#b91c1c",
    background:
      "rgba(239,68,68,.045)",
  },
};

function formatDate(
  value: string
): string {
  const [
    year,
    month,
    day,
  ] = value.split("-");

  return `${day}/${month}/${year}`;
}

function recurrenceLabel(
  value: Note["recurrence"]
): string {
  const labels:
    Record<string, string> = {
      daily:
        "Todos os dias",
      weekly:
        "Toda semana",
      monthly:
        "Todo mês",
      yearly:
        "Todo ano",
    };

  return labels[value] || "";
}

function reminderLabel(
  value: number
): string {
  if (value === 0) {
    return "Na hora";
  }

  if (value === 15) {
    return "15 min antes";
  }

  if (value === 60) {
    return "1 hora antes";
  }

  if (value === 1440) {
    return "1 dia antes";
  }

  if (value < 60) {
    return `${value} min antes`;
  }

  if (
    value % 1440 ===
    0
  ) {
    const days =
      value / 1440;

    return `${days} ${
      days === 1
        ? "dia"
        : "dias"
    } antes`;
  }

  if (
    value % 60 ===
    0
  ) {
    const hours =
      value / 60;

    return `${hours} ${
      hours === 1
        ? "hora"
        : "horas"
    } antes`;
  }

  return `${value} min antes`;
}

function buildCopyText(
  note: Note
): string {
  const lines:
    string[] = [];

  if (
    note.title?.trim()
  ) {
    lines.push(
      `📝 ${note.title.trim()}`
    );
  }

  if (
    note.priority !==
    "none"
  ) {
    lines.push(
      `⚑ Prioridade: ${
        priorityStyle[
          note.priority
        ].label
      }`
    );
  }

  if (
    note.tags?.length
  ) {
    lines.push(
      `🏷️ ${note.tags
        .map(
          (tag) =>
            `#${tag}`
        )
        .join(" ")}`
    );
  }

  if (
    note.appointment
  ) {
    lines.push(
      "📌 Compromisso"
    );
  }

  if (note.date) {
    lines.push(
      `📅 ${formatDate(
        note.date
      )}${
        note.time
          ? ` às ${note.time}`
          : ""
      }`
    );
  }

  if (
    note.recurrence &&
    note.recurrence !==
      "none"
  ) {
    lines.push(
      `🔁 ${recurrenceLabel(
        note.recurrence
      )}`
    );
  }

  if (
    note.reminderMinutes !==
      null &&
    note.reminderMinutes !==
      undefined
  ) {
    lines.push(
      `🔔 ${reminderLabel(
        note.reminderMinutes
      )}`
    );
  }

  if (note.completed) {
    lines.push(
      "✅ Concluída"
    );
  }

  if (note.favorite) {
    lines.push(
      "⭐ Favorita"
    );
  }

  if (note.pinned) {
    lines.push(
      "📌 Fixada no topo"
    );
  }

  if (
    note.content?.trim()
  ) {
    if (lines.length) {
      lines.push("");
    }

    lines.push(
      note.content.trim()
    );
  }

  if (
    note.checklist
      ?.length
  ) {
    if (lines.length) {
      lines.push("");
    }

    lines.push(
      "☑️ Checklist:"
    );

    note.checklist.forEach(
      (item) => {
        lines.push(
          `${
            item.done
              ? "☑"
              : "☐"
          } ${item.text}`
        );
      }
    );
  }

  return lines.join("\n");
}

async function copyText(
  text: string
): Promise<void> {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      text
    );

    return;
  }

  const textarea =
    document.createElement(
      "textarea"
    );

  textarea.value = text;

  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";

  textarea.style.pointerEvents =
    "none";

  textarea.style.left =
    "-9999px";

  document.body.appendChild(
    textarea
  );

  textarea.focus();
  textarea.select();

  const copied =
    document.execCommand(
      "copy"
    );

  textarea.remove();

  if (!copied) {
    throw new Error(
      "Não foi possível copiar a anotação."
    );
  }
}

export default function NoteCard({
  note,
  tagColors,
  onEdit,
  onDelete,
  onPatch,
  onHistory,
}: Props) {
  const priority =
    priorityStyle[
      note.priority
    ];

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    contentExpanded,
    setContentExpanded,
  ] = useState(false);

  const checklistDone =
    note.checklist?.filter(
      (item) => item.done
    ).length ?? 0;

  const hasTitle =
    Boolean(
      note.title?.trim()
    );

  const hasContent =
    Boolean(
      note.content?.trim()
    );

  const contentText =
    note.content?.trim() || "";

  const contentLines =
    contentText
      ? contentText.split(/\r?\n/)
      : [];

  const contentIsLong =
    contentText.length > 180 ||
    contentLines.length > 3;

  const hasPriority =
    note.priority !==
    "none";

  const hasTags =
    Boolean(
      note.tags?.length
    );

  const hasRecurrence =
    Boolean(
      note.recurrence &&
      note.recurrence !==
        "none"
    );

  const hasReminder =
    note.reminderMinutes !==
      null &&
    note.reminderMinutes !==
      undefined;

  const hasChecklist =
    Boolean(
      note.checklist
        ?.length
    );

  async function handleCopy() {
    try {
      await copyText(
        buildCopyText(
          note
        )
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(
            false
          );
        },
        1800
      );
    } catch (error) {
      console.error(
        "Erro ao copiar anotação:",
        error
      );
    }
  }

  return (
    <article
      className="px-3 px-xl-4 py-3"
      role="button"
      tabIndex={0}
      onClick={() =>
        onEdit(note)
      }
      onKeyDown={(
        event
      ) => {
        if (
          event.key ===
            "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onEdit(note);
        }
      }}
      title="Clique para abrir esta anotação"
      style={{
        borderBottom:
          "1px solid var(--bs-border-color)",

        borderLeft: `4px solid ${
          hasPriority
            ? priority.border
            : "#cbd5e1"
        }`,

        background:
          hasPriority
            ? priority.background
            : "transparent",

        opacity:
          note.completed
            ? 0.78
            : 1,

        cursor: "pointer",

        outline: "none",

        transition:
          "background-color .15s ease, box-shadow .15s ease",
      }}
    >
      <div className="row gx-3 gy-3 align-items-center">

        {/* ANOTAÇÃO */}
        <div className="col-12 col-xl-4">

          {(hasTitle ||
            note.pinned ||
            note.favorite) && (
            <div className="d-flex align-items-center flex-wrap gap-2 mb-1">

              {hasTitle && (
                <strong
                  className="text-truncate"
                  title={
                    note.title
                  }
                  style={{
                    maxWidth:
                      "100%",

                    fontSize:
                      15,

                    textDecoration:
                      note.completed
                        ? "line-through"
                        : "none",
                  }}
                >
                  {note.title}
                </strong>
              )}

              {note.pinned && (
                <i
                  className="bi bi-pin-angle-fill text-primary"
                  title="Fixada no topo"
                />
              )}

              {note.favorite && (
                <i
                  className="bi bi-star-fill text-warning"
                  title="Favorita"
                />
              )}
            </div>
          )}

          {hasContent && (
            <div>
              <div
                className="text-secondary"
                title={
                  contentExpanded
                    ? undefined
                    : note.content
                }
                style={{
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",

                  ...(contentExpanded
                    ? {
                        display: "block",
                        overflow: "visible",
                      }
                    : {
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient:
                          "vertical",
                        overflow: "hidden",
                      }),
                }}
              >
                {note.content}
              </div>

              {contentIsLong && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 mt-1 text-decoration-none fw-semibold"
                  onClick={(event) => {
                    event.stopPropagation();
                    setContentExpanded(
                      (current) =>
                        !current
                    );
                  }}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                  }}
                  title={
                    contentExpanded
                      ? "Recolher anotação"
                      : "Mostrar anotação completa"
                  }
                  style={{
                    fontSize: 12,
                  }}
                >
                  {contentExpanded ? (
                    <>
                      Ver menos
                      <i className="bi bi-chevron-up ms-1" />
                    </>
                  ) : (
                    <>
                      Ver mais
                      <i className="bi bi-chevron-down ms-1" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAGS / PRIORIDADE */}
        <div className="col-12 col-md-6 col-xl-2 text-xl-center">

          <div className="d-flex flex-column gap-2 align-items-xl-center">

            {hasTags && (
              <div className="d-flex flex-wrap gap-1 justify-content-xl-center">
                {note.tags.map((tag) => {
                  const color = safeTagColor(tagColors[tag]);

                  return (
                    <span
                      key={tag}
                      className="badge rounded-pill border-0 px-2 py-1"
                      style={{
                        background: color,
                        color: tagTextColor(color),
                      }}
                    >
                      #{tag}
                    </span>
                  );
                })}
              </div>
            )}

            {hasPriority && (
              <span
                className="d-inline-flex align-items-center gap-1"
                style={{
                  color:
                    priority.color,

                  fontSize:
                    12,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,

                    borderRadius:
                      "50%",

                    background:
                      priority.border,

                    display:
                      "inline-block",
                  }}
                />

                {priority.label}
              </span>
            )}
          </div>
        </div>

        {/* DATA / COMPROMISSO */}
        <div className="col-12 col-md-6 col-xl-2 text-xl-center">

          <div
            className="d-flex flex-column gap-2 align-items-xl-center"
            style={{
              fontSize: 13,
            }}
          >

            {note.date && (
              <span>
                <i className="bi bi-calendar3 me-1 text-secondary" />

                {formatDate(
                  note.date
                )}
              </span>
            )}

            {note.time && (
              <span>
                <i className="bi bi-clock me-1 text-secondary" />

                {note.time}
              </span>
            )}

            {note.appointment && (
              <span className="text-primary">
                <i className="bi bi-calendar-check me-1" />
                Compromisso
              </span>
            )}
          </div>
        </div>

        {/* DETALHES */}
        <div className="col-12 col-md-6 col-xl-2 text-xl-center">

          <div className="d-flex flex-column gap-2 small align-items-xl-center">

            {hasRecurrence && (
              <span>
                <i className="bi bi-arrow-repeat me-1 text-info" />

                {recurrenceLabel(
                  note.recurrence
                )}
              </span>
            )}

            {hasReminder && (
              <span>
                <i className="bi bi-bell me-1 text-warning" />

                {reminderLabel(
                  note.reminderMinutes!
                )}
              </span>
            )}

            {hasChecklist && (
              <span>
                <i className="bi bi-check2-square me-1 text-success" />

                Checklist{" "}
                {checklistDone}/
                {
                  note
                    .checklist
                    .length
                }
              </span>
            )}

            {note.completed && (
              <span className="text-success fw-semibold">
                <i className="bi bi-check-circle me-1" />
                Concluída
              </span>
            )}
          </div>
        </div>

        {/* AÇÕES */}
        <div className="col-12 col-md-6 col-xl-2">

          <div
            className="d-flex justify-content-center align-items-center gap-1 flex-wrap"

            onClick={(
              event
            ) =>
              event.stopPropagation()
            }

            onKeyDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              className={`btn btn-sm ${
                note.completed
                  ? "btn-success"
                  : "btn-outline-success"
              }`}

              onClick={() =>
                void onPatch(
                  note,
                  {
                    completed:
                      !note.completed,
                  }
                )
              }

              style={{
                width: 32,
                height: 32,
                padding: 0,
              }}

              title={
                note.completed
                  ? "Marcar como pendente"
                  : "Marcar como concluída"
              }
            >
              <i
                className={`bi ${
                  note.completed
                    ? "bi-check-circle-fill"
                    : "bi-check-circle"
                }`}
              />
            </button>

            <button
              className={`btn btn-sm ${
                copied
                  ? "btn-success"
                  : "btn-light border"
              }`}

              onClick={() =>
                void handleCopy()
              }

              style={{
                width: 32,
                height: 32,
                padding: 0,
              }}

              title={
                copied
                  ? "Copiado!"
                  : "Copiar"
              }
            >
              <i
                className={`bi ${
                  copied
                    ? "bi-check2"
                    : "bi-copy"
                }`}
              />
            </button>

            <button
              className="btn btn-sm btn-light border"

              onClick={() =>
                onHistory(
                  note
                )
              }

              style={{
                width: 32,
                height: 32,
                padding: 0,
              }}

              title="Histórico"
            >
              <i className="bi bi-clock-history" />
            </button>

            <button
              className={`btn btn-sm ${
                note.favorite
                  ? "btn-warning"
                  : "btn-light border"
              }`}

              onClick={() =>
                void onPatch(
                  note,
                  {
                    favorite:
                      !note.favorite,
                  }
                )
              }

              style={{
                width: 32,
                height: 32,
                padding: 0,
              }}

              title="Favorito"
            >
              <i
                className={`bi ${
                  note.favorite
                    ? "bi-star-fill"
                    : "bi-star"
                }`}
              />
            </button>

            <button
              className="btn btn-sm btn-light border"

              onClick={() =>
                onEdit(note)
              }

              style={{
                width: 32,
                height: 32,
                padding: 0,
              }}

              title="Editar"
            >
              <i className="bi bi-pencil-square" />
            </button>

            <button
              className="btn btn-sm btn-outline-danger"

              onClick={() =>
                onDelete(
                  note
                )
              }

              style={{
                width: 32,
                height: 32,
                padding: 0,
              }}

              title="Excluir definitivamente"
            >
              <i className="bi bi-trash3" />
            </button>
          </div>
        </div>
      </div>

      {hasChecklist && (
        <div className="mt-3 pt-3 border-top">

          <div className="d-flex align-items-center gap-2 flex-wrap">

            <span className="small fw-semibold">
              <i className="bi bi-check2-square me-1" />
              Checklist:
            </span>

            {note.checklist.map(
              (item) => (
                <span
                  key={
                    item.id
                  }

                  className={`badge rounded-pill ${
                    item.done
                      ? "text-bg-success"
                      : "bg-body text-secondary border"
                  }`}

                  style={{
                    textDecoration:
                      item.done
                        ? "line-through"
                        : "none",
                  }}
                >
                  <i
                    className={`bi ${
                      item.done
                        ? "bi-check-circle-fill"
                        : "bi-circle"
                    } me-1`}
                  />

                  {
                    item.text
                  }
                </span>
              )
            )}
          </div>
        </div>
      )}
    </article>
  );
}
