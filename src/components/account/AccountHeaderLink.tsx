import {Button} from '@astryxdesign/core/Button';
import {SignInButton} from '@/components/site/SiteHeader';
import {getActorAccount} from '@/lib/account/session';

/** Header button on account pages: "My account" when signed in, otherwise "Sign in". */
export async function AccountHeaderLink() {
  const account = await getActorAccount();
  if (!account) return <SignInButton />;
  return <Button href="/account" variant="secondary" size="sm" label="My account" />;
}
