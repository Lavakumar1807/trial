import React, { useState, useEffect, useRef } from "react";
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
  const [output, setOutput] = useState(null);
  const [iframeSrc, setIframeSrc] = useState("");


  const navigate = useNavigate();

  const updateIframeSrc = (url) => {
    setIframeSrc(url);
  };

  const handleCreateFolderS3 = async () => {
    const folderName = "Code1";
    const fileKeys = files.map((file) => file.key);
    // if (!folderName || !fileKeys.trim()) {
    //   alert("Please enter both folder name and file keys.");
    //   return;
    // }

    //const filesArray = fileKeys.split(",").map((key) => key.trim()); // Convert input to array

    try {
      const response = await axios.post("http://localhost:5000/createFolderFromS3", {
        folderName,
        files: fileKeys,
      });

     // setResponseMessage(response.data.message);
    } catch (error) {
      console.error("Error creating folder:", error);
     // setResponseMessage(
     //   error.response?.data?.error || "Failed to create folder."
     // );
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
    fetchFiles();
    getExtensions();

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
      });
      setSaved(false);
    } catch (error) {
      console.error("Error in Updating code : ", error);
    }
  };

  // Add a new file
  const handleAddFile = async (newFile) => {
    setNewFileAdded(false);
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
        },
      });
      setDeleted(true);
    } catch (error) {
      console.error("Error in deleting file", error);
    }
  };
  // const handleRunCode = async () => {
  //   if (!code) {
  //     alert("no code selected");
  //     return;
  //   }
  //   const response = await axios.post(
  //     `http://localhost:5000/runFile`,
  //     { code }, // Send code as an object
  //     { headers: { "Content-Type": "application/json" } }
  //   );
  //   console.log(response.data);
  // };

  // const handleRunCode = async () => {
  //   if (!code || !selectedFile) {
  //     alert("No code selected");
  //     return;
  //   }

  //   try {
  //     const response = await axios.post(
  //       `http://localhost:5000/runFile`,
  //       { code, selectedFile},
  //       { headers: { "Content-Type": "application/json" } }
  //     );

  //     const outputDiv = document.querySelector(".output");
  //     if (outputDiv) {
  //       outputDiv.innerText = response.data.output || "No output";
  //     }
  //   } catch (error) {
  //     console.error("Error running code:", error);

  //     const outputDiv = document.querySelector(".output");
  //     if (outputDiv) {
  //       outputDiv.innerText = error.response?.data?.error || "An error occurred.";
  //     }
  //   }
  // };




//   const handleRunCode = async () => {
//     // const files = [
//     //   {
//     //     name: "Code1/file1.js",
//     //     content:
//     //       "const utils = require('./utils'); console.log('Hello', utils.message);",
//     //   },
//     //   {
//     //     name: "Code1/utils.js",
//     //     content: "module.exports = { message: 'World!' };",
//     //   },
//     // ];

//     // const mainFile = "Code1/file1.js"; // The main file to execute

//     const mainFileContent = `
// from flask import Flask, render_template_string

// app = Flask(__name__)

// # Define a basic HTML template using render_template_string
// html_template = """
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Flask Page</title>
//     <style>
//         #output {
//             width: 300px;
//             height: 100px;
//             background-color: #f0f0f0;
//             border: 1px solid #ccc;
//             text-align: center;
//             line-height: 100px;
//             margin-bottom: 20px;
//         }
//         button {
//             padding: 10px 20px;
//             font-size: 16px;
//             cursor: pointer;
//         }
//     </style>
// </head>
// <body>
//     <h1>Flask Web Page</h1>
//     <div id="output">This is a DIV</div>
//     <button onclick="updateDiv()">Click Me</button>

//     <script>
//         function updateDiv() {
//             const div = document.getElementById('output');
//             div.innerText = "Button Clicked!";
//             div.style.backgroundColor = "#d0f0c0";
//         }
//     </script>
// </body>
// </html>
// """

// @app.route('/')
// def home():
//     return render_template_string(html_template)

// if __name__ == '__main__':
//     app.run(debug=True)

//     `;
    

//     const files = [
//       { name: "Code1/main.py", content: mainFileContent } // Only sending one file
//   ];
//   const mainFile = "Code1/main.py";

