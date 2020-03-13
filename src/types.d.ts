declare module types {

  interface PatchRange {
    oldStart: number
    oldLines: number
    newStart: number
    newLines: number
  }

  interface Annotation {
    path: string
    start_line: number
    end_line: number
    annotation_level: string
    message: string
  }

  interface Annotations {
    annotations: Annotation[]
    lines: number
  }

  interface PullRequestInfo {
    owner: string
    repo: string
    ref: string
    pull_number?: number
    sha?: string
  }
  interface PullRequestInfoFull {
    owner: string
    repo: string
    ref: string
    pull_number: number
    sha: string
  }

  interface File {
    filename: string
    content: string
  }

  interface GitFile {
    owner?: string
    repo?: string
    filename: string
    sha: string
  }

  interface CheckrunInfo {
    owner: string
    repo: string
    head_sha: string
    name: string
  }

  interface Checkrun {
    error: (error: string) => Promise<void>

    queued: () => Promise<void>
    progress: (time: Date) => Promise<void>

    failure: (annotations: Annotation[], lines: number, skipped: string[])
      => Promise<void>
    warningSkipped: (skipped: string[]) => Promise<void>
    success: () => Promise<void>
  }
}
