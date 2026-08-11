import { Form, Input } from "antd";
import { UploadIcon } from "lucide-react";
import { useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import { config } from "../../config";
import SetMediaModal from "../modal/media/SetMediaModal";

interface UploadVideoProps {
  form: any;
  fieldPath: string | (string | number)[];
  idFieldPath?: string | (string | number)[];
  /** When true, prepend `config.image_access_url` for relative library paths */
  accessurl?: boolean;
}

function resolveVideoSrc(url: string | null | undefined, useAccessUrl: boolean) {
  if (!url) return "";
  if (!useAccessUrl || url.startsWith("http") || url.startsWith("//")) return url;
  const base = config.image_access_url?.replace(/\/$/, "") ?? "";
  const path = url.replace(/^\//, "");
  return `${base}/${path}`;
}

const UploadVideo = ({
  form,
  fieldPath,
  idFieldPath,
  accessurl = true,
}: UploadVideoProps) => {
  const [openModal, setOpenModal] = useState(false);

  const pathArray = (
    Array.isArray(fieldPath)
      ? fieldPath
      : fieldPath.split(".").map((key) => (/^\d+$/.test(key) ? Number(key) : key))
  ) as (string | number)[];

  const watched = Form.useWatch(pathArray, form);
  const fieldValue = (
    watched !== undefined ? watched : form.getFieldValue(pathArray)
  ) as string | null | undefined;
  const videoSrc = resolveVideoSrc(fieldValue, accessurl);

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.setFieldValue(pathArray, null);
    if (idFieldPath) form.setFieldValue(idFieldPath, null);
  };

  const handleSelect = (selected: string | string[], selectedData?: any) => {
    const value = Array.isArray(selected) ? selected[0] : selected;
    form.setFieldValue(pathArray, value);
    if (idFieldPath && selectedData) {
      form.setFieldValue(idFieldPath, selectedData._id || selectedData.id || selectedData.name || selectedData.path);
    }
    setOpenModal(false);
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
      {fieldValue ? (
        <div className="relative w-[200px] h-[125px] cursor-pointer">
        
         
          <div className="rounded-md border border-secondary-200 overflow-hidden bg-black shadow-sm">
            <video
              key={videoSrc}
              className="w-full h-[125px] object-cover"
              controls
              playsInline
              preload="metadata"
              src={videoSrc}
            />
          </div>
           <button
              onClick={handleDelete}
              className="absolute top-1 right-1 bg-white border border-primary-500 text-primary-600 p-2 rounded-lg shadow hover:bg-primary-600 hover:text-white transition-colors"
            >
              <RiDeleteBinLine size={16} />
            </button>
        </div>
      ) : (
       
         <button
            type="button"
           onClick={() => setOpenModal(true)}
            className="flex flex-col items-center justify-center w-[200px] h-[125px] border border-dashed border-secondary-300 rounded-lg bg-secondary-50 hover:border-primary-400 transition-colors duration-200 cursor-pointer"
          >
            <UploadIcon className="w-8 h-8 text-secondary-400 mb-2" />
            <span className="text-sm text-secondary-500 text-center">
              Upload Video
            </span>
          </button>
      )}

      {openModal && (
        <SetMediaModal
          open={openModal}
          setOpen={setOpenModal}
          onSelectImage={handleSelect}
          selectionMode="single"
          initialSelected={
            typeof fieldValue === "string" ? fieldValue : undefined
          }
          type="video"
        />
      )}
    </div>
  );
};

export default UploadVideo;
