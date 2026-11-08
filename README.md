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

- `PokemonService` is the only place that talks to PokéAPI. Detail and type requests are cached in memory with `shareReplay`, and a failed request is dropped from the cache so Try again can fetch it again. The browse list asks for one page of 20. Cards then load that page's details. The full directory is fetched only when search, filters, or paging need it.
- `TeamService` holds the team in signals. The team is written to `localStorage` after the browser has hydrated, so the server render and the first client render agree.
- Search is an RxJS pipeline in `pokemon-search.ts`. `debounceTime(300)`, `distinctUntilChanged`, and `switchMap` mean a new query cancels the one still in flight. An empty query never calls the API. A 404 and a network failure are different results.
- The list page and filters are written to the URL (`page`, `types`, `generations`, `legendary`, `mythical`, `team`) and remembered for the browser session. Leaving the Pokédex and opening it again keeps that page and those filters. The compare list remembers its own browse, separate from the Pokédex. Dialogs stay component state. The team and the Pokémon cache are shared services.

## Why Tailwind and Spartan

I come from React, Tailwind, and shadcn/ui. I kept that way of building UI and swapped the React pieces for Angular ones.

Tailwind is the styling language I already use. Classes sit next to the markup, so a card, a sheet, and a toolbar can share spacing, type, and colour without a separate stylesheet per component. The theme is CSS variables in `src/styles.css` (`--primary`, `--ring`, `--background`, and the rest). Tailwind utilities and the component kit both read those variables, so light and dark stay in one place. I named that theme Pokédex Terminal.

[Spartan](https://spartan.ng/) is the Angular version of shadcn. shadcn copies component source into the repo instead of hiding it in a package. Spartan does the same: Helm components live in `libs/ui` and are imported from `@spartan-ng/helm/*`. Brain (`@spartan-ng/brain`) is the headless behaviour, the same role as Radix in a shadcn app. Variants use `class-variance-authority`. `tailwind-merge` lets a local `class` override the component default, which is how a button can be a round toolbar control without forking the button.

Dialogs, sheets, buttons, cards, and switches come from that kit. I reach for a Helm component when the interaction already exists there. I write a small component when the interaction is specific to this app.

`app-select` is one of those. The role field, the filter menus, and the round role button on a team slot all need the same keyboard behaviour: a letter jumps to a matching option, the arrow keys open and move, and Escape closes the list without closing the dialog or sheet. Helm's select did not give me that, plus an icon trigger, from one component. The listbox lives in `src/app/pokemon/select` and every select in the app uses it.

Layout classes stay on the parent. A component styles its own control. The toolbar, for example, places search, pagination, and filters. Those components do not position themselves on the page.

## Assumptions and trade-offs

- A successful search opens a detail sheet on the list instead of leaving the page. The sheet shows the name, number, image, types, height, weight, abilities, base stats, and add or remove. **Show more** goes to `/pokemon/:id`. I wanted search to keep the list in place.
- A nickname is 3 to 12 characters. The add and swap forms start from the Pokémon's name. A form name longer than 12 characters is shortened so the field is already valid.
- Legendary filtering uses `is_legendary` only. Mythical filtering uses `is_mythical` only. A mythical such as Mew is not treated as legendary.
- Team membership is the Pokémon's own id. A form is not the same team member as its species.
- The team holds six slots. Adding a duplicate or a seventh Pokémon is refused, and a full team explains why.
- Filters for type, generation, legendary, and mythical come from the PokéAPI CSV data on jsDelivr. The public REST API does not return those fields in a shape that can filter the whole list without a request per Pokémon.

## Known limitations

- The first paint of a page waits on PokéAPI. A failed browse request or a failed card can be retried from the screen.
- An image that fails to load keeps its box and shows the pokéball placeholder. A Pokémon with no artwork says "No image".
- Compare, reorder, and the filters are extra. They are not required by the brief.

## With more time

I would add an end-to-end pass for search, add-to-team, and refresh, and I would cache the browse directory so filters do not download it again in a new session.

## Tests

The unit tests cover:

1. Adding a Pokémon that is already on the team is refused.
2. A seventh Pokémon is refused.
3. Search trims and lowercases input, waits 300ms, cancels an in-flight lookup, ignores an empty query, and tells a missing Pokémon apart from a network failure. The lookup is a fake observable.

## AI tools

I used an AI coding assistant to implement features, adjust the interface, and check the result against this brief. I decided the product behaviour and the visual design, and I can explain the code.

## Time spent

[Fill in the approximate time you spent.]
