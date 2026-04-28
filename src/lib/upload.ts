/**
 * Frontend utility for direct-to-S3 uploads using presigned URLs.
 * This bypasses Next.js server limits (413 Content Too Large).
 */

export async function uploadFile(
  file: File, 
  metadata: { tenantId?: string; courseId?: string },
  onProgress?: (percent: number) => void
): Promise<{ url: string; name: string; size: number; key: string }> {
  // 1. Get Presigned URL
  const formData = new FormData();
  formData.append('presign', 'true');
  formData.append('fileName', file.name);
  formData.append('contentType', file.type);
  if (metadata.tenantId) formData.append('tenantId', metadata.tenantId);
  if (metadata.courseId) formData.append('courseId', metadata.courseId);

  const presignRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!presignRes.ok) {
    const err = await presignRes.json();
    throw new Error(err.error || 'Failed to get presigned URL');
  }

  const { uploadUrl, publicUrl, key } = await presignRes.json();

  // 2. Upload to S3 directly
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve({
          url: publicUrl,
          name: file.name,
          size: file.size,
          key: key
        });
      } else {
        reject(new Error(`S3 Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('S3 Upload network error'));
    xhr.send(file);
  });
}
