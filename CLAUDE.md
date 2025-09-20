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
- **External Storage System**: `external_source`, `external_object`, `asset_external_object`, `media_source_external_object` (multi-storage source support)

#### Post-Migration Schema Changes
After external storage migration completion:
- **asset.file_id**: Now nullable and redundant (migrated to external_object references)
- **media_source.url**: Now nullable and redundant (migrated to external_object references)
- All file access exclusively uses the external storage architecture via association tables
- Legacy fields maintained for backward compatibility but set to NULL post-migration

#### External Storage Architecture
The application supports a flexible multi-storage source architecture:

- **external_source**: Defines storage configurations (raw_url, ipfs)
  - `uuid`: Unique identifier
  - `type`: Storage type ('raw_url' for direct URLs, 'ipfs' for IPFS distributed storage)
  - `name`: Human-readable name
  - `endpoint`: URL template with {ID} placeholder

- **external_object**: Maps files to storage sources
  - `uuid`: Unique identifier (can be used directly for file access)
  - `external_source_uuid`: Reference to storage source
  - `mime_type`: File MIME type
  - `file_id`: File identifier in the storage system

- **asset_external_object**: Many-to-many relationship between assets and external objects
- **media_source_external_object**: Many-to-many relationship between media sources and external objects

This architecture allows:
- Multiple storage backends per application
- Migration between storage systems
- Unified file access through `/api/get/file/{uuid}` endpoint
- Flexible external storage management without environment variable dependencies

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

#### External Storage Management - *Requires Authentication*
- **Storage Source Management**:
    - `POST /api/input/external_source`: Create new storage source
      - Body: `{ uuid, type: 'raw_url'|'ipfs', name, endpoint }`
      - Example endpoint templates:
        - `https://assets.example.com/{ID}` (raw_url)
        - `https://ipfs.io/ipfs/{ID}` (ipfs)
    - `POST /api/update/external_source`: Update storage source
    - `POST /api/delete/external_source`: Delete storage source
    - `GET /api/get/external_source/{uuid}`: Get storage source details

- **External Object Management**:
    - `POST /api/input/external_object`: Create new external object
      - Body: `{ uuid, external_source_uuid, mime_type, file_id }`
    - `POST /api/update/external_object`: Update external object
    - `POST /api/delete/external_object`: Delete external object
    - `GET /api/get/external_object/{uuid}`: Get external object details

#### Data Migration - *Requires Authentication* (Legacy)
- **Migration Operations**:
    - `POST /api/migrate/external-storage`: Execute migration from legacy asset storage to external storage
      - Body: `{ asset_url: string, batch_size?: number }`
      - Creates default storage source based on provided asset URL
      - Migrates all existing assets and media sources to external objects
      - Returns detailed migration status and results
    - `GET /api/migrate/status`: Get current migration status
      - Returns progress information and completion status
    - `POST /api/migrate/validate`: Validate migration integrity
      - Checks for missing associations, orphaned objects, and data consistency
      - Returns validation report with any issues found

#### Management and Testing Interface
- **Database Management** - *Requires Authentication*:
    - `POST /api/input/dbinit` or `GET /api/dbinit`: Initialize database tables
    - `POST /api/delete/dbclear` or `GET /api/dbclear`: Clear user data tables

#### File Access
- `GET /api/get/file/{uuid}`: Redirect to download URL for external objects
    - **Current Behavior**: Returns 302 redirect to actual file download URL using external storage architecture
    - **UUID Requirements**: Must be an asset UUID, media_source UUID, or external_object UUID
    - **Asset/Media UUIDs**: Automatically resolves to associated external objects via junction tables
    - **External Object UUIDs**: Direct access to external storage via storage source endpoint
    - Returns 404 if UUID not found or no external object associations exist
    - **Migration Status**: All assets and media sources have been migrated to external storage

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
- File storage handled through external storage architecture
- Environment variables must be configured in Cloudflare dashboard

## External Storage Migration Guide

### Overview
The external storage system provides a flexible architecture for supporting multiple storage backends. The migration functionality helps transition from legacy file storage approaches to the modern external storage architecture.

