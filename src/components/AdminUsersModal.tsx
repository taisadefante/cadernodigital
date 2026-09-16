"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

type AdminView = "list" | "create";

interface AdminUser {
  uid: string;
  name: string;
  email: string;
  disabled: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  isAdmin: boolean;
}

interface Props {
  open: boolean;
  initialView: AdminView;
  onClose: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function AdminUsersModal({
  open,
  initialView,
  onClose,
}: Props) {
  const [view, setView] = useState<AdminView>(initialView);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!open) return;

    setView(initialView);
    setError("");
    setSuccess("");
    setEditing(null);
    setDeleteTarget(null);

    void loadUsers();
  }, [open, initialView]);

  async function adminFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("Sessão administrativa não encontrada.");
    }

    const token = await currentUser.getIdToken();

    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      users?: AdminUser[];
      success?: boolean;
    };

    if (!response.ok) {
      throw new Error(body.error || "Não foi possível concluir.");
    }

    return body;
  }

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await adminFetch("/api/admin/users");
      setUsers(data.users || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os usuários."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
        }),
      });

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");

      setSuccess("Usuário cadastrado com sucesso.");
      setView("list");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o usuário."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user: AdminUser) {
    setEditing(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword("");
    setError("");
    setSuccess("");
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminFetch("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({
          uid: editing.uid,
          name: editName,
          email: editEmail,
          password: editPassword || undefined,
        }),
      });

      setEditing(null);
      setEditPassword("");
      setSuccess("Usuário atualizado com sucesso.");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o usuário."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminFetch("/api/admin/users", {
        method: "DELETE",
        body: JSON.stringify({
          uid: deleteTarget.uid,
        }),
      });

      setDeleteTarget(null);
      setSuccess(
        "Usuário e todos os dados dele foram excluídos definitivamente."
      );

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o usuário."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(query)
    );
  }, [users, search]);

  if (!open) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-2 p-md-3"
      style={{
        zIndex: 3000,
        background: "rgba(15,23,42,.58)",
        backdropFilter: "blur(5px)",
        overflowY: "auto",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white w-100 my-auto"
        style={{
          maxWidth: 1050,
          maxHeight: "92vh",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 30px 90px rgba(15,23,42,.28)",
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-3 p-4 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background: "#eff6ff",
                  color: "#2563eb",
                }}
              >
                <i className="bi bi-people fs-5" />
              </span>

              <div>
                <h4 className="fw-bold mb-0">Administração de usuários</h4>
                <small className="text-secondary">
                  Cadastro, edição e exclusão definitiva.
                </small>
              </div>
            </div>
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

        <div className="px-4 pt-3">
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className={`btn ${
                view === "list"
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              onClick={() => setView("list")}
            >
              <i className="bi bi-people me-2" />
              Usuários
            </button>

            <button
              type="button"
              className={`btn ${
                view === "create"
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              onClick={() => setView("create")}
            >
              <i className="bi bi-person-plus me-2" />
              Novo usuário
            </button>
          </div>
        </div>

        <div
          className="p-4"
          style={{
            overflowY: "auto",
            maxHeight: "calc(92vh - 145px)",
          }}
        >
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2" />
              {success}
            </div>
          )}

          {view === "create" ? (
            <form
              onSubmit={createUser}
              className="border rounded-4 p-3 p-md-4"
            >
              <h5 className="fw-bold mb-1">Cadastrar novo usuário</h5>
              <p className="text-secondary small mb-4">
                A conta será criada pelo administrador sem alterar a sessão
                atual.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nome</label>
                  <input
                    className="form-control"
                    value={createName}
                    onChange={(event) =>
                      setCreateName(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    value={createEmail}
                    onChange={(event) =>
                      setCreateEmail(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Senha inicial
                  </label>

                  <div className="input-group">
                    <input
                      type={showCreatePassword ? "text" : "password"}
                      className="form-control"
                      value={createPassword}
                      onChange={(event) =>
                        setCreatePassword(event.target.value)
                      }
                      minLength={6}
                      required
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setShowCreatePassword((current) => !current)
                      }
                      title="Mostrar/ocultar senha"
                    >
                      <i
                        className={`bi ${
                          showCreatePassword
                            ? "bi-eye-slash"
                            : "bi-eye"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  className="btn btn-primary px-4"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2" />
                      Cadastrar
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                <div>
                  <h5 className="fw-bold mb-1">
                    Usuários cadastrados
                  </h5>
                  <small className="text-secondary">
                    {users.length} usuário(s)
                  </small>
                </div>

                <div
                  className="position-relative"
                  style={{ width: "min(100%, 360px)" }}
                >
                  <i
                    className="bi bi-search position-absolute"
                    style={{
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#64748b",
                    }}
                  />

                  <input
                    className="form-control ps-5"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar nome ou e-mail..."
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                </div>
              ) : (
                <div className="border rounded-4 overflow-hidden">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Usuário</th>
                          <th>Último acesso</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.uid}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <span
                                  className="d-flex align-items-center justify-content-center fw-bold"
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    background: user.isAdmin
                                      ? "#dbeafe"
                                      : "#f1f5f9",
                                    color: user.isAdmin
                                      ? "#1d4ed8"
                                      : "#475569",
                                    flexShrink: 0,
                                  }}
                                >
                                  {(user.name || user.email || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>

                                <div style={{ minWidth: 0 }}>
                                  <div className="fw-semibold">
                                    {user.name || "Sem nome"}

                                    {user.isAdmin && (
                                      <span className="badge text-bg-primary ms-2">
                                        Admin
                                      </span>
                                    )}
                                  </div>

                                  <small className="text-secondary">
                                    {user.email}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td className="small text-secondary">
                              {formatDate(user.lastSignInAt)}
                            </td>

                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light border"
                                  onClick={() => startEdit(user)}
                                  title="Editar usuário"
                                >
                                  <i className="bi bi-pencil-square" />
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={user.isAdmin}
                                  onClick={() =>
                                    setDeleteTarget(user)
                                  }
                                  title={
                                    user.isAdmin
                                      ? "A conta administradora não pode ser excluída"
                                      : "Excluir usuário"
                                  }
                                >
                                  <i className="bi bi-trash3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredUsers.length === 0 && (
                          <tr>
                            <td
                              colSpan={3}
                              className="text-center text-secondary py-5"
                            >
                              Nenhum usuário encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {editing && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 3100,
            background: "rgba(15,23,42,.48)",
          }}
        >
          <form
            onSubmit={saveEdit}
            className="bg-white w-100 p-4"
            style={{
              maxWidth: 560,
              borderRadius: 20,
              boxShadow: "0 24px 70px rgba(15,23,42,.22)",
            }}
          >
            <div className="d-flex justify-content-between gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1">Editar usuário</h5>
                <small className="text-secondary">
                  {editing.email}
                </small>
              </div>

              <button
                type="button"
                className="btn btn-light rounded-circle"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Nome</label>
              <input
                className="form-control"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">E-mail</label>
              <input
                type="email"
                className="form-control"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                disabled={editing.isAdmin}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">
                Nova senha
              </label>

              <div className="input-group">
                <input
                  type={showEditPassword ? "text" : "password"}
                  className="form-control"
                  value={editPassword}
                  onChange={(event) =>
                    setEditPassword(event.target.value)
                  }
                  placeholder="Deixe em branco para não alterar"
                  minLength={editPassword ? 6 : undefined}
                />

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setShowEditPassword((current) => !current)
                  }
                >
                  <i
                    className={`bi ${
                      showEditPassword
                        ? "bi-eye-slash"
                        : "bi-eye"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <span className="spinner-border spinner-border-sm" />
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
      )}

      {deleteTarget && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 3200,
            background: "rgba(15,23,42,.55)",
          }}
        >
          <div
            className="bg-white w-100 p-4"
            style={{
              maxWidth: 500,
              borderRadius: 20,
              boxShadow: "0 24px 70px rgba(15,23,42,.24)",
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

            <h5 className="fw-bold">Excluir usuário definitivamente?</h5>

            <p className="text-secondary mb-2">
              <strong>{deleteTarget.name || deleteTarget.email}</strong>
            </p>

            <p className="text-secondary">
              A conta e todos os dados dela serão apagados: anotações,
              categorias, compromissos e históricos. Esta ação não pode ser
              desfeita.
            </p>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void deleteUser()}
                disabled={saving}
              >
                {saving ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <>
                    <i className="bi bi-trash3 me-2" />
                    Excluir tudo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
