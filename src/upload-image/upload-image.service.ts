import { Injectable } from '@nestjs/common';
import {v2 as cloud} from 'cloudinary'
import {CloudinaryResponse} from './upload-image.response';
import streamifier from 'streamifier'

@Injectable()
export class UploadImageService {
  uploadFile(file : Express.Multer.File): Promise<CloudinaryResponse>{
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloud.uploader.upload_stream(
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
        )
      streamifier.createReadStream(file.buffer).pipe(uploadStream)
    })
  }
}