### Migration Process

#### Prerequisites
1. **Backup Database**: Always backup your D1 database before migration
2. **Asset URL**: Determine the asset URL that was previously used for file access
3. **Authentication**: Migration endpoints require authentication via JWT

#### Step-by-Step Migration

1. **Prepare Migration**
   ```bash
   # Check current migration status
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        https://your-app.workers.dev/api/migrate/status
   ```

2. **Execute Migration**
   ```bash
   # Start migration with your asset URL
   curl -X POST \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"asset_url": "https://assets.vocarchive.com", "batch_size": 50}' \
        https://your-app.workers.dev/api/migrate/external-storage
   ```

3. **Monitor Progress**
   ```bash
   # Check migration status
   curl -H "Authorization: Bearer $JWT_TOKEN" \
        https://your-app.workers.dev/api/migrate/status
   ```

4. **Validate Migration**
   ```bash
   # Validate migration integrity
   curl -X POST \
        -H "Authorization: Bearer $JWT_TOKEN" \
        https://your-app.workers.dev/api/migrate/validate
   ```

#### Migration Details

**What the migration does:**
- Creates a "Default Asset Storage" external source based on your provided asset URL
- For each `asset`: Creates an `external_object` with the asset's `file_id`
- For each `media_source`: Creates an `external_object` with the media's `url` as `file_id`
- Establishes associations via `asset_external_object` and `media_source_external_object` tables
- Processes data in configurable batches (default: 50) with transaction support

**Migration Compatibility:**
- File access via `/api/get/file/{uuid}` continues to work for migrated files
- The system uses external storage architecture exclusively
- Unmigrated files will return 404 with guidance on migration needs

#### Post-Migration

**Verification Steps:**
1. Test file access for both assets and media sources
2. Verify external objects are properly created
3. Check that no files are inaccessible
4. Monitor application logs for any errors

**Rollback (if needed):**
- Migration is additive - original `asset` and `media_source` tables remain unchanged
- To rollback: Delete records from `external_object`, `asset_external_object`, and `media_source_external_object` tables
- Note: After rollback, unmigrated assets will not be accessible until a new migration is performed or external objects are manually created

### Storage Source Configuration

#### Supported Storage Types

**Raw URL (`raw_url`)**
- Direct URL access to files
- Endpoint template: `https://your-domain.com/{ID}`
- Best for: CDNs, direct HTTP access

**IPFS (`ipfs`)**
- IPFS gateway access to distributed storage
- Endpoint template: `https://ipfs.io/ipfs/{ID}` or `https://gateway.pinata.cloud/ipfs/{ID}`
- Uses Content Identifier (CID) for file addressing
- Best for: Decentralized content distribution, permanent storage
- Supports custom IPFS gateways and self-hosted nodes


#### Adding New Storage Sources

```bash
# Add a new storage source
curl -X POST \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "uuid": "new-storage-uuid",
       "type": "raw_url",
       "name": "CDN Storage",
       "endpoint": "https://cdn.example.com/{ID}"
     }' \
     https://your-app.workers.dev/api/input/external_source

# Add an IPFS storage source
curl -X POST \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "uuid": "ipfs-storage-uuid",
       "type": "ipfs",
       "name": "IPFS Gateway",
       "endpoint": "https://ipfs.io/ipfs/{ID}"
     }' \
     https://your-app.workers.dev/api/input/external_source
```

### Troubleshooting

**Common Issues:**

1. **Migration fails with "asset_url is required"**
   - Ensure the request body includes a valid `asset_url` field

2. **File access returns 404 after migration**
   - Check that external objects were created correctly
   - Verify storage source endpoint template is correct
   - Test file access manually using the constructed URL

3. **Migration appears stuck**
   - Check migration status endpoint for progress information
   - Large datasets may take time - monitor via status endpoint
   - Check application logs for any batch processing errors

4. **Validation reports issues**
   - Review validation errors in the response
   - Common issues: orphaned external objects, missing source references
   - Re-run migration if necessary to fix incomplete data

