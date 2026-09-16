"use client";

import type {
  NoteFilters,
  NotePriority,
} from "@/types/note";

interface Props {
  open: boolean;
  filters: NoteFilters;
  categories: string[];
  tags: string[];
  onChange: (
    filters: NoteFilters
  ) => void;
  onClear: () => void;
}

export default function FiltersPanel({
  open,
  filters,
  categories,
  tags,
  onChange,
  onClear,
}: Props) {
  if (!open) return null;

  function setFilter<
    K extends keyof NoteFilters
  >(
    key: K,
    value: NoteFilters[K]
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  const hasActiveFilters =
    filters.priority !== "all" ||
    filters.category !== "all" ||
    filters.tag !== "all" ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    filters.appointment !== "all" ||
    filters.status !== "all" ||
    filters.favoritesOnly ||
    filters.sort !== "updatedDesc";

  return (
    <div
      className="bg-body border p-3 p-lg-4"
      style={{
        borderRadius: 16,

        boxShadow:
          "0 5px 18px rgba(15,23,42,.04)",
      }}
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">

        <div>
          <div className="fw-bold">
            Filtros
          </div>

          <small className="text-secondary">
            Refine as anotações exibidas.
          </small>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClear}
          >
            <i className="bi bi-x-circle me-2" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="row g-3">

        {/* CATEGORIA */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Categoria
          </label>

          <select
            className="form-select"
            value={filters.category}
            onChange={(event) =>
              setFilter(
                "category",
                event.target.value
              )
            }
          >
            <option value="all">
              Todas
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>
        </div>

        {/* TAG */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Tag
          </label>

          <select
            className="form-select"
            value={filters.tag}
            onChange={(event) =>
              setFilter(
                "tag",
                event.target.value
              )
            }
          >
            <option value="all">
              Todas
            </option>

            {tags.map(
              (tag) => (
                <option
                  key={tag}
                  value={tag}
                >
                  #{tag}
                </option>
              )
            )}
          </select>
        </div>

        {/* PRIORIDADE */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Prioridade
          </label>

          <select
            className="form-select"
            value={filters.priority}
            onChange={(event) =>
              setFilter(
                "priority",
                event.target
                  .value as
                  | "all"
                  | NotePriority
              )
            }
          >
            <option value="all">
              Todas
            </option>

            <option value="low">
              Baixa
            </option>

            <option value="medium">
              Média
            </option>

            <option value="high">
              Alta
            </option>

            <option value="urgent">
              Urgente
            </option>
          </select>
        </div>

        {/* STATUS */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Status
          </label>

          <select
            className="form-select"
            value={filters.status}
            onChange={(event) =>
              setFilter(
                "status",
                event.target
                  .value as
                  NoteFilters["status"]
              )
            }
          >
            <option value="all">
              Todos
            </option>

            <option value="pending">
              Pendentes
            </option>

            <option value="completed">
              Concluídas
            </option>
          </select>
        </div>

        {/* DATA INICIAL */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Data inicial
          </label>

          <input
            type="date"
            className="form-control"
            value={filters.dateFrom}
            onChange={(event) =>
              setFilter(
                "dateFrom",
                event.target.value
              )
            }
          />
        </div>

        {/* DATA FINAL */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Data final
          </label>

          <input
            type="date"
            className="form-control"
            value={filters.dateTo}
            onChange={(event) =>
              setFilter(
                "dateTo",
                event.target.value
              )
            }
          />
        </div>

        {/* COMPROMISSO */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Data / compromisso
          </label>

          <select
            className="form-select"
            value={filters.appointment}
            onChange={(event) =>
              setFilter(
                "appointment",
                event.target
                  .value as
                  NoteFilters["appointment"]
              )
            }
          >
            <option value="all">
              Todos
            </option>

            <option value="withDate">
              Com data
            </option>

            <option value="withoutDate">
              Sem data
            </option>
          </select>
        </div>

        {/* ORDENAÇÃO */}
        <div className="col-12 col-md-6 col-xl-3">

          <label className="form-label small fw-semibold">
            Ordenar
          </label>

          <select
            className="form-select"
            value={filters.sort}
            onChange={(event) =>
              setFilter(
                "sort",
                event.target
                  .value as
                  NoteFilters["sort"]
              )
            }
          >
            <option value="updatedDesc">
              Atualizadas recentemente
            </option>

            <option value="createdDesc">
              Criadas recentemente
            </option>

            <option value="dateAsc">
              Data mais próxima
            </option>

            <option value="priorityDesc">
              Maior prioridade
            </option>

            <option value="titleAsc">
              Título A-Z
            </option>
          </select>
        </div>

        <div className="col-12">

          <div className="form-check">
            <input
              id="filter-favorites"
              className="form-check-input"
              type="checkbox"
              checked={
                filters.favoritesOnly
              }
              onChange={(event) =>
                setFilter(
                  "favoritesOnly",
                  event.target.checked
                )
              }
            />

            <label
              className="form-check-label"
              htmlFor="filter-favorites"
            >
              <i className="bi bi-star me-2 text-warning" />
              Somente favoritas
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
