import { DeleteOutlined, FileOutlined, InboxOutlined } from "@ant-design/icons";
import { Card, Image, Input, message, Modal, Upload } from "antd";
import type { RcFile } from "antd/es/upload/interface";
import { useEffect, useState } from "react";
import { useUploadMediaLibraryMutation } from "../../../redux/features/media-library/media-libraryApi";
import { inferMediaLibraryKind } from "../../../utils/mediaLibraryKind";

const { Dragger } = Upload;

function UploadVideoPreview({ file }: { file: RcFile }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  return (
    <video
      className="w-full max-h-[200px] object-contain bg-black"
      controls
      muted
      playsInline
      src={url}
    />
  );
}

function UploadAudioPreview({ file }: { file: RcFile }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  return (
    <audio controls className="w-full" preload="metadata" src={url} />
  );
}

function UploadImagePreview({ file }: { file: RcFile }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  return (
    <Image
      alt={file.name}
      height={200}
      width={"100%"}
      src={url}
      className="object-cover"
    />
  );
}

function UploadPdfPreview({ file }: { file: RcFile }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  return (
    <iframe
      title={file.name}
      src={url}
      className="w-full max-h-[200px] min-h-[160px] border-0 bg-white"
    />
  );
}

export type MediaLibraryUploadKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "other";

interface MediaLibraryUploadModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  uploadKind?: MediaLibraryUploadKind;
  // Upload the files into this folder id (omit / null = uploads root).
  folder?: string | null;
}

const DOC_MIME =
  /pdf|msword|wordprocessingml|spreadsheetml|presentationml|excel|powerpoint|officedocument|^text\/(plain|csv|rtf)/i;

const DOC_NAME = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt|ods)(\?.*)?$/i;

function fileMatchesUploadKind(
  file: RcFile,
  kind: MediaLibraryUploadKind
): boolean {
  const mime = (file.type || "").toLowerCase();
  const name = file.name || "";

  switch (kind) {
    case "image":
      return mime.startsWith("image/");
    case "video":
      return mime.startsWith("video/");
    case "audio":
      return mime.startsWith("audio/");
    case "document":
      return DOC_MIME.test(mime) || DOC_NAME.test(name);
    case "other":
      return true;
    default:
      return false;
  }
}

function acceptForKind(kind: MediaLibraryUploadKind): string | undefined {
  switch (kind) {
    case "image":
      return "image/*";
    case "video":
      return "video/*";
    case "audio":
      return "audio/*";
    case "document":
      return ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods";
    case "other":
      return undefined;
    default:
      return undefined;
  }
}

const TITLE: Record<MediaLibraryUploadKind, string> = {
  image: "Upload Images",
  video: "Upload Videos",
  audio: "Upload Audio",
  document: "Upload Documents",
  other: "Upload Files",
};

const DRAGGER: Record<MediaLibraryUploadKind, string> = {
  image: "Click or drag images to this area to upload",
  video: "Click or drag videos to this area to upload",
  audio: "Click or drag audio files to this area to upload",
  document: "Click or drag documents (PDF, Office, text) to upload",
  other: "Click or drag any files to this area to upload",
};

const SUCCESS: Record<MediaLibraryUploadKind, string> = {
  image: "Images uploaded successfully",
  video: "Videos uploaded successfully",
  audio: "Audio uploaded successfully",
  document: "Documents uploaded successfully",
  other: "Files uploaded successfully",
};

const FAIL: Record<MediaLibraryUploadKind, string> = {
  image: "Image upload failed",
  video: "Video upload failed",
  audio: "Audio upload failed",
  document: "Document upload failed",
  other: "File upload failed",
};

const REJECT: Record<MediaLibraryUploadKind, string> = {
  image: "Please select image files only",
  video: "Please select video files only",
  audio: "Please select audio files only",
  document: "Please select document files only",
  other: "Invalid file",
};

const MediaLibraryUploadModal = ({
  open,
  setOpen,
  uploadKind = "image",
  folder = null,
}: MediaLibraryUploadModalProps) => {
  const [uploadFiles, setUploadFiles] = useState<RcFile[]>([]);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [uploadMediaLibrary, { isLoading: isUploading }] =
    useUploadMediaLibraryMutation();

  const accept = acceptForKind(uploadKind);

  const handleRemove = (file: RcFile) => {
    setUploadFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    setCustomNames((prev) => {
      const copy = { ...prev };
      delete copy[file.name];
      return copy;
    });
  };

  const uploadProps = {
    multiple: true,
    ...(accept ? { accept } : {}),
    showUploadList: false,
    beforeUpload: (file: RcFile) => {
      if (!fileMatchesUploadKind(file, uploadKind)) {
        message.error(REJECT[uploadKind]);
        return Upload.LIST_IGNORE;
      }
      setUploadFiles((prev) => [...prev, file]);
      setCustomNames((prev) => ({ ...prev, [file.name]: file.name }));
      return false;
    },
  };

  const handleUploadAll = async () => {
    try {
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append("file", file);
        if (customNames[file.name]) {
          formData.append("customName", customNames[file.name]);
        }
        if (folder) {
          formData.append("folder", folder);
        }
        await uploadMediaLibrary(formData).unwrap();
      }
      message.success(SUCCESS[uploadKind]);
      setOpen(false);
      setUploadFiles([]);
      setCustomNames({});
    } catch {
      message.error(FAIL[uploadKind]);
    }
  };

  const renderFilePreview = (file: RcFile) => {
    const inferred = inferMediaLibraryKind({
      type: file.type,
      name: file.name,
    });
    if (inferred === "video") return <UploadVideoPreview file={file} />;
    if (inferred === "audio") return <UploadAudioPreview file={file} />;
    if (inferred === "image") return <UploadImagePreview file={file} />;
    if (
      inferred === "document" &&
      (file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"))
    ) {
      return <UploadPdfPreview file={file} />;
    }
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 bg-[#f5f5f5] text-secondary-600">
        <FileOutlined className="text-5xl" />
        <span className="text-sm px-2 text-center line-clamp-2">{file.name}</span>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      width={800}
      title={TITLE[uploadKind]}
      onCancel={() => {
        setOpen(false);
        setUploadFiles([]);
        setCustomNames({});
      }}
      onOk={handleUploadAll}
      okText="Upload All"
      confirmLoading={isUploading}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      <Dragger {...uploadProps} style={{ padding: "60px 20px", minHeight: 260 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{DRAGGER[uploadKind]}</p>
        <p className="ant-upload-hint">Supports multiple files.</p>
      </Dragger>

      {uploadFiles.length > 0 && (
        <div className="mt-4 space-y-4">
          {uploadFiles.map((file) => (
            <Card
              key={file.uid}
              className="overflow-hidden"
              cover={
                <div className="relative">
                  {renderFilePreview(file)}
                  <hr />
                  <DeleteOutlined
                    onClick={() => handleRemove(file)}
                    className="absolute top-2 right-2 text-white bg-black/60 hover:bg-black p-1 rounded cursor-pointer text-lg"
                  />
                </div>
              }
            >
              <div className="mb-2">
                <label
                  htmlFor={`custom-name-${file.uid}`}
                  className="block mb-1 font-medium text-secondary-700"
                >
                  Custom Filename
                </label>
                <Input
                  id={`custom-name-${file.uid}`}
                  placeholder="Enter custom filename"
                  style={{
                    width: "100%",
                    borderRadius: "0",
                  }}
                  value={customNames[file.name] || ""}
                  onChange={(e) =>
                    setCustomNames((prev) => ({
                      ...prev,
                      [file.name]: e.target.value,
                    }))
                  }
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default MediaLibraryUploadModal;
