import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentKind } from '@svcm/db';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('presign')
  async presign(
    @Body()
    body: {
      filename: string;
      mimeType: string;
      kind?: AttachmentKind;
      uploadedBy?: string;
    }
  ) {
    if (!body.filename || !body.mimeType) {
      throw new BadRequestException('filename and mimeType are required');
    }
    return this.attachmentsService.presign(body);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string) {
    return this.attachmentsService.complete(id);
  }

  @Get(':id/url')
  async getUrl(@Param('id') id: string) {
    return this.attachmentsService.getUrl(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('kind') kind?: AttachmentKind,
    @Body('uploadedBy') uploadedBy?: string
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.attachmentsService.uploadDirect(file, kind, uploadedBy);
  }
}
