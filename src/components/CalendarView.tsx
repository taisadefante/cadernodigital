"use client";

import { useMemo, useState } from "react";
import type { Note, NotePriority } from "@/types/note";

interface CalendarViewProps {
  notes: Note[];
  onEdit: (note: Note) => void;
}

interface CalendarCell {
  key: string;
  date: Date;
  isoDate: string;
  day: number;
  currentMonth: boolean;
  isToday: boolean;
  notes: Note[];
}

const weekdays = [
  { short: "D", full: "Dom" },
  { short: "S", full: "Seg" },
  { short: "T", full: "Ter" },
  { short: "Q", full: "Qua" },
  { short: "Q", full: "Qui" },
  { short: "S", full: "Sex" },
  { short: "S", full: "Sáb" },
];

const priorityInfo: Record<
  NotePriority,
  { label: string; color: string; soft: string; text: string }
> = {
  none: {
    label: "Sem prioridade",
    color: "#94a3b8",
    soft: "#f1f5f9",
    text: "#64748b",
  },
  low: {
    label: "Baixa",
    color: "#22c55e",
    soft: "#ecfdf5",
    text: "#166534",
  },
  medium: {
    label: "Média",
    color: "#eab308",
    soft: "#fefce8",
    text: "#854d0e",
  },
  high: {
    label: "Alta",
    color: "#f97316",
    soft: "#fff7ed",
    text: "#9a3412",
  },
  urgent: {
    label: "Urgente",
    color: "#ef4444",
    soft: "#fef2f2",
    text: "#991b1b",
  },
};

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseIso(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDateLong(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parseIso(value));
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCells(cursor: Date, notes: Note[]): CalendarCell[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstDay.getDay());
  const todayIso = toIso(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const isoDate = toIso(date);

    return {
      key: `${isoDate}-${index}`,
      date,
      isoDate,
      day: date.getDate(),
      currentMonth: date.getMonth() === month,
      isToday: isoDate === todayIso,
      notes: notes
        .filter((note) => note.date === isoDate)
        .sort((a, b) => {
          const time = (a.time || "").localeCompare(b.time || "");
          if (time !== 0) return time;

          const priorityOrder: Record<NotePriority, number> = {
            urgent: 5,
            high: 4,
            medium: 3,
            low: 2,
            none: 1,
          };

          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }),
    };
  });
}

function checklistProgress(note: Note): string | null {
  if (!note.checklist?.length) return null;

  const done = note.checklist.filter((item) => item.done).length;
  return `${done}/${note.checklist.length}`;
}

