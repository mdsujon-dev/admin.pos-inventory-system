import React from "react";
import { Modal, Table, Tag, Spin } from "antd";
import { Link } from "react-router-dom";
import { useGetMediaUsageQuery } from "../../../redux/features/media-library/media-libraryApi";

interface MediaUsageModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mediaId: string;
}

const MediaUsageModal: React.FC<MediaUsageModalProps> = ({ open, setOpen, mediaId }) => {
  const { data, isLoading } = useGetMediaUsageQuery(mediaId, { skip: !open || !mediaId });

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => {
        let color = "default";
        if (text === "Product") color = "blue";
        else if (text === "Category") color = "green";
        else if (text === "Blog") color = "purple";
        else if (text === "Brand") color = "magenta";
        else if (text === "Content") color = "orange";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        record.url ? <Link to={record.url}>View</Link> : <span>-</span>
      ),
    },
  ];

  return (
    <Modal
      title="Media Usage Details"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={600}
    >
      <div className="py-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {data?.data && data.data.length > 0 ? (
              <Table 
                dataSource={data.data} 
                columns={columns} 
                rowKey="id" 
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center text-secondary-500 py-8">
                This image is not currently used anywhere.
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default MediaUsageModal;
