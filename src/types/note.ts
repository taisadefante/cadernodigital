import type { Timestamp } from "firebase/firestore";

export type NotePriority = "none" | "low" | "medium" | "high" | "urgent";
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: NotePriority;
  tags: string[];
  checklist: ChecklistItem[];
  appointment: boolean;
  date: string | null;
  time: string | null;
  recurrence: Recurrence;
  reminderMinutes: number | null;
  favorite: boolean;
  pinned: boolean;
  completed: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  archived?: boolean;
  deletedAt?: Timestamp | null;
}

export interface NoteFormData {
  title: string;
  content: string;
  category: string;
  priority: NotePriority;
  tags: string[];
  checklist: ChecklistItem[];
  appointment: boolean;
  date: string;
  time: string;
  recurrence: Recurrence;
  reminderMinutes: number | null;
  favorite: boolean;
  pinned: boolean;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface NoteFilters {
  search: string;
  priority: "all" | NotePriority;
  category: "all" | string;
  tag: "all" | string;
  dateFrom: string;
  dateTo: string;
  appointment: "all" | "withDate" | "withoutDate";
  status: "all" | "pending" | "completed";
  favoritesOnly: boolean;
  sort:
    | "updatedDesc"
    | "createdDesc"
    | "dateAsc"
    | "priorityDesc"
    | "titleAsc";
}

export interface HistoryEntry {
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
