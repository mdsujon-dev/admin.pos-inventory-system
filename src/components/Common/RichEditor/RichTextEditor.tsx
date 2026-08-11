import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
}

const FONT_FAMILIES: { label: string; stack: string }[] = [
  { label: 'Inter', stack: 'Inter, system-ui, sans-serif' },
  { label: 'Arial', stack: 'arial, helvetica, sans-serif' },
  { label: 'Arial Black', stack: 'arial black, sans-serif' },
  { label: 'Arial Narrow', stack: 'arial narrow, sans-serif' },
  { label: 'Helvetica', stack: 'helvetica, arial, sans-serif' },
  { label: 'Helvetica Neue', stack: 'helvetica neue, helvetica, arial, sans-serif' },
  { label: 'Tahoma', stack: 'tahoma, geneva, sans-serif' },
  { label: 'Verdana', stack: 'verdana, geneva, sans-serif' },
  { label: 'Trebuchet MS', stack: 'trebuchet ms, sans-serif' },
  { label: 'Segoe UI', stack: 'segoe ui, system-ui, sans-serif' },
  { label: 'Calibri', stack: 'calibri, sans-serif' },
  { label: 'Candara', stack: 'candara, sans-serif' },
  { label: 'Outfit', stack: 'Outfit, Arial, sans-serif' },
  { label: 'Roboto', stack: 'Roboto, Arial, sans-serif' },
  { label: 'Open Sans', stack: 'Open Sans, Arial, sans-serif' },
  { label: 'Lato', stack: 'Lato, Arial, sans-serif' },
  { label: 'Montserrat', stack: 'Montserrat, Arial, sans-serif' },
  { label: 'Poppins', stack: 'Poppins, Arial, sans-serif' },
  { label: 'Nunito', stack: 'Nunito, Arial, sans-serif' },
  { label: 'Raleway', stack: 'Raleway, Arial, sans-serif' },
  { label: 'Source Sans Pro', stack: 'Source Sans Pro, Arial, sans-serif' },
  { label: 'Ubuntu', stack: 'Ubuntu, Arial, sans-serif' },
  { label: 'PT Sans', stack: 'PT Sans, Arial, sans-serif' },
  { label: 'Noto Sans', stack: 'Noto Sans, Arial, sans-serif' },
  { label: 'Work Sans', stack: 'Work Sans, Arial, sans-serif' },
  { label: 'Oswald', stack: 'Oswald, Arial, sans-serif' },
  { label: 'Georgia', stack: 'georgia, palatino, serif' },
  { label: 'Times New Roman', stack: 'times new roman, times, serif' },
  { label: 'Times', stack: 'times, serif' },
  { label: 'Garamond', stack: 'garamond, serif' },
  { label: 'Palatino', stack: 'palatino, palatino linotype, serif' },
  { label: 'Cambria', stack: 'cambria, serif' },
  { label: 'Book Antiqua', stack: 'book antiqua, palatino, serif' },
  { label: 'Baskerville', stack: 'baskerville, serif' },
  { label: 'Didot', stack: 'didot, serif' },
  { label: 'Merriweather', stack: 'Merriweather, Georgia, serif' },
  { label: 'Playfair Display', stack: 'Playfair Display, Georgia, serif' },
  { label: 'PT Serif', stack: 'PT Serif, Georgia, serif' },
  { label: 'Lora', stack: 'Lora, Georgia, serif' },
  { label: 'Noto Serif', stack: 'Noto Serif, Georgia, serif' },
  { label: 'Crimson Text', stack: 'Crimson Text, Georgia, serif' },
  { label: 'Libre Baskerville', stack: 'Libre Baskerville, Georgia, serif' },
  { label: 'Courier New', stack: 'courier new, courier, monospace' },
  { label: 'Courier', stack: 'courier, monospace' },
  { label: 'Consolas', stack: 'consolas, monospace' },
  { label: 'Monaco', stack: 'monaco, monospace' },
  { label: 'Menlo', stack: 'menlo, monospace' },
  { label: 'Fira Code', stack: 'Fira Code, monospace' },
  { label: 'Source Code Pro', stack: 'Source Code Pro, monospace' },
  { label: 'JetBrains Mono', stack: 'JetBrains Mono, monospace' },
  { label: 'Roboto Mono', stack: 'Roboto Mono, monospace' },
  { label: 'Inconsolata', stack: 'Inconsolata, monospace' },
  { label: 'Lucida Console', stack: 'lucida console, monospace' },
  { label: 'Comic Sans MS', stack: 'comic sans ms, cursive' },
  { label: 'Brush Script MT', stack: 'brush script mt, cursive' },
  { label: 'Impact', stack: 'impact, sans-serif' },
  { label: 'Lucida Sans', stack: 'lucida sans, lucida grande, sans-serif' },
  { label: 'Copperplate', stack: 'copperplate, papyrus, fantasy' },
];

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderFontList = (filter: string) => {
  const q = filter.trim().toLowerCase();
  const matches = q
    ? FONT_FAMILIES.filter((f) => f.label.toLowerCase().includes(q))
    : FONT_FAMILIES;
  if (matches.length === 0) {
    return '<div style="padding:16px;color:#9ca3af;text-align:center;font-size:13px;">No fonts match</div>';
  }
  return matches
    .map(
      (f) => `
      <button type="button" class="rte-font-item"
        data-stack="${escapeHtml(f.stack)}"
        data-label="${escapeHtml(f.label)}"
        style="display:block;width:100%;text-align:left;padding:10px 14px;border:0;border-bottom:1px solid #f1f5f9;background:#fff;cursor:pointer;font-family:${escapeHtml(f.stack)};font-size:15px;color:#1f2937;line-height:1.3;">
        ${escapeHtml(f.label)}
      </button>`
    )
    .join('');
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder,
  height = 480,
}) => {
  const editorRef = useRef<any>(null);

  return (
    <div className="rich-text-editor-wrapper border border-gray-200 overflow-hidden focus-within:border-primary focus-within:ring-2 rounded-lg focus-within:ring-primary/15 transition-colors">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        onInit={(_evt: any, editor: any) => {
          editorRef.current = editor;
        }}
        value={value}
        onEditorChange={(content: string) => onChange?.(content)}
        init={{
          height,
          menubar: 'file edit view insert format tools table help',
          menu: {
            file: {
              title: 'File',
              items: 'newdocument restoredraft | preview | print',
            },
            edit: {
              title: 'Edit',
              items:
                'undo redo | cut copy paste pastetext | selectall | searchreplace',
            },
            view: {
              title: 'View',
              items:
                'code | visualaid visualchars visualblocks | preview fullscreen',
            },
            insert: {
              title: 'Insert',
              items:
                'image link media addcomment pageembed codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor insertdatetime',
            },
            format: {
              title: 'Format',
              items:
                'bold italic underline strikethrough superscript subscript codeformat | styles blocks fontfamilysearch fontsize align lineheight | forecolor backcolor | language | removeformat',
            },
            tools: {
              title: 'Tools',
              items: 'code wordcount',
            },
            table: {
              title: 'Table',
              items:
                'inserttable | cell row column | advtablesort | tableprops deletetable',
            },
            help: { title: 'Help', items: 'help' },
          },
          placeholder:
            placeholder || 'Start writing — paste freely, format with the toolbar...',

          plugins: [
            'accordion',
            'advlist',
            'anchor',
            'autolink',
            'autosave',
            'charmap',
            'code',
            'codesample',
            'directionality',
            'emoticons',
            'fullscreen',
            'help',
            'image',
            'importcss',
            'insertdatetime',
            'link',
            'lists',
            'media',
            'nonbreaking',
            'pagebreak',
            'preview',
            'quickbars',
            'save',
            'searchreplace',
            'table',
            'visualblocks',
            'visualchars',
            'wordcount',
          ],

          setup: (editor: any) => {
            const SNIPPETS = [
              {
                label: 'Greeting',
                html: '<p>Dear Hiring Team,</p><p>&nbsp;</p>',
              },
              {
                label: 'Strong opener',
                html: '<p>I am excited to apply for this role and believe my background aligns well with what you are looking for.</p>',
              },
              {
                label: 'Experience summary',
                html: '<p>Over the past <strong>X years</strong>, I have worked extensively with <em>[skill/tool]</em>, leading projects that delivered <em>[outcome]</em>.</p>',
              },
              {
                label: 'Why this company',
                html: '<p>What draws me to <strong>[Company]</strong> is your focus on <em>[mission/product]</em> — it resonates with my own values and goals.</p>',
              },
              {
                label: 'Skills bullets',
                html: '<ul><li><strong>Skill 1</strong> — brief context</li><li><strong>Skill 2</strong> — brief context</li><li><strong>Skill 3</strong> — brief context</li></ul>',
              },
              {
                label: 'Closing',
                html: '<p>I would welcome the chance to discuss how I can contribute. Thank you for your time and consideration.</p><p>Sincerely,<br>[Your name]</p>',
              },
            ];

            editor.ui.registry.addButton('snippets', {
              icon: 'template',
              text: 'Snippets',
              tooltip: 'Insert reusable snippets',
              onAction: () => {
                const items = SNIPPETS.map(
                  (s, i) =>
                    `<button type="button" class="rte-snippet-item" data-idx="${i}" style="display:block;width:100%;text-align:left;padding:10px 14px;border:0;border-bottom:1px solid #f1f5f9;background:#fff;cursor:pointer;font-size:14px;color:#1f2937;">${escapeHtml(s.label)}</button>`
                ).join('');

                const dlg = editor.windowManager.open({
                  title: 'Insert snippet',
                  size: 'medium',
                  body: {
                    type: 'panel',
                    items: [
                      {
                        type: 'htmlpanel',
                        html: `<div id="rte-snippet-list" style="max-height:400px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;background:#fff;">${items}</div>`,
                      },
                    ],
                  },
                  buttons: [{ type: 'cancel', text: 'Close' }],
                });

                requestAnimationFrame(() => {
                  document
                    .getElementById('rte-snippet-list')
                    ?.addEventListener('click', (e) => {
                      const btn = (e.target as HTMLElement)?.closest(
                        '.rte-snippet-item'
                      ) as HTMLElement | null;
                      if (!btn) return;
                      const idx = Number(btn.getAttribute('data-idx'));
                      const snip = SNIPPETS[idx];
                      if (snip) {
                        editor.insertContent(snip.html);
                        dlg.close();
                      }
                    });
                });
              },
            });

            editor.ui.registry.addButton('fontfamilysearch', {
              icon: 'text-color',
              text: 'Font',
              tooltip: 'Font family (searchable)',
              onAction: () => {
                const dialog = editor.windowManager.open({
                  title: 'Choose font family',
                  size: 'medium',
                  body: {
                    type: 'panel',
                    items: [
                      {
                        type: 'htmlpanel',
                        html: `
                          <div style="display:flex;flex-direction:column;gap:8px;">
                            <input
                              type="text"
                              id="rte-font-search"
                              placeholder="Type to search fonts..."
                              autocomplete="off"
                              style="width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;outline:none;"
                            />
                            <div id="rte-font-list" style="max-height:380px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;background:#fff;">
                              ${renderFontList('')}
                            </div>
                          </div>
                        `,
                      },
                    ],
                  },
                  buttons: [{ type: 'cancel', text: 'Close' }],
                });

                requestAnimationFrame(() => {
                  const input = document.getElementById(
                    'rte-font-search'
                  ) as HTMLInputElement | null;
                  const list = document.getElementById('rte-font-list');
                  if (!input || !list) return;

                  input.focus();

                  input.addEventListener('input', () => {
                    list.innerHTML = renderFontList(input.value);
                  });

                  list.addEventListener('click', (e) => {
                    const btn = (e.target as HTMLElement)?.closest(
                      '.rte-font-item'
                    ) as HTMLElement | null;
                    if (!btn) return;
                    const stack = btn.getAttribute('data-stack');
                    if (stack) {
                      editor.execCommand('FontName', false, stack);
                      dialog.close();
                    }
                  });
                });
              },
            });
          },

          toolbar: [
            'undo redo | save restoredraft | blocks fontfamilysearch fontsize | bold italic underline strikethrough subscript superscript | forecolor backcolor | removeformat',
            'cut copy paste pastetext | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote codesample | link unlink anchor openlink',
            'searchreplace | ltr rtl | lineheight | visualblocks visualchars nonbreaking | preview fullscreen code print | help | emoticons charmap insertdatetime | image media table hr pagebreak accordion',
          ].join(' | '),
          toolbar_mode: 'wrap',
          toolbar_sticky: false,
          toolbar_groups: {
            formatting: {
              icon: 'format',
              tooltip: 'Formatting',
              items: 'bold italic underline strikethrough | superscript subscript',
            },
          },

          quickbars_selection_toolbar:
            'bold italic underline | h2 h3 blockquote | forecolor backcolor | quicklink',
          quickbars_insert_toolbar: 'quickimage quicktable | hr',
          quickbars_image_toolbar:
            'alignleft aligncenter alignright | rotateleft rotateright | imageoptions',

          contextmenu: 'link image table configurepermanentpen',

          statusbar: true,
          elementpath: true,
          wordcount_show_words: true,
          wordcount_show_characters: true,

          autosave_ask_before_unload: true,
          autosave_interval: '10s',
          autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
          autosave_restore_when_empty: false,
          autosave_retention: '30m',

          paste_data_images: true,
          paste_block_drop: false,
          paste_as_text: false,
          paste_webkit_styles: 'all',
          paste_retain_style_properties: 'all',
          paste_remove_styles_if_webkit: false,
          smart_paste: true,

          image_caption: true,
          image_advtab: true,
          image_title: true,
          image_description: true,
          image_dimensions: true,
          image_class_list: [
            { title: 'Responsive', value: 'img-fluid' },
            { title: 'Rounded', value: 'img-rounded' },
            { title: 'Shadow', value: 'img-shadow' },
            { title: 'Border', value: 'img-bordered' },
          ],
          object_resizing: true,

          link_default_target: '_blank',
          link_default_protocol: 'https',
          link_assume_external_targets: true,
          link_context_toolbar: true,
          link_title: true,
          link_quicklink: true,
          link_class_list: [
            { title: 'None', value: '' },
            { title: 'Button', value: 'btn-link' },
            { title: 'Muted', value: 'text-muted-link' },
          ],

          media_live_embeds: true,
          media_alt_source: false,
          media_poster: true,
          media_dimensions: true,

          table_default_attributes: { border: '1' },
          table_default_styles: {
            'border-collapse': 'collapse',
            width: '100%',
          },
          table_responsive_width: true,
          table_class_list: [
            { title: 'None', value: '' },
            { title: 'Striped', value: 'table-striped' },
            { title: 'Bordered', value: 'table-bordered' },
            { title: 'Hover', value: 'table-hover' },
          ],
          table_toolbar:
            'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablecellprops tablerowprops',
          table_grid: true,
          table_resize_bars: true,

          importcss_append: true,
          importcss_merge_classes: true,
          importcss_exclusive: false,

          save_enablewhendirty: true,
          save_onsavecallback: () => {
            // Hook for Ctrl+S — autosave already handles draft persistence
          },

          color_cols: 8,
          color_map: [
            '000000', 'Black',
            '434343', 'Dark Gray 4',
            '666666', 'Dark Gray 3',
            '999999', 'Dark Gray 2',
            'B7B7B7', 'Dark Gray 1',
            'CCCCCC', 'Gray',
            'D9D9D9', 'Light Gray 1',
            'EFEFEF', 'Light Gray 2',
            'F3F3F3', 'Light Gray 3',
            'FFFFFF', 'White',
            '980000', 'Red Berry',
            'FF0000', 'Red',
            'FF9900', 'Orange',
            'FFFF00', 'Yellow',
            '00FF00', 'Green',
            '00FFFF', 'Cyan',
            '4A86E8', 'Cornflower Blue',
            '0000FF', 'Blue',
            '9900FF', 'Purple',
            'FF00FF', 'Magenta',
            'E6B8AF', 'Light Red Berry 3',
            'F4CCCC', 'Light Red 3',
            'FCE5CD', 'Light Orange 3',
            'FFF2CC', 'Light Yellow 3',
            'D9EAD3', 'Light Green 3',
            'D0E0E3', 'Light Cyan 3',
            'C9DAF8', 'Light Cornflower Blue 3',
            'CFE2F3', 'Light Blue 3',
            'D9D2E9', 'Light Purple 3',
            'EAD1DC', 'Light Magenta 3',
            '35AD0B', 'Brand Primary',
            '0F1112', 'Brand Secondary',
          ],

          style_formats_merge: true,
          style_formats: [
            {
              title: 'Headings',
              items: [
                { title: 'Heading 1', format: 'h1' },
                { title: 'Heading 2', format: 'h2' },
                { title: 'Heading 3', format: 'h3' },
                { title: 'Heading 4', format: 'h4' },
                { title: 'Heading 5', format: 'h5' },
                { title: 'Heading 6', format: 'h6' },
              ],
            },
            {
              title: 'Inline',
              items: [
                { title: 'Bold', format: 'bold' },
                { title: 'Italic', format: 'italic' },
                { title: 'Underline', format: 'underline' },
                { title: 'Strikethrough', format: 'strikethrough' },
                { title: 'Superscript', format: 'superscript' },
                { title: 'Subscript', format: 'subscript' },
                { title: 'Code', format: 'code' },
              ],
            },
            {
              title: 'Blocks',
              items: [
                { title: 'Paragraph', format: 'p' },
                { title: 'Blockquote', format: 'blockquote' },
                { title: 'Div', format: 'div' },
                { title: 'Pre', format: 'pre' },
              ],
            },
            {
              title: 'Callouts',
              items: [
                {
                  title: 'Info callout',
                  block: 'div',
                  classes: 'callout callout-info',
                  styles: {
                    background: '#eff6ff',
                    'border-left': '4px solid #3b82f6',
                    padding: '12px 16px',
                    'border-radius': '6px',
                    margin: '12px 0',
                  },
                },
                {
                  title: 'Success callout',
                  block: 'div',
                  classes: 'callout callout-success',
                  styles: {
                    background: '#ecfdf5',
                    'border-left': '4px solid #10b981',
                    padding: '12px 16px',
                    'border-radius': '6px',
                    margin: '12px 0',
                  },
                },
                {
                  title: 'Warning callout',
                  block: 'div',
                  classes: 'callout callout-warning',
                  styles: {
                    background: '#fffbeb',
                    'border-left': '4px solid #f59e0b',
                    padding: '12px 16px',
                    'border-radius': '6px',
                    margin: '12px 0',
                  },
                },
                {
                  title: 'Danger callout',
                  block: 'div',
                  classes: 'callout callout-danger',
                  styles: {
                    background: '#fef2f2',
                    'border-left': '4px solid #ef4444',
                    padding: '12px 16px',
                    'border-radius': '6px',
                    margin: '12px 0',
                  },
                },
              ],
            },
            {
              title: 'Highlights',
              items: [
                {
                  title: 'Yellow highlight',
                  inline: 'span',
                  styles: { 'background-color': '#fef08a', padding: '0 4px' },
                },
                {
                  title: 'Green highlight',
                  inline: 'span',
                  styles: { 'background-color': '#bbf7d0', padding: '0 4px' },
                },
                {
                  title: 'Pink highlight',
                  inline: 'span',
                  styles: { 'background-color': '#fbcfe8', padding: '0 4px' },
                },
              ],
            },
          ],

          line_height_formats: '1 1.15 1.25 1.5 1.75 2 2.5 3',

          spellchecker_language: 'en',
          browser_spellcheck: true,

          noneditable_class: 'mceNonEditable',
          editable_class: 'mceEditable',

          allow_html_in_named_anchor: true,
          convert_urls: false,
          relative_urls: false,
          remove_script_host: false,

          branding: false,
          promotion: false,

          font_size_formats:
            '10px 12px 14px 15px 16px 18px 20px 22px 24px 28px 32px 36px 42px 48px 60px 72px',
          font_family_formats: [
            'Inter=Inter, system-ui, sans-serif',
            'Arial=arial, helvetica, sans-serif',
            'Arial Black=arial black, sans-serif',
            'Arial Narrow=arial narrow, sans-serif',
            'Helvetica=helvetica, arial, sans-serif',
            'Helvetica Neue=helvetica neue, helvetica, arial, sans-serif',
            'Tahoma=tahoma, geneva, sans-serif',
            'Verdana=verdana, geneva, sans-serif',
            'Trebuchet MS=trebuchet ms, sans-serif',
            'Segoe UI=segoe ui, system-ui, sans-serif',
            'Calibri=calibri, sans-serif',
            'Candara=candara, sans-serif',
            'Outfit=Outfit, Arial, sans-serif',
            'Roboto=Roboto, Arial, sans-serif',
            'Open Sans=Open Sans, Arial, sans-serif',
            'Lato=Lato, Arial, sans-serif',
            'Montserrat=Montserrat, Arial, sans-serif',
            'Poppins=Poppins, Arial, sans-serif',
            'Nunito=Nunito, Arial, sans-serif',
            'Raleway=Raleway, Arial, sans-serif',
            'Source Sans Pro=Source Sans Pro, Arial, sans-serif',
            'Ubuntu=Ubuntu, Arial, sans-serif',
            'PT Sans=PT Sans, Arial, sans-serif',
            'Noto Sans=Noto Sans, Arial, sans-serif',
            'Work Sans=Work Sans, Arial, sans-serif',
            'Oswald=Oswald, Arial, sans-serif',
            'Georgia=georgia, palatino, serif',
            'Times New Roman=times new roman, times, serif',
            'Times=times, serif',
            'Garamond=garamond, serif',
            'Palatino=palatino, palatino linotype, serif',
            'Cambria=cambria, serif',
            'Book Antiqua=book antiqua, palatino, serif',
            'Baskerville=baskerville, serif',
            'Didot=didot, serif',
            'Merriweather=Merriweather, Georgia, serif',
            'Playfair Display=Playfair Display, Georgia, serif',
            'PT Serif=PT Serif, Georgia, serif',
            'Lora=Lora, Georgia, serif',
            'Noto Serif=Noto Serif, Georgia, serif',
            'Crimson Text=Crimson Text, Georgia, serif',
            'Libre Baskerville=Libre Baskerville, Georgia, serif',
            'Courier New=courier new, courier, monospace',
            'Courier=courier, monospace',
            'Consolas=consolas, monospace',
            'Monaco=monaco, monospace',
            'Menlo=menlo, monospace',
            'Fira Code=Fira Code, monospace',
            'Source Code Pro=Source Code Pro, monospace',
            'JetBrains Mono=JetBrains Mono, monospace',
            'Roboto Mono=Roboto Mono, monospace',
            'Inconsolata=Inconsolata, monospace',
            'Lucida Console=lucida console, monospace',
            'Comic Sans MS=comic sans ms, cursive',
            'Brush Script MT=brush script mt, cursive',
            'Impact=impact, sans-serif',
            'Lucida Sans=lucida sans, lucida grande, sans-serif',
            'Copperplate=copperplate, papyrus, fantasy',
          ].join(';'),
          block_formats:
            'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Blockquote=blockquote; Code=pre; Preformatted=pre',

          codesample_languages: [
            { text: 'HTML/XML', value: 'markup' },
            { text: 'JavaScript', value: 'javascript' },
            { text: 'TypeScript', value: 'typescript' },
            { text: 'CSS', value: 'css' },
            { text: 'PHP', value: 'php' },
            { text: 'Ruby', value: 'ruby' },
            { text: 'Python', value: 'python' },
            { text: 'Java', value: 'java' },
            { text: 'C', value: 'c' },
            { text: 'C#', value: 'csharp' },
            { text: 'C++', value: 'cpp' },
            { text: 'Go', value: 'go' },
            { text: 'Rust', value: 'rust' },
            { text: 'Bash', value: 'bash' },
            { text: 'JSON', value: 'json' },
            { text: 'SQL', value: 'sql' },
          ],

          content_style: `
            body {
              font-family: Outfit, 'Segoe UI', system-ui, -apple-system, sans-serif;
              font-size: 15px;
              line-height: 1.65;
              color: #1f2937;
              padding: 16px;
            }
            body p { margin: 0 0 0.75em; }
            body h1 { font-size: 2em; font-weight: 700; line-height: 1.25; margin: 0.5em 0 0.4em; }
            body h2 { font-size: 1.5em; font-weight: 700; line-height: 1.3; margin: 0.5em 0 0.4em; }
            body h3 { font-size: 1.25em; font-weight: 600; line-height: 1.4; margin: 0.5em 0 0.3em; }
            body h4 { font-size: 1.1em; font-weight: 600; margin: 0.4em 0 0.3em; }
            body h5, body h6 { font-weight: 600; margin: 0.4em 0 0.3em; }
            body ul, body ol { padding-left: 1.5em; margin: 0.5em 0; }
            body a { color: #35ad0b; text-decoration: underline; }
            body blockquote {
              border-left: 3px solid #e5e7eb;
              padding: 0.25em 0 0.25em 1em;
              margin: 0.75em 0;
              color: #6b7280;
              font-style: italic;
            }
            body img { max-width: 100%; height: auto; border-radius: 4px; }
            body pre {
              background: #f3f4f6;
              padding: 1em;
              border-radius: 6px;
              font-family: 'Fira Code', Consolas, Monaco, monospace;
              font-size: 0.9em;
              overflow-x: auto;
            }
            body hr {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 1.5em 0;
            }
            body table { border-collapse: collapse; margin: 1em 0; }
            body table td, body table th {
              border: 1px solid #e5e7eb;
              padding: 0.5em 0.75em;
            }
            body table th { background: #f9fafb; font-weight: 600; }
          `,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
