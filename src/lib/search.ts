import type { Note, NoteFilters, NotePriority } from "@/types/note";

export type NoteSection =
  | "notes"
  | "appointments"
  | "favorites"
  | "calendar";

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const priorityWeight: Record<NotePriority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

function timestampMillis(value: Note["updatedAt"]): number {
  return value?.toMillis?.() ?? 0;
}

function contains(note: Note, search: string): boolean {
  const query = normalizeText(search);

  if (!query) {
    return true;
  }

  const searchableText = normalizeText(
    [
      note.title,
      note.content,
      note.category,
      note.tags?.join(" ") || "",
      note.checklist?.map((item) => item.text).join(" ") || "",
    ].join(" ")
  );

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => searchableText.includes(term));
}

export function filterNotes(
  notes: Note[],
  filters: NoteFilters,
  section: NoteSection
): Note[] {
  return notes
    .filter((note) => {
      // Registros antigos que ainda estavam na antiga lixeira
      // nunca voltam para a listagem enquanto são removidos do Firebase.
      if (note.deletedAt) {
        return false;
      }

      if (section === "appointments" && !note.appointment) {
        return false;
      }

      if (section === "favorites" && !note.favorite) {
        return false;
      }

      if (!contains(note, filters.search)) {
        return false;
      }

      if (
        filters.priority !== "all" &&
        note.priority !== filters.priority
      ) {
        return false;
      }

      if (
        filters.category !== "all" &&
        note.category !== filters.category
      ) {
        return false;
      }


      if (
        filters.tag !== "all" &&
        !(note.tags || []).includes(filters.tag)
      ) {
        return false;
      }

      if (
        filters.dateFrom &&
        (!note.date || note.date < filters.dateFrom)
      ) {
        return false;
      }

      if (
        filters.dateTo &&
        (!note.date || note.date > filters.dateTo)
      ) {
        return false;
      }

      if (
        filters.appointment === "withDate" &&
        !note.date
      ) {
        return false;
      }

      if (
        filters.appointment === "withoutDate" &&
        note.date
      ) {
        return false;
      }

      if (
        filters.status === "pending" &&
        note.completed
      ) {
        return false;
      }

      if (
        filters.status === "completed" &&
        !note.completed
      ) {
        return false;
      }

      if (
        filters.favoritesOnly &&
        !note.favorite
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      switch (filters.sort) {
        case "createdDesc":
          return timestampMillis(b.createdAt) - timestampMillis(a.createdAt);

        case "dateAsc":
          return (
            (a.date || "9999-12-31").localeCompare(
              b.date || "9999-12-31"
            ) ||
            (a.time || "").localeCompare(b.time || "")
          );

        case "priorityDesc":
          return (
            priorityWeight[b.priority] -
            priorityWeight[a.priority]
          );

        case "titleAsc":
          return normalizeText(a.title).localeCompare(
            normalizeText(b.title)
          );

        case "updatedDesc":
        default:
          return timestampMillis(b.updatedAt) - timestampMillis(a.updatedAt);
      }
    });
}
