import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-southeast-1";
const bucketName = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
const bucketEnvNames = "S3_BUCKET, AWS_S3_BUCKET, or NEXT_PUBLIC_S3_BUCKET";

export const s3Client = new S3Client({
    region,
});

function toFileUrl(key: string) {
    return `/api/files/${key.split('/').map(encodeURIComponent).join('/')}`;
}

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
        throw new Error(`${bucketEnvNames} environment variable is not set`);
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
        publicUrl: toFileUrl(key),
        key
    };
}

export async function getObjectFromS3(key: string, bucketOverride?: string | null) {
    const targetBucket = bucketOverride || bucketName;
    if (!targetBucket) {
        throw new Error(`${bucketEnvNames} environment variable is not set`);
    }

    const command = new GetObjectCommand({
        Bucket: targetBucket,
        Key: key,
    });

    return s3Client.send(command);
}

export async function headObjectFromS3(key: string, bucketOverride?: string | null) {
    const targetBucket = bucketOverride || bucketName;
    if (!targetBucket) {
        throw new Error(`${bucketEnvNames} environment variable is not set`);
    }

    const command = new HeadObjectCommand({
        Bucket: targetBucket,
        Key: key,
    });

    return s3Client.send(command);
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
        throw new Error(`${bucketEnvNames} environment variable is not set`);
    }

    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanCourse = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
    const key = `${cleanTenant}/${cleanCourse}/${fileName}`;

    const lowerFileName = fileName.toLowerCase();
    const contentType = lowerFileName.endsWith('.pdf') ? 'application/pdf'
        : lowerFileName.endsWith('.mp4') ? 'video/mp4'
        : lowerFileName.endsWith('.png') ? 'image/png'
        : lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') ? 'image/jpeg'
        : lowerFileName.endsWith('.webp') ? 'image/webp'
        : 'application/octet-stream';

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    await s3Client.send(command);

    return toFileUrl(key);
}
