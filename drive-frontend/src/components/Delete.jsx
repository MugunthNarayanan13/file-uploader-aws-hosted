import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import axios from "axios";
import serverURL from "../serverURL";
axios.defaults.baseURL = serverURL;

const Delete = ({ item, refreshList }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try {
            const data = item.isFolder ? { path: item.key } : { key: item.key };
            await axios.delete("/delete", { data });
            refreshList && refreshList();
        } catch (err) {
            alert("Delete failed");
        }
        setLoading(false);
    };

    return (
        <div style={{ display: "inline-block", position: "relative" }}>
            <FaTrash
                style={{
                    color: "#ff7777",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginLeft: "5px",
                    fontSize: "12px",
                    opacity: 1,
                }}
                title="Delete"
                onClick={loading ? undefined : handleDelete}
            />
        </div>
    );
};

export default Delete;
