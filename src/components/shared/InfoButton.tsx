import { Tooltip } from "antd";
import { AiOutlineQuestionCircle } from "react-icons/ai";

const InfoButton = ({ title }: { title: string }) => {
  return (
    <Tooltip title={title}>
      <AiOutlineQuestionCircle style={{ fontSize: "18px", color: "#4a5568" }} />
    </Tooltip>
  );
};

export default InfoButton;
