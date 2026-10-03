<div align="center">

# Telegram Mini App Starter

### A production-minded Mini App shell with verified sessions and group-safe bot commands.

![Telegram](https://img.shields.io/badge/Telegram-Mini_App-229ED9) ![Frontend](https://img.shields.io/badge/UI-mobile_first-17B85A) ![Security](https://img.shields.io/badge/initData-server_verified-111827) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)

[![CI](https://github.com/0xENTYPER/telegram-miniapp-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/0xENTYPER/telegram-miniapp-starter/actions/workflows/ci.yml)

</div>

This starter demonstrates the full interaction boundary around a Telegram product: a native-feeling mobile interface, Telegram theme and viewport integration, backend `initData` verification, and commands that continue to work when the bot is added to a group.

The included **Creator Desk** is a real browser-runnable interface, not a static mockup. It works in Telegram and provides a preview mode during local development.

<p align="center">
  <img src="docs/miniapp-preview.png" width="390" alt="Creator Desk Mini App running from the repository" />
</p>

<p align="center"><sub>Real local Vite build rendered in Chromium. No design mock or fabricated chat screenshot.</sub></p>

## At a glance

| Layer | Included | Design intent |
| --- | --- | --- |
| Mini App UI | Three working views and responsive navigation | The first screen is the product, not a landing page |
| Telegram bridge | Theme, viewport, lifecycle, haptics | Feels native without coupling every component to Telegram |
| Session boundary | Server-side `initData` HMAC and age checks | Client profile data never becomes authorization |
| Bot router | Private/group copy and `@botname` parsing | One command system behaves correctly in both contexts |
| Admin policy | Server-side allowlist check | A visible command is not assumed to be permitted |
| Browser mode | Safe local fallback | Frontend work remains fast outside Telegram |

## Included

- responsive Mini App UI with Home, Activity, and Profile views;
- Telegram color variables, stable viewport height, and safe-area insets;
- `ready()`, `expand()`, theme events, viewport events, and haptic feedback;
- server-side HMAC verification for raw `initData`;
- timestamp checks against replayed sessions;
- direct and `@botname` command parsing;
- private/group-aware responses;
- server-side authorization for an admin command;
- tests and a production build workflow.

## Architecture

```mermaid
flowchart LR
    T[Telegram client] -->|initData| M[Mini App]
    M -->|raw initData| A[Application API]
    A --> V[HMAC and age validation]
    V --> S[Authenticated session]
    T -->|Bot API update| B[Command router]
    B --> P{Private or group}
    P --> C[Authorized command]
    C --> M
```

## Mini App lifecycle

[`src/telegram.ts`](src/telegram.ts) keeps the Telegram bridge small. The app signals readiness only after JavaScript has loaded, expands when appropriate, listens for theme and viewport changes, and leaves a browser fallback for normal frontend work.

The layout uses:

```css
min-height: var(--tg-viewport-stable-height, 100vh);
padding-top: max(18px, env(safe-area-inset-top));
```

This avoids bottom controls jumping with Telegram's animated viewport and prevents fullscreen UI from colliding with device cutouts.

```mermaid
flowchart LR
    B[Bundle loaded] --> T{Telegram bridge present?}
    T -->|yes| R[ready + expand]
    T -->|no| P[Browser preview mode]
    R --> H[Apply theme variables]
    R --> V[Track stable viewport]
    H --> U[Render product UI]
    V --> U
    P --> U
    U --> A[Home / Activity / Profile]
```

The bridge in [`src/telegram.ts`](src/telegram.ts) is an adapter rather than a global dependency. UI code can request haptics or read context without scattering Telegram existence checks across components.

## Authentication boundary

`initDataUnsafe` helps render a fast greeting, but it is not authorization. The client sends the untouched `Telegram.WebApp.initData` string to the server. [`server/validate-init-data.ts`](server/validate-init-data.ts) then:

1. extracts the supplied hash;
2. sorts the remaining fields into Telegram's data-check string;
3. derives the secret from the bot token and `WebAppData`;
4. verifies HMAC-SHA-256 without an early-exit comparison;
5. rejects old or implausibly future `auth_date` values;
6. parses user data only after integrity succeeds.

Never ship the bot token in frontend code.

```mermaid
sequenceDiagram
    participant T as Telegram client
    participant M as Mini App
    participant API as Application API
    participant S as Session store

    T->>M: Signed initData
    M->>API: Untouched initData string
    API->>API: Verify HMAC + auth_date
    alt Valid and recent
        API->>S: Create application session
        API-->>M: Authenticated response
    else Modified or expired
        API-->>M: 401
    end
```

## Commands in chats

[`bot/commands.ts`](bot/commands.ts) supports both private and group use:

| Command | Behavior |
| --- | --- |
| `/app` | Returns an explicit action to open the Mini App |
| `/status` | Uses private or group-specific copy |
| `/help` | Shows the supported command set |
| `/sync` | Checks server-side admin authorization |

In groups, `/status@creator_bot` is accepted while commands addressed to another bot are ignored. Command scopes improve Telegram's menu, but the backend still validates every received command and its permissions.

Telegram privacy mode can remain enabled for this command-driven design. The bot does not need to read ordinary group conversation.

### Routing rules

| Incoming text | Chat context | Result |
| --- | --- | --- |
| `/app` | Private | Return the Mini App action |
| `/status` | Group | Return group-specific workspace status |
| `/status@creator_bot` | Group | Handle when mention matches this bot |
| `/status@another_bot` | Group | Ignore safely |
| `/sync` | Any | Check user ID against server policy |
| Normal message | Group with privacy mode | Not required by this architecture |

Command scopes are a discoverability layer. [`bot/commands.ts`](bot/commands.ts) remains the enforcement layer and returns structured responses that a Bot API adapter can turn into text and buttons.

## UI rationale

- The first viewport is the working product, not a landing page.
- The layout stays narrow and thumb-friendly in Telegram but remains usable in a browser.
- Theme colors come from Telegram, while spacing and hierarchy remain product-owned.
- Three stable bottom destinations match repeated use without crowding the screen.
- The primary action is contextual and singular.
- Status uses text plus color, never color alone.
- Motion respects `prefers-reduced-motion`.
- Cards are limited to the summary; list content remains easy to scan.

### Interface anatomy

| Region | Job | Why it stays simple |
| --- | --- | --- |
| Identity header | Establish workspace and refresh context | No promotional hero inside a task surface |
| Today panel | Present one decisive next action | Avoids competing primary buttons |
| Progress strip | Make readiness glanceable | Three stable metrics fit one thumb-width row |
| Workspace list | Expose state and recency | Rows scan faster than nested cards |
| Bottom navigation | Move between repeated workflows | Three destinations stay predictable |

The interface uses text and color together, stable control dimensions, safe-area padding, and restrained motion. It is intentionally quiet enough for daily operational use.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open the local URL in a browser for preview mode. For Telegram testing, expose an HTTPS URL, configure the Mini App in BotFather, and open it through the bot.

Production build:

```bash
npm run build
npm run preview
```

## Bot setup checklist

1. Create a bot in BotFather and configure its Mini App URL.
2. Store the bot token only in the server secret manager.
3. Register private and group command scopes with `setMyCommands`.
4. Keep privacy mode enabled unless the product truly requires ordinary messages.
5. Verify commands and admin status server-side regardless of the visible menu.
6. Use HTTPS and a strict Content Security Policy in production.
7. Rate-limit session exchange and command handlers.
8. Log update IDs for idempotent Bot API processing.

## Verification

The test suite covers valid, modified, expired, and future Mini App sessions; direct and mentioned commands; cross-bot command isolation; admin authorization; and Mini App action responses. CI also creates the real Vite production bundle.

## Repository map

| Path | Responsibility |
| --- | --- |
| [`src/main.ts`](src/main.ts) | Product views, navigation, and interaction state |
| [`src/styles.css`](src/styles.css) | Mobile layout, Telegram variables, safe areas, reduced motion |
| [`src/telegram.ts`](src/telegram.ts) | Small client bridge and browser fallback |
| [`server/validate-init-data.ts`](server/validate-init-data.ts) | Integrity, timestamp, and user parsing boundary |
| [`bot/commands.ts`](bot/commands.ts) | Mention-aware command routing and authorization |
| [`test/security.test.ts`](test/security.test.ts) | Session and chat-command threat cases |

## What this case study demonstrates

- building a Telegram-native product surface that remains browser-developable;
- separating untrusted presentation data from authenticated application sessions;
- handling private chats, groups, mentions, and admin actions in one router;
- designing mobile operational UI around safe areas and unstable viewport height;
- keeping a showcase runnable without publishing tokens or private product logic.

## References

- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Telegram bot features and privacy mode](https://core.telegram.org/bots/features)
- [Telegram Bot API commands](https://core.telegram.org/bots/api#setmycommands)

## Scope

This starter intentionally omits a live bot token, hosted backend, database, analytics identifiers, and production product logic. Example names and activity are local demo data.

## Author

Built by [0xENTYPER](https://github.com/0xENTYPER).