export default function CalendarView({
  notes,
  onEdit,
}: CalendarViewProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const cells = useMemo(() => buildCells(cursor, notes), [cursor, notes]);

  const selectedNotes = useMemo(() => {
    if (!selectedDate) return [];

    return notes
      .filter((note) => note.date === selectedDate)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [notes, selectedDate]);

  const monthCount = useMemo(
    () =>
      cells
        .filter((cell) => cell.currentMonth)
        .reduce((total, cell) => total + cell.notes.length, 0),
    [cells]
  );

  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <>
      <section
        className="bg-body border"
        style={{
          borderRadius: 18,
          overflow: "hidden",
          borderColor: "var(--bs-border-color)",
          boxShadow: "0 8px 24px rgba(15,23,42,.04)",
        }}
      >
        <div
          className="d-flex align-items-center justify-content-between gap-2 px-3 px-md-4 py-3 border-bottom"
          style={{ minHeight: 72 }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4
                className="fw-bold text-capitalize mb-0"
                style={{ fontSize: "clamp(18px, 2vw, 25px)" }}
              >
                {formatMonth(cursor)}
              </h4>

              <span className="badge rounded-pill text-bg-light border">
                {monthCount}
              </span>
            </div>

            <small className="text-secondary d-none d-sm-block mt-1">
              Clique em um dia com registro para ver os detalhes.
            </small>
          </div>

          <div className="d-flex align-items-center gap-1 gap-md-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-light border"
              onClick={() =>
                setCursor(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() - 1,
                      1
                    )
                )
              }
              title="Mês anterior"
            >
              <i className="bi bi-chevron-left" />
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-none d-sm-inline-flex"
              onClick={goToday}
            >
              Hoje
            </button>

            <button
              type="button"
              className="btn btn-sm btn-light border"
              onClick={() =>
                setCursor(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() + 1,
                      1
                    )
                )
              }
              title="Próximo mês"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>

        <div className="p-2 p-md-3">
          <div
            className="calendar-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
            }}
          >
            {weekdays.map((weekday, index) => (
              <div
                key={`${weekday.full}-${index}`}
                className="text-center text-secondary fw-semibold"
                style={{
                  padding: "4px 0 6px",
                  fontSize: 12,
                }}
              >
                <span className="d-none d-sm-inline">{weekday.full}</span>
                <span className="d-inline d-sm-none">{weekday.short}</span>
              </div>
            ))}

            {cells.map((cell) => {
              const hasNotes = cell.notes.length > 0;

              return (
                <button
                  type="button"
                  key={cell.key}
                  className="calendar-day btn text-start position-relative"
                  disabled={!hasNotes}
                  onClick={() => {
                    if (hasNotes) setSelectedDate(cell.isoDate);
                  }}
                  title={
                    hasNotes
                      ? `${cell.notes.length} registro(s) em ${cell.isoDate}`
                      : undefined
                  }
                  style={{
                    minWidth: 0,
                    minHeight: 82,
                    padding: 8,
                    borderRadius: 13,
                    border: cell.isToday
                      ? "2px solid #2563eb"
                      : "1px solid var(--bs-border-color)",
                    background: cell.currentMonth
                      ? hasNotes
                        ? "var(--bs-body-bg)"
                        : "rgba(148,163,184,.035)"
                      : "rgba(148,163,184,.07)",
                    color: cell.currentMonth
                      ? "var(--bs-body-color)"
                      : "#94a3b8",
                    opacity: cell.currentMonth ? 1 : 0.62,
                    cursor: hasNotes ? "pointer" : "default",
                    boxShadow:
                      cell.isToday && hasNotes
                        ? "0 4px 12px rgba(37,99,235,.10)"
                        : "none",
                  }}
                >
                  <div className="d-flex align-items-start justify-content-between gap-1">
                    <span
                      className="fw-semibold"
                      style={{
                        fontSize: 13,
                        lineHeight: 1,
                      }}
                    >
                      {cell.day}
                    </span>

                    {cell.isToday && (
                      <span
                        className="badge rounded-pill text-bg-primary"
                        style={{
                          fontSize: 9,
                          padding: "3px 5px",
                        }}
                      >
                        Hoje
                      </span>
                    )}
                  </div>

                  {hasNotes && (
                    <>
                      <div
                        className="fw-bold mt-2"
                        style={{
                          fontSize: 11,
                          color: "#2563eb",
                        }}
                      >
                        {cell.notes.length}{" "}
                        <span className="d-none d-md-inline">
                          {cell.notes.length === 1 ? "registro" : "registros"}
                        </span>
                      </div>

                      <div
                        className="d-flex flex-wrap gap-1 mt-2"
                        aria-label="Prioridades do dia"
                      >
                        {cell.notes.slice(0, 5).map((note) => (
                          <span
                            key={note.id}
                            title={priorityInfo[note.priority].label}
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: priorityInfo[note.priority].color,
                              display: "inline-block",
                            }}
                          />
                        ))}

                        {cell.notes.length > 5 && (
                          <small
                            className="text-secondary"
                            style={{
                              fontSize: 9,
                              lineHeight: "7px",
                            }}
                          >
                            +{cell.notes.length - 5}
                          </small>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selectedDate && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-md-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDate(null);
            }
          }}
          style={{
            zIndex: 2200,
            background: "rgba(15,23,42,.52)",
            backdropFilter: "blur(4px)",
            overflowY: "auto",
          }}
        >
          <div
            className="bg-body w-100 my-auto"
            style={{
              maxWidth: 760,
              maxHeight: "90vh",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 28px 80px rgba(15,23,42,.25)",
            }}
          >
            <div className="d-flex align-items-start justify-content-between gap-3 p-3 p-md-4 border-bottom">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "#eff6ff",
                      color: "#2563eb",
                      flexShrink: 0,
                    }}
                  >
                    <i className="bi bi-calendar3" />
                  </span>

                  <div>
                    <h5 className="fw-bold text-capitalize mb-0">
                      {formatDateLong(selectedDate)}
                    </h5>

                    <small className="text-secondary">
                      {selectedNotes.length}{" "}
                      {selectedNotes.length === 1 ? "registro" : "registros"}
                    </small>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-light rounded-circle"
                onClick={() => setSelectedDate(null)}
                title="Fechar"
                style={{ width: 38, height: 38 }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div
              className="p-3 p-md-4"
              style={{
                overflowY: "auto",
                maxHeight: "calc(90vh - 95px)",
              }}
            >
              <div className="d-grid gap-3">
                {selectedNotes.map((note) => {
                  const priority = priorityInfo[note.priority];
                  const progress = checklistProgress(note);

                  return (
                    <article
                      key={note.id}
                      className="border"
                      style={{
                        borderRadius: 17,
                        overflow: "hidden",
                        borderColor: "var(--bs-border-color)",
                      }}
                    >
                      <div
                        className="px-3 px-md-4 py-3"
                        style={{
                          borderLeft: `4px solid ${priority.color}`,
                          background: priority.soft,
                        }}
                      >
                        <div className="d-flex justify-content-between gap-3 align-items-start">
                          <div style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                              <h6 className="fw-bold mb-0">
                                {note.title || "Sem título"}
                              </h6>

                              <span
                                className="badge rounded-pill"
                                style={{
                                  background: "#fff",
                                  border: `1px solid ${priority.color}45`,
                                  color: priority.text,
                                }}
                              >
                                {priority.label}
                              </span>

                              {note.completed && (
                                <span className="badge rounded-pill text-bg-success">
                                  Concluída
                                </span>
                              )}
                            </div>

                            <div className="d-flex flex-wrap gap-3 small">
                              <span>
                                <i className="bi bi-folder2 me-1" />
                                {note.category || "Geral"}
                              </span>

                              {note.time && (
                                <span>
                                  <i className="bi bi-clock me-1" />
                                  {note.time}
                                </span>
                              )}

                              {progress && (
                                <span>
                                  <i className="bi bi-check2-square me-1" />
                                  Checklist {progress}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-primary flex-shrink-0"
                            onClick={() => {
                              setSelectedDate(null);
                              onEdit(note);
                            }}
                          >
                            <i className="bi bi-pencil-square me-1" />
                            <span className="d-none d-sm-inline">Editar</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 p-md-4">
                        {note.content ? (
                          <div
                            style={{
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.55,
                            }}
                          >
                            {note.content}
                          </div>
                        ) : (
                          <div className="text-secondary fst-italic">
                            Esta anotação não possui descrição.
                          </div>
                        )}

                        {note.checklist?.length > 0 && (
                          <div className="mt-3 pt-3 border-top">
                            <div className="fw-semibold small mb-2">
                              Checklist
                            </div>

                            <div className="d-grid gap-1">
                              {note.checklist.map((item) => (
                                <div
                                  key={item.id}
                                  className="d-flex align-items-start gap-2 small"
                                >
                                  <i
                                    className={`bi ${
                                      item.done
                                        ? "bi-check-square-fill text-success"
                                        : "bi-square text-secondary"
                                    }`}
                                  />

                                  <span
                                    style={{
                                      textDecoration: item.done
                                        ? "line-through"
                                        : "none",
                                      color: item.done
                                        ? "#64748b"
                                        : "inherit",
                                    }}
                                  >
                                    {item.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {note.tags?.length > 0 && (
                          <div className="d-flex gap-1 flex-wrap mt-3 pt-3 border-top">
                            {note.tags.map((tag) => (
                              <span
                                key={tag}
                                className="badge rounded-pill bg-body-tertiary text-secondary border"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .calendar-day:disabled {
          opacity: 1;
        }

        .calendar-day:not(:disabled):hover {
          border-color: #93c5fd !important;
          background: rgba(37, 99, 235, .045) !important;
          transform: translateY(-1px);
        }

        .calendar-day {
          transition:
            background .15s ease,
            border-color .15s ease,
            transform .15s ease;
        }

        @media (max-width: 575.98px) {
          .calendar-grid {
            gap: 4px !important;
          }

          .calendar-day {
            min-height: 58px !important;
            padding: 6px !important;
            border-radius: 10px !important;
          }

          .calendar-day .badge {
            font-size: 0 !important;
            width: 7px;
            height: 7px;
            padding: 0 !important;
          }

          .calendar-day .badge::after {
            content: "";
          }
        }

        @media (min-width: 576px) and (max-width: 991.98px) {
          .calendar-day {
            min-height: 70px !important;
          }
        }

        @media (min-width: 1200px) {
          .calendar-day {
            min-height: 92px !important;
          }
        }
      `}</style>
    </>
  );
}
