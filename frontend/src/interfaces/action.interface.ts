import { StudentResult } from "./user.interface";
import { Dispatch, SetStateAction } from "react";
import { MouseEvent } from "react";

export interface AdminActionsProps {
  courseCode: string;
  task: string;
  students: StudentResult[];
  fetchStudents: (courseCode: string, task: string) => Promise<StudentResult[]>;
  setStudents: Dispatch<SetStateAction<StudentResult[]>>;
  setFilteredStudents: Dispatch<SetStateAction<StudentResult[]>>;
  handleGenerateCSV: () => void;
  handleSettingsMenuOpen: (event: MouseEvent<HTMLElement>) => void;
  handleAutotestCenterClick: () => void;
  handleTaskSettingsClick: () => void;
  handleToleranceSettingsClick: () => void;
  settingsAnchorEl: HTMLElement | null;
  handleSettingsMenuClose: () => void;
  onSubmissionRateClick: () => void;
  userLevel: string;
}
