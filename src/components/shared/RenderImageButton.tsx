import { Button } from "antd";
import { RiDeleteBinLine } from "react-icons/ri";
import AntImage from "./AntImage";

interface RenderImageButtonProps {
  form: any;
  fieldPath: string;
  handleSetImageClick: any;
}

const RenderImageButton = ({
  form,
  fieldPath,
  handleSetImageClick,
}: RenderImageButtonProps) => {
  const pathArray = fieldPath
    .split(".")
    .map((key) => (/^\d+$/.test(key) ? Number(key) : key));
  const imageUrl = form.getFieldValue(pathArray);
  const handleDelete = (e: any) => {
    e.preventDefault();
    // const getFieldValue = form.getFieldValue(pathArray);
    form.setFieldValue(pathArray, null);
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="flex gap-3">
          <AntImage
            width={70}
            height={70}
            src={imageUrl}
            accessurl={true}
            alt="Preview"
            className="bg-secondary-100 overflow-hidden w-[80px] h-[80px] object-cover"
          />
          <Button
            type="default"
            size="small"
            onClick={handleDelete}
            danger icon={<RiDeleteBinLine size={15} />}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            className="px-4"
            type="default"
            onClick={() => handleSetImageClick(fieldPath)}
          >
            Set Image
          </Button>
        </div>
      )}
    </div>
  );
};

export default RenderImageButton;
