/**
 * Google Material Symbols (Outlined, weight 400), inlined as SVG so no icon font is loaded.
 * Source: @material-symbols/svg-400 v0.49.0, Apache License 2.0 (Google).
 * To add an icon, copy the `d` attribute from node_modules/@material-symbols/svg-400/outlined/<name>.svg
 * or https://fonts.google.com/icons.
 */
const PATHS = {
  add: 'M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z',
  delete:
    'M261-120q-24.75 0-42.37-17.63Q201-155.25 201-180v-570h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm438-630H261v570h438v-570ZM367-266h60v-399h-60v399Zm166 0h60v-399h-60v399ZM261-750v570-570Z',
} as const;

export type MaterialIconName = keyof typeof PATHS;

export function MaterialIcon({name, size = 20}: {name: MaterialIconName; size?: number}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
