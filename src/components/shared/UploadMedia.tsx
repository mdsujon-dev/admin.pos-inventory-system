import UploadImage from "./UploadImage";
import UploadVideo from "./UploadVideo";

interface UploadMediaProps {
  form: any;
  fieldPath: string;
  idFieldPath?: string | (string | number)[];
  mode?: "single" | "multiple";
  type: "image" | "video" | "audio" | "document" | "other";
}

const UploadMedia = ({
  form,
  fieldPath,
  idFieldPath,
  mode = "single",
  type,
}: UploadMediaProps) => {
  return (
   <>
    {type === "image" && <UploadImage form={form} fieldPath={fieldPath} idFieldPath={idFieldPath} mode={mode} />}
    {type === "video" && <UploadVideo form={form} fieldPath={fieldPath} idFieldPath={idFieldPath} />}
    {/* {type === "audio" && <UploadAudio form={form} fieldPath={fieldPath} mode={mode} />}
    {type === "document" && <UploadDocument form={form} fieldPath={fieldPath} mode={mode} />}
    {type === "other" && <UploadOther form={form} fieldPath={fieldPath} mode={mode} />} */}
    </>
  )
}

export default UploadMedia