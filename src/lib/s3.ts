import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-southeast-1";
const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET;

export const s3Client = new S3Client({
    region,
});

/**
 * Generates a presigned URL for direct S3 upload.
 */
export async function getPresignedUrl({
    tenantId = 'system',
    courseId = 'misc',
    fileName,
    contentType
}: {
    tenantId?: string;
    courseId?: string;
    fileName: string;
    contentType: string;
}) {
    if (!bucketName) {
        throw new Error("NEXT_PUBLIC_S3_BUCKET environment variable is not set");
    }

    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanCourse = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
    const key = `${cleanTenant}/${cleanCourse}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    return {
        uploadUrl: url,
        publicUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
        key
    };
}

/**
 * Uploads a file to S3 with a structured path (Limited to 6MB on Lambda).
 * Path format: [tenantId]/[courseId]/[filename]
 */
export async function uploadToS3({
    file,
    tenantId = 'system',
    courseId = 'misc',
    fileName
}: {
    file: Buffer | Uint8Array | Blob | string;
    tenantId?: string;
    courseId?: string;
    fileName: string;
}) {
    if (!bucketName) {
        throw new Error("NEXT_PUBLIC_S3_BUCKET environment variable is not set");
    }

    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanCourse = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
    const key = `${cleanTenant}/${cleanCourse}/${fileName}`;

    const contentType = fileName.endsWith('.pdf') ? 'application/pdf' 
        : fileName.endsWith('.mp4') ? 'video/mp4'
        : 'application/octet-stream';

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    await s3Client.send(command);

    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
