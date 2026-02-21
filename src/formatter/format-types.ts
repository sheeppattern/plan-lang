export interface FormatOptions {
  /** Write formatted output back to file */
  write?: boolean;
  /** Check mode: return whether formatting is needed (exit code 1 if so) */
  check?: boolean;
}

export interface FormatResult {
  filePath?: string;
  original: string;
  formatted: string;
  changed: boolean;
}
