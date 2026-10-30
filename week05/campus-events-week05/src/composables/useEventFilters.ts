import { computed, ref, type Ref } from "vue";
import type { CampusEvent, Category } from "../types";

// E1 (refactor): the filtering logic moved here from week 4's EventList.vue,
// so any page can reuse it. Returns { search, category, visible }.
// The test "filters the list with the search box" in EventsPage.test.ts checks it.
export function useEventFilters(events: Ref<CampusEvent[]>) {
  const search = ref("");
  const category = ref<Category | "all">("all");
  const visible = computed(() => {
    const text = search.value.trim().toLowerCase();
    return events.value.filter((e) => {
      const matchesCategory = category.value === "all" || e.category === category.value;
      const matchesText =
        text === "" ||
        e.title.toLowerCase().includes(text) ||
        e.location.toLowerCase().includes(text);
      return matchesCategory && matchesText;
    });
  });
  return { search, category, visible };
}
