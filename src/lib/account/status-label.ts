import type {ActorStatus} from '@/db/schema';

/** Status wording shown to actors (gentler than the casting team's internal labels). */
export const ACTOR_STATUS_LABEL: Record<ActorStatus, {label: string; note: string}> = {
  new: {label: 'Received', note: 'Your profile is in our casting database and will be reviewed for upcoming projects.'},
  shortlisted: {label: 'Shortlisted', note: 'You have been shortlisted. We will contact you if the project moves forward.'},
  contacted: {label: 'Contacted', note: 'Our casting team has contacted you. Check your WhatsApp and email.'},
  selected: {label: 'Selected', note: 'Congratulations! You have been selected. Our team will be in touch with details.'},
  not_suitable: {
    label: 'Not selected this time',
    note: 'You were not selected for the current projects. We keep your profile for future castings.',
  },
};
