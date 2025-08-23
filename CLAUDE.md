# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VOCArchive is a VOCALOID song archive project built on Cloudflare Workers and D1 database. It provides song information management, TOTP authentication, and player/listing pages for VOCALOID music content.

## Development Commands

### Core Development
- `wrangler dev` - Start development server with Wrangler
- `npm run deploy` - Deploy to Cloudflare with minification and variable preservation
- `npm run cf-typegen` - Generate Cloudflare bindings TypeScript types

### Database Management
- Database initialization is done via SQL execution in Cloudflare dashboard using `initdb.sql`
- Test data can be loaded using `testdata.sql`

## Architecture

### Technology Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js with JSX support
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: JWT with TOTP (Time-based One-Time Password)
- **Static Assets**: Served from external S3-compatible storage

### Project Structure
```
src/app/
├── index.tsx          # Main application and routing
├── database.ts        # Database operations and schema management
├── auth.ts           # Authentication utilities
├── pages/            # SSR page components
│   ├── index.tsx     # Song listing page
│   ├── player.tsx    # Song player page
│   └── footer.tsx    # Footer component
└── routes/           # API route handlers
    ├── auth.ts       # Authentication endpoints
    ├── get.ts        # Data retrieval endpoints
    ├── list.ts       # Data listing endpoints
    ├── search.ts     # Search functionality
    ├── input.ts      # Data creation endpoints
    ├── update.ts     # Data modification endpoints
    ├── delete.ts     # Data deletion endpoints
    └── footer.ts     # Footer management endpoints
```

### Database Schema
The application uses a comprehensive relational schema:
- **Core Tables**: `work`, `creator`, `asset`, `media_source`
- **Relationship Tables**: `work_creator`, `work_relation`, `asset_creator`
- **Metadata Tables**: `work_title` (multi-language), `work_wiki`, `creator_wiki`
- **Configuration**: `footer_settings`, `work_license`

### API Design

#### Core Data Interface
- **Authentication**:
  - `POST /api/auth/login`: User login
  - `POST /api/auth/reset-secrets`: Reset authentication secrets

- **Data Query (Read)**:
  - `GET /api/list/{type}`: Get paginated list of specified type (e.g. `/api/list/works`)
  - `GET /api/get/{type}`: Get single item details by UUID (e.g. `/api/get/work?uuid=...`)
  - `GET /api/search`: Search songs by keyword (matches title field with multi-language support)

- **Data Modification (Write)** - *Requires Authentication*:
  - `POST /api/input/{type}`: Create new item (e.g. `/api/input/work`)
  - `POST /api/update/{type}`: Update existing item (e.g. `/api/update/work`)
  - `POST /api/delete/{type}`: Delete item (e.g. `/api/delete/work`)

#### Management and Testing Interface
- **Database Management** - *Requires Authentication*:
  - `POST /api/input/dbinit` or `GET /api/dbinit`: Initialize database tables
  - `POST /api/delete/dbclear` or `GET /api/dbclear`: Clear user data tables

#### External Assets
- `GET https://assets.vocarchive.com/{file_id}`: Download files from object storage (Demo only)

### Frontend Architecture
- Server-side rendered with Hono JSX
- Main routes: `/` (song listing), `/player` (song player)
- Supports pagination and search functionality
- Responsive design with asset URL configuration

### Environment Configuration
Required environment variables:
- `JWT_SECRET`: JWT signing secret
- `TOTP_SECRET`: TOTP authentication secret
- `ASSET_URL`: S3-compatible storage endpoint URL
- `DB`: D1 database binding (configured in wrangler.toml)

## Code Conventions

### Naming Standards
- **Database/Routes**: snake_case
- **Classes/Objects**: 
  - Callable objects: PascalCase
  - Data/route objects: camelCase
- **Files**: 
  - Route-related: kebab-case (based on route paths)
  - Others: snake_case
- **System concepts**: lowercase singular words

### TypeScript Integration
- Strict TypeScript configuration with ESNext target
- JSX configured for Hono with `jsx: "react-jsx"` and `jsxImportSource: "hono/jsx"`
- Cloudflare Workers types included via `@cloudflare/workers-types`

### Database Operations
- All database operations use prepared statements for security
- UUID validation implemented for all entity operations
- Batch operations used for related data insertions/updates
- Cascade deletes configured via foreign key constraints

### Authentication Flow
- JWT-based session management
- TOTP for initial authentication
- Middleware protection on modification endpoints
- Public access for read operations

## Development Notes

### Local Development
- Uses Wrangler for local development with D1 database binding
- Static assets served from `public/` directory
- Service worker configuration generated dynamically

### Deployment Considerations
- Cloudflare Workers environment with D1 database
- Asset storage requires S3-compatible endpoint
- Environment variables must be configured in Cloudflare dashboard