'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {Pagination} from '@astryxdesign/core/Pagination';

export function Pager({
  page,
  totalItems,
  pageSize,
  param = 'page',
  label = 'Profile pages',
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  /** Search param holding the page number (lets two lists on one page paginate separately). */
  param?: string;
  label?: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <Pagination
      page={page}
      totalItems={totalItems}
      pageSize={pageSize}
      onChange={(p) => {
        const sp = new URLSearchParams(params.toString());
        if (p <= 1) sp.delete(param);
        else sp.set(param, String(p));
        const qs = sp.toString();
        router.push(qs ? `${path}?${qs}` : path);
        if (param === 'page') window.scrollTo({top: 0});
      }}
      label={label}
    />
  );
}
