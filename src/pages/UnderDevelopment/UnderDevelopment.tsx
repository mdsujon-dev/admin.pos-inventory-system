import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { useLocation } from "react-router-dom";

const UnderDevelopment = () => {
  const location = useLocation(); // Get current route path

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full min-h-[80vh] flex-col items-center justify-center text-center"
    >
      <Wrench size={96} className="text-primary-500 mb-4" />

      <h2 className="mb-3 text-3xl font-semibold text-primary-600">
        This page is under development
      </h2>

      <p className="mb-2 text-sm text-gray-500">
        Route:{" "}
        <code className="text-primary underline">{location.pathname}</code>
      </p>

      <p className="mb-8 max-w-md text-gray-500">
        We're working hard to bring you this feature. Please check back soon or
        contact support if you need help.
      </p>
    </motion.div>
  );
};

export default UnderDevelopment;
