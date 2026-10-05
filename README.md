# TI Web

Web frontend for **TI (Troy Intelligence)** — a self-hosted personal AI for asking questions about uploaded PDF documents.

This app talks to the [`ti`](https://github.com/troyblank/ti) API. See [`PLAN.md`](https://github.com/troyblank/ti/blob/main/PLAN.md) in that repository for the roadmap.

## Global Requirements

* nvm
* A running `ti` API (see the `ti` README)

## Setup

1. run `nvm use`
2. run `yarn install`
3. copy `.env.example` to `.env` and set the variables below
4. run `yarn start`

Open `http://localhost:5173`. The page shows the result of calling the API's `/health` endpoint.

The `ti` API must allow this app's origin via its `CORS_ORIGIN` variable (e.g. `CORS_ORIGIN=http://localhost:5173`).

## Environment variables

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `VITE_TI_API_URL` | For `yarn build` | `http://localhost:3000` (dev server only) | Base URL of the `ti` API, without a trailing slash. Baked into the bundle at build time; `yarn build` fails if it is not set. |

## Commands

| Command         | Result                                             |
| --------------- | -------------------------------------------------- |
| yarn start      | Runs the Vite dev server.                          |
| yarn build      | Type-checks and builds a production bundle to `dist/`. |
| yarn preview    | Serves the production bundle locally.              |
| yarn lint       | Checks repo for any lint or tsc issues.            |
| yarn test       | Runs unit tests with coverage (100% threshold).    |
| yarn test:watch | Runs unit tests in watch mode.                     |

## Project structure

```text
src/
  main.tsx              # entrypoint
  App.tsx               # top-level layout
  config.ts             # reads VITE_* env
  api/
    health.ts           # fetchHealth() → GET {TI_API_URL}/health
  components/
    HealthStatus/       # displays the API health result
```
