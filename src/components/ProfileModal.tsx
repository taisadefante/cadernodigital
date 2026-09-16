"use client";

import { FormEvent, useEffect, useState } from "react";
import type {
  Note,
  NoteFormData,
  NotePriority,
  Recurrence,
} from "@/types/note";

interface Props {
  open: boolean;
  note: Note | null;
  categories: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: NoteFormData) => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
}

const empty: NoteFormData = {
  title: "",
  content: "",
  category: "Geral",
  priority: "none",
  tagsText: "",
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
  categories,
  saving,
  onClose,
  onSave,
  onCreateCategory,
}: Props) {
  const [form, setForm] = useState<NoteFormData>(empty);
  const [newCat, setNewCat] = useState("");
  const [showCat, setShowCat] = useState(false);
  const [checkText, setCheckText] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm(
      note
        ? {
            title: note.title,
            content: note.content,
            category: note.category || "Geral",
            priority: note.priority,
            tagsText: note.tags.join(", "),
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

    setErr("");
    setCheckText("");
    setNewCat("");
    setShowCat(false);
  }, [open, note]);

  if (!open) return null;

  const set = <K extends keyof NoteFormData>(
    key: K,
    value: NoteFormData[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addCheck = () => {
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
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() && !form.content.trim() && !form.checklist.length) {
      setErr("Escreva um título, uma anotação ou adicione um item ao checklist.");
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
        style={{ maxWidth: 900, borderRadius: 22, overflow: "hidden" }}
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
            title="Fechar"
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
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex.: Renovação do contrato"
              autoFocus
            />

            <label className="form-label fw-semibold">Anotação</label>
            <textarea
              className="form-control mb-3"
              rows={7}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Escreva tudo o que precisa lembrar..."
              style={{ resize: "vertical" }}
            />

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Categoria</label>

                <div className="input-group">
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setShowCat((current) => !current)}
                    title="Nova categoria"
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                </div>

                {showCat && (
                  <div className="d-flex gap-2 mt-2">
                    <input
                      className="form-control form-control-sm"
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      placeholder="Nova categoria"
                    />

                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={async () => {
                        const name = newCat.trim();
                        if (!name) return;

                        await onCreateCategory(name);
                        set("category", name);
                        setNewCat("");
                        setShowCat(false);
                      }}
                    >
                      <i className="bi bi-check-lg" />
                    </button>
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Prioridade</label>
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={(e) =>
                    set("priority", e.target.value as NotePriority)
                  }
                >
                  {priorities.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Tags</label>
                <input
                  className="form-control"
                  value={form.tagsText}
                  onChange={(e) => set("tagsText", e.target.value)}
                  placeholder="DETRAN, contrato, imóvel"
                />
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
                  onChange={(e) => setCheckText(e.target.value)}
                  placeholder="Adicionar item"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
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
                    onChange={(e) =>
                      set(
                        "checklist",
                        form.checklist.map((current, currentIndex) =>
                          currentIndex === index
                            ? { ...current, done: e.target.checked }
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
                    title="Excluir item"
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
                  onChange={(e) => set("appointment", e.target.checked)}
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
                    onChange={(e) => {
                      set("date", e.target.value);
                      if (e.target.value) set("appointment", true);
                    }}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Hora</label>
                  <input
                    className="form-control"
                    type="time"
                    value={form.time}
                    onChange={(e) => set("time", e.target.value)}
                    disabled={!form.date}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Repetir</label>
                  <select
                    className="form-select"
                    value={form.recurrence}
                    onChange={(e) =>
                      set("recurrence", e.target.value as Recurrence)
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
                    onChange={(e) =>
                      set(
                        "reminderMinutes",
                        e.target.value === "" ? null : Number(e.target.value)
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
                      onChange={(e) => set(key, e.target.checked)}
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

            <button className="btn btn-primary px-4" disabled={saving}>
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
  );
}
