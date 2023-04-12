import { useState } from "react";

import dynamic from "next/dynamic";



interface MarkdownEditorProps {
  value: string;
  // onChange: (value: string) => void;
  props: any;
}


function MarkdownEditor({ value, props }: MarkdownEditorProps) {

  console.log('18 MarkdownEditor.tsx' );


  const [markdownString, setMarkdownString] = useState(value);

  const MDEditor = dynamic(
    () => import("@uiw/react-md-editor"),
    { ssr: false }
  );

  const handleChange = (value: string) => {
    setMarkdownString(value);
 
  };

  const handleSave = () => {
    const element = document.createElement("a");
    const file = new Blob([markdownString], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "myMarkdownFile.md";
    document.body.appendChild(element);
    element.click();
  };

  const handlePublish = async () => {
    const accessToken = "YOUR_GITHUB_ACCESS_TOKEN";
    const owner = props.phFocus.focusProj?.org;
    const repo = props.phFocus.focusProj?.repoo;
    const path = props.phFocus.focusProj?.path;
    const file = props.phFocus.focusProj?.file;
    const brach = props.phFocus.focusProj?.branch;
    const message = "Publish myMarkdownFile.md";
    const content = btoa(markdownString);

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message,
        content,
      }),
    });

    if (response.ok) {
      console.log("File published successfully!");
    } else {
      console.error("Failed to publish file:", response.statusText);
    }
  };

  const toolbar = [
    // ... toolbar buttons and options ...
  ];

  return (
    <>
      <MDEditor value={markdownString} onChange={handleChange} height={870}  preview="preview"/>
      <div style={{ display: "flex", justifyContent: "flex-end", height: "auto" }}>
        <button className="btn btn-sm m-1" onClick={handleSave}>Save</button>
        {/* <button onClick={handlePublish}>Publish</button> */}
      </div>
    </>
  );
}

export default MarkdownEditor;



