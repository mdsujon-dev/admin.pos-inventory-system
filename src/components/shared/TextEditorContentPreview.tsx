const TextEditorContentPreview = ({ content }: any) => {
  return (
    <div
      className="text-editor max-w-9xl mx-auto space-y-5"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default TextEditorContentPreview;
