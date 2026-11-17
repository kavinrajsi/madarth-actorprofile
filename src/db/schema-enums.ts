// Plain enum value lists shared by client validation and the Drizzle schema
// (importing drizzle-orm/pg-core in client bundles is unnecessary weight).
export const genderEnum = ['male', 'female', 'non_binary', 'other', 'prefer_not'] as const;
export const statusEnum = ['new', 'shortlisted', 'contacted', 'selected', 'not_suitable'] as const;
export const photoKindEnum = ['headshot', 'gallery', 'full_length'] as const;
export const tokenPurposeEnum = ['setup', 'reset', 'email_change'] as const;
export const emailKindEnum = ['thank_you', 'invite', 'password_reset', 'email_change'] as const;
