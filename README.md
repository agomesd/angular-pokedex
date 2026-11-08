# Pokémon Explorer

A browse, search, and team builder for Pokémon, built with Angular and [PokéAPI](https://pokeapi.co/).

## Prerequisites

- Node.js current LTS and npm
- A browser, for the app and for Karma

## Install and run

```bash
npm install
npm start
```

The app is served at [http://localhost:4200/](http://localhost:4200/). My Team is `/`. The Pokédex is `/pokemon`. A Pokémon page is `/pokemon/25` or `/pokemon/pikachu` and works when that URL is opened directly.

```bash
npm test
npm run build
```

`npm test` runs the Karma unit tests. They do not call the live PokéAPI.

Angular **22.2**. TypeScript. The lockfile is `package-lock.json`.

## Architecture

Feature UI lives under `src/app/pokemon`. Routes are in `src/app/app.routes.ts`.

- `PokemonService` is the only code that calls PokéAPI. Once a Pokémon or a type has loaded, later screens reuse that response instead of asking again. A failed request is forgotten, so Try again starts a new one. The list loads one page of 20 names. Each card then loads that Pokémon's picture and types. Every Pokémon is downloaded only when search, filters, or skipping ahead need the whole set.
- `TeamService` is the single copy of the team, used by My Team, the Pokédex, and compare. It is saved in the browser's localStorage, so a refresh keeps the same six slots. That save is read only after the page is running in the browser. The server has no localStorage, and reading it any earlier would make the first paint on the server differ from the first paint in the browser.
- Search waits until typing pauses for 300ms, then looks up that text. Another keystroke cancels a lookup that has not come back yet. An empty box does not call the API. A name PokéAPI does not know is a different message from PokéAPI being unreachable.
- The Pokédex page and filters are kept in the URL (`page`, `types`, `generations`, `legendary`, `mythical`, `team`), so the address can be shared and the browser's back button restores them. The same browse is also kept for this browser tab: leave for My Team, open the Pokédex again, and the page and filters are preserved. Compare remembers its own page and filters. Nickname and role dialogs are not saved; closing one clears it. The team and the loaded Pokémon are the two pieces of data shared by the whole app.

## Why Tailwind and Spartan

I come from React, Tailwind, and shadcn/ui background. I kept that way of building UI and swapped the React pieces for Angular ones.

Tailwind is the styling language I already use. I prefer having tailwind css utility classes sit next to the markup, so a card, a sheet, and a toolbar can share spacing, type, and colour without a separate stylesheet per component. The theme is CSS variables in `src/styles.css` (`--primary`, `--ring`, `--background`, and the rest). Tailwind utilities and the component kit both read those variables, so light and dark stay in one place.

[Spartan](https://spartan.ng/) is the Angular version of shadcn. shadcn copies component source into the repo instead of hiding it in a package. Spartan does the same: Helm components live in `libs/ui` and are imported from `@spartan-ng/helm/*`. Brain (`@spartan-ng/brain`) is the headless behaviour, the same role as Radix in a shadcn app. Variants use `class-variance-authority`. `tailwind-merge` lets a local `class` override the component default, which is how a button can be a round toolbar control without forking the button.

I start with Spartan's own dialogs, sheets, buttons, cards, and switches. When a screen needs behaviour that belongs to this app, I compose a new component from those defaults.

`app-select` is one of those. The role field, the filter menus, and the round role button on a team slot all need the same keyboard behaviour: a letter jumps to a matching option, the arrow keys open and move, and Escape closes the list without closing the dialog or sheet. Helm's select did not give me that, plus an icon trigger, from one component. The listbox lives in `src/app/components/select` and every select in the app uses it.

Layout classes stay on the parent. A component styles its own control. The toolbar, for example, places search, pagination, and filters. Those components do not position themselves on the page.

## Assumptions and trade-offs

- A successful search opens a detail sheet on the list instead of leaving the page. The sheet shows the name, number, image, types, height, weight, abilities, base stats, and add or remove. **Show more** goes to `/pokemon/:id`. I wanted search to keep the list in place.
- A nickname is 3 to 12 characters. The add and swap forms start from the Pokémon's name. A form name longer than 12 characters is shortened so the field is already valid.
- Legendary filtering uses `is_legendary` only. Mythical filtering uses `is_mythical` only. A mythical such as Mew is not treated as legendary.
- The team stores each Pokémon by its own number. Charizard and Mega Charizard X share a species, but they have different numbers, so both can be on the team. Adding one leaves the other off the team.
- The team holds six slots. Adding a duplicate or a seventh Pokémon is refused, and a full team explains why.
- Type, generation, legendary, and mythical filters need those facts for every Pokémon at once. PokéAPI's usual API, `pokeapi.co/api/v2`, describes one Pokémon per request, so building the filters that way would mean a separate request for each of the thousand-plus Pokémon. PokéAPI also publishes the same data as CSV tables in its GitHub repository. jsDelivr is a public network that serves files straight from GitHub, and `PokemonService.filterCatalog()` downloads four of those tables through it: species, Pokémon, types, and which Pokémon has which type. The app reads them the first time a filter is used and keeps the result in memory. The list, pictures, and detail pages still come from the usual API.

## Known limitations

- The first paint of a page waits on PokéAPI. A failed browse request or a failed card can be retried from the screen.
- An image that fails to load keeps its box and shows the pokéball placeholder. A Pokémon with no artwork says "No image".

## Tests

The unit tests cover:

1. Adding a Pokémon that is already on the team is refused.
2. A seventh Pokémon is refused.
3. Search trims and lowercases input, waits 300ms, cancels an in-flight lookup, ignores an empty query, and tells a missing Pokémon apart from a network failure. The lookup is a fake observable.

## AI tools

I used an AI coding assistant while building this app. It implemented features, adjusted the interface, and checked the result against this brief. I decided the product behaviour and the visual design, and I can explain the code.

I also used it to understand the Angular patterns behind that behaviour. I come from React, so I asked how each Angular pattern lines up with the React pattern I would use for the same result: a shared service instead of a shared store, the router instead of React Router, and composing small components instead of assembling them in JSX. The assistant made that mapping, and the decisions about what the app should do stayed mine.
