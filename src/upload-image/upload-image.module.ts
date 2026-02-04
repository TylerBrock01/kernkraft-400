import { Module } from '@nestjs/common';
import { UploadImageService } from './upload-image.service';
import { UploadImage } from './upload-image';

@Module({
  providers: [UploadImageService, UploadImage]
})
export class UploadImageModule {}
