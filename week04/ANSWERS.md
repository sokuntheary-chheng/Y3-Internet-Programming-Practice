# Week 4 — Explain it

Answers based on `week04-starter/campus-events-week04/src` (`EventCard.vue`, `EventList.vue`, `App.vue`).

## 1. In `EventList`, what goes wrong if you use the array index as `:key` and the list gets filtered while a card has local state (for example an open details panel)?

In `EventList.vue` the `v-for="e in visible"` uses `:key="e.id"`, so a card belongs to an event, not to a position in the list. With the array index as the key, Vue reuses the component instance that already sits at that position when the list changes, so after filtering, the card at index 0 may now show a different event but it keeps the old instance and its local state. The details panel you opened for one event would then appear attached to a different event, or jump to another event when the list shifts. With `e.id` as the key, Vue moves the existing instance to its new place and keeps the local state with the right event.

## 2. Why is `visible` a computed and not a function called from the template? What is the difference when you type in the search box?

`visible` is a `computed` in `EventList.vue`: it reads `search.value` and `category.value` and returns the filtered array of events. A computed is lazy and cached, so Vue recalculates it only when `search` or `category` actually changes, and because the computed is itself reactive the template updates on its own. A plain function called from the template would run again on every re-render of `EventList`, even when nothing relevant changed. When you type in the search box, `search` changes, so the computed is invalidated and recalculated once and only the affected cards are re-rendered, while a method would run the filter again on every render pass.

## 3. `EventCard` emits `book` instead of changing `event.booked`. Give two reasons.

First, props are read-only: `event` reaches `EventCard` as a prop from `EventList` (`<EventCard :event="e" ...>`), and the object belongs to the parent, so Vue warns when a child writes to `props.event.booked`. Second, the card does not own the data: `App.vue` owns `events` and is the only place that decides what a booking means, so `onBook(id)` there is what increases `event.booked` and pushes the id into `myBookings`. `EventCard` therefore only reports the intent with `emit("book", event.id)`, and `EventList` passes the event up again with `@book="emit('book', $event)"`.

## 4. You write `const { booked } = reactive(event); booked++`. The page does not change. Why?

`const { booked } = reactive(event)` reads the value of `booked` once and puts it into a plain number variable, so the connection to the reactive object is gone. `booked++` then changes only that local variable, and no template in the component reads it, so nothing on the page is updated. To keep the reactivity you have to go through the proxy, for example `event.booked++` on the reactive object (which is what `App.vue`'s `onBook` does with `event.booked += 1`), or `toRefs(event).booked.value++` if you want to destructure.

## 5. Where does `myBookings` live, and why not in `EventCard` or `EventList`?

`myBookings` is a ref in `App.vue` (`const myBookings = ref<number[]>([])`), right next to `events`, which is the owner of the data. It has to be visible to the whole app: `onBook(id)` adds an id to it, `bookingCount` derives the header text "You have booked N seats." from it, and the watcher saves it to `localStorage` so the seats survive a reload. It cannot live in `EventCard`, because that would create one private copy per card that is thrown away when the card is unmounted or filtered out of `visible`. It should not live in `EventList` either, because `App.vue` would then have two sources of truth for the same bookings (the seat numbers in `events` and a second list in the list component), and the list would still have to send the count up to the header.
