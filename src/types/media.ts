export interface FolderNode {
  id: string;
  name: string;
  type: "folder";
  children?: FolderNode[];
  path: string;
}

export interface MediaImage {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  folder?: string | null;
  altText?: string;
  title?: string;
  caption?: string;
  description?: string;
  tags?: string[];
  uploadedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  folderPath: string; // For frontend compatibility
  folderRef?: {
    id: string;
    name: string;
    path: string;
    parentPath: string;
  };
}

export interface UploadMediaPayload {
  files: File[];
  folder?: string;
  altText?: string;
  title?: string;
  caption?: string;
  description?: string;
}

export interface FolderWithMedia {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  fullPath: string;
  media: MediaImage[];
  children?: FolderWithMedia[];
  _count?: {
    media: number;
    children: number;
  };
}
