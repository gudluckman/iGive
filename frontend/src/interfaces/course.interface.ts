// src/interfaces/course.interface.ts

export interface Course {
  id: string;
  title: string;
}

export interface CourseCardProps {
  courseId: string;
  courseCode: string;
  title: string;
  term: string;
}

export interface CourseDropdownProps {
  userType: string;
  courses: string[];
}

export interface CourseSectionProps {
  role: "student" | "tutor" | "admin";
  courses: Course[];
}

export interface CourseSettingsProps {
  settingsOpen: boolean;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  method: string;
}
