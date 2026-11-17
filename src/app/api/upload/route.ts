import {issueSignedToken} from '@vercel/blob';
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from '@vercel/blob/client';
import {NextResponse} from 'next/server';
import {PHOTO_ACCEPT, PHOTO_MAX_BYTES} from '@/lib/constants';
import {isDraftId, isPathInDraft} from '@/lib/blob-paths';
import {rateLimit} from '@/lib/rate-limit';

/** Shared checks for both upload flows. Throws to refuse the upload. */
async function authorize(pathname: string, clientPayload: string | null) {
  if (!isDraftId(clientPayload) || !isPathInDraft(pathname, clientPayload)) {
    throw new Error('Invalid upload path');
  }
  // ~6 photos per submission; allows retries and a few submissions per hour per IP.
  if (!(await rateLimit('upload', 60, 3600))) {
    throw new Error('Too many uploads. Please try again later.');
  }
}

const limits = {allowedContentTypes: PHOTO_ACCEPT, maximumSizeInBytes: PHOTO_MAX_BYTES};

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody | HandleUploadPresignedBody;

  try {
    if (body.type === 'blob.generate-presigned-url') {
      // Store connected with OIDC (no read-write token): presigned PUT URL flow.
      const json = await handleUploadPresigned({
        body: body as HandleUploadPresignedBody,
        request,
        // We never register upload-completed callbacks; any callback is rejected by signature check.
        webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY ?? 'unused',
        getSignedToken: async (pathname, clientPayload) => {
          await authorize(pathname, clientPayload);
          const token = await issueSignedToken({operations: ['put'], ...limits});
          return {token, urlOptions: {...limits, addRandomSuffix: true}};
        },
      });
      return NextResponse.json(json);
    }

    // Store connected with BLOB_READ_WRITE_TOKEN: client-token flow.
    const json = await handleUpload({
      body: body as HandleUploadBody,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await authorize(pathname, clientPayload);
        return {...limits, addRandomSuffix: true};
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Upload failed'},
      {status: 400},
    );
  }
}
