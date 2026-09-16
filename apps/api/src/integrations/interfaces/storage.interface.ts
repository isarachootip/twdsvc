export interface PresignUploadResult {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface IStorageProvider {
  presignUpload(
    storageKey: string,
    mimeType: string,
    expiresInSeconds?: number
  ): Promise<PresignUploadResult>;

  getSignedUrl(
    storageKey: string,
    expiresInSeconds?: number
  ): Promise<string>;

  uploadBuffer(
    storageKey: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ storageKey: string; location: string }>;

  deleteFile(storageKey: string): Promise<void>;
}
