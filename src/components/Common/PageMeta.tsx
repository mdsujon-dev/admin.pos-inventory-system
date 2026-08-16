import { useEffect } from "react";

interface PageMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: "summary" | "summary_large_image";
  noindex?: boolean;
  nofollow?: boolean;
}

const PageMeta: React.FC<PageMetaProps> = ({
  title = "POS & Inventory Admin Panel",
  description = "POS & Inventory Admin Panel - Manage sales, stock, purchases and accounts",
  keywords = "POS, Inventory, Admin Panel, Sales, Stock, Accounts",
  canonicalUrl,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  noindex = false,
  nofollow = false,
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = "name") => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Robots meta
    const robotsContent = [
      noindex ? "noindex" : "index",
      nofollow ? "nofollow" : "follow",
    ].join(", ");
    updateMetaTag("robots", robotsContent);

    // Open Graph tags
    updateMetaTag("og:title", title, "property");
    updateMetaTag("og:description", description, "property");
    updateMetaTag("og:type", ogType, "property");
    if (ogImage) {
      updateMetaTag("og:image", ogImage, "property");
    }

    // Twitter Card tags
    updateMetaTag("twitter:card", twitterCard);
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    if (ogImage) {
      updateMetaTag("twitter:image", ogImage);
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonicalUrl);
    } else if (canonicalLink) {
      // Remove canonical if no URL provided
      canonicalLink.remove();
    }

    // Cleanup function
    return () => {
      // Optionally reset to default on unmount
      // document.title = "POS & Inventory Admin Panel";
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, twitterCard, noindex, nofollow]);

  return null; // This component doesn't render anything
};

export default PageMeta;







