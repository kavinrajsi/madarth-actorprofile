import Link from 'next/link';
import {notFound} from 'next/navigation';
import {and, asc, eq, sql} from 'drizzle-orm';
import {ProfileForm, type ProfileFormState} from '@/components/form/ProfileForm';
import type {UploadItem} from '@/components/form/PhotoUploader';
import {getDb, schema} from '@/db';
import {requireActorAccount} from '@/lib/account/session';
import styles from '@/components/account/account.module.css';

export default async function EditProfilePage({params}: {params: Promise<{code: string}>}) {
  const account = await requireActorAccount();
  const {code} = await params;
  const db = getDb();
  const [a] = await db
    .select()
    .from(schema.actors)
    .where(and(eq(schema.actors.actorCode, decodeURIComponent(code)), sql`lower(${schema.actors.email}) = ${account.email}`))
    .limit(1);
  if (!a) notFound();

  const photos = await db
    .select()
    .from(schema.actorPhotos)
    .where(eq(schema.actorPhotos.actorId, a.id))
    .orderBy(asc(schema.actorPhotos.sort));

  const initial: ProfileFormState = {
    fullName: a.fullName,
    dateOfBirth: a.dateOfBirth,
    gender: a.gender,
    city: a.city,
    phone: a.phone,
    whatsappSame: a.whatsapp === a.phone,
    whatsapp: a.whatsapp,
    email: a.email,
    guardianName: a.guardianName ?? '',
    guardianPhone: a.guardianPhone ?? '',
    guardianConsent: Boolean(a.guardianConsent),
    instagramHandle: a.instagramHandle ? `@${a.instagramHandle}` : '',
    instagramUrl: a.instagramUrl ?? '',
    youtubeUrl: a.youtubeUrl ?? '',
    facebookUrl: a.facebookUrl ?? '',
    otherSocialLinks: a.otherSocialLinks,
    intro: a.intro,
    experience: a.experience ?? '',
    portfolioLinks: a.portfolioLinks.length ? a.portfolioLinks : [''],
    showreelUrls: a.showreelUrls.length ? a.showreelUrls : [''],
    languages: a.languages,
    heightCm: a.heightCm,
    profession: a.profession ?? '',
    availability: a.availability ?? '',
    willingToTravel: a.willingToTravel ? 'yes' : 'no',
    consent: true,
    website: '',
  };

  const existing: UploadItem[] = photos.map((p) => ({
    localId: p.id,
    id: p.id,
    kind: p.kind,
    previewUrl: `/api/photos/${p.id}`,
    status: 'done',
    pathname: p.blobPathname,
    contentType: p.contentType,
    size: p.sizeBytes,
  }));

  const uploadMode = process.env.BLOB_READ_WRITE_TOKEN ? 'token' : 'presigned';

  return (
    <div className={styles.column}>
      <div>
        <Link href="/account" style={{color: 'var(--mad-muted)', fontSize: 14}}>
          ← My account
        </Link>
      </div>
      <header className={styles.head}>
        <span className="mad-eyebrow">{a.actorCode}</span>
        <h1 className={styles.title}>Edit profile</h1>
      </header>
      <ProfileForm uploadMode={uploadMode} edit={{code: a.actorCode, initial, photos: existing}} />
    </div>
  );
}
