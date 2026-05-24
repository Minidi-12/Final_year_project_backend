import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import S3 from "./s3";

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME || "ngo";
const PUBLIC_BASE_URL = process.env.CLOUDFLARE_PUBLIC_DOMAIN || "";

/**
 * Upload a file to Cloudflare R2 and return a publicly accessible URL.
 * @param fileBuffer - The file buffer/data
 * @param fileName   - Original file name (used to preserve extension)
 * @param fileType   - MIME type of the file
 * @returns { fileUrl, file_name } — public URL + sanitised display name
 */
export const uploadFileToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
): Promise<{ fileUrl: string; file_name: string }> => {
  try {
    if (!PUBLIC_BASE_URL) {
      throw new Error(
        "CLOUDFLARE_PUBLIC_DOMAIN is not set. " +
        "Add it to your .env (e.g. https://pub-xxxx.r2.dev or your custom domain).",
      );
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueKey = `${Date.now()}-${safeName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      Body: fileBuffer,
      ContentType: fileType,
    };

    await S3.send(new PutObjectCommand(params));

    const fileUrl = `${PUBLIC_BASE_URL}/${uniqueKey}`;

    return { fileUrl, file_name: safeName };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file");
  }
};

/**
 * Delete a file from Cloudflare R2
 * @param fileUrl - The public URL of the file to delete
 */
export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    const key = fileUrl.replace(`${PUBLIC_BASE_URL}/`, "");

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await S3.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error("Error deleting file from S3:", error);
  }
};

/**
 * Validate file type and size
 * @param file    - Express file object
 * @param maxSize - Max file size in bytes (default 5 MB)
 */
export const validateFile = (
  file: any,
  maxSize: number = 5 * 1024 * 1024,
): boolean => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, and PDF files are allowed",
    );
  }

  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }

  return true;
};