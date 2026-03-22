"use client";

import { useState } from "react";
import { getSignedUploadUrl } from "../actions/s3";

interface S3UploaderProps {
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export default function S3Uploader({ onUploadSuccess, onUploadError }: S3UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(10); // Initial progress

      // Step 1: Request Presigned URL from Next.js Server Action
      const { success, url, key, error } = await getSignedUploadUrl(file.name, file.type);

      if (!success || !url) {
        throw new Error(error || "Failed to get presigned URL.");
      }

      setUploadProgress(30); // Acquired URL

      // Step 2: Upload file directly to S3
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      setUploadProgress(100); // Uploaded

      // The final URL of the uploaded object
      // (Assuming the bucket is public or you will serve it via CloudFront)
      const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "[your-bucket-name]";
      const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
      const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

      if (onUploadSuccess) {
        onUploadSuccess(fileUrl);
      }

      alert("File uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      if (onUploadError) {
        onUploadError(err.message);
      } else {
        alert(`Upload error: ${err.message}`);
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      setFile(null); // Reset selection
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 p-4 border rounded-md shadow-sm max-w-md bg-white">
      <h3 className="text-lg font-semibold text-gray-800">Upload to S3</h3>
      
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 cursor-pointer"
      />
      
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? `Uploading... ${uploadProgress}%` : "Upload File"}
      </button>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
