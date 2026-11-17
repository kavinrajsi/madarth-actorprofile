import {get} from '@vercel/blob';
import {eq} from 'drizzle-orm';
import {getDb, schema} from '@/db';
import {getActorAccount} from '@/lib/account/session';
import {getAdmin} from '@/lib/authz';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  if (!UUID.test(id)) return new Response('Not found', {status: 404});

  // Casting team (admins) can see every photo; an actor can see only photos on their own profiles.
  const admin = await getAdmin();
  const account = admin ? null : await getActorAccount();
  if (!admin && !account) return new Response('Unauthorized', {status: 401});

  const [photo] = await getDb()
    .select({
      pathname: schema.actorPhotos.blobPathname,
      contentType: schema.actorPhotos.contentType,
      ownerEmail: schema.actors.email,
    })
    .from(schema.actorPhotos)
    .innerJoin(schema.actors, eq(schema.actors.id, schema.actorPhotos.actorId))
    .where(eq(schema.actorPhotos.id, id))
    .limit(1);
  if (!photo) return new Response('Not found', {status: 404});
  if (!admin && photo.ownerEmail.toLowerCase() !== account!.email) return new Response('Not found', {status: 404});

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