//     try {
//       const response = await axios.post("http://localhost:5000/runFiles", {
//         files,
//         mainFile,
//       });
//       console.log(response.data);
//       const output = response.data.output;
//       document.querySelector(".output").innerText = response.data.output;
//       setOutput(response.data.output);
//       //navigate("/display", { state: { output } });
//       const iframe = document.querySelector("#output-iframe");
//             iframe.src = `/display?output=${encodeURIComponent(output)}`;
//     } catch (error) {
//       console.error("Error:", error.response?.data || error.message);
//       const errorMessage = error.response?.data.error || "Execution Failed";
//       document.querySelector(".output").innerText =
//         error.response?.data.error || "Execution Failed";
//       setOutput("failed");
//       //  navigate("/display", { state: { output: errorMessage } });
//       const iframe = document.querySelector("#output-iframe");
//             iframe.src = `/display?output=${encodeURIComponent(errorMessage)}`;
//     }
//   };

// const handleRunCode = async () => {
//   // Flask-based main file content with embedded HTML template
//   const mainFileContent = `
// from flask import Flask, render_template_string

// app = Flask(__name__)

// # Define a basic HTML template using render_template_string
// html_template = """
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Flask Page</title>
//     <style>
//         #output {
//             width: 300px;
//             height: 100px;
//             background-color: #f0f0f0;
//             border: 1px solid #ccc;
//             text-align: center;
//             line-height: 100px;
//             margin-bottom: 20px;
//         }
//         button {
//             padding: 10px 20px;
//             font-size: 16px;
//             cursor: pointer;
//         }
//     </style>
// </head>
// <body>
//     <h1>Flask Web Page</h1>
//     <div id="output">This is a DIV</div>
//     <button onclick="updateDiv()">Click Me</button>

//     <script>
//         function updateDiv() {
//             const div = document.getElementById('output');
//             div.innerText = "Button Clicked!";
//             div.style.backgroundColor = "#d0f0c0";
//         }
//     </script>
// </body>
// </html>
// """

// @app.route('/')
// def home():
//     return render_template_string(html_template)

// if __name__ == '__main__':
//     app.run(debug=True, host='0.0.0.0', port=5000)
// `;

//   // Define files to be sent to the server
//   const files = [{ name: "Code1/main.py", content: mainFileContent }];
//   const mainFile = "Code1/main.py";

//   try {
//     // Send request to the backend
//     const response = await axios.post("http://localhost:5000/runFiles", {
//       files,
//       mainFile,
//     });

//     console.log("Server Response:", response.data);

//     // Handle Flask output URL
//     if (response.data.url) {
//       const iframe = document.querySelector("#output-iframe");
//       iframe.src = response.data.url; // Dynamically update the iframe
//       setOutput("Flask server started successfully at " + response.data.url);
//     } 
//     // Handle normal execution output
//     else if (response.data.output) {
//       document.querySelector(".output").innerText = response.data.output;
//       setOutput(response.data.output);
//     }

//   } catch (error) {
//     console.error("Error:", error.response?.data || error.message);

//     // Extract error message
//     const errorMessage = error.response?.data?.error || "Execution Failed";

//     // Update output section
//     document.querySelector(".output").innerText = errorMessage;
//     setOutput(errorMessage);

//     // Optionally, update iframe to display the error
//     const iframe = document.querySelector("#output-iframe");
//     iframe.src = `/display?output=${encodeURIComponent(errorMessage)}`;
//   }
// };



