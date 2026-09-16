import {
  Injectable,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageProvider,
  PresignUploadResult,
} from '../interfaces/storage.interface';

@Injectable()
export class MinioStorageProvider implements IStorageProvider, OnModuleInit {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private s3Client: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint =
      this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const region =
      this.configService.get<string>('S3_REGION') || 'us-east-1';
    const accessKeyId =
      this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin';
    const secretAccessKey =
      this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin';
    this.bucket =
      this.configService.get<string>('S3_BUCKET') || 'svcm-attachments';

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucketExists();
    } catch (err: any) {
      this.logger.warn(
        `Could not initialize S3/MinIO bucket "${this.bucket}": ${err.message}. Storage operations will fallback or retry when available.`
      );
    }
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (headErr: any) {
      if (headErr.name === 'NotFound' || headErr.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Bucket "${this.bucket}" does not exist. Creating...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucket })
        );
        this.logger.log(`Bucket "${this.bucket}" successfully created.`);
      } else {
        throw headErr;
      }
    }
  }

  async presignUpload(
    storageKey: string,
    mimeType: string,
    expiresInSeconds: number = 3600
  ): Promise<PresignUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      storageKey,
      expiresInSeconds,
    };
  }

  async getSignedUrl(
    storageKey: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async uploadBuffer(
    storageKey: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ storageKey: string; location: string }> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const endpoint =
      this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const location = `${endpoint}/${this.bucket}/${storageKey}`;

    return { storageKey, location };
  }

  async deleteFile(storageKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      })
    );
  }
}
