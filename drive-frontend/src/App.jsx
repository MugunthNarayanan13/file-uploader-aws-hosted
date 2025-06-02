import React, { useEffect, useState } from "react";
import UploadFolder from "./components/UploadFolder";
import Delete from "./components/Delete";
import axios from "axios";
import serverURL from "./serverURL";
axios.defaults.baseURL = serverURL;

function buildTree(items) {
  const root = {};
  items.forEach((item) => {
    const parts = item.path ? item.path.split("/").filter(Boolean) : [];
    let current = root;
    parts.forEach((part, idx) => {
      if (!current[part]) {
        current[part] = {
          __children: {},
          __isFolder: true,
          __key: parts.slice(0, idx + 1).join("/") + "/",
        };
      }
      current = current[part].__children;
    });

    if (item.is_folder) {
      current[item.file_name] = {
        ...item,
        __children: {},
        __isFolder: true,
        __key: (item.path || "") + item.file_name + "/",
      };
    } else {
      current[item.file_name] = {
        ...item,
        __children: null,
        __isFolder: false,
        __key: item.s3_key,
      };
    }
  });
  return root;
}

function Tree({ nodes, refreshList }) {
  const [openKeys, setOpenKeys] = useState({});

  const toggleFolder = (key) => {
    setOpenKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <ul style={{ listStyle: "none", paddingLeft: 16 }}>
      {Object.entries(nodes).map(([name, node]) => (
        <li
          key={node.__key}
          style={{
            position: "relative",
            marginBottom: 4,
            cursor: node.__isFolder ? "pointer" : "default",
          }}
        >
          <div
            onClick={() => node.__isFolder && toggleFolder(node.__key)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span>
              {node.__isFolder ? (openKeys[node.__key] ? "📂" : "📁") : "📄"}{" "}
              {name}
            </span>
            <Delete
              item={{
                key: node.__key,
                name,
                isFolder: node.__isFolder,
              }}
              refreshList={refreshList}
            />
          </div>

          {node.__isFolder &&
            openKeys[node.__key] &&
            Object.keys(node.__children).length > 0 && (
              <Tree nodes={node.__children} refreshList={refreshList} />
            )}
        </li>
      ))}
    </ul>
  );
}

function App() {
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
      const res = await axios.get("/list");
      setItems(res.data);
    } catch (err) {
      setItems([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const tree = buildTree(items);

  return (
    <div
      style={{
        padding: "20px",
        width: "100vw",
        margin: "auto",
        minHeight: "100vh",
      }}
    >
      <div>
        <h1 style={{ textAlign: "center" }}>My Drive</h1>
        <p style={{ textAlign: "center" }}>
          Upload your folders to My Drive.
        </p>
      </div>

      <UploadFolder refreshList={fetchItems} />

      <div style={{ marginTop: "30px" }}>
        <h2>Folders & Files</h2>
        {items.length === 0 ? (
          <p>No files or folders found.</p>
        ) : (
          <Tree nodes={tree} refreshList={fetchItems} />
        )}
      </div>
    </div>
  );
}

export default App;
