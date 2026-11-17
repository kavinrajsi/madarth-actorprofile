import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

/**
 * Madarth brand theme (dark only).
 * Source: Madarth design system tokens (ink-900 ground, paper text,
 * brand-yellow accent with black text, brand-orange for labels, square corners).
 * Every value is a [light, dark] tuple with the same value: the app always runs in dark mode.
 */
const c = (v: string): [string, string] => [v, v];

const INK_900 = '#111111';
const INK_1000 = '#000000';
const PAPER = '#ffffff';
const PAPER_SOFT = '#f8f8f8';
const TEXT_SECONDARY = '#b8b8b8'; // 9.6:1 on ink-900
const LINE = '#3d3d3d'; // decorative hairline (1.7:1), never for controls
const CONTROL_BORDER = '#707070'; // 3.7:1 on ink-900, meets 3:1 for control borders
const YELLOW = '#fddb45';
const ORANGE = '#da5326';
const DANGER = '#ff7a7a'; // 7.1:1 on ink-900; redder and lighter than brand-orange

export const madarthTheme = defineTheme({
  name: 'madarth',
  extends: neutralTheme,
  typography: {
    body: {family: 'var(--font-anek-tamil)', fallbacks: '"Anek Tamil", system-ui, sans-serif'},
    heading: {family: 'var(--font-anek-tamil)', fallbacks: '"Anek Tamil", system-ui, sans-serif'},
  },
  radius: {base: 0, multiplier: 0},
  tokens: {
    '--color-accent': c(YELLOW),
    '--color-accent-muted': c('#fddb4533'),
    '--color-on-accent': c(INK_1000),
    '--color-text-accent': c(YELLOW),
    '--color-icon-accent': c(YELLOW),

    '--color-background-body': c(INK_900),
    '--color-background-surface': c(INK_900),
    '--color-background-card': c('#171717'),
    '--color-background-popover': c('#1c1c1c'),
    '--color-background-muted': c('#1a1a1a'),
    '--color-background-inverted': c(PAPER),

    '--color-text-primary': c(PAPER),
    '--color-text-secondary': c(TEXT_SECONDARY),
    '--color-icon-primary': c(PAPER),
    '--color-icon-secondary': c(TEXT_SECONDARY),

    '--color-border': c(LINE),
    '--color-border-emphasized': c(CONTROL_BORDER),

    '--color-error': c(DANGER),
    '--color-on-error': c(INK_1000),
    '--color-text-error': c(DANGER),
    '--color-icon-error': c(DANGER),
    '--color-border-error': c(DANGER),
    '--color-error-muted': c('#ff7a7a26'),
    '--color-on-error-muted': c('#ffb3b3'),

    '--color-text-orange': c(ORANGE),
    '--color-text-gray': c(PAPER_SOFT),
  },
});
