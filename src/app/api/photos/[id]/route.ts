import {get} from '@vercel/blob';
import {eq} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {getAdmin} from '@/lib/authz';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, {params}: {params: Promise<{id: string}>}) {
  const admin = await getAdmin();
  if (!admin) return new Response('Unauthorized', {status: 401});

  const {id} = await params;
  if (!UUID.test(id)) return new Response('Not found', {status: 404});

  const [photo] = await getDb()
    .select({pathname: schema.actorPhotos.blobPathname, contentType: schema.actorPhotos.contentType})
    .from(schema.actorPhotos)
    .where(eq(schema.actorPhotos.id, id))
    .limit(1);
  if (!photo) return new Response('Not found', {status: 404});

  const result = await get(photo.pathname, {access: 'private'});
  if (!result || result.statusCode !== 200) {
    return new Response('Not found', {status: 404});
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': photo.contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
