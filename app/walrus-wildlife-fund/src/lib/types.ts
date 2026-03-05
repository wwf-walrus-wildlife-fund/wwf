// ============================================================
// On-chain file manifest (stored as JSON string in Dataset.file_manifest)
// ============================================================

export interface ManifestFileEntry {
  name: string;
  size: number;
  mimeType: string;
  /** Index into blob_ids for "blobs" storageType. */
  blobIndex: number;
  /** Safe identifier used as the quilt form field name (only for "quilt" storageType). */
  quiltIdentifier?: string;
  /** Walrus quilt patch ID (only for "quilt" storageType). */
  quiltPatchId?: string;
  /** @deprecated Legacy: byte offset within client-encoded quilt blob. */
  patchOffset?: number;
  /** @deprecated Legacy: byte length within client-encoded quilt blob. */
  patchLength?: number;
}

export interface FileManifest {
  version: number;
  storageType: "blobs" | "quilt";
  files: ManifestFileEntry[];
  /** Sui object IDs of the Walrus blob(s) — needed for deletion. */
  blobObjectIds?: string[];
}

// ============================================================
// UI Dataset model
// ============================================================

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  size: string;
  format: string;
  downloads: number;
  expiresIn: string;
  seller: string;
  verified: boolean;
  imageUrl?: string;
  projectUrl?: string;
  blob_ids?: string[];
  /** Sui object IDs of the Walrus blob(s) — for deletion. */
  blobObjectIds?: string[];
  /** Parsed file manifest (present on envelope-encrypted datasets). */
  fileManifest?: FileManifest;
  envelopeVersion?: number;
  /**
   * Raw encrypted_key bytes length.
   * 0 (or absent) means legacy Seal-encrypted-blob dataset.
   */
  envelopeKeyLength?: number;
}

/** Decrypted file returned to the UI. */
export interface DecryptedFile {
  name: string;
  mimeType: string;
  data: Blob;
}

export interface Stat {
  label: string;
  value: string;
}

export interface UploadPayload {
  files: File[];
  name: string;
  description: string;
  category: string;
  price: string;
  storageDays: number;
}
