export interface Task {
  name: string;
  deadline: string;
  maxAutomark: number;
  maxStyleMark: number;
  specURL: string;
  fileRestrictions?: {
    requiredFiles: string[];
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  latePolicy: {
    percentDeductionPerDay: number;
    lateDayType: 'CALENDAR' | 'BUSINESS';
    maxLateDays: number;
  } | null;
}

export interface TaskResult {
  name: string,
  deadline: string;
  files: string[];
  lastSubmitted: string;
  automark: number | null;
  raw_automark?: number | null;
  maxAutomark: number;
  style: number | null;
  maxStyleMark: number;
  grade: number | null;
  maxMark: number;
  comments: string;
  lateDays?: number;
  latePenaltyPercentage?: number;
  latePolicy?: {
    percentDeductionPerDay: number;
    lateDayType: 'CALENDAR' | 'BUSINESS';
    maxLateDays: number;
  };
}

export interface PastSubmission {
  timestamp: string;
  filePaths: string[];
}
