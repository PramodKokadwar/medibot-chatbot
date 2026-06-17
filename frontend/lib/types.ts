export interface LoginResponse {
  token: string;
  username: string;
  display_name: string;
  role: string;
  collections: string[];
}

export interface Source {
  source_document: string;
  section_title: string;
  collection: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  retrieval_type: "hybrid_rag" | "sql_rag";
  role: string;
  blocked: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  retrieval_type?: "hybrid_rag" | "sql_rag";
  blocked?: boolean;
  timestamp: Date;
}

export interface UserSession {
  token: string;
  username: string;
  display_name: string;
  role: string;
  collections: string[];
}
