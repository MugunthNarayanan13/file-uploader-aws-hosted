import React, { useState } from "react";
import axios from "axios";
import { PiMinusCircleFill } from "react-icons/pi";
import { FaCloudUploadAlt } from "react-icons/fa";
import { MdError } from "react-icons/md";

export default function UploadFolder() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    // Avoid duplicates if user selects multiple times
    setFiles((prev) => {
      const existingPaths = new Set(prev.map((f) => f.webkitRelativePath));
      const filteredNew = newFiles.filter(
        (f) => !existingPaths.has(f.webkitRelativePath)
      );
      return [...prev, ...filteredNew];
    });
  };

  const handleRemove = (path) => {
    setFiles(files.filter((f) => f.webkitRelativePath !== path));
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("No files selected");

    setUploading(true);
    setMessage("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("path", file.webkitRelativePath.replace(file.name, ""));
        formData.append("files", file, file.name);

        await axios.post("http://localhost:8003/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setMessage("Upload successful!");
      setFiles([]); // clear after upload
    } catch (err) {
    setMessage(
      <span>
        <MdError style={{ color: "red", verticalAlign: "middle" }} size={20} /> Upload
        failed: {err.message}
      </span>
    );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        webkitdirectory="true"
        multiple
        onChange={handleFileChange}
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#22c55e",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "8px 16px",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        <FaCloudUploadAlt color="#fff" size={20} />
        {uploading ? "Uploading..." : "Upload Folder"}
      </button>
      {message && <p>{message}</p>}
      <ul>
        {files.map((file) => (
          <li
            key={file.webkitRelativePath}
            style={{ display: "flex", alignItems: "center" }}
          >
            <button
              onClick={() => handleRemove(file.webkitRelativePath)}
              style={{
                marginRight: "10px",
                background: "transparent",
                color: "red",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              aria-label={`Remove ${file.webkitRelativePath}`}
            >
              <PiMinusCircleFill size={22} />
            </button>
            {file.webkitRelativePath}
          </li>
        ))}
      </ul>
    </div>
  );
}
