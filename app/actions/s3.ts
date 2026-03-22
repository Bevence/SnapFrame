"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getSignedUploadUrl(fileName: string, fileType: string) {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      throw new Error("AWS_S3_BUCKET_NAME is not defined in environment variables.");
    }

    // You can customize the key structure here, e.g., adding a unique UUID folder prefix.
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const key = `uploads/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    // The presigned URL is valid for 60 seconds.
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return { success: true, url: signedUrl, key };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return { success: false, error: "Failed to generate presigned URL" };
  }
}
