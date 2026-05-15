import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import S3 from "./s3";

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME || "gn-officer-proofs";
const S3_BASE_URL = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/**
 * Upload a file to S3 (Cloudflare R2)
 * @param fileBuffer - The file buffer/data
 * @param fileName - Original file name
 * @param fileType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export const uploadFileToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const uniqueFileName = `gn-officer-proofs/${timestamp}-${fileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: fileType,
    };

    await S3.send(new PutObjectCommand(params));

    return `${S3_BASE_URL}/${BUCKET_NAME}/${uniqueFileName}`;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file");
  }
};

/**
 * Delete a file from S3
 * @param fileUrl - The URL of the file to delete
 */
export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    const urlParts = fileUrl.split("/");
    const key = urlParts.slice(-2).join("/");

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
 * @param file - Express file object
 * @param maxSize - Max file size in bytes (default 5MB)
 * @returns true if valid, throws error if invalid
 */
export const validateFile = (
  file: any,
  maxSize: number = 5 * 1024 * 1024, // 5MB default
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
