export enum ResourceType {
  LESSON_PLAN = 'LESSON_PLAN',
  QUIZ = 'QUIZ',
  MEDIA_ANALYSIS = 'MEDIA_ANALYSIS',
  IMAGE = 'IMAGE',
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  content: string; // Markdown or text description
  createdAt: string; // ISO date string
  tags: string[];
  thumbnail?: string; // URL or Base64 placeholder
}

export interface GenerationRequest {
  topic: string;
  gradeLevel: string;
  additionalContext?: string;
  file?: File;
}

export interface AIResponse {
  text: string;
  error?: string;
}
