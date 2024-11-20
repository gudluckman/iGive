import { ChangeEvent, RefObject, MouseEvent } from "react";
import { PastSubmission } from "./tasks.interface";
import { StudentResult } from "./user.interface";
import { Task } from "./tasks.interface";


export interface TaskModalProps {
  editing: boolean;
  open: boolean;
  handleClose: () => void;
  handleAddNewTask: () => void;
  newTaskName?: string;
  newTaskDeadline: string;
  newTaskMaxAutomark: number;
  newTaskMaxStyle: number;
  newTaskRequiredFiles: string;
  newTaskAllowedFileTypes: string;
  newTaskMaxFileSize: number;
  percentDeductionPerDay?: number;
  lateDayType?: 'CALENDAR' | 'BUSINESS';
  maxLateDays?: number;
  setNewTaskName?: (name: string) => void;
  setNewTaskDeadline: (deadline: string) => void;
  setNewTaskMaxAutomark: (maxAutomark: number) => void;
  setNewTaskMaxStyle: (maxStyle: number) => void;
  setNewTaskRequiredFiles: (fileNames: string) => void;
  setNewTaskAllowedFileTypes: (fileTypes: string) => void;
  setNewTaskMaxFileSize: (maxFileSize: number) => void;
  setPercentDeductionPerDay?: (percent: number) => void;
  setLateDayType?: (type: 'CALENDAR' | 'BUSINESS') => void;
  setMaxLateDays?: (days: number) => void;
  tasks?: Task[];
  taskSpecURL: string;
  setTaskSpecURL: (specURL: string) => void;
}

export interface FileUploadModalProps {
  courseCode: string;
  taskName: string;
  taskIndex: number;
  updateFiles: (filenames: string[], lastSubmitted: string, index: number) => void;
}

export interface StudentPastSubmissionsModalProps {
  open: boolean;
  onClose: () => void;
  courseCode: string;
  taskName: string;
  loadingPastSubmissions: boolean;
  pastSubmissions: PastSubmission[];
}

export interface AutotestCenterModalProps {
  courseCode: string;
  task: string;
  handleAutotestCenterClose: () => void;
  autotestCenterOpen: boolean;
}

export interface AutotestSummaryContainerProps {
  tests: string[];
  handleAutotestDeleteClick: (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => void;
  handleAutotestEditClick: (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => void;
  editingModule: string | null;
  hidden: boolean;
}

export interface AutotestSummaryModuleProps {
  handleAutotestDeleteClick: (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => void;
  handleAutotestEditClick: (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => void;
  test: string;
  hidden: boolean;
  isEditing: boolean;
}

export interface FileUploadButtonProps {
  handleFileUploadClick: (method: string) => void;
  handleFileUploadChange: (event: ChangeEvent<HTMLInputElement>, method: string) => void;
  handleScriptDownload?: () => void;
  fileRef: RefObject<HTMLInputElement>;
  file: null | File;
  method: string;
  uploaded: boolean;
}

export interface ModifyMarksModalProps {
  open: boolean;
  onClose: () => void;
  student: StudentResult;
  onUpdate: (updatedStudent: StudentResult) => void;
}

export interface AutotestModalProps {
  open: boolean;
  handleClose: () => void;
  isAutotest: boolean;
  autotestResult: any[] | null;
  renderAutotestResults: (results: any[]) => React.ReactNode;
  studentId?: string;
}

export interface FileRestrictionSettingModalProps {
  courseCode: string;
  task: string;
  fileRestrictionSettingsOpen: boolean;
  handleFileRestrictionsClose: () => void;
  onSaveSettings: (restrictions: FileRestrictionSettings) => void;
}

export interface FileRestrictionSettings {
  requiredFiles: string[];
  allowedFileTypes: string[];
  maxFileSize: number;
  courseCode: string;
  task: string;
}

export interface ToleranceSettingsModalProps {
  courseCode: string;
  task: string;
  toleranceSettingsOpen: boolean;
  handleToleranceSettingsClose: () => void;
}

export interface SpecialConsiderationModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  courseCode: string;
  task: string;
  onSuccess?: () => void;
}
