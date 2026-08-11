import { toast } from "react-toastify";

export const copyToClipboard = (text: string): void => {
  // Create a temporary textarea element
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);

  // Select the text in the textarea
  textarea.select();
  textarea.setSelectionRange(0, 99999); // For mobile devices

  // Copy the text to the clipboard
  const successful = document.execCommand("copy");

  // Remove the temporary textarea
  document.body.removeChild(textarea);

  if (successful) {
    toast.success("Copied to clipboard!");
  } else {
    toast.error("Failed to copy!");
  }
};
