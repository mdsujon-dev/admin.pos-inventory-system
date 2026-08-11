import {
  ApiOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import { format } from "date-fns";

import AntModal from "../shared/AntModal";
const getStatusColor = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  if (statusCode >= 500) return "error";
  return "default";
};

const getStatusIcon = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) return <CheckCircleOutlined />;
  if (statusCode >= 400 && statusCode < 500)
    return <ExclamationCircleOutlined />;
  if (statusCode >= 500) return <CloseCircleOutlined />;
  return <ClockCircleOutlined />;
};

const getMethodColor = (method: string) => {
  switch (method) {
    case "GET":
      return "blue";
    case "POST":
      return "green";
    case "PUT":
      return "orange";
    case "DELETE":
      return "red";
    case "PATCH":
      return "purple";
    default:
      return "default";
  }
};

const ActionLogViewModal = ({
  open,
  setOpen,
  data,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data: any;
}) => {
  return (
    <AntModal maskClosable open={open} setOpen={setOpen} title={"Action Log"}>
      <div className="space-y-6">
        {/* Basic Info */}

        <div className="space-y-3">
          <div className="border border-border rounded-lg p-4 bg-card">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <UserOutlined className="text-primary" />
              User Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{data?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <Tag color="var(--primary)">{data?.role}</Tag>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border border-border rounded-lg p-4 bg-card">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ApiOutlined className="text-primary" />
              Request Details
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <Tag color={getMethodColor(data?.method)} className="font-mono">
                  {data?.method}
                </Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action:</span>
                <span className="font-medium">{data?.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Req Status:</span>
                <Tag
                  color={getStatusColor(data?.requestStatusCode)}
                  icon={getStatusIcon(data?.requestStatusCode)}
                  className="font-mono"
                >
                  {data?.requestStatusCode}
                </Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Res Status:</span>
                <Tag
                  color={getStatusColor(data?.responseStatusCode)}
                  icon={getStatusIcon(data?.responseStatusCode)}
                  className="font-mono"
                >
                  {data?.responseStatusCode}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h4 className="font-semibold mb-3">Route</h4>
          <div className="bg-muted p-3 rounded font-mono text-sm break-all">
            {data?.route}
          </div>
        </div>

        {/* Timestamp */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <ClockCircleOutlined className="text-primary" />
            Timestamp
          </h4>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <span className="text-muted-foreground">Date: </span>
              <span className="font-medium">
                {format(new Date(data?.timestamp), "MMMM dd, yyyy")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Time: </span>
              <span className="font-medium">
                {format(new Date(data?.timestamp), "HH:mm:ss")}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <GlobalOutlined className="text-primary" />
            Lead Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">IP Address: </span>
              <span className="font-mono font-medium">
                {data?.leadDetails.ipAddress}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Accessed At: </span>
              <span className="font-medium">
                {format(
                  new Date(data?.leadDetails.accessedAt),
                  "MMM dd, yyyy HH:mm:ss"
                )}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Browser URL: </span>
              <div className="bg-muted p-2 rounded font-mono text-sm break-all mt-1">
                {data?.leadDetails.browserUrl}
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">User Agent: </span>
              <div className="bg-muted p-2 rounded font-mono text-sm break-all mt-1">
                {data?.leadDetails.userAgent}
              </div>
            </div>
          </div>
        </div>

        {/* Server Details */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h4 className="font-semibold mb-3">Server Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-muted-foreground">Hostname: </span>
              <span className="font-medium">
                {data?.serverDetails.hostname}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Platform: </span>
              <span className="font-medium capitalize">
                {data?.serverDetails.platform}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Uptime: </span>
              <span className="font-medium">{data?.serverDetails.uptime}</span>
            </div>
          </div>
        </div>
      </div>
    </AntModal>
  );
};

export default ActionLogViewModal;
