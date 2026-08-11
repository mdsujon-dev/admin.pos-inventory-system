import { FileTextIcon, UploadIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import SetMediaModal from "../modal/media/SetMediaModal";
import AntImage from "./AntImage";
import { Form, Input } from "antd";
import { config } from "../../config";

interface UploadImageProps {
  form: any;
  fieldPath: string | (string | number)[];
  idFieldPath?: string | (string | number)[];
  mode?: "single" | "multiple";
  /**
   * What kind of file this slot holds. "document" switches the picker to PDFs
   * and other handouts — without it a syllabus PDF can never be attached,
   * because the media picker only ever offered images.
   */
  mediaKind?: "image" | "document";
}

const UploadImage = ({
  form,
  fieldPath,
  idFieldPath,
  mode = "single",
  mediaKind = "image",
}: UploadImageProps) => {
  const [openSetImageModal, setOpenSetImageModal] = useState(false);
  const isDoc = mediaKind === "document";
  const uploadLabel = isDoc ? "Upload File" : "Upload Image";

  const pathArray = useMemo(() => {
    return Array.isArray(fieldPath)
      ? fieldPath
      : fieldPath
          .split(".")
          .map((key) => (/^\d+$/.test(key) ? Number(key) : key));
  }, [fieldPath]);

  const fieldValue = Form.useWatch(pathArray, form);

  const imageUrls =
    mode === "multiple"
      ? Array.isArray(fieldValue)
        ? fieldValue
        : fieldValue
        ? [fieldValue]
        : []
      : fieldValue;

  const handleDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    url?: string
  ) => {
    e.preventDefault();
    if (mode === "multiple") {
      const updated = imageUrls.filter((img: string) => img !== url);
      form.setFieldValue(pathArray, updated);
      // In multiple mode, we don't easily know which ID corresponds to the deleted URL
      // If we wanted to, we'd need to filter the IDs array as well, but for now we'll just leave it or reset it if needed.
    } else {
      form.setFieldValue(pathArray, null);
      if (idFieldPath) {
        form.setFieldValue(idFieldPath, null);
      }
    }
  };

  const handleImageSelect = (selected: string | string[], selectedData?: any) => {
    if (mode === "multiple") {
      const updated = Array.isArray(selected) ? selected : [selected];
      form.setFieldValue(pathArray, updated);
      
      if (idFieldPath && selectedData) {
        form.setFieldValue(idFieldPath, selectedData.map((d: any) => d._id || d.id || d.name || d.path));
      }
    } else {
      form.setFieldValue(pathArray, selected);
      
      if (idFieldPath && selectedData) {
        form.setFieldValue(idFieldPath, selectedData._id || selectedData.id || selectedData.name || selectedData.path);
      }
    }
    setOpenSetImageModal(false);
  };

  // A PDF has no thumbnail, so its tile is the file name plus a link that
  // opens it — the same click that would have previewed an image.
  const DocTile = ({ url }: { url: string }) => {
    const href = url?.startsWith("http")
      ? url
      : `${config.image_access_url}/${url}`;
    const name = decodeURIComponent(String(url).split("/").pop() || "file");
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={name}
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border border-secondary-200 bg-secondary-50 p-2 text-secondary-500 hover:border-primary-400"
      >
        <FileTextIcon className="h-7 w-7" />
        <span className="w-full truncate text-center text-[10px]">{name}</span>
      </a>
    );
  };

  return (
    <div className="space-y-2">
      <Form.Item name={pathArray} hidden>
        <Input />
      </Form.Item>
      {idFieldPath && (
        <Form.Item name={idFieldPath} hidden>
          <Input />
        </Form.Item>
      )}
      {/* Single mode */}
      {mode === "single" ? (
        imageUrls ? (
          <div
            className="relative w-[125px] h-[125px] cursor-pointer"
            // onClick={() => setOpenSetImageModal(true)}
          >
            {isDoc ? (
              <DocTile url={imageUrls} />
            ) : (
              <AntImage
                width={125}
                height={125}
                src={imageUrls}
                accessurl={!imageUrls?.startsWith("http")}
                alt="Preview"
                className="w-full h-full object-cover rounded-md border border-secondary-200 shadow-sm"
              />
            )}
            <button
              onClick={handleDelete}
              className="absolute top-1 right-1 bg-white border border-red-500 text-red-500 p-2 rounded-lg shadow hover:bg-red-600 hover:text-white transition-colors"
            >
              <RiDeleteBinLine size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpenSetImageModal(true)}
            className="flex flex-col items-center justify-center w-32 h-32 border border-dashed border-secondary-300 rounded-lg bg-secondary-50 hover:border-primary-400 transition-colors duration-200 cursor-pointer"
          >
            <UploadIcon className="w-8 h-8 text-secondary-400 mb-2" />
            <span className="text-sm text-secondary-500 text-center">
              {uploadLabel}
            </span>
          </button>
        )
      ) : (
        // Multiple mode
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url: string, index: number) => (
            <div key={index} className="relative w-[120px] h-[120px]">
              {isDoc ? (
                <DocTile url={url} />
              ) : (
                <AntImage
                  width={120}
                  height={120}
                  src={url}
                  accessurl={!url?.startsWith("http")}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-md border border-secondary-200 shadow-sm"
                />
              )}
              <button
                onClick={(e) => handleDelete(e, url)}
                className="absolute top-1 right-1 bg-white border border-red-500 text-red-500 p-2 rounded-lg shadow hover:bg-red-600 hover:text-white transition-colors"
              >
                <RiDeleteBinLine size={16} />
              </button>
            </div>
          ))}

          {/* Always show Upload button in multiple mode */}
          <button
            type="button"
            onClick={() => setOpenSetImageModal(true)}
            className="flex flex-col items-center justify-center w-32 h-32 border border-dashed border-secondary-300 rounded-lg bg-secondary-50 hover:border-primary-400 transition-colors duration-200 cursor-pointer"
          >
            <UploadIcon className="w-8 h-8 text-secondary-400 mb-2" />
            <span className="text-sm text-secondary-500 text-center">
              {uploadLabel}
            </span>
          </button>
        </div>
      )}

      {openSetImageModal && (
        <SetMediaModal
          open={openSetImageModal}
          setOpen={setOpenSetImageModal}
          onSelectImage={handleImageSelect}
          selectionMode={mode}
          initialSelected={mode === "multiple" ? imageUrls : undefined}
          type={mediaKind}
        />
      )}
    </div>
  );
};

export default UploadImage;
