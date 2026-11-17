import Link from 'next/link';
import {MaterialIcon} from '@/components/icons/MaterialIcon';

/** "Back" link with the Material Symbols arrow_back icon. */
export function BackLink({href, label}: {href: string; label: string}) {
  return (
    <Link href={href} className="mad-back">
      <MaterialIcon name="arrow_back" size={18} />
      {label}
    </Link>
  );
}
