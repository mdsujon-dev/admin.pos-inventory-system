import { Tooltip } from "antd";
import { AiOutlineQuestionCircle } from "react-icons/ai";

const InfoButton = ({ title }: { title: string }) => {
  return (
    <Tooltip title={title}>
      <AiOutlineQuestionCircle style={{ fontSize: "18px", color: "#4d4d4d" }} />
    </Tooltip>
  );
};

export default InfoButton;
