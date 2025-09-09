import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { mediaSource, asset } from '../schema';

// Types matching current interfaces
export interface MediaSource {
  uuid: string;
  work_uuid: string;
  is_music: boolean;
  file_name: string;
  url: string;
  mime_type: string;
  info: string;
}

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
  return UUID_PATTERNS.test(uuid);
}

/**
 * Get media source by UUID
 */
export async function getMediaByUUID(
  db: DrizzleDB, 
  mediaUuid: string
): Promise<MediaSource | null> {
  if (!validateUUID(mediaUuid)) {
    return null;
  }

  const mediaResult = await db
    .select({
      uuid: mediaSource.uuid,
      work_uuid: mediaSource.workUuid,
      is_music: mediaSource.isMusic,
      file_name: mediaSource.fileName,
      url: mediaSource.url,
      mime_type: mediaSource.mimeType,
      info: mediaSource.info,
    })
    .from(mediaSource)
    .where(eq(mediaSource.uuid, mediaUuid))
    .limit(1);

  return mediaResult[0] || null;
}

/**
 * Get paginated list of media sources
 */
export async function listMedia(
  db: DrizzleDB, 
  page: number, 
  pageSize: number
): Promise<MediaSource[]> {
  if (page < 1 || pageSize < 1) {
    return [];
  }

  const offset = (page - 1) * pageSize;
  
  const mediaList = await db
    .select({
      uuid: mediaSource.uuid,
      work_uuid: mediaSource.workUuid,
      is_music: mediaSource.isMusic,
      file_name: mediaSource.fileName,
      url: mediaSource.url,
      mime_type: mediaSource.mimeType,
      info: mediaSource.info,
    })
    .from(mediaSource)
    .limit(pageSize)
    .offset(offset);

  return mediaList;
}

/**
 * Create a new media source
 */
export async function inputMedia(
  db: DrizzleDB,
  mediaData: MediaSource
): Promise<void> {
  await db.insert(mediaSource).values({
    uuid: mediaData.uuid,
    workUuid: mediaData.work_uuid,
    isMusic: mediaData.is_music,
    fileName: mediaData.file_name,
    url: mediaData.url,
    mimeType: mediaData.mime_type,
    info: mediaData.info,
  });
}

/**
 * Update an existing media source
 */
export async function updateMedia(
  db: DrizzleDB,
  mediaUuid: string,
  mediaData: MediaSource
): Promise<boolean> {
  if (!validateUUID(mediaUuid)) return false;

  try {
    await db
      .update(mediaSource)
      .set({
        workUuid: mediaData.work_uuid,
        isMusic: mediaData.is_music,
        fileName: mediaData.file_name,
        url: mediaData.url,
        mimeType: mediaData.mime_type,
        info: mediaData.info,
      })
      .where(eq(mediaSource.uuid, mediaUuid));

    return true;
  } catch (error) {
    console.error('Error updating media:', error);
    return false;
  }
}

/**
 * Delete a media source
 */
export async function deleteMedia(db: DrizzleDB, mediaUuid: string): Promise<boolean> {
  if (!validateUUID(mediaUuid)) return false;

  try {
    const result = await db
      .delete(mediaSource)
      .where(eq(mediaSource.uuid, mediaUuid));

    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
}

/**
 * Get file URL by UUID (supports both media_source and asset)
 */
export async function getFileURLByUUID(
  db: DrizzleDB, 
  fileUuid: string, 
  assetUrl: string
): Promise<string | null> {
  if (!validateUUID(fileUuid)) {
    return null;
  }

  // First check media_source table
  const mediaResult = await db
    .select({ url: mediaSource.url })
    .from(mediaSource)
    .where(eq(mediaSource.uuid, fileUuid))
    .limit(1);

  if (mediaResult.length > 0) {
    return mediaResult[0].url;
  }

  // Then check asset table
  const assetResult = await db
    .select({ file_id: asset.fileId })
    .from(asset)
    .where(eq(asset.uuid, fileUuid))
    .limit(1);

  if (assetResult.length > 0) {
    return `${assetUrl}/${assetResult[0].file_id}`;
  }

  return null;
}