# Internet Programming — Year 3

Practice lab repository for the Internet Programming course at the Institute of Technology of Cambodia.

## Student Information

| Field                | Value                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| Name                 | Chheng Sokuntheary                                                                  |
| Student ID           | p20240044                                                                           |
| University           | Institute of Technology of Cambodia                                                 |
| Faculty / Department | International Program                                                               |
| Course               | Internet Programming                                                                |
| Lecturer             | Mr. CHUN Thavora                                                                    |
| Lab                  | Week 4 — Vue Components and Reactivity (Campus Events)                              |
| Date of Submission   | 21 October 2026                                                                     |
| Repository           | [internet-programming](https://github.com/sokuntheary-chcheng/internet-programming) |

## About This Lab

Week 4 introduces component-based development and reactivity in Vue 3. The main concepts are **props go down, events go up, and derived values are computed**.

The reference application, Campus Events, displays a list of university events with a search box, a category filter, and a "Book a Seat" button. Event data is hard-coded in `src/data/events.ts`. In Week 5, the application will use data from an API instead.

I implemented the three main components of the reference application:

- `EventCard.vue`
- `EventList.vue`
- `App.vue`

I also answered the five "Explain It" questions from the handout in [`week04/ANSWERS.md`](week04/ANSWERS.md).

## What I Implemented

| Handout Part   | File                           | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Part B         | `src/components/EventCard.vue` | Defined the `event` prop using `defineProps` and the `book` event using `defineEmits`. Implemented three computed properties: `left`, `isFull`, and `almostFull`. Added event information, date formatting with `formatDate(event.startsAt)`, a `full` class, a full-capacity badge, remaining-seat information with the `warn` class, and a booking button that is disabled when the event is full. The button emits the event ID when clicked. |
| Part C         | `src/components/EventList.vue` | Implemented the `book` event, the `search` and `category` refs, and the computed property `visible` for category filtering and case-insensitive searching by title or location. Added `v-model` bindings, an event count, an `EventCard` for each visible event using `v-for` and `:key="e.id"`, and an empty-state message when no events match.                                                                                                |
| Part D         | `src/App.vue`                  | Implemented the `events` and `myBookings` refs, the computed property `bookingCount`, and the `onBook(id)` handler. The handler finds the selected event, checks seat availability, increments its `booked` count, and records the booking ID. Added a header displaying the number of booked seats.                                                                                                                                             |
| Part D — Bonus | `src/App.vue`                  | Added a `watch` on `myBookings` to save booking IDs to `localStorage` using `JSON.stringify`. On startup, the application reads the saved IDs inside a `try`/`catch` block and restores the corresponding booked-seat counts.                                                                                                                                                                                                                    |

## How the App Works

### 1. State Management

`App.vue` owns the application state. It maintains `events`, a reactive copy of `initialEvents`, `myBookings`, and the computed property `bookingCount`. It is the only component responsible for changing an event's `booked` count.

### 2. Searching and Filtering

`EventList.vue` receives `events` as a prop and calculates the visible events through the computed property `visible`.

The computed property combines the selected category with a case-insensitive search across event titles and locations. Using a computed property avoids maintaining a separate list that must be manually synchronized with the search and category inputs.

### 3. Component Communication

`EventCard.vue` receives one `event` through props and does not directly modify it. Instead, it emits a booking event:

`emit("book", event.id)`

The event travels upward from `EventCard.vue` to `EventList.vue`, which re-emits it to `App.vue`. The `onBook(id)` handler then performs the actual booking operation.

This follows Vue's one-way data flow: **props pass data down, and events communicate user actions up**.

### 4. Reactivity

When `App.vue` updates an event's `booked` count, Vue's reactivity system updates the dependent interface automatically.

The remaining-seat information, capacity badge, button state, and booking count stay synchronized with the underlying state without manually updating the DOM.

### 5. Booking Persistence

The bonus implementation uses `localStorage` to preserve booking IDs between page reloads. The `watch` saves changes to `myBookings`, while the startup logic reads the saved IDs and restores the corresponding booking counts.

## Running the Application

### Prerequisites

- Node.js 24 LTS
- npm 11
- A terminal and a code editor

The development environment used for verification was Node.js `v24.22.0` and npm `11.19.1` on Linux.

### Installation and Execution

Run the following commands from the project directory containing `package.json`.

```bash
cd week04-starter/campus-events-week04

# Install dependencies
npm install

# Start the development server
npm run dev

# Run the test suite
npm test

# Run TypeScript and Vue type checks
npm run check
```

After starting the development server, open [http://localhost:5173](http://localhost:5173) in your browser.

## Test Results

| Command         | Result                                     |
| --------------- | ------------------------------------------ |
| `npm test`      | 15 of 15 tests passing across 4 test files |
| `npm run check` | No type-checking errors                    |

**Verified environment:** Node.js `v24.22.0`, npm `11.19.1`, Linux.

## Handout Questions

The five "Explain It" questions from the Week 4 handout are answered in [`week04/ANSWERS.md`](week04/ANSWERS.md).

The answers use the variable and function names from my implementation, including `visible`, `book`, `myBookings`, `bookingCount`, and `onBook`.

## Repository Layout

```text
.
├── README.md
├── W04 Practice Handout.pdf
├── week04/
│   └── ANSWERS.md
└── week04-starter/
    └── campus-events-week04/
        ├── src/
        │   ├── App.vue
        │   ├── components/
        │   │   ├── EventCard.vue
        │   │   └── EventList.vue
        │   ├── data/
        │   │   └── events.ts
        │   ├── format.ts
        │   ├── types.ts
        │   └── main.ts
        ├── tests/
        ├── package.json
        ├── vite.config.ts
        └── tsconfig.json
```

## Learning Outcomes

Through this practice lab, I applied the following Vue 3 concepts:

- Component-based application structure.
- Props and custom events for parent-child communication.
- Reactive state using `ref`.
- Derived state using `computed`.
- Conditional rendering and list rendering with `v-if`, `v-else`, and `v-for`.
- Two-way input binding using `v-model`.
- Watching state changes using `watch`.
- Browser persistence using `localStorage`.
- Component testing and TypeScript type checking.
