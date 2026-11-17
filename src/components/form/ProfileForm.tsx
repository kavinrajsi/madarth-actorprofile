'use client';

import {useCallback, useMemo, useRef, useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {DateInput} from '@astryxdesign/core/DateInput';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {RadioList, RadioListItem} from '@astryxdesign/core/RadioList';
import {Selector} from '@astryxdesign/core/Selector';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {submitProfile} from '@/app/(public)/actions';
import {
  CONSENT_TEXT,
  GENDER_OPTIONS,
  GUARDIAN_CONSENT_TEXT,
  LANGUAGES,
  PHOTO_RULES,
} from '@/lib/constants';
import {ageFromDob} from '@/lib/age';
import {instagramHandle} from '@/lib/text';
import {fieldErrors, submissionSchema, type SubmissionInput} from '@/lib/validation';
import {LinkList} from './LinkList';
import {PhotoUploader, type UploadItem, type UploadMode} from './PhotoUploader';
import styles from './form.module.css';

type State = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  phone: string;
  whatsappSame: boolean;
  whatsapp: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  guardianConsent: boolean;
  instagramHandle: string;
  instagramUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  otherSocialLinks: string[];
  intro: string;
  experience: string;
  portfolioLinks: string[];
  showreelUrls: string[];
  languages: string[];
  heightCm: number | null;
  profession: string;
  availability: string;
  willingToTravel: string;
  consent: boolean;
  website: string;
};

const initial: State = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  city: '',
  phone: '',
  whatsappSame: true,
  whatsapp: '',
  email: '',
  guardianName: '',
  guardianPhone: '',
  guardianConsent: false,
  instagramHandle: '',
  instagramUrl: '',
  youtubeUrl: '',
  facebookUrl: '',
  otherSocialLinks: [],
  intro: '',
  experience: '',
  portfolioLinks: [''],
  showreelUrls: [''],
  languages: [],
  heightCm: null,
  profession: '',
  availability: '',
  willingToTravel: '',
  consent: false,
  website: '',
};

function omit(obj: Record<string, string>, ...keys: string[]) {
  const next = {...obj};
  for (const k of keys) delete next[k];
  return next;
}

const err = (m?: string) => (m ? {type: 'error' as const, message: m} : undefined);

function SectionHead({n, title, text}: {n: string; title: string; text?: string}) {
  return (
    <header className={styles.sectionHead}>
      <span className="mad-eyebrow">{n}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {text && <p className={styles.sectionText}>{text}</p>}
    </header>
  );
}

