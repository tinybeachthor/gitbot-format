export interface PatchRange {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
}

export enum AnnotationLevel {
  Failure = 'failure',
  Warning = 'warning',
  Infor = 'info',
}

export interface Annotation {
  path: string
  start_line: number
  end_line: number
  annotation_level: AnnotationLevel
  message: string
}

export interface Annotations {
  annotations: Annotation[]
  lines: number
}

export interface PullRequestInfo {
  owner: string
  repo: string
  ref: string
  pull_number?: number
  sha?: string
}
export interface PullRequestInfoFull {
  owner: string
  repo: string
  ref: string
  pull_number: number
  sha: string
}

export interface File {
  filename: string
  content: string
}

export interface GitFile {
  owner?: string
  repo?: string
  filename: string
  sha: string
}

export interface CheckrunInfo {
  owner: string
  repo: string
  head_sha: string
  name: string
}

export interface Checkrun {
  error: (error: string) => Promise<void>
  queued: () => Promise<void>
  progress: (time: Date) => Promise<void>
  failure: (annotations: Annotation[], lines: number, skipped: string[])
    => Promise<void>
  warningSkipped: (skipped: string[]) => Promise<void>
  success: () => Promise<void>
}
