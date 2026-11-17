import type {Actor, PhotoKind} from '@/db/schema';

export type ChecklistItem = {key: string; label: string; done: boolean; hint: string};

/** What makes a profile easy to cast. Shown to actors as a checklist with a completion meter. */
export function profileChecklist(a: Actor, photoKinds: PhotoKind[]): ChecklistItem[] {
  const count = (k: PhotoKind) => photoKinds.filter((p) => p === k).length;
  const hasSocial = Boolean(a.instagramUrl || a.youtubeUrl || a.facebookUrl || a.otherSocialLinks.length);
  return [
    {key: 'headshot', label: 'Front-facing headshot', done: count('headshot') > 0, hint: 'A clear photo of your face.'},
    {key: 'gallery', label: '3 or more best pictures', done: count('gallery') >= 3, hint: 'Show your range.'},
    {key: 'full', label: 'Full-length photograph', done: count('full_length') > 0, hint: 'Head to toe, standing.'},
    {key: 'showreel', label: 'Showreel or audition video', done: a.showreelUrls.length > 0, hint: 'Even a short self-tape helps.'},
    {key: 'experience', label: 'Acting experience', done: Boolean(a.experience?.trim()), hint: 'Films, ads, theatre, short films.'},
    {key: 'portfolio', label: 'Portfolio links', done: a.portfolioLinks.length > 0, hint: 'Links to your work.'},
    {key: 'social', label: 'Social media profile', done: hasSocial, hint: 'Instagram, YouTube or others.'},
    {key: 'height', label: 'Height', done: a.heightCm !== null, hint: 'Helps with casting requirements.'},
  ];
}
