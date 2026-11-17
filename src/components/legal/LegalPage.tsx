import {SiteFooter, SiteHeader} from '@/components/site/SiteHeader';
import {LEGAL} from '@/lib/legal';
import styles from './legal.module.css';

type Props = {
  title: string;
  /** Small label above the title. */
  eyebrow?: string;
  intro?: React.ReactNode;
  /** Section anchors for the on-page contents list. */
  sections?: {id: string; title: string}[];
  children: React.ReactNode;
};

export function LegalPage({title, eyebrow = 'Policies', intro, sections, children}: Props) {
  return (
    <>
      <SiteHeader />
      <main className="mad-container">
        <article className={styles.article}>
          <header className={styles.head}>
            <span className="mad-eyebrow">{eyebrow}</span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.updated}>Last updated: {LEGAL.lastUpdated}</p>
            {intro && <div className={styles.intro}>{intro}</div>}
          </header>

          {sections && sections.length > 0 && (
            <nav className={styles.toc} aria-label="On this page">
              <p className={styles.tocTitle}>On this page</p>
              <ol>
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className={styles.prose}>{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

/** A numbered policy section with an anchor. */
export function Section({id, title, children}: {id: string; title: string; children: React.ReactNode}) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

export function Email() {
  return <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>;
}