export function ProfileForm({uploadMode}: {uploadMode: UploadMode}) {
  const router = useRouter();
  // Created on first use (not during render) so the page can be prerendered.
  const draftRef = useRef<string | null>(null);
  const getDraftId = useCallback(() => (draftRef.current ??= crypto.randomUUID()), []);
  const [s, setS] = useState<State>(initial);
  const [photos, setPhotos] = useState<UploadItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof State>(key: K, value: State[K]) => {
    setS((prev) => ({...prev, [key]: value}));
    if (errors[key as string]) setErrors((prev) => omit(prev, key as string));
  };

  const languageOptions = useMemo(() => {
    const all = new Set([...LANGUAGES, ...s.languages]);
    return [...all].map((l) => ({value: l, label: l}));
  }, [s.languages]);

  // Only computed once a date is entered (keeps `new Date()` out of the prerender).
  const age = s.dateOfBirth ? ageFromDob(s.dateOfBirth) : null;
  const isMinor = age !== null && age < 18;
  const uploading = photos.some((p) => p.status === 'uploading');
  const photoError = (kind: string) => errors[`photos.${kind}`];

  function buildInput(): SubmissionInput {
    return {
      draftId: getDraftId(),
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender as SubmissionInput['gender'],
      city: s.city,
      phone: s.phone,
      whatsapp: s.whatsappSame ? s.phone : s.whatsapp,
      email: s.email,
      guardianName: isMinor ? s.guardianName : undefined,
      guardianPhone: isMinor ? s.guardianPhone : undefined,
      guardianConsent: isMinor ? s.guardianConsent : undefined,
      instagramHandle: s.instagramHandle,
      instagramUrl: s.instagramUrl,
      youtubeUrl: s.youtubeUrl,
      facebookUrl: s.facebookUrl,
      otherSocialLinks: s.otherSocialLinks.map((l) => l.trim()).filter(Boolean),
      photos: photos
        .filter((p) => p.status === 'done' && p.pathname)
        .map((p) => ({kind: p.kind, pathname: p.pathname!, contentType: p.contentType, size: p.size})),
      intro: s.intro,
      experience: s.experience,
      portfolioLinks: s.portfolioLinks.map((l) => l.trim()).filter(Boolean),
      showreelUrls: s.showreelUrls.map((l) => l.trim()).filter(Boolean),
      languages: s.languages,
      heightCm: s.heightCm ?? '',
      profession: s.profession,
      availability: s.availability,
      willingToTravel: s.willingToTravel as 'yes' | 'no',
      consent: s.consent as true,
      website: s.website,
    };
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-has-error="true"]');
      el?.scrollIntoView({behavior: 'smooth', block: 'center'});
      if (el && 'focus' in el) el.focus({preventScroll: true});
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (uploading) {
      setFormError('Please wait for your photos to finish uploading.');
      return;
    }
    const input = buildInput();
    const parsed = submissionSchema.safeParse(input);
    if (!parsed.success) {
      const fe = fieldErrors(parsed.error);
      setErrors(fe);
      setFormError('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    startTransition(async () => {
      const res = await submitProfile(input);
      if (res.ok) {
        router.push(`/submitted/${encodeURIComponent(res.code)}`);
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.message);
        focusFirstError();
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className="mad-visually-hidden" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={s.website}
            onChange={(e) => set('website', e.target.value)}
          />
        </label>
      </div>

      {/* 1. Basic details */}
      <section className={styles.section} aria-labelledby="sec-basic">
        <SectionHead n="01" title="Basic details" />
        <div className={styles.grid} id="sec-basic">
          <div className={styles.full}>
            <TextInput
              label="Full name"
              value={s.fullName}
              onChange={(v) => set('fullName', v)}
              isRequired
              autoComplete="name"
              status={err(errors.fullName)}
              width="100%"
            />
          </div>
          <DateInput
            label="Date of birth"
            value={(s.dateOfBirth || undefined) as React.ComponentProps<typeof DateInput>['value']}
            onChange={(v) => set('dateOfBirth', v ?? '')}
            min="1925-01-01"
            format="date"
            isRequired
            status={err(errors.dateOfBirth)}
            width="100%"
          />
          <Selector
            label="Gender"
            options={GENDER_OPTIONS}
            value={s.gender}
            onChange={(v) => set('gender', v)}
            placeholder="Select"
            isRequired
            status={err(errors.gender)}
            width="100%"
          />
          <TextInput
            label="City / current location"
            value={s.city}
            onChange={(v) => set('city', v)}
            placeholder="e.g. Chennai"
            autoComplete="address-level2"
            autoCapitalize="words"
            isRequired
            status={err(errors.city)}
            width="100%"
          />
          <TextInput
            label="Contact number"
            type="tel"
            value={s.phone}
            onChange={(v) => set('phone', v)}
            isRequired
            autoComplete="tel"
            placeholder="+91 98765 43210"
            status={err(errors.phone)}
            width="100%"
          />
          <TextInput
            label="Email ID"
            type="email"
            value={s.email}
            onChange={(v) => set('email', v)}
            isRequired
            autoComplete="email"
            status={err(errors.email)}
            width="100%"
          />
          <div className={styles.full}>
            <CheckboxInput
              label="My WhatsApp number is the same as my contact number"
              value={s.whatsappSame}
              onChange={(v) => set('whatsappSame', v)}
            />
          </div>
          {!s.whatsappSame && (
            <TextInput
              label="WhatsApp number"
              type="tel"
              value={s.whatsapp}
              onChange={(v) => set('whatsapp', v)}
              isRequired
              status={err(errors.whatsapp)}
              width="100%"
            />
          )}
        </div>

        {isMinor && (
          <div className={styles.guardian}>
            <p className={styles.sectionText}>
              You are under 18, so a parent or legal guardian must add their details and consent.
            </p>
            <div className={styles.grid}>
              <TextInput
                label="Parent / guardian name"
                value={s.guardianName}
                onChange={(v) => set('guardianName', v)}
                isRequired
                status={err(errors.guardianName)}
                width="100%"
              />
              <TextInput
                label="Parent / guardian phone"
                type="tel"
                value={s.guardianPhone}
                onChange={(v) => set('guardianPhone', v)}
                isRequired
                status={err(errors.guardianPhone)}
                width="100%"
              />
              <div className={styles.full}>
                <CheckboxInput
                  label={`${GUARDIAN_CONSENT_TEXT} *`}
                  value={s.guardianConsent}
                  onChange={(v) => set('guardianConsent', v)}
                  status={err(errors.guardianConsent)}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Social */}
      <section className={styles.section} aria-labelledby="sec-social">
        <SectionHead n="02" title="Social media" />
        <div className={styles.grid} id="sec-social">
          <TextInput
            label="Instagram username"
            value={s.instagramHandle}
            onChange={(v) => {
              set('instagramHandle', v);
              const h = instagramHandle(v);
              if (h && (!s.instagramUrl || s.instagramUrl.startsWith('https://instagram.com/'))) {
                set('instagramUrl', `https://instagram.com/${h}`);
              }
            }}
            placeholder="@yourname"
            autoCapitalize="none"
            hasAutoCorrect={false}
            status={err(errors.instagramHandle)}
            width="100%"
          />
          <TextInput
            label="Instagram profile link"
            type="url"
            value={s.instagramUrl}
            onChange={(v) => set('instagramUrl', v)}
            placeholder="https://instagram.com/yourname"
            status={err(errors.instagramUrl)}
            width="100%"
          />
          <TextInput
            label="YouTube channel link"
            type="url"
            value={s.youtubeUrl}
            onChange={(v) => set('youtubeUrl', v)}
            placeholder="https://youtube.com/@yourchannel"
            status={err(errors.youtubeUrl)}
            width="100%"
          />
          <TextInput
            label="Facebook profile link"
            type="url"
            value={s.facebookUrl}
            onChange={(v) => set('facebookUrl', v)}
            placeholder="https://facebook.com/yourname"
            status={err(errors.facebookUrl)}
            width="100%"
          />
        </div>
        <LinkList
          legend="Other social media"
          description="X (Twitter), LinkedIn, IMDb, Moj, Josh or any other profile."
          itemLabel="Social link"
          addLabel="Add a social link"
          addMoreLabel="Add another social link"
          values={s.otherSocialLinks}
          onChange={(v) => set('otherSocialLinks', v)}
          errors={errors}
          errorKey="otherSocialLinks"
          max={5}
        />
      </section>

      {/* 3. Photos */}
      <section className={styles.section} aria-labelledby="sec-photos">
        <SectionHead n="03" title="Profile pictures" />
        <div className={styles.guidelines} id="sec-photos">
          <p className={styles.guidelinesTitle}>Photo guidelines</p>
          <ul>
            <li>The headshot should clearly show your face, looking at the camera.</li>
            <li>No sunglasses, filters or side-profile pictures.</li>
            <li>Recent, clear and good-quality photographs.</li>
            <li>Avoid heavily edited or blurry pictures.</li>
          </ul>
          <p className={styles.sectionText}>JPG, PNG or WebP, up to 10 MB each.</p>
        </div>
        <div className={styles.photoStack}>
          <PhotoUploader
            kind="headshot"
            label="Front-facing headshot"
            description="One clear photo of your face."
            max={PHOTO_RULES.headshot.max}
            isRequired
            getDraftId={getDraftId}
            uploadMode={uploadMode}
            items={photos}
            onItemsChange={setPhotos}
            error={photoError('headshot')}
          />
          <PhotoUploader
            kind="gallery"
            label="Recent best pictures"
            description="3–4 recent photos that show your range. Recommended."
            max={PHOTO_RULES.gallery.max}
            getDraftId={getDraftId}
            uploadMode={uploadMode}
            items={photos}
            onItemsChange={setPhotos}
            error={photoError('gallery')}
          />
          <PhotoUploader
            kind="full_length"
            label="Full-length photograph"
            description="Head to toe, standing. Recommended."
            max={PHOTO_RULES.full_length.max}
            getDraftId={getDraftId}
            uploadMode={uploadMode}
            items={photos}
            onItemsChange={setPhotos}
            error={photoError('full_length')}
          />
        </div>
      </section>

      {/* 4. Experience */}
      <section className={styles.section} aria-labelledby="sec-exp">
        <SectionHead n="04" title="Acting experience" />
        <div className={styles.stack} id="sec-exp">
          <TextArea
            label="Short introduction"
            description="Tell us about yourself in a few lines."
            value={s.intro}
            onChange={(v) => set('intro', v)}
            rows={4}
            maxLength={1500}
            isRequired
            status={err(errors.intro)}
            width="100%"
          />
          <TextArea
            label="Previous acting experience / projects"
            description="Films, ads, theatre, short films, web series: title, role and year."
            value={s.experience}
            onChange={(v) => set('experience', v)}
            rows={5}
            maxLength={4000}
            status={err(errors.experience)}
            width="100%"
          />
          <LinkList
            legend="Acting portfolio links"
            description="Films, ads, reels, YouTube and so on."
            itemLabel="Portfolio link"
            addLabel="Add a link"
            addMoreLabel="Add another link"
            values={s.portfolioLinks}
            onChange={(v) => set('portfolioLinks', v)}
            errors={errors}
            errorKey="portfolioLinks"
            max={10}
            minRows={1}
          />
          <LinkList
            legend="Showreel / audition video links"
            description="YouTube, Vimeo, Google Drive or any other video link."
            itemLabel="Showreel link"
            addLabel="Add a video link"
            addMoreLabel="Add another video link"
            values={s.showreelUrls}
            onChange={(v) => set('showreelUrls', v)}
            errors={errors}
            errorKey="showreelUrls"
            max={5}
            minRows={1}
          />
        </div>
      </section>

      {/* 5. Additional */}
      <section className={styles.section} aria-labelledby="sec-more">
        <SectionHead n="05" title="Additional details" />
        <div className={styles.grid} id="sec-more">
          <div className={styles.full}>
            <MultiSelector
              label="Languages known"
              description="Pick all that apply. Type to add one that is not listed."
              options={languageOptions}
              value={s.languages}
              onChange={(v) => set('languages', v)}
              hasSearch
              hasCreate
              triggerDisplay="badges"
              maxBadges={8}
              placeholder="Select languages"
              isRequired
              status={err(errors.languages)}
              width="100%"
            />
          </div>
          <NumberInput
            label="Height"
            units="cm"
            value={s.heightCm ?? undefined}
            onChange={(v) => set('heightCm', Number.isFinite(v) ? v : null)}
            isIntegerOnly
            status={err(errors.heightCm)}
            width="100%"
          />
          <TextInput
            label="Current profession"
            value={s.profession}
            onChange={(v) => set('profession', v)}
            isOptional
            status={err(errors.profession)}
            width="100%"
          />
          <div className={styles.full}>
            <TextInput
              label="Availability for shoots"
              description="For example: weekends only, available from January, full-time."
              value={s.availability}
              onChange={(v) => set('availability', v)}
              status={err(errors.availability)}
              width="100%"
            />
          </div>
          <div className={styles.full} data-has-error={errors.willingToTravel ? 'true' : undefined}>
            <RadioList
              label="Willing to travel?"
              value={s.willingToTravel}
              onChange={(v) => set('willingToTravel', v)}
              orientation="horizontal"
              isRequired
              status={err(errors.willingToTravel)}
            >
              <RadioListItem value="yes" label="Yes" />
              <RadioListItem value="no" label="No" />
            </RadioList>
          </div>
        </div>
      </section>

      {/* Consent + submit */}
      <section className={styles.section} aria-label="Consent">
        <div data-has-error={errors.consent ? 'true' : undefined}>
          <CheckboxInput
            label={`${CONSENT_TEXT} *`}
            value={s.consent}
            onChange={(v) => set('consent', v)}
            status={err(errors.consent)}
          />
        </div>
        <p className={styles.sectionText}>
          Read our{' '}
          <a href="/privacy" target="_blank" rel="noopener" className={styles.policyLink}>
            Privacy Policy
          </a>
          ,{' '}
          <a href="/photo-consent" target="_blank" rel="noopener" className={styles.policyLink}>
            Photo &amp; Consent Policy
          </a>{' '}
          and{' '}
          <a href="/terms" target="_blank" rel="noopener" className={styles.policyLink}>
            Terms of Use
          </a>
          . Links open in a new tab, so your form stays filled in.
        </p>
        {formError && (
          <div className={styles.formError}>
            <Banner status="error" title={formError} />
          </div>
        )}
        <div className={styles.submitRow}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            label={uploading ? 'Waiting for photos…' : 'Submit profile'}
            isLoading={isPending}
            isDisabled={isPending}
          />
        </div>
      </section>
    </form>
  );
}
