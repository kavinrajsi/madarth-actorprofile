'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {Pagination} from '@astryxdesign/core/Pagination';

export function Pager({page, totalItems, pageSize}: {page: number; totalItems: number; pageSize: number}) {
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
        if (p <= 1) sp.delete('page');
        else sp.set('page', String(p));
        const qs = sp.toString();
        router.push(qs ? `${path}?${qs}` : path);
        window.scrollTo({top: 0});
      }}
      label="Profile pages"
    />
  );
}
