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