// src/interfaces/user.interface.ts

import { Task } from "./tasks.interface";

export interface StudentCourseViewProps {
  courseCode: string;
  tasks: Task[];
}

export interface TutorCourseViewProps {
  courseCode: string;
  tasks: Task[];
  onTaskClick: (id: number, name: string) => void;
  isDeadlinePassed: (deadline: string) => boolean;
  formatDeadline: (deadline: string) => string;
}

export interface AdminCourseViewProps {
  courseCode: string;
  tasks: Task[];
  onTaskClick: (id: number, name: string) => void;
  handleDeleteTask: (task: Task) => void;
  handleClickOpen: () => void;
  isDeadlinePassed: (deadline: string) => boolean;
  formatDeadline: (deadline: string) => string;
  handleSettingsMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  settingsAnchorEl: null | HTMLElement;
  handleSettingsMenuClose: () => void;
  handleSettingsMenuItemClick: (method: string) => void;
}

export interface StudentDetails {
  zID: string;
  firstName: string;
  lastName: string;
}

export interface LatePolicy {
  percentDeductionPerDay: number;
  lateDayType: 'CALENDAR' | 'BUSINESS';
  maxLateDays: number;
}

export interface SpecialConsideration {
  extensionHours: number;
  reason: string;
  approvedBy: string;
}

export interface StudentResult {
  lastSubmitted: string;
  id: string;
  first_name: string;
  last_name: string;
  automark: number;
  raw_automark?: number | null;
  automark_timestamp: string;
  automark_report: any;
  style: number;
  grade: string;
  comments: string;
  mark_released: boolean;
  latePolicy?: LatePolicy;
  lateDays?: number;
  latePenaltyPercentage?: number;
  specialConsideration?: SpecialConsideration;
  submissions: {
    submissions: {
      [key: string]: string[];  // timestamp -> file paths
    };
  };
  /* 
    {
      "submissions": {
        "<latest submission timestamp>": [
          "<absolute storage path of file #1>",
          "<absolute storage path of file #2>",
          "<absolute storage path of file #...>",
        ],
        "<2nd latest submission timestamp>": [
          "<absolute storage path of file #1>",
          "<absolute storage path of file #2>",
          "<absolute storage path of file #...>",
        ],
        ...
      }
    }
    */
}

export interface StudentAccordionProps {
  filteredStudents: StudentResult[];
  isLoading: boolean;
  isInitialized: boolean;
  userLevel: string;
  taskMaxAutomark: number;
  taskMaxStyle: number;
  maxTaskMark: number;
  handleAutotestClick: (student: StudentResult) => void;
  handleRunAutomarkClick: (student: StudentResult, index: number) => void;
  handleViewAutomarkReport: (student: StudentResult) => void;
  handleModifyMarksClick: (student: StudentResult) => void;
  handleMarkReleaseChange: (index: number, checked: boolean) => Promise<void>;
  renderSubmissionDetails: (submissions: any) => React.ReactNode;
  handleDownloadFiles: (student: StudentResult) => void;
  handleSpecialConsiderationClick: (studentId: string) => void;
}
