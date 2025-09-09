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
│   ├── footer.tsx    # Footer component
│   └── components/   # Reusable UI components
│       ├── work-list.tsx      # Work list display component
│       ├── pagination.tsx     # Pagination controls
│       ├── floating-search.tsx # Search interface
│       └── language-selector.tsx # Language selection dropdown
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
- **Taxonomy System**: `tag`, `category`, `work_tag`, `work_category` (for work classification and tagging)

### API Design

#### Core Data Interface
- **Authentication**:
    - `POST /api/auth/login`: User login
    - `POST /api/auth/reset-secrets`: Reset authentication secrets

- **Data Query (Read)**:
    - `GET /api/list/{type}`: Get paginated list of specified type (e.g. `/api/list/works`)
    - `GET /api/get/{type}/{uuid}`: Get single item details by UUID (e.g. `/api/get/work/{uuid}`)
    - `GET /api/get/file/{uuid}`: Get file redirect to download URL for media_source/asset UUID (returns 302 redirect)
    - `GET /api/search/{query}`: Search songs by keyword (matches title field with multi-language support)
    - `GET /api/list/tags`: Get all tags
    - `GET /api/list/categories`: Get category tree structure
    - `GET /api/list/works-by-tag/{tag_uuid}/{page}/{size?}`: Get works by tag with pagination
    - `GET /api/list/works-by-category/{category_uuid}/{page}/{size?}`: Get works by category with pagination

- **Data Modification (Write)** - *Requires Authentication*:
    - `POST /api/input/{type}`: Create new item (e.g. `/api/input/work`, `/api/input/tag`, `/api/input/category`)
    - `POST /api/update/{type}`: Update existing item (e.g. `/api/update/work`, `/api/update/tag`, `/api/update/category`)
    - `POST /api/delete/{type}`: Delete item (e.g. `/api/delete/work`, `/api/delete/tag`, `/api/delete/category`)
    - `POST /api/input/work-tags`: Batch add tags to work
    - `POST /api/input/work-categories`: Batch add categories to work
    - `POST /api/delete/work-tags`: Batch remove tags from work  
    - `POST /api/delete/work-categories`: Batch remove categories from work

#### Management and Testing Interface
- **Database Management** - *Requires Authentication*:
    - `POST /api/input/dbinit` or `GET /api/dbinit`: Initialize database tables
    - `POST /api/delete/dbclear` or `GET /api/dbclear`: Clear user data tables

#### File Access
- `GET /api/get/file/{uuid}`: Redirect to download URL for media_source or asset UUID
    - Returns 302 redirect to actual file download URL
    - Works with both media_source UUIDs (direct URL) and asset UUIDs (constructed from ASSET_URL + file_id)
    - Returns 404 if UUID not found, 500 if ASSET_URL not configured

#### External Assets (Legacy)
- `GET https://assets.vocarchive.com/{file_id}`: Download files from object storage (Demo only)

### Frontend Architecture
- Server-side rendered with Hono JSX
- Main routes: `/` (song listing), `/player` (song player)
- Supports pagination and search functionality
- Asset access unified through `/api/get/file/{uuid}` endpoint

#### User Interface Features
- **Multi-language Title Display**: Intelligent title selection based on user preference with automatic fallback
- **Tag/Category Filtering**: Clean interface with inline filter indicators in section headers
- **Language Selection**: Fixed position language selector (bottom-right corner) with dropdown menu
- **Responsive Pagination**: Context-aware pagination that preserves filter and language parameters
- **Search Integration**: Full-text search with type selection (title/creator/all)

#### URL Parameters
- `page`: Pagination (default: 1)
- `search`: Search query string
- `type`: Search type ('title'|'creator'|'all', default: 'all')
- `tag`: Filter by tag UUID
- `category`: Filter by category UUID  
- `lang`: Display language preference ('auto'|'zh-cn'|'zh-tw'|'ja'|'en'|'ko', default: 'auto')

### Tag and Category System
The application includes a comprehensive taxonomy system for organizing works:

#### Features
- **Tags**: Flat structure for flexible labeling (e.g., "rock", "ballad", "duet")
- **Categories**: Hierarchical structure for systematic classification (e.g., "Original Songs" > "Rock" > "Alternative Rock")
- **Multi-assignment**: Each work can have multiple tags and categories
- **Search Integration**: Filter works by tags or categories with pagination support
- **Clean UI**: Simplified main page without tag/category clutter, filter status shown inline with section headers

#### Data Structure
- `tag`: Simple name-based labels
- `category`: Supports parent-child relationships for hierarchical organization  
- `work_tag`: Many-to-many relationship between works and tags
- `work_category`: Many-to-many relationship between works and categories

#### API Integration
- All work queries include associated tags and categories in the response
- Dedicated endpoints for tag/category management and work filtering
- Batch operations for efficient tag/category assignment

### Multi-language Support System
The application provides comprehensive multi-language title support with dynamic language detection:

#### Language Selection Logic
- **Auto Mode**: Prioritizes Chinese (Simplified) → Official title → First available title
- **Specific Language Mode**: Prioritizes selected language → Official title → First available title
- **Dynamic Language Detection**: Only displays languages that actually exist in the database
- **Language Mapping**: Supports common language codes with proper display names

#### Implementation
- Language options dynamically generated from `work_title.language` field
- Language preference stored in URL parameter (`?lang=<code>`)
- Real-time switching with page refresh
- Fallback mechanism ensures titles always display
- Compatible with filtering, searching, and pagination
- Fixed language selector positioned at bottom-right corner
- Unknown language codes display as uppercase (e.g., 'fr' → 'FR')

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