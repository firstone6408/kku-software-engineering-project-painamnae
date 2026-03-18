import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import ApiError from './ApiError';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
}

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(new ApiError(500, 'Cloudinary upload failed.'));
        }

        resolve({ url: result!.secure_url, public_id: result!.public_id });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = (publicId: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error: unknown, result: unknown) => {
      if (error) {
        console.error('Cloudinary Delete Error:', error);
        return reject(new ApiError(500, 'Cloudinary deletion failed.'));
      }
      resolve(result);
    });
  });
};
