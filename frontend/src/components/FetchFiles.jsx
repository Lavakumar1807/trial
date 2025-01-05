import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Editor } from "@monaco-editor/react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Terminal from "./terminal";

const FetchFiles = () => {
  const { frameworkname, foldername } = useParams();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("plaintext");
  const [deleted, setDeleted] = useState(false);
  const [newFileAdded, setNewFileAdded] = useState(false);
  const [newFile, setNewFile] = useState("");
  const [extensions, setExtensions] = useState([]);
  const [saved, setSaved] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");
  const [textOutput, setTextOutput] = useState("");
  const [objectData, setObjectData] = useState("");

  const navigate = useNavigate();

  const originalConsoleError = console.error;

  const resizeObserverError = () => {
    console.error = (message, ...args) => {
      // Filter specific error messages to avoid recursion
      if (message.includes("ResizeObserver loop limit exceeded")) {
        return;
      }
      // Call the original console.error for other messages
      originalConsoleError(message, ...args);
    };
  };

  //creates the files at the server
  const handleCreateFolderS3 = async () => {
    const folderName = foldername;
    const fileKeys = files.map((file) => file.key);
    try {
      const response = await axios.post(
        "http://localhost:5000/createFolderFromS3",
        {
          folderName,
          files: fileKeys,
          framework: frameworkname,
        }
      );
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  // fetch files in the folder
  const fetchFiles = async () => {
    if (!foldername) {
      console.log("No folder found!!!");
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/folder/${foldername}`
      );
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching the files:", error);
    }
  };

  // Get extensions of the framework
  const getExtensions = async (req, res) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/extensions/${frameworkname}`
      );
      setExtensions(response.data);
    } catch (error) {
      console.error("Error in getting extensions : ", error);
    }
  };

  useEffect(() => {
    resizeObserverError();

    // Cleanup: Restore the original console.error on unmount
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    if (iframeSrc) {
      const iframe = document.getElementById("outputIframe");
      iframe.src = iframeSrc; // Ensure the iframe reloads when src changes
    }
  }, [iframeSrc]);
  

  useEffect(() => {
    fetchFiles();
    getExtensions();
    handleCreateFolderS3();

    const languageMap = {
      nodejs: "javascript",
      python: "python",
      cpp: "cpp",
    };
    setEditorLanguage(languageMap[frameworkname] || "plaintext");
  }, [frameworkname, deleted, newFileAdded, extensions, saved]);

  // Select file to open on editor
  const handleFileSelect = async (fileKey) => {
    setSelectedFile(fileKey);
    try {
      const response = await axios.get("http://localhost:5000/file", {
        params: { key: fileKey },
      });
      setCode(response.data);
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  // save and update code
  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleUpdateCode = async () => {
    setSaved(true);
    try {
      await axios.put(`http://localhost:5000/codeUpdate`, {
        fileKey: selectedFile,
        newCode: code,
        foldername: foldername,
      });
      setSaved(false);
    } catch (error) {
      console.error("Error in Updating code : ", error);
    }
  };

  // Add a new file
  const handleAddFile = async (newFile) => {
    setNewFileAdded(false);
    console.log(foldername);
    try {
      await axios.post(
        `http://localhost:5000/addFile/${frameworkname}/${foldername}/${newFile}`
      );
      setNewFileAdded(true);
      setNewFile("");
    } catch (error) {
      console.error("Error in adding file : ", error);
    }
  };

  // Delete a file
  const handleDeleteFile = async (Key) => {
    setDeleted(false);
    try {
      await axios.delete(`http://localhost:5000/deleteFile`, {
        params: {
          fileKey: Key,
          foldername: foldername,
        },
      });
      setDeleted(true);
    } catch (error) {
      console.error("Error in deleting file", error);
    }
  };

  // const handleRunCode = async () => {
  //   console.log("Run button clicked");
  //   const FileName = selectedFile.split("/").pop();

  //   try {
  //     const response = await fetch(
  //       `http://localhost:5000/${frameworkname}/${FileName}/${foldername}`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           hostPort: 9000,
  //         }),
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       console.error("Deployment failed:", errorData.error);
  //       alert(`Deployment failed: ${errorData.error}`);
  //       return;
  //     }

  //     const data = await response.json();
  //     if (data.url) {
  //       console.log(`Deployed ${frameworkname} app URL:`, data.url);
  //       setIframeSrc(data.url);
  //       //alert(`Your ${framework} app is running at ${data.url}`);
  //       return;
  //     }

  //     if (data.output) {
  //       // setIframeSrc(null); // Clear the iframe for text output
  //       // const iframe = document.getElementById("outputIframe");
  //       // if (iframe && iframe.contentDocument) {
  //       //   iframe.contentDocument.open();
  //       //   iframe.contentDocument.write(`<pre>${data.output}</pre>`);
  //       //   iframe.contentDocument.close();
  //       // }
  //       console.log(data.output);
  //       if (data.output) {
  //         setIframeSrc(null); // Clear iframe for text output
  //         setTextOutput(data.output); // Update output text
  //       }
  //       // const iframe = document.getElementById("outputIframe");
  //       // iframe.contentDocument.body.innerHTML = `<pre>${data.output}</pre>`;
  //       return;
  //     }
  //   } catch (error) {
  //     console.error("Error during deployment/running:", error);
  //   }
  // };

  const handleRunCode = async () => {
    console.log("Run button clicked");
   
    try {
      const response = await fetch(
        `http://localhost:5000/${frameworkname}/${selectedFile}/${foldername}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hostPort: 9000,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Deployment failed:", data.output || data.error);
        //setIframeSrc(null);
        setObjectData("");
        setTextOutput(data.output || `Error: ${data.error}`);
        return;
      }

      if (data.url) {
        console.log(`Deployed ${frameworkname} app URL:`, data.url);
        setObjectData(data.url);
        setTextOutput(null);
        console.log(data.url);
        console.log(iframeSrc);
        return;
      }

      if (data.output) {
        console.log("Program output:", data.output);
        //setIframeSrc(null);
        setTextOutput(data.output);
        return;
      }

      // Handle unexpected cases
      console.log("Unexpected response:", data);
      //setIframeSrc(null); // Clear iframe
      setObjectData(null);
      setTextOutput("Unexpected response received.");
    } catch (error) {
      console.error("Error during deployment/running:", error);
      //setIframeSrc(null); // Clear iframe
      setObjectData(null);
      setTextOutput(`Error during deployment/running: ${error.message}`);
    }
  };

  const handleStopCode = async () => {
    console.log("Stop button clicked");

    try {
      const response = await fetch("http://localhost:5000/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostPort: 9000,
          framework: frameworkname,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Stopping failed:", errorData.error);
        alert(`Stopping failed: ${errorData.error}`);
        return;
      }

      console.log(`${frameworkname} app stopped successfully`);
      alert(`${frameworkname} app stopped successfully and the port is freed.`);
    } catch (error) {
      console.error("Error during stopping:", error);
      alert(`Error during stopping: ${error.message}`);
    }
  };

  const handleButtonClick = (frameworkName) => {
    const button = document.getElementById("runBtn");

    if (frameworkName == "cpp") {
      handleRunCode();
    } else {
      if (button.innerText === "Run") {
        button.innerText = "Stop";
        handleRunCode();
      } else {
        button.innerText = "Run";
        handleStopCode();
      }
    }
    return;
  };

  return (
    <div className="frameworkEditor">
      <div className="menu">
      
        <div className="headername">
        <h3 style={{ color: "white", fontSize: "20px" }}>
          Folder : {foldername.toUpperCase()}
        </h3>
        <hr />
        </div>

        <div className="fileList">
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {files.map((file) => (
            <li key={file.key}>
              <div
                className="fileSelection"
                style={{
                  backgroundColor: selectedFile === file.key ? "#0d6096" : "",
                }}
                onClick={() => {
                  handleFileSelect(file.key);
                  console.log(file.key);
                }}
              >
                {file.key}
                <button
                  title="Delete File"
                  id="deleteFileBtn"
                  onClick={() => handleDeleteFile(file.key)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        </div>

        <div className="addFile">
            <input
              type="text"
              value={newFile}
              onChange={(e) => setNewFile(e.target.value)}
              placeholder="Enter file name..."
            ></input>
            <button
              id="addFileBtn"
              title="Add File"
              onClick={() => handleAddFile(newFile)}
            >
              Add
            </button>
        </div>

        <div className="extensions">
          <h2>Extensions : </h2>
          <div className="extensionsList">
            {extensions ? (
              extensions.map((extension, index) => (
                <div className="extension" key={index}>
                  {extension}
                </div>
              ))
            ) : (
              <p>Empty...</p>
            )}
          </div>
        </div>
      </div>

      <div className="editorTerminal">
        <div className="editor">
          <div className={saved == true ? "saved" : "unsaved"}>
            <span>Saved</span>
            <p>Your code has been saved successfully :)</p>
          </div>
          <Editor
            // height="75vh"
            language={editorLanguage}
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
          />
          {/* <button id="stopBtn" onClick={handleStopCode}>
            stop
          </button> */}
          <button id="runBtn" onClick={handleButtonClick}>
            Run
          </button>

          <button id="saveBtn" onClick={handleUpdateCode}>
            Save
          </button>
        </div>
        <div className="terminal">
          <p>Output Section</p>
          {/* <Terminal /> */}
          {iframeSrc && (
            <iframe
              id="outputIframe"
              src={iframeSrc}
              title="dynamic content frame"
              style={{
                width: "100%",
                height: "500px",
                border: "none",
                marginTop: "20px",
              }}
            />
          )}
          <object data={objectData} width="500" height="500"></object>
          <div className="output">{textOutput && <pre>{textOutput}</pre>}</div>
        </div>
      </div>
    </div>
  );
};

export default FetchFiles;
