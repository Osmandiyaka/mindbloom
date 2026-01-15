export type StudentColumnConfig = {
  key: string;
  label: string;
  defaultVisible: boolean;
};

export const STUDENT_COLUMN_SCHEMA: StudentColumnConfig[] = [
  { key: 'name', label: 'Student', defaultVisible: true },
  { key: 'grade', label: 'Grade', defaultVisible: true },
  { key: 'section', label: 'Section', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'flags', label: 'Attention', defaultVisible: true },
  { key: 'updated', label: 'Updated', defaultVisible: true },
];
