import { Button } from "antd";
import { motion } from "framer-motion";
import { ArrowLeft, Home, RefreshCcw } from "lucide-react";
import { Link, useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error: any = useRouteError();
  console.error("Route Error Caught:", error);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full min-h-[80vh] flex-col items-center justify-center text-center p-4"
    >
      <h1 className="mb-4 text-9xl font-bold text-primary-500">
        {error?.status || '404'}
      </h1>
      <h2 className="mb-6 text-3xl font-semibold">
        {error?.statusText || error?.message || 'Page Not Found'}
      </h2>
      <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
        {error?.data || "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."}
      </p>
      
      {error && (
        <pre className="text-left bg-gray-100 p-4 rounded mb-8 text-red-500 max-w-2xl overflow-auto text-sm">
          {error.stack || JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
        <Link to="/">
          <Button type="primary" icon={<Home size={16} />}>
            Back to Dashboard
          </Button>
        </Link>
        <Button
          type="default"
          icon={<ArrowLeft size={16} />}
          onClick={() => history.back()}
        >
          Go Back
        </Button>
        <Button
          type="dashed"
          icon={<RefreshCcw size={16} />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </div>
    </motion.div>
  );
};

export default ErrorPage;
