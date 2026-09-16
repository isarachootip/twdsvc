import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IStorageProvider } from '../interfaces/storage.interface';
import { AttachmentKind } from '@svcm/db';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider
  ) {}

  async presign(params: {
    filename: string;
    mimeType: string;
    kind?: AttachmentKind;
    uploadedBy?: string;
  }) {
    const ext = params.filename.includes('.')
      ? params.filename.split('.').pop()
      : 'jpg';
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const storageKey = `attachments/${Date.now()}_${randomSuffix}.${ext}`;

    const presignResult = await this.storageProvider.presignUpload(
      storageKey,
      params.mimeType,
      3600
    );

    const attachment = await this.prisma.attachment.create({
      data: {
        kind: params.kind || 'INTAKE_PRODUCT',
        storageKey,
        mimeType: params.mimeType,
        uploadedBy: params.uploadedBy,
      },
    });

    return {
      id: attachment.id,
      storageKey,
      uploadUrl: presignResult.uploadUrl,
      expiresInSeconds: presignResult.expiresInSeconds,
    };
  }

  async complete(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  async getUrl(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const url = await this.storageProvider.getSignedUrl(
      attachment.storageKey,
      3600
    );

    return {
      id: attachment.id,
      kind: attachment.kind,
      mimeType: attachment.mimeType,
      url,
    };
  }

  async uploadDirect(
    file: Express.Multer.File,
    kind: AttachmentKind = 'INTAKE_PRODUCT',
    uploadedBy?: string
  ) {
    const ext = file.originalname.includes('.')
      ? file.originalname.split('.').pop()
      : 'jpg';
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const storageKey = `attachments/${Date.now()}_${randomSuffix}.${ext}`;

    await this.storageProvider.uploadBuffer(
      storageKey,
      file.buffer,
      file.mimetype
    );

    const attachment = await this.prisma.attachment.create({
      data: {
        kind,
        storageKey,
        mimeType: file.mimetype,
        uploadedBy,
      },
    });

    const url = await this.storageProvider.getSignedUrl(storageKey, 3600);

    return {
      id: attachment.id,
      storageKey,
      mimeType: file.mimetype,
      url,
    };
  }
}
