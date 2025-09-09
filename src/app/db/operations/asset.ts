import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { asset, assetCreator, creator } from '../schema';
import { convertAssetData } from '../utils';

// Types matching current interfaces
export interface Asset {
  uuid: string;
  file_id: string;
  work_uuid: string;
  asset_type: 'lyrics' | 'picture';
  file_name: string;
  is_previewpic?: boolean;
  language?: string;
}

export interface CreatorWithRole {
  creator_uuid: string;
  creator_name?: string;
  creator_type: 'human' | 'virtual';
  role: string;
}

export interface AssetWithCreators extends Asset {
  creator: CreatorWithRole[];
}

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
  return UUID_PATTERNS.test(uuid);
}

/**
 * Get asset by UUID with creator information
 */
export async function getAssetByUUID(
  db: DrizzleDB, 
  assetUuid: string
): Promise<{ asset: Asset, creator: CreatorWithRole[] } | null> {
  if (!validateUUID(assetUuid)) {
    return null;
  }

  // Get asset
  const assetResult = await db
    .select({
      uuid: asset.uuid,
      file_id: asset.fileId,
      work_uuid: asset.workUuid,
      asset_type: asset.assetType,
      file_name: asset.fileName,
      is_previewpic: asset.isPreviewpic,
      language: asset.language,
    })
    .from(asset)
    .where(eq(asset.uuid, assetUuid))
    .limit(1);

  if (assetResult.length === 0) {
    return null;
  }

  // Get asset creators
  const assetCreators = await db
    .select({
      creator_uuid: creator.uuid,
      creator_name: creator.name,
      creator_type: creator.type,
      role: assetCreator.role,
    })
    .from(assetCreator)
    .innerJoin(creator, eq(assetCreator.creatorUuid, creator.uuid))
    .where(eq(assetCreator.assetUuid, assetUuid));

  return {
    asset: convertAssetData(assetResult[0]),
    creator: assetCreators,
  };
}

/**
 * Get paginated list of assets
 */
export async function listAssets(
  db: DrizzleDB, 
  page: number, 
  pageSize: number
): Promise<Asset[]> {
  if (page < 1 || pageSize < 1) {
    return [];
  }

  const offset = (page - 1) * pageSize;
  
  const assets = await db
    .select({
      uuid: asset.uuid,
      file_id: asset.fileId,
      work_uuid: asset.workUuid,
      asset_type: asset.assetType,
      file_name: asset.fileName,
      is_previewpic: asset.isPreviewpic,
      language: asset.language,
    })
    .from(asset)
    .limit(pageSize)
    .offset(offset);

  return assets.map(convertAssetData);
}

/**
 * Create a new asset with creator relationships
 */
export async function inputAsset(
  db: DrizzleDB,
  assetData: Asset,
  creators?: CreatorWithRole[]
): Promise<void> {
  // For D1 compatibility, execute operations sequentially without transactions
  // Insert asset
  await db.insert(asset).values({
    uuid: assetData.uuid,
    fileId: assetData.file_id,
    workUuid: assetData.work_uuid,
    assetType: assetData.asset_type,
    fileName: assetData.file_name,
    isPreviewpic: assetData.is_previewpic || null,
    language: assetData.language || null,
  });

  // Insert asset creators
  if (creators && creators.length > 0) {
    await db.insert(assetCreator).values(
      creators.map(creator => ({
        assetUuid: assetData.uuid,
        creatorUuid: creator.creator_uuid,
        role: creator.role,
      }))
    );
  }
}

/**
 * Update an existing asset and creator relationships
 */
export async function updateAsset(
  db: DrizzleDB,
  assetUuid: string,
  assetData: Asset,
  creators?: CreatorWithRole[]
): Promise<boolean> {
  if (!validateUUID(assetUuid)) return false;

  try {
    // For D1 compatibility, execute operations sequentially without transactions
    // Update asset
    await db
      .update(asset)
      .set({
        fileId: assetData.file_id,
        workUuid: assetData.work_uuid,
        assetType: assetData.asset_type,
        fileName: assetData.file_name,
        isPreviewpic: assetData.is_previewpic || null,
        language: assetData.language || null,
      })
      .where(eq(asset.uuid, assetUuid));

    // Delete old asset creators
    await db
      .delete(assetCreator)
      .where(eq(assetCreator.assetUuid, assetUuid));

    // Insert new asset creators
    if (creators && creators.length > 0) {
      await db.insert(assetCreator).values(
        creators.map(creator => ({
          assetUuid: assetUuid,
          creatorUuid: creator.creator_uuid,
          role: creator.role,
        }))
      );
    }

    return true;
  } catch (error) {
    console.error('Error updating asset:', error);
    return false;
  }
}

/**
 * Delete an asset and all related data
 */
export async function deleteAsset(db: DrizzleDB, assetUuid: string): Promise<boolean> {
  if (!validateUUID(assetUuid)) return false;

  try {
    // Delete asset (cascade will handle related tables)
    await db.delete(asset).where(eq(asset.uuid, assetUuid));
    
    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  }
}