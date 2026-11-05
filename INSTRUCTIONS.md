# 💻 Angular Coding Challenge: Pokémon Explorer

## Overview

Build a **Pokémon Explorer** web application using **Angular** and the public **PokéAPI**.

Users should be able to browse Pokémon, search for a specific Pokémon, view its details, and assemble a team of their favorites.

No starter project is provided. You are free to choose your project structure, styling approach, UI libraries, and state-management strategy.

Prioritize a working, well-structured implementation over extra features. If you run out of time, explain what remains unfinished in your README.


## 1. Technical requirements

-   Use a currently supported stable version of Angular and specify the version in your README.
-   Use TypeScript.
-   Fetch Pokémon data from  [PokéAPI](https://pokeapi.co/).
-   No backend or API key is required.
-   The application must run locally using documented commands.
-   You may use any CSS framework (such as Tailwind CSS or Bootstrap) or vanilla SCSS. The layout must be clean and responsive, utilizing clear loading states or skeleton placeholders during API transitions.

**API documentation:**  [https://pokeapi.co/docs/v2](https://pokeapi.co/docs/v2)

Useful endpoints:

```
GET https://pokeapi.co/api/v2/pokemon?limit=20&offset=0
GET https://pokeapi.co/api/v2/pokemon/{name-or-id}
```

The list endpoint returns names and detail URLs, not all the information needed for a card. Decide how to obtain images and other information without unnecessarily fetching the entire dataset.


## 2. Required functionality

### A. Browse Pokémon

Create a browse page that:

-   Displays a paginated list of Pokémon.
-   Shows each Pokémon’s name and image.
-   Provides previous and next page controls.
-   Allows users to open a Pokémon’s detail page.
-   Shows an appropriate loading state while fetching data.

Use  **20 Pokémon per page**. Previous navigation should be disabled on the first page, and next navigation should be disabled when no further page exists.

### B. Search

Allow users to search for a Pokémon by  **exact name or numeric ID**.

Expected behavior:

-   Implement a search input to look up Pokémon by name or ID. Use RxJS operators (`debounceTime(300)`,  `distinctUntilChanged`) to avoid spamming the API.
-   If a user modifies their search while an API request is still pending, the previous request must be safely cancelled.
-   Search works across the API, not just the currently displayed page.
-   Trim whitespace and treat names case-insensitively.
-   Submitting a valid search opens the matching Pokémon’s detail page.
-   A Pokémon that cannot be found produces a clear message.
-   An empty submission does not make an API request.
-   Network failures are distinguishable from “Pokémon not found.”

A submit button or Enter-key submission is sufficient. Autocomplete and partial-name search are  **not required**.

### C. Pokémon details

Create a dedicated detail route, such as:

`/pokemon/132` or `/pokemon/ditto`

Display:

-   Name and ID.
-   Image.
-   Type or types.
-   Height and weight, with readable units.
-   Abilities.
-   Base stats, with labels and values.
-   A control to add or remove the Pokémon from the user’s team.

The detail page must work when its URL is opened directly or refreshed, without first visiting the browse page.

### D. My Team

Allow users to maintain a team of  **up to six unique Pokémon**.

**Note**: Implement team management locally in your application. Use PokéAPI to retrieve Pokémon information and local storage to persist the team. PokéAPI does not manage or save teams.

Required behavior:

-   When adding a Pokémon to the team, the user must fill out a form to give it a "Nickname" and assign it a "Role" (e.g., Attacker, Defender, Support). Nickname is required and must be between 3 and 12 characters.
-   Add a Pokémon from its detail page.
-   Display the team in a dedicated page or clearly accessible section.
-   Show each team member’s name and image.
-   Remove Pokémon from the team.
-   Prevent duplicates.
-   Explain why a Pokémon cannot be added when the team is full.
-   Preserve the team after a browser refresh using local storage.
-   Allow users to open a team member’s detail page.

When a Pokémon is already on the team, the interface should clearly reflect that state.

### E. Loading, empty, and error states

Provide clear feedback for:

-   Loading API data.
-   A search with no matching Pokémon.
-   An empty team.
-   Failed API requests, with a way to retry.
-   Missing images, without breaking the layout.

The application should not display a blank screen or crash when a request fails.


## 3. User experience

The application should:

-   Be usable on mobile and desktop.
-   Have clear navigation between browsing and the team.
-   Use labeled inputs, meaningful image alternatives, and keyboard-accessible controls.
-   Make disabled actions and feedback understandable.

There is  **no prescribed visual design**. A simple, consistent interface is sufficient; elaborate styling and animations are not expected.


## 4. Testing

Include automated tests for  **at least three meaningful behaviors**, including:

1.  Preventing duplicate team members.
2.  Enforcing the six-Pokémon team limit.
3.  One API-related behavior, such as successful detail loading, handling a failed request, or normalizing search input.

Choose the appropriate test level. Automated tests should not depend on the live public API.


## 5. Submission

Submit a Git repository containing your application and a README with:

-   Prerequisites and installation instructions.
-   Commands to run the application and tests.
-   Angular version.
-   A brief explanation of your architecture and state-management choices.
-   Assumptions, trade-offs, and known limitations.
-   Approximate time spent.
-   What you would improve with more time.
-   Whether you used AI tools and how they assisted you.

Include the dependency lockfile. Do not include credentials or generated dependency folders.

A deployed demo is welcome but  **not required**.

### Use of AI tools

AI assistance is allowed. Briefly disclose how you used it in your README. You remain responsible for the submitted code and should be able to explain its behavior and design decisions.

### Review process

We will review your submission independently by running or accessing the application, inspecting the source code, and reviewing the tests and documentation.

**No presentation, live demonstration, or code walkthrough is required.**  Ensure your submission contains everything needed to evaluate it without additional explanation.

If the public API becomes unavailable, document the issue and any temporary workaround. Provider outages will not count against your submission.


## 6. Evaluation criteria

- Functional correctness and edge cases
- Angular usage, code structure, and TypeScript
- API integration and state management
- Meaningful automated tests
- Usability, accessibility, and documentation


We value appropriate, understandable solutions over unnecessary complexity. No particular state-management library is required.

**Optional features do not compensate for missing core requirements.**


## 7. Optional extensions (Bonus!)

Only attempt these if the core requirements are complete and time permits:

-   Cache previously loaded Pokémon details.
-   Preserve the browse page number in the URL.
-   Allow users to reorder their team.
-   Compare the base stats of two Pokémon.

These extensions are not required for a strong submission.


## 8. Questions & Clarifications

If you have any questions or need clarification about the challenge, please contact us. We’re happy to help. Good luck!
