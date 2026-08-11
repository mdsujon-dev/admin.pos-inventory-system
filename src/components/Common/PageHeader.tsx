import { Breadcrumb, Divider, Typography } from "antd";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

const { Title } = Typography;

interface BreadcrumbItem {
  title: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: ReactNode;
}

// chnages header to include breadcrumbs and extra content
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  extra,
}) => {
  return (
    <div className="mb-6">
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          className="mb-2"
          items={breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return {
              title:
                item.path && !isLast ? (
                  <Link to={item.path}>{item.title}</Link>
                ) : (
                  <span className={isLast ? "text-primary font-medium" : ""}>
                    {item.title}
                  </span>
                ),
            };
          })}
        />
      )}
      <div className="flex flex-col w-full sm:flex-row sm:items-center justify-between">
        <div>
          <Title level={4} className="!mb-0 !text-[23px] !text-secondary-800">
            {title}
          </Title>
          {subtitle && (
            <p className="text-secondary-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {extra && <div className="mt-4 sm:mt-0">{extra}</div>}
      </div>
      <Divider className="my-4" />
    </div>
  );
};

export default PageHeader;
