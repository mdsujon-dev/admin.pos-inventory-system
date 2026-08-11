import { Modal, ModalProps } from "antd";

interface AntModalProps extends ModalProps {
  open: boolean;
  children: React.ReactNode;
  maskClosable?: boolean;
  setOpen: (val: boolean) => void;
  footer?: React.ReactNode;
}

const AntModal: React.FC<AntModalProps> = ({
  open,
  setOpen,
  children,
  footer,
  maskClosable = false,
  ...props
}) => {
  return (
    <Modal
      open={open}
      width={2000}
      onCancel={() => setOpen(false)}
      destroyOnClose
      maskClosable={maskClosable}
      footer={footer ?? null}
      cancelButtonProps={{ style: { display: "none" } }}
      okButtonProps={{ style: { display: "none" } }}
      closable
      {...props}
    >
      {children}
    </Modal>
  );
};

export default AntModal;