**Performance Considerations:**
- Batch size can be adjusted based on database performance
- Larger batches = faster migration but higher memory usage
- Smaller batches = slower migration but more stable
- Default batch size of 50 is recommended for most installations

## Post-Migration Cleanup and Optimization

### Migration Completion Status
The external storage migration has been **fully completed** with the following optimizations:

#### Database Schema Cleanup
1. **Redundant Field Removal**: 
   - `asset.file_id` and `media_source.url` fields set to NULL
   - Fields remain in schema as nullable for backward compatibility
   - All file access exclusively uses external storage architecture

2. **Association Table Population**:
   - All assets linked to external objects via `asset_external_object` (7 associations)
   - All media sources linked to external objects via `media_source_external_object` (9 associations)
   - Handles URL-encoded file names (e.g., "BUTCHER VANITY ft. Yi Xi.flac" → "BUTCHER+VANITY+ft.+Yi+Xi.flac")

#### API Response Optimization
- **Asset API**: No longer returns `file_id` field
- **Media API**: No longer returns `url` field  
- **External Objects**: Included in asset/media responses for file access information
- **File Access**: 100% success rate via `/api/get/file/{uuid}` endpoint

#### Admin Interface Updates
- **Asset Table**: Removed "文件ID" column display
- **Media Table**: Removed "URL" column display
- **External Objects**: Properly displayed and selectable in edit forms
- **Form Handling**: Removed redundant file_id/url input fields

### Troubleshooting Migration Issues

#### Common Post-Migration Problems

1. **404 File Access Errors**
   ```
   Error: "Asset found but not migrated and no ASSET_URL available"
   ```
   **Solution**: Missing asset-external object associations
   ```sql
   -- Check unmigrated assets
   SELECT a.uuid, a.file_name 
   FROM asset a 
   LEFT JOIN asset_external_object aeo ON a.uuid = aeo.asset_uuid 
   WHERE aeo.external_object_uuid IS NULL;
   
   -- Create missing associations by file name matching
   INSERT INTO asset_external_object (asset_uuid, external_object_uuid)
   SELECT DISTINCT a.uuid, eo.uuid
   FROM asset a
   JOIN external_object eo ON a.file_name = eo.file_id
   WHERE NOT EXISTS (
       SELECT 1 FROM asset_external_object aeo 
       WHERE aeo.asset_uuid = a.uuid AND aeo.external_object_uuid = eo.uuid
   );
   ```

2. **URL-Encoded File Name Mismatches**
   **Problem**: Media files with spaces/special characters
   ```sql
   -- Manual association for URL-encoded files
   INSERT INTO media_source_external_object (media_source_uuid, external_object_uuid)
   SELECT m.uuid, eo.uuid
   FROM media_source m, external_object eo
   WHERE m.file_name = 'BUTCHER VANITY ft. Yi Xi.flac' 
     AND eo.file_id = 'BUTCHER+VANITY+ft.+Yi+Xi.flac';
   ```

#### Verification Commands
```sql
-- Check migration completeness
SELECT COUNT(*) as unmigrated_assets
FROM asset a 
LEFT JOIN asset_external_object aeo ON a.uuid = aeo.asset_uuid 
WHERE aeo.external_object_uuid IS NULL;

SELECT COUNT(*) as unmigrated_media
FROM media_source m 
LEFT JOIN media_source_external_object meo ON m.uuid = meo.media_source_uuid 
WHERE meo.external_object_uuid IS NULL;

-- Should both return 0 for complete migration
```
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## External Storage Migration Status
**MIGRATION COMPLETED**: The external storage architecture is fully implemented and operational.
- All assets and media sources have been migrated to external storage
- Redundant database fields (file_id, url) have been cleaned up
- API responses optimized to exclude legacy fields
- Admin interface updated to use external storage exclusively
- File access via `/api/get/file/{uuid}` working at 100% success rate

**Important**: Any file-related operations should use the external storage architecture exclusively. Do not attempt to access legacy file_id or url fields as they are now NULL.