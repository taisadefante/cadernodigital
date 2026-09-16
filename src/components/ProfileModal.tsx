"use client";

interface Props {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  setDark: (value: boolean) => void;
}

export default function ProfileModal({
  open,
  onClose,
  dark,
  setDark,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        zIndex: 2200,
        background: "rgba(15,23,42,.55)",
        backdropFilter: "blur(5px)",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-body w-100 shadow"
        style={{
          maxWidth: 520,
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        <div className="d-flex align-items-start justify-content-between gap-3 p-4 border-bottom">
          <div>
            <h4 className="fw-bold mb-1">
              Perfil e aparência
            </h4>

            <p className="text-secondary mb-0 small">
              Personalize a aparência do seu caderno.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-light rounded-circle"
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

        <div className="p-4">
          <div
            className="d-flex align-items-center justify-content-between gap-3 p-3 border rounded-4"
          >
            <div className="d-flex align-items-center gap-3">
              <span
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: dark ? "#1e293b" : "#eff6ff",
                  color: dark ? "#f8fafc" : "#2563eb",
                  flexShrink: 0,
                }}
              >
                <i
                  className={`bi ${
                    dark ? "bi-moon-stars" : "bi-sun"
                  } fs-5`}
                />
              </span>

              <div>
                <div className="fw-semibold">
                  Tema escuro
                </div>

                <small className="text-secondary">
                  {dark
                    ? "O modo escuro está ativado."
                    : "O modo claro está ativado."}
                </small>
              </div>
            </div>

            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={dark}
                onChange={(event) =>
                  setDark(event.target.checked)
                }
                aria-label="Alternar tema escuro"
                style={{
                  width: 44,
                  height: 22,
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          <div className="alert alert-light border mt-3 mb-0">
            <i className="bi bi-info-circle me-2 text-primary" />
            A preferência de aparência fica salva neste navegador.
          </div>
        </div>

        <div className="p-4 pt-0 d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary px-4"
            onClick={onClose}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
