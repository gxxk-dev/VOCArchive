# Project Overview

This project is a VOCALOID song archiving application built with Cloudflare Workers and a D1 database. It provides a RESTful API for managing and retrieving song information, as well as a simple web-based player. The backend is written in TypeScript and uses the Hono framework for routing.

## Building and Running

### Prerequisites

*   A Cloudflare account
*   Node.js and npm installed
*   `wrangler` CLI tool installed (`npm install -g wrangler`)

### Development

To run the project in a local development environment, use the following command:

```bash
npm run dev
```

This will start a local server that emulates the Cloudflare Workers environment.

### Deployment

To deploy the project to Cloudflare Workers, use the following command:

```bash
npm run deploy
```

## Development Conventions

*   **Framework:** The project uses the Hono web framework for building the API.
*   **Database:** The database schema is defined in `src/app/database.ts`. All database interactions are handled through this file.
*   **Routing:** API routes are defined in `src/app/index.ts` and organized into separate files in the `src/app/routes` directory.
*   **Authentication:** The API uses JWT for authentication, with TOTP for logging in.
*   **API Documentation:** The API endpoints are documented in `apilist.md`.