const handleRunCode = async () => {
  const reactAppContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => (
  <div>
    <h1>Hello, React!</h1>
    <p>This is a React app running dynamically.</p>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`;

  const files = [
    { name: "ReactApp/src/main.js", content: reactAppContent },
    { name: "ReactApp/index.html", content: "<div id='root'></div>" },
  ];
  const mainFile = "ReactApp/src/main.js";

  try {
    const response = await axios.post("http://localhost:5000/runFiles", {
      files,
      mainFile,
    });

    if (response.data.url) {
      const iframe = document.querySelector("#output-iframe");
      iframe.src = response.data.url;
    } else if (response.data.output) {
      document.querySelector(".output").innerText = response.data.output;
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};


// const handleRunCode = async () => {
//   const files = [
//     { name: "src/main.js", content: `console.log("Hello, Node.js!");` },
//     { name: "index.html", content: `<div id="root"></div>` },
//   ];
//   const mainFile = "src/main.js"; // Specify the main file path

//   try {
//     const response = await axios.post("http://localhost:5000/runFiles", {
//       files,
//       mainFile,
//     });

  //   console.log("Server Response:", response.data);

  //   if (response.data.url) {
  //     // Update iframe for React or Flask server
  //     const iframe = document.querySelector("#output-iframe");
  //     iframe.src = response.data.url;
  //   } else if (response.data.output) {
  //     // Update output for non-server execution
  //     document.querySelector(".output").innerText = response.data.output;
  //   }
  // } catch (error) {
  //   console.error("Error:", error.response?.data || error.message);

//     // Update UI with error message
//     const errorMessage = error.response?.data?.error || "Execution Failed";
//     document.querySelector(".output").innerText = errorMessage;
//   }
// };


// const handleRunCode = async () => {
//   const files = [
//     {
//       name: "src/main.jsx",
//       content: `
// import React from 'react';
// import ReactDOM from 'react-dom/client';

// const App = () => {
//   return <h1>Hello from React!</h1>;
// };

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<App />);
//       `,
//     },
//     { name: "index.html", content: `<div id="root"></div>` },
//     {
//       name: "vite.config.js",
//       content: `
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
// });
  //     `,
  //   },
  //   { name: "package.json", content: `{"dependencies": {"react": "^18.0.0", "react-dom": "^18.0.0"}}` },
  // ];
  // const mainFile = "src/main.jsx";

  // try {
  //   const response = await axios.post("http://localhost:5000/runFiles", {
  //     files,
  //     mainFile,
  //   });

  //   console.log("Server Response:", response.data);

  //   if (response.data.url) {
  //     // Load the React app URL into the iframe
  //     const iframe = document.querySelector("#output-iframe");
  //     iframe.src = response.data.url;
  //     document.querySelector(".output").innerText = `React app running at ${response.data.url}`;
//     } else {
//       document.querySelector(".output").innerText = response.data.output;
//     }
//   } catch (error) {
//     console.error("Error:", error.response?.data || error.message);

//     // Display error message in output div
//     const errorMessage = error.response?.data?.error || "Execution Failed";
//     document.querySelector(".output").innerText = errorMessage;
//   }
// };

// const handleCreateServerFolder = async () => {
//   try {
//     const response = await axios.post("http://localhost:5000/createServerFolder", {
//       files,
//     });
//     console.log("folder created successfully");
//     setCode(response.data);
//   } catch (error) {
//     console.error("Error fetching file content:", error);
//   }
// };

// handleCreateServerFolder();



  return (
    <div className="frameworkEditor">
      <div className="menu">
        <h3 style={{ color: "white", fontSize: "20px" }}>
          Folder : {foldername.toUpperCase()}
        </h3>
        <hr />

        <ul style={{ listStyleType: "none", padding: 0 }}>
          {files.map((file) => (
            <li key={file.key}>
              <div
                className="fileSelection"
                style={{
                  backgroundColor: selectedFile === file.key ? "#0d6096" : "",
                }}
                onClick={() => {handleFileSelect(file.key); console.log(file.key);}}
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

        <center>
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
        </center>

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
          <button id="runBtn" onClick={handleRunCode}>
            Run
          </button>
          <button id="saveBtn" onClick={handleUpdateCode}>
            Save
          </button>
        </div>
        <div className="terminal">
          <Terminal updateIframeSrc={updateIframeSrc}/>
          <div className="output"></div>
          <iframe
          id="output-iframe"
            // src="/display"
            //src="http://127.0.0.1:7000/"
            src={iframeSrc}
            title="Output Display"
            style={{
              width: "100%",
              height: "200px",
              border: "1px solid #ccc",
              marginTop: "10px",
            }}
          >
            output
          </iframe>
          {/* <p>
            Want to see it in a new window?{" "}
           
            <Link
              to={`/display?output=${encodeURIComponent(output)}`}
              target="_blank"
            >
              Open /display
            </Link>
           
          </p> */}
          <p><a href="http://127.0.0.1:8080/something.html" >Open in new window</a></p>
        </div>
      </div>
    </div>
  );
};

export default FetchFiles;
