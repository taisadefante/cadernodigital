"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Note,
  NoteFormData,
  NotePriority,
  Recurrence,
  Tag,
} from "@/types/note";

type ManagerItem = {
  id: string;
  name: string;
  color?: string;
};

const DEFAULT_TAG_COLOR = "#64748b";

function safeColor(value?: string): string {
  return /^#[0-9a-f]{6}$/i.test(value || "")
    ? String(value)
    : DEFAULT_TAG_COLOR;
}

function contrastText(hex: string): string {
  const clean = safeColor(hex).slice(1);
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.62 ? "#111827" : "#ffffff";
}

interface ManagerModalProps {
  open: boolean;
  title: string;
  singular: string;
  plural: string;
  icon: string;
  items: ManagerItem[];
  counts: Record<string, number>;
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
  onRename: (item: ManagerItem, newName: string, color: string) => Promise<void>;
  onDelete: (item: ManagerItem) => Promise<void>;
}

function ManagerModal({
  open,
  title,
  singular,
  plural,
  icon,
  items,
  counts,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: ManagerModalProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#2563eb");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState(DEFAULT_TAG_COLOR);
  const [deleteTarget, setDeleteTarget] = useState<ManagerItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
      ),
    [items]
  );

  useEffect(() => {
    if (!open) return;
    setNewName("");
    setNewColor("#2563eb");
    setEditingId(null);
    setEditingName("");
    setEditingColor(DEFAULT_TAG_COLOR);
    setDeleteTarget(null);
    setError("");
  }, [open]);

  if (!open) return null;

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = newName.trim();
    if (!clean) return;

    try {
      setBusy(true);
      setError("");
      await onCreate(clean, newColor);
      setNewName("");
      setNewColor("#2563eb");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Não foi possível criar ${singular}.`
      );
    } finally {
      setBusy(false);
    }
  }

  async function rename(item: ManagerItem) {
    const clean = editingName.trim();

    if (!clean) {
      setError(`Informe o nome da ${singular}.`);
      return;
    }

    try {
      setBusy(true);
      setError("");
      await onRename(item, clean, editingColor);
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Não foi possível renomear ${singular}.`
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;

    try {
      setBusy(true);
      setError("");
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Não foi possível excluir ${singular}.`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-md-3"
        style={{
          zIndex: 2200,
          background: "rgba(15,23,42,.58)",
          backdropFilter: "blur(5px)",
          overflowY: "auto",
        }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) {
            onClose();
          }
        }}
      >
        <div
          className="bg-body w-100 my-auto"
          style={{
            maxWidth: 650,
            maxHeight: "90vh",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 28px 80px rgba(15,23,42,.26)",
          }}
        >
          <div className="d-flex align-items-start justify-content-between gap-3 p-4 border-bottom">
            <div>
              <h4 className="fw-bold mb-1">{title}</h4>
              <small className="text-secondary">
                Crie, edite ou exclua {plural}.
              </small>
            </div>

            <button
              type="button"
              className="btn btn-light rounded-circle"
              onClick={onClose}
              disabled={busy}
              title="Fechar"
              style={{ width: 40, height: 40 }}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div
            className="p-3 p-md-4"
            style={{
              overflowY: "auto",
              maxHeight: "calc(90vh - 90px)",
            }}
          >
            {error && (
              <div className="alert alert-danger py-2">
                <i className="bi bi-exclamation-triangle me-2" />
                {error}
              </div>
            )}

            <form onSubmit={create} className="mb-4">
              <label className="form-label fw-semibold">
                Nova {singular}
              </label>

              <div className="d-flex flex-column flex-sm-row gap-2">
                <div className="input-group flex-grow-1">
                  <span className="input-group-text bg-body">
                    <i className={`bi ${icon}`} />
                  </span>

                  <input
                    className="form-control"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder={`Nome da ${singular}`}
                    maxLength={60}
                  />
                </div>

                <div
                  className="d-flex align-items-center gap-2 border rounded px-2"
                  style={{ minHeight: 38 }}
                  title="Escolher cor"
                >
                  <span
                    className="rounded-circle"
                    style={{
                      width: 18,
                      height: 18,
                      background: newColor,
                      border: "1px solid rgba(0,0,0,.15)",
                    }}
                  />

                  <input
                    type="color"
                    value={newColor}
                    onChange={(event) => setNewColor(event.target.value)}
                    className="form-control form-control-color border-0 p-0"
                    title="Cor da tag"
                    style={{ width: 34, height: 30 }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busy || !newName.trim()}
                >
                  <i className="bi bi-plus-lg me-1" />
                  Adicionar
                </button>
              </div>

              {newName.trim() && (
                <div className="mt-2">
                  <span
                    className="badge rounded-pill px-3 py-2"
                    style={{
                      background: newColor,
                      color: contrastText(newColor),
                    }}
                  >
                    #{newName.trim()}
                  </span>
                </div>
              )}
            </form>

            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold">Minhas {plural}</span>
              <span className="badge rounded-pill text-bg-light border">
                {sorted.length}
              </span>
            </div>

            {sorted.length === 0 ? (
              <div
                className="text-center py-5 px-3 border rounded-4 text-secondary"
                style={{ borderStyle: "dashed" }}
              >
                <i className={`bi ${icon} fs-2 d-block mb-2`} />
                Nenhuma {singular} cadastrada.
              </div>
            ) : (
              <div className="border rounded-4 overflow-hidden">
                {sorted.map((item, index) => {
                  const count = counts[item.name] ?? 0;
                  const editing = editingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-3"
                      style={{
                        borderBottom:
                          index < sorted.length - 1
                            ? "1px solid var(--bs-border-color)"
                            : "none",
                      }}
                    >
                      {editing ? (
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex gap-2 align-items-center">
                            <input
                              className="form-control"
                              value={editingName}
                              onChange={(event) =>
                                setEditingName(event.target.value)
                              }
                              autoFocus
                              maxLength={60}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void rename(item);
                                }

                                if (event.key === "Escape") {
                                  setEditingId(null);
                                  setEditingName("");
                                }
                              }}
                            />

                            <input
                              type="color"
                              value={editingColor}
                              onChange={(event) =>
                                setEditingColor(event.target.value)
                              }
                              className="form-control form-control-color"
                              title="Cor da tag"
                              style={{ width: 48 }}
                            />

                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => void rename(item)}
                              disabled={busy}
                              title="Salvar"
                            >
                              <i className="bi bi-check-lg" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-light border"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              disabled={busy}
                              title="Cancelar"
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </div>

                          {editingName.trim() && (
                            <div>
                              <span
                                className="badge rounded-pill px-3 py-2"
                                style={{
                                  background: editingColor,
                                  color: contrastText(editingColor),
                                }}
                              >
                                #{editingName.trim()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              background: safeColor(item.color),
                              color: contrastText(safeColor(item.color)),
                            }}
                          >
                            <i className={`bi ${icon}`} />
                          </span>

                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2">
                              <span
                                className="badge rounded-pill px-2 py-1"
                                style={{
                                  background: safeColor(item.color),
                                  color: contrastText(safeColor(item.color)),
                                }}
                              >
                                #{item.name}
                              </span>
                            </div>
                            <small className="text-secondary">
                              {count} {count === 1 ? "anotação" : "anotações"}
                            </small>
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditingName(item.name);
                              setEditingColor(safeColor(item.color));
                              setError("");
                            }}
                            disabled={busy}
                            title="Editar"
                          >
                            <i className="bi bi-pencil-square" />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setDeleteTarget(item);
                              setError("");
                            }}
                            disabled={busy}
                            title="Excluir"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 2350,
            background: "rgba(15,23,42,.60)",
          }}
        >
          <div
            className="bg-body w-100 p-4"
            style={{
              maxWidth: 460,
              borderRadius: 20,
              boxShadow: "0 24px 70px rgba(15,23,42,.25)",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center mb-3"
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "#fee2e2",
                color: "#dc2626",
              }}
            >
              <i className="bi bi-trash3 fs-4" />
            </div>

            <h5 className="fw-bold">
              Excluir {singular}?
            </h5>

            <p className="text-secondary">
              <strong>{deleteTarget.name}</strong> será excluída.
              As anotações continuarão existindo.
            </p>

            {(counts[deleteTarget.name] ?? 0) > 0 && (
              <div className="alert alert-warning py-2">
                Ela está sendo usada em{" "}
                <strong>{counts[deleteTarget.name]}</strong>{" "}
                {counts[deleteTarget.name] === 1 ? "anotação" : "anotações"}.
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void remove()}
                disabled={busy}
              >
                {busy ? (
                  <span className="spinner-border spinner-border-sm me-2" />
                ) : (
                  <i className="bi bi-trash3 me-2" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface Props {
  open: boolean;
  note: Note | null;
  tags: Tag[];
  tagCounts: Record<string, number>;
  saving: boolean;
  onClose: () => void;
  onSave: (data: NoteFormData) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<void>;
  onRenameTag: (tag: Tag, newName: string, color: string) => Promise<void>;
  onDeleteTag: (tag: Tag) => Promise<void>;
}

const empty: NoteFormData = {
  title: "",
  content: "",
  priority: "none",
  tags: [],
  checklist: [],
  appointment: false,
  date: "",
  time: "",
  recurrence: "none",
  reminderMinutes: null,
  favorite: false,
  pinned: false,
  completed: false,
};

export default function NoteModal({
  open,
  note,
  tags,
  tagCounts,
  saving,
  onClose,
  onSave,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
}: Props) {
  const [form, setForm] = useState<NoteFormData>(empty);
  const [checkText, setCheckText] = useState("");
  const [err, setErr] = useState("");

  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [tagSelectOpen, setTagSelectOpen] = useState(false);


  const sortedTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [tags]
  );

  useEffect(() => {
    if (!open) return;

    setForm(
      note
        ? {
            title: note.title,
            content: note.content,
            priority: note.priority,
            tags: note.tags || [],
            checklist: note.checklist || [],
            appointment: note.appointment,
            date: note.date || "",
            time: note.time || "",
            recurrence: note.recurrence || "none",
            reminderMinutes: note.reminderMinutes ?? null,
            favorite: note.favorite,
            pinned: note.pinned,
            completed: note.completed,
          }
        : empty
    );

    setCheckText("");
    setErr("");
    setTagManagerOpen(false);
    setTagSelectOpen(false);
  }, [open, note]);

  if (!open) return null;

  const set = <K extends keyof NoteFormData>(
    key: K,
    value: NoteFormData[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  function toggleTag(name: string) {
    const selected = form.tags.includes(name);

    set(
      "tags",
      selected
        ? form.tags.filter((tag) => tag !== name)
        : [...form.tags, name]
    );
  }

  function addCheck() {
    const text = checkText.trim();
    if (!text) return;

    set("checklist", [
      ...form.checklist,
      {
        id: crypto.randomUUID(),
        text,
        done: false,
      },
    ]);

    setCheckText("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.title.trim() &&
      !form.content.trim() &&
      !form.checklist.length
    ) {
      setErr(
        "Escreva um título, uma anotação ou adicione um item ao checklist."
      );
      return;
    }

    setErr("");
    await onSave(form);
  }

  const priorities: Array<[NotePriority, string]> = [
    ["none", "⚪ Sem prioridade"],
    ["low", "🟢 Baixa"],
    ["medium", "🟡 Média"],
    ["high", "🟠 Alta"],
    ["urgent", "🔴 Urgente"],
  ];

  const recurrences: Array<[Recurrence, string]> = [
    ["none", "Não repetir"],
    ["daily", "Todos os dias"],
    ["weekly", "Toda semana"],
    ["monthly", "Todo mês"],
    ["yearly", "Todo ano"],
  ];

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-md-3"
        style={{
          zIndex: 1800,
          background: "rgba(15,23,42,.52)",
          backdropFilter: "blur(5px)",
          overflowY: "auto",
        }}
      >
        <div
          className="bg-body w-100 my-auto shadow"
          style={{
            maxWidth: 900,
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          <div className="d-flex justify-content-between p-4 border-bottom">
            <div>
              <h4 className="fw-bold mb-1">
                {note ? "Editar anotação" : "Nova anotação"}
              </h4>
              <small className="text-secondary">
                Anotação, compromisso e checklist no mesmo lugar.
              </small>
            </div>

            <button
              type="button"
              className="btn btn-light rounded-circle"
              onClick={onClose}
              disabled={saving}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="p-4">
              {err && <div className="alert alert-warning">{err}</div>}

              <label className="form-label fw-semibold">Título</label>
              <input
                className="form-control form-control-lg mb-3"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="Ex.: Renovação do contrato"
                autoFocus
              />

              <label className="form-label fw-semibold">Anotação</label>
              <textarea
                className="form-control mb-3"
                rows={7}
                value={form.content}
                onChange={(event) => set("content", event.target.value)}
                placeholder="Escreva tudo o que precisa lembrar..."
                style={{ resize: "vertical" }}
              />

              <div className="row g-3">

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Prioridade</label>
                  <select
                    className="form-select"
                    value={form.priority}
                    onChange={(event) =>
                      set("priority", event.target.value as NotePriority)
                    }
                  >
                    {priorities.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Tags</label>

                  <div className="input-group">
                    <div className="position-relative flex-grow-1">
                      <button
                        type="button"
                        className="form-select text-start w-100"
                        onClick={() => setTagSelectOpen((current) => !current)}
                      >
                        {form.tags.length === 0
                          ? "Selecione uma ou mais tags"
                          : `${form.tags.length} tag(s) selecionada(s)`}
                      </button>

                      {tagSelectOpen && (
                        <div
                          className="position-absolute start-0 end-0 mt-1 bg-body border shadow-sm p-2"
                          style={{
                            zIndex: 50,
                            borderRadius: 12,
                            maxHeight: 220,
                            overflowY: "auto",
                          }}
                        >
                          {sortedTags.length === 0 ? (
                            <div className="text-secondary small p-2">
                              Nenhuma tag cadastrada.
                            </div>
                          ) : (
                            sortedTags.map((tag) => (
                              <label
                                key={tag.id}
                                className="d-flex align-items-center gap-2 px-2 py-2 rounded"
                                style={{ cursor: "pointer" }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={form.tags.includes(tag.name)}
                                  onChange={() => toggleTag(tag.name)}
                                />
                                <span
                                  className="badge rounded-pill px-2 py-1"
                                  style={{
                                    background: safeColor(tag.color),
                                    color: contrastText(safeColor(tag.color)),
                                  }}
                                >
                                  #{tag.name}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => {
                        setTagSelectOpen(false);
                        setTagManagerOpen(true);
                      }}
                      title="Gerenciar tags"
                    >
                      <i className="bi bi-plus-lg" />
                    </button>
                  </div>

                  {form.tags.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {form.tags.map((tagName) => {
                        const tagInfo = tags.find(
                          (item) => item.name === tagName
                        );
                        const color = safeColor(tagInfo?.color);

                        return (
                          <button
                            key={tagName}
                            type="button"
                            className="badge rounded-pill border-0"
                            onClick={() => toggleTag(tagName)}
                            title="Remover tag"
                            style={{
                              cursor: "pointer",
                              background: color,
                              color: contrastText(color),
                            }}
                          >
                            #{tagName}
                            <i className="bi bi-x ms-1" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 border rounded-4">
                <div className="fw-semibold mb-2">
                  <i className="bi bi-check2-square me-2" />
                  Checklist
                </div>

                <div className="input-group mb-2">
                  <input
                    className="form-control"
                    value={checkText}
                    onChange={(event) => setCheckText(event.target.value)}
                    placeholder="Adicionar item"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCheck();
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addCheck}
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                </div>

                {form.checklist.map((item, index) => (
                  <div
                    className="d-flex align-items-center gap-2 py-1"
                    key={item.id}
                  >
                    <input
                      className="form-check-input mt-0"
                      type="checkbox"
                      checked={item.done}
                      onChange={(event) =>
                        set(
                          "checklist",
                          form.checklist.map((current, currentIndex) =>
                            currentIndex === index
                              ? { ...current, done: event.target.checked }
                              : current
                          )
                        )
                      }
                    />

                    <span
                      className="flex-grow-1"
                      style={{
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      {item.text}
                    </span>

                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger"
                      onClick={() =>
                        set(
                          "checklist",
                          form.checklist.filter(
                            (_, currentIndex) => currentIndex !== index
                          )
                        )
                      }
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 border rounded-4 bg-body-tertiary">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    id="appointment"
                    type="checkbox"
                    checked={form.appointment}
                    onChange={(event) =>
                      set("appointment", event.target.checked)
                    }
                  />

                  <label
                    className="form-check-label fw-semibold"
                    htmlFor="appointment"
                  >
                    <i className="bi bi-calendar-check me-2" />
                    É um compromisso
                  </label>
                </div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Data</label>
                    <input
                      className="form-control"
                      type="date"
                      value={form.date}
                      onChange={(event) => {
                        set("date", event.target.value);
                        if (event.target.value) set("appointment", true);
                      }}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Hora</label>
                    <input
                      className="form-control"
                      type="time"
                      value={form.time}
                      onChange={(event) => set("time", event.target.value)}
                      disabled={!form.date}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Repetir</label>
                    <select
                      className="form-select"
                      value={form.recurrence}
                      onChange={(event) =>
                        set(
                          "recurrence",
                          event.target.value as Recurrence
                        )
                      }
                      disabled={!form.date}
                    >
                      {recurrences.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Lembrar</label>
                    <select
                      className="form-select"
                      value={form.reminderMinutes ?? ""}
                      onChange={(event) =>
                        set(
                          "reminderMinutes",
                          event.target.value === ""
                            ? null
                            : Number(event.target.value)
                        )
                      }
                      disabled={!form.date}
                    >
                      <option value="">Sem lembrete</option>
                      <option value="0">Na hora</option>
                      <option value="15">15 min antes</option>
                      <option value="60">1 hora antes</option>
                      <option value="1440">1 dia antes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3 mt-4">
                {[
                  ["favorite", "bi-star", "Favorita"],
                  ["pinned", "bi-pin-angle", "Fixar no topo"],
                  ["completed", "bi-check-circle", "Concluída"],
                ].map(([field, icon, label]) => {
                  const key = field as
                    | "favorite"
                    | "pinned"
                    | "completed";

                  return (
                    <div className="form-check" key={field}>
                      <input
                        id={field}
                        className="form-check-input"
                        type="checkbox"
                        checked={form[key]}
                        onChange={(event) =>
                          set(key, event.target.checked)
                        }
                      />
                      <label className="form-check-label" htmlFor={field}>
                        <i className={`bi ${icon} me-1`} />
                        {label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 p-4 border-top">
              <button
                type="button"
                className="btn btn-light"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primary px-4"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ManagerModal
        open={tagManagerOpen}
        title="Gerenciar tags"
        singular="tag"
        plural="tags"
        icon="bi-tags"
        items={tags}
        counts={tagCounts}
        onClose={() => setTagManagerOpen(false)}
        onCreate={onCreateTag}
        onRename={onRenameTag}
        onDelete={onDeleteTag}
      />
    </>
  );
}
