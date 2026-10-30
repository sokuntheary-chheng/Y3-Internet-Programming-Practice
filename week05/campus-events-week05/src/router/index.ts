import { createRouter, createWebHistory, type RouterHistory } from "vue-router";
import { useSessionStore } from "../stores/session";
import EventsPage from "../pages/EventsPage.vue";

declare module "vue-router" {
  interface RouteMeta {
    organiserOnly?: boolean;
  }
}

export const routes = [
  { path: "/", name: "events", component: EventsPage },
  // "/events/new" must come before "/events/:id": the router matches top-down,
  // so without the (\\d+) on :id the literal path "new" would be swallowed
  // by the dynamic segment and never reach this route.
  {
    path: "/events/new",
    name: "event-new",
    component: () => import("../pages/NewEventPage.vue"),
    meta: { organiserOnly: true },
  },
  {
    path: "/events/:id(\\d+)",
    name: "event-detail",
    component: () => import("../pages/EventDetailPage.vue"),
    props: true,
  },
  {
    path: "/my-bookings",
    name: "my-bookings",
    component: () => import("../pages/MyBookingsPage.vue"),
  },
  // Catch-all: always last, every unmatched path ends here.
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../pages/NotFoundPage.vue"),
  },
];

export function makeRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({ history, routes });

  // Only create the session store when the route actually needs the check:
  // organiser-only pages. (Also keeps the guard cheap for every other route.)
  router.beforeEach((to) => {
    if (to.meta.organiserOnly && !useSessionStore().isOrganiser) {
      return { name: "events", query: { denied: "1" } };
    }
    return true;
  });

  return router;
}
