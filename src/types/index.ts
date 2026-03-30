export interface ColumnProfile {
  col: string;
  type: 'numeric' | 'categorical' | 'text' | 'datetime' | 'empty';
  nullCount: number;
  uniqueCount: number;
  total: number;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  median?: number;
  q1?: number;
  q3?: number;
  outliers?: number;
  skew?: number;
  top?: { value: string; count: number; pct: number }[];
}

export interface Artifact {
  type: string;
  title?: string;
  ctype?: string;
  xCol?: string;
  yCol?: string;
  aggFn?: string;
  data?: Record<string, any>[];
  insights?: string[];
  lang?: string;
  code?: string;
  profile?: ColumnProfile[];
  stats?: { label: string; value: string | number; color?: string }[];
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  artifacts?: Artifact[];
  timestamp: string;
}

export interface Session {
  id: string;
  title: string;
  fileName?: string;
  rowCount?: number;
  colCount?: number;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ChangelogEntry {
  id: string;
  action: 'upload' | 'transform' | 'filter' | 'drop' | 'chart' | 'analysis' | 'other';
  description: string;
  timestamp: string;
  data?: Record<string, any>;
}
