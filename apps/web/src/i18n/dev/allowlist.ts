// Latin text that may stay on the Russian screen. Add an entry here when the
// check flags something that is right as it is (a brand, a key, a technical
// name); text that should be Russian goes into a catalog instead.

/** Phrases kept as they are, matched without regard to case before the text is split into words. */
export const ALLOWED_PHRASES: readonly string[] = ['The Human Box', 'Human Box']

/** Single words kept as they are, matched without regard to case. */
export const ALLOWED_WORDS: readonly string[] = [
  // Keys (GLOSSARY: key names are not translated).
  'Shift',
  'Esc',
  'Escape',
  'Ctrl',
  'Control',
  'Cmd',
  'Command',
  'Alt',
  'Option',
  'Opt',
  'Tab',
  'Enter',
  'Return',
  'Space',
  'Backspace',
  'Delete',
  'Del',
  'Fn',
  'PgUp',
  'PgDn',
  'WASD',
  // Units and sizes.
  'fps',
  'ms',
  'px',
  'KB',
  'MB',
  'GB',
  'KiB',
  'MiB',
  'GiB',
  'Hz',
  // Technical and product names.
  'macOS',
  'Electron',
  'Chromium',
  'WebGL',
  'WebGPU',
  'WebAssembly',
  'WASM',
  'Rust',
  'GPU',
  'CPU',
  'RAM',
  'JSON',
  'URL',
  'GitHub',
  'Apple',
  'Silicon',
  'FPS',
]
