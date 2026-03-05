// ============================================================
// On-chain file manifest (stored as JSON string in Dataset.file_manifest)
// ============================================================

export interface ManifestFileEntry {
  name: string;
  size: number;
  mimeType: string;
  /** Index into blob_ids for "blobs" storageType. */
  blobIndex: number;
  /** Byte offset within quilt blob (only for "quilt" storageType). */
  patchOffset?: number;
  /** Byte length within quilt blob (only for "quilt" storageType). */
  patchLength?: number;
}

export interface FileManifest {
  version: number;
  storageType: "blobs" | "quilt";
  files: ManifestFileEntry[];
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
