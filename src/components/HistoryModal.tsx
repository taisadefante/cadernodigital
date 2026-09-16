"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type {
  ChecklistItem,
  Note,
  NotePriority,
} from "@/types/note";

interface Props {
  open: boolean;
  userId: string;
  note: Note | null;
  onClose: () => void;
}

interface HistoryItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: NotePriority;
  tags: string[];
  date: string | null;
  time: string | null;
  checklist: ChecklistItem[];
  savedAt: Timestamp | null;
}

const priorityLabel: Record<NotePriority, string> = {
  none: "Sem prioridade",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

function formatTimestamp(value: Timestamp | null) {
  if (!value) return "Data não disponível";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value.toDate());
}

function formatDate(value: string | null) {
  if (!value) return "Sem data";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day)
  );
}

export default function HistoryModal({
  open,
  userId,
  note,
  onClose,
}: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !note || !userId) {
      setItems([]);
      setError("");
      return;
    }

    let active = true;

    async function loadHistory() {
      if (!note) return;

      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(
          query(
            collection(
              db,
              "users",
              userId,
              "notes",
              note.id,
              "history"
            ),
            orderBy("savedAt", "desc")
          )
        );

        if (!active) return;

        const historyItems = snapshot.docs.map((document) => {
          const data = document.data();

          return {
            id: document.id,
            title:
              typeof data.title === "string"
                ? data.title
                : "",
            content:
              typeof data.content === "string"
                ? data.content
                : "",
            category:
              typeof data.category === "string"
                ? data.category
                : "",
            priority:
              (data.priority as NotePriority) || "none",
            tags: Array.isArray(data.tags)
              ? data.tags.filter(
                  (item): item is string =>
                    typeof item === "string"
                )
              : [],
            date:
              typeof data.date === "string"
                ? data.date
                : null,
            time:
              typeof data.time === "string"
                ? data.time
                : null,
            checklist: Array.isArray(data.checklist)
              ? (data.checklist as ChecklistItem[])
              : [],
            savedAt:
              data.savedAt instanceof Timestamp
                ? data.savedAt
                : null,
          };
        });

        setItems(historyItems);
      } catch (caught) {
        console.error(
          "Erro ao carregar histórico da anotação:",
          caught
        );

        if (active) {
          setError(
            "Não foi possível carregar o histórico desta anotação."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [open, userId, note]);

  if (!open || !note) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-md-3"
      style={{
        zIndex: 2200,
        background: "rgba(15,23,42,.58)",
        backdropFilter: "blur(5px)",
        overflowY: "auto",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-body w-100 my-auto shadow"
        style={{
          maxWidth: 820,
          maxHeight: "90vh",
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        <div className="d-flex align-items-start justify-content-between gap-3 p-4 border-bottom">
          <div style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "#eff6ff",
                  color: "#2563eb",
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-clock-history" />
              </span>

              <h4 className="fw-bold mb-0">
                Histórico
              </h4>
            </div>

            <p className="text-secondary mb-0 text-truncate">
              {note.title || "Anotação sem título"}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-light rounded-circle flex-shrink-0"
            onClick={onClose}
            title="Fechar"
            style={{
              width: 40,
              height: 40,
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div
          className="p-3 p-md-4"
          style={{
            overflowY: "auto",
            maxHeight: "calc(90vh - 105px)",
          }}
        >
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <span className="fw-semibold">
                Versão atual
              </span>

              <span className="badge text-bg-primary">
                Atual
              </span>
            </div>

            <div className="border rounded-4 p-3 bg-body-tertiary">
              <div className="fw-bold mb-1">
                {note.title || "Sem título"}
              </div>

              {note.content ? (
                <p
                  className="mb-2 text-secondary"
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {note.content}
                </p>
              ) : (
                <p className="mb-2 text-secondary fst-italic">
                  Sem descrição
                </p>
              )}

              <div className="d-flex flex-wrap gap-2 small">
                <span className="badge bg-body border text-body">
                  <i className="bi bi-folder2 me-1" />
                  {note.category || "Sem categoria"}
                </span>

                <span className="badge bg-body border text-body">
                  {priorityLabel[note.priority]}
                </span>

                {note.date && (
                  <span className="badge bg-body border text-body">
                    <i className="bi bi-calendar3 me-1" />
                    {formatDate(note.date)}
                    {note.time ? ` às ${note.time}` : ""}
                  </span>
                )}

                {(note.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="badge bg-body border text-body"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-semibold">
              Versões anteriores
            </span>

            {!loading && (
              <span className="badge rounded-pill text-bg-light border">
                {items.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
              <div className="text-secondary small mt-2">
                Carregando histórico...
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
            </div>
          ) : items.length === 0 ? (
            <div
              className="text-center p-5 border rounded-4 text-secondary"
              style={{
                borderStyle: "dashed",
              }}
            >
              <i className="bi bi-clock-history fs-2 d-block mb-2" />
              <div className="fw-semibold">
                Ainda não há versões anteriores
              </div>
              <small>
                Uma versão é salva antes de cada edição.
              </small>
            </div>
          ) : (
            <div className="d-grid gap-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="border rounded-4 p-3"
                >
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                    <div>
                      <div className="fw-semibold">
                        Versão {items.length - index}
                      </div>

                      <small className="text-secondary">
                        Salva em {formatTimestamp(item.savedAt)}
                      </small>
                    </div>

                    <span className="badge rounded-pill text-bg-light border">
                      {priorityLabel[item.priority]}
                    </span>
                  </div>

                  <div className="fw-bold mb-1">
                    {item.title || "Sem título"}
                  </div>

                  {item.content ? (
                    <p
                      className="text-secondary mb-3"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.content}
                    </p>
                  ) : (
                    <p className="text-secondary fst-italic mb-3">
                      Sem descrição
                    </p>
                  )}

                  <div className="d-flex flex-wrap gap-2 small">
                    <span className="badge bg-body-tertiary border text-body">
                      <i className="bi bi-folder2 me-1" />
                      {item.category || "Sem categoria"}
                    </span>

                    {item.date && (
                      <span className="badge bg-body-tertiary border text-body">
                        <i className="bi bi-calendar3 me-1" />
                        {formatDate(item.date)}
                        {item.time ? ` às ${item.time}` : ""}
                      </span>
                    )}

                    {item.tags.map((tag) => (
                      <span
                        key={`${item.id}-${tag}`}
                        className="badge bg-body-tertiary border text-body"
                      >
                        #{tag}
                      </span>
                    ))}

                    {item.checklist.length > 0 && (
                      <span className="badge bg-body-tertiary border text-body">
                        <i className="bi bi-check2-square me-1" />
                        {
                          item.checklist.filter(
                            (check) => check.done
                          ).length
                        }
                        /{item.checklist.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
