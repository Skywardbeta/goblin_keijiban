export interface Comment {
  id: number;
  name: string;
  mail?: string;
  rawDate: string;
  uid?: string;
  message: string;
}

export interface ThreadSubject {
  id: string;
  subject: string;
  length: number;
  archived?: boolean;
}

export type AppContext = any;
