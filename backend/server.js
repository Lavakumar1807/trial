const express = require("express");
const http = require("http");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const pty = require("node-pty-prebuilt-multiarch");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const s3Client = require("./storjClient");

const app = express();
const server = http.createServer(app);
//  const io = new Server(server);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOW-FROM http://localhost:3000/editor/cpp/Code1");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(bodyParser.json());
app.use(cors());
// app.use(cors({
//   origin: "http://localhost:3000/editor/cpp/Code1", // Replace with your frontend's URL
//   methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
//   credentials: true // Allow cookies or authorization headers
// }));

const BUCKET_NAME = "task2";
const BASE_FOLDER = "base/";

var shell = os.platform() === "win32" ? "powershell.exe" : "bash";
var ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 120,
  rows: 30,
  cwd: process.env.INIT_CWD,
  env: process.env,
});

ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
  console.log(data);

  // Check if data contains the "http://" or "https://" URL
  const urlMatch = data.match(/(http:\/\/localhost:\d+|https:\/\/localhost:\d+)/);
  if (urlMatch) {
    const url = urlMatch[0];
    io.emit("dev-url", url); // Send the URL to the frontend
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("update-frameworks", (frameworks) => {
    io.emit("frameworks-updated", frameworks);
  });

  socket.on("code-updated", (updatedFile) => {
    io.emit("file-updated", updatedFile);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });

  socket.on("terminal:write", (data) => {
    ptyProcess.write(data);
  });
});

// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

  // socket.on("run-react-app", () => {
  //   const reactAppPath = path.join(__dirname, "Code1");
  //   console.log("Starting React app in:", reactAppPath);

  //   const reactProcess = spawn("npm", ["start"], {
  //     cwd: reactAppPath,
  //     shell: true,
  //   });
  //   reactProcess.stdout.on("data", (data) => {
  //     console.log(`React stdout: ${data}`);
  //     // Send server URL back to the frontend
  //     const output = data.toString();
  //     const match = output.match(/Local:\s*(http:\/\/localhost:\d+)/);
  //     if (match) {
  //       const reactURL = match[1];
  //       socket.emit("react-app-started", reactURL);
  //     }
  //   });

  //   reactProcess.stderr.on("data", (data) => {
  //     console.error(`React stderr: ${data}`);
  //   });
  //   reactProcess.on("close", (code) => {
  //     console.log(`React process exited with code ${code}`);
  //   });
  // });



// io.on("connection", (socket) => {
//   socket.on("run-react-app", () => {
//     const reactAppPath = path.join(__dirname, "Code1");
//     exec("npm start", { cwd: reactAppPath }, (error) => {
//       if (error) {
//         console.error("Error starting React app:", error);
//       }
//     });

//     // Send the React app URL back to the frontend
//     const appUrl = "http://localhost:3000"; // Adjust the port as needed
//     socket.emit("react-app-started", appUrl);
//   });
// });


//   socket.on("update-frameworks", (frameworks) => {
//     io.emit("frameworks-updated", frameworks);
//   });

//   socket.on("code-updated", (updatedFile) => {
//     io.emit("file-updated", updatedFile);
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected:", socket.id);
//   });

//   socket.on("terminal:write", (data) => {
//     ptyProcess.write(data);
//   });
// });



// Send terminal output to the client
// ptyProcess.onData((data) => {
//   io.emit("terminal:data", data);
// });


// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   // Listen for terminal input from the client
//   socket.on("terminal:write", (data) => {
//     ptyProcess.write(data);
//   });

  
//   // Handle React app start
//   socket.on("run-react-app", () => {
//     const reactAppPath = path.join(__dirname, "Code1");
//     exec("npm start", { cwd: reactAppPath }, (error) => {
//       if (error) {
//         console.error("Error starting React app:", error);
//         socket.emit("react-app-error", "Failed to start React app.");
//       } else {
//         const appUrl = "http://localhost:4000"; // Adjust port as needed
//         socket.emit("react-app-started", appUrl);
//       }
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected:", socket.id);
//   });
// });
// app.post("/runFile", async (req, res) => {

// try {
//   // Step 1: Extract and validate code from request body
//   const { code } = req.body;
//   if (!code || typeof code !== "string") {
//     return res.status(400).json({ error: "Invalid or missing 'code' input." });
//   }

// // Step 2: Define the file path
// const filePath = path.join(__dirname, "test.cpp");
//   // Step 3: Write the code to a file
//   try {
//     await fs.writeFile(filePath, code, "utf8");
//   } catch (writeError) {
//     console.error("Error writing to file:", writeError);
//     return res.status(500).json({ error: "Could not create file." });
// }

// console.log("Code successfully written to file:", filePath);

// // Step 4: Placeholder for actual execution logic (e.g., run `g++` or similar)
// // Replace this with actual shell commands to compile/run the C++ code
//       const output = `Code has been written to ${filePath}. Actual execution logic goes here.`;

//       // Step 5: Send success response with output
//       return res.status(200).json({ message: "Code executed successfully.", output });
//     } catch (error) {
//       // General error handling
//       console.error("Error processing the request:", error);
//       return res.status(500).json({ error: "Internal server error." });
//     }
// });

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject({ error: error.message, stderr });
      if (stderr) return reject({ error: stderr });
      resolve(stdout);
    });
  });
};

// app.post("/runFile", async (req, res) => {
//   const fileName = "test.cpp";
//   const executableName = "test_executable";

//   try {
//     // Step 1: Extract and validate code from request body
//     const { code } = req.body;
//     if (!code || typeof code !== "string") {
//       return res.status(400).json({ error: "Invalid or missing 'code' input." });
//     }

//     // Step 2: Define file paths
//     const filePath = path.join(__dirname, fileName);
//     const executablePath = path.join(__dirname, executableName);
//      // Step 3: Write the code to a file
//      await fs.writeFile(filePath, code, "utf8");
//      console.log("Code successfully written to file:", filePath);

//      // Step 4: Compile the C++ file using g++
//      try {
//        await runCommand(`g++ ${filePath} -o ${executablePath}`);
//        console.log("Compilation successful");
//      } catch (compilationError) {
//    console.error("Compilation Error:", compilationError.error || compilationError.stderr);
//    await fs.unlink(filePath).catch(() => {}); // Cleanup the file
//    return res.status(400).json({ error: "Compilation failed.", details: compilationError.error || compilationError.stderr });
//  }
//   // Step 5: Execute the compiled file
// let output;
// try {
//   output = await runCommand(`./${executableName}`);
//   console.log("Execution Output:", output);
// } catch (executionError) {
//   console.error("Runtime Error:", executionError.error || executionError.stderr);
//   return res.status(500).json({ error: "Runtime error.", details: executionError.error || executionError.stderr });
// }

// // Step 6: Cleanup (delete the .cpp file and the executable)
// await fs.unlink(filePath).catch(() => {});
// await fs.unlink(executablePath).catch(() => {});

//     // Step 7: Return the output
//     return res.status(200).json({ message: "Code executed successfully.", output });
//   } catch (error) {
//     console.error("Error processing the request:", error);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// });

// app.post("/runFile", async (req, res) => {
//   const fileName = "test.cpp";
//   const executableName = "test_executable";
//   const isWindows = process.platform === "win32"; // Detect operating system

//   try {
//     // Step 1: Extract and validate code from request body
//     const { code } = req.body;
//     if (!code || typeof code !== "string") {
//       return res.status(400).json({ error: "Invalid or missing 'code' input." });
//     }

//     // Step 2: Define file paths
//     const filePath = path.join(__dirname, fileName);
//     const executablePath = path.join(__dirname, isWindows ? `${executableName}.exe` : executableName);

//     // Step 3: Write the code to a file
//     await fs.writeFile(filePath, code, "utf8");
//     console.log("Code successfully written to file:", filePath);

// // Step 4: Compile the C++ file
// try {
//   await runCommand(`g++ ${filePath} -o ${executablePath}`);
//   console.log("Compilation successful");
// } catch (compilationError) {
//   console.error("Compilation Error:", compilationError.stderr || compilationError.error);
//   await fs.unlink(filePath).catch(() => {}); // Cleanup the file
//   return res.status(400).json({ error: "Compilation failed.", details: compilationError.stderr || compilationError.error });
// }

// // Step 5: Execute the compiled file
// let output;
// try {
//   const executeCommand = isWindows ? `${executablePath}` : `./${executablePath}`;
//   output = await runCommand(executeCommand);
//   console.log("Execution Output:", output);
// } catch (executionError) {
//   console.error("Runtime Error:", executionError.stderr || executionError.error);
//   return res.status(500).json({ error: "Runtime error.", details: executionError.stderr || executionError.error });
// }

// // Step 6: Cleanup files
// await fs.unlink(filePath).catch(() => {});
// await fs.unlink(executablePath).catch(() => {});

//     // Step 7: Return the execution output
//     return res.status(200).json({ message: "Code executed successfully.", output });
//   } catch (error) {
//     console.error("Error processing the request:", error);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// });

// app.post("/runFile", async (req, res) => {
// try {
//   const { code } = req.body; // Extract the code from the request body

//   if (!code) {
//     return res.status(400).json({ error: "No code provided." });
//   }

//   const filePath = path.join(__dirname, "test.cpp");
//   const executablePath = path.join(__dirname, "test_executable");

//   // Step 1: Write code to test.cpp
// fs.writeFile(filePath, code);

// // Step 2: Compile the C++ file
// exec(`g++ ${filePath} -o ${executablePath}`, (compileErr, stdout, stderr) => {
//   if (compileErr || stderr) {
//     console.error("Compilation error:", stderr)
//     return res
//       .status(200)
//       .json({ output: `Compilation Error:\n${stderr}` });
//   }
//    // Step 3: Run the executable if compilation is successful
//  exec(`${executablePath}`, (runErr, runStdout, runStderr) => {
//   // Step 4: Capture runtime errors or output
//   if (runErr || runStderr) {
//     console.error("Runtime error:", runStderr);
//     return res
//       .status(200)
//       .json({ output: `Runtime Error:\n${runStderr}` });
//   }

//         // Step 5: Return program output
//         res.status(200).json({ output: runStdout });

//         // Step 6: Cleanup files
//         fs.unlink(filePath);
//         fs.unlink(executablePath);
//       });
//     });
//   } catch (error) {
//     console.error("Error executing code:", error);
//     res.status(500).json({ error: "Failed to execute code." });
//   }
// });

// app.post("/runFile", async (req, res) => {
//   try {
//     const { code, selectedFile } = req.body;

//     if (!code || !selectedFile) {
//       return res.status(400).json({ error: "Code and file path are required." });
//     }
//     const splittingfilename=selectedFile.split("/");
//     const filename = splittingfilename[1];
//     console.log(filename);

//     const fileExtension = path.extname(filename); // Extract file extension
//     const filePath = path.join(__dirname, filename); // Final file path

//     // Step 1: Write the code to the specified file path
//     fs.writeFile(filePath, code);

//     let command;

//     // Step 2: Determine the execution command based on the file extension
// switch (fileExtension) {
//   case ".cpp":
//     const executablePath = filePath.replace(".cpp", "_executable");
//     command = `g++ ${filePath} -o ${executablePath} && ${executablePath}`;
//     break;
//   case ".py":
//     command = `python ${filePath}`;
//     break;
//   case ".js":
//     command = `node ${filePath}`;
//     break;
//   default:
//     throw new Error("Unsupported file type.");
// }

// // Step 3: Execute the file using the appropriate command
// exec(command, (err, stdout, stderr) => {
//   let output;

// if (err || stderr) {
//   output = `Error:\n${stderr || err.message}`;
// } else {
//   output = stdout;
// }

// // Cleanup: Delete the created file and executable if applicable
// try {
//   if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//   if (fileExtension === ".cpp") {
//     const executablePath = filePath.replace(".cpp", "_executable");
//     if (fs.existsSync(executablePath)) fs.unlinkSync(executablePath);
//   }
// } catch (cleanupErr) {
//   console.error("Cleanup error:", cleanupErr);
// }

// // Return the output or error
// res.status(200).json({ output });
//   });
// } catch (error) {
//   console.error("Execution error:", error);

//   // Ensure cleanup on unexpected errors
//   try {
//     const filePath = path.join(__dirname, req.body.selectedFile);
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//     } catch (cleanupErr) {
//       console.error("Error during cleanup:", cleanupErr);
//     }

//     res.status(500).json({ error: "Failed to execute the code." });
//   }
// });


// Function to execute the main file based on its extension
// const executeMainFile = (mainFilePath, folderPath) => {
//   const ext = path.extname(mainFilePath);

//   return new Promise((resolve, reject) => {
//     let command;

//     if (ext === ".js") {
//       // Node.js Execution
//       command = `node ${mainFilePath}`;
//     } else if (ext === ".cpp") {
//       // C++ Compilation and Execution
//       const executable = path.join(folderPath, "main_executable");
//       command = `g++ ${mainFilePath} -o ${executable} && ${executable}`;
//     } else if (ext === ".py") {
//       // Python Execution
//       command = `start python ${mainFilePath}`;
//     } else {
//       reject(`Unsupported file type: ${ext}`);
//       return;
//     }

//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(stderr || error.message);
//       } else {
//         resolve(stdout);
//       }
//     });
//   });
// };

// // POST endpoint to handle multiple files, execute main file
// app.post("/runFiles", async (req, res) => {
//   try {
//     const { files, mainFile } = req.body;
//     // files: [{ name: "Code1/file1.js", content: "..." }, { name: "Code1/utils.js", content: "..." }]
//     // mainFile: "Code1/file1.js"

//     if (!files || !Array.isArray(files) || !mainFile) {
//       return res
//         .status(400)
//         .json({ error: "Files array and mainFile are required" });
//     }

//     // Extract folder name from the first file
//     const folderName = path.dirname(files[0].name);
//     const folderPath = path.join(__dirname, folderName);

//     // 1. Create the folder dynamically
//     if (!fs.existsSync(folderPath)) {
    //   fs.mkdirSync(folderPath, { recursive: true });
    // }

    // // 2. Write all files into the folder
    // for (const file of files) {
    //   const filePath = path.join(__dirname, file.name);
    //   fs.writeFileSync(filePath, file.content, "utf8");
    // }

    // // 3. Execute the main file
    // const mainFilePath = path.join(__dirname, mainFile);
    // const output = await executeMainFile(mainFilePath, folderPath);

    // // 4. Cleanup: Delete the folder and its contents
    // setTimeout(() => {
    //   fs.rmSync(folderPath, { recursive: true, force: true });
    //   console.log("Temporary folder deleted:", folderPath);
    // }, 1000);

    // res.status(200).json({ message: "Execution successful", output });
//   } catch (error) {
//     res.status(500).json({ error: error.toString() });
//   }
// });



// Utility function to identify Flask files
// const isFlaskFile = (fileContent) => {
//   return fileContent.includes("from flask import Flask") || fileContent.includes("Flask(");
// };

// // Execute main file function
// const executeMainFile = (mainFilePath, folderPath, isFlask = false) => {
//   return new Promise((resolve, reject) => {
//     const ext = path.extname(mainFilePath);
//     let command;

//     if (ext === ".js") {
//       // Node.js Execution
//       command = `node ${mainFilePath}`;
//     } else if (ext === ".cpp") {
//       // C++ Compilation and Execution
//       const executable = path.join(folderPath, "main_executable");
//       command = `g++ ${mainFilePath} -o ${executable} && ${executable}`;
//     } else if (ext === ".py" && !isFlask) {
//       // Normal Python Execution
//       command = `python ${mainFilePath}`;
//     } else if (ext === ".py" && isFlask) {
//       // Start Flask server
//       const flaskProcess = spawn("python", [mainFilePath], {
//         cwd: folderPath, // Set the working directory
//         shell: true,
//       });

//       let flaskUrl = "http://127.0.0.1:5000";
//       let errorOccurred = false;

//       // Monitor the output
//       flaskProcess.stdout.on("data", (data) => {
//         const output = data.toString();
//         console.log(`Flask Output: ${output}`);

//         if (output.includes("Running on")) {
//           resolve({ url: flaskUrl, process: flaskProcess });
//         }
//       });

//       flaskProcess.stderr.on("data", (data) => {
//         errorOccurred = true;
//         console.error(`Flask Error: ${data.toString()}`);
//       });

//       flaskProcess.on("close", (code) => {
//         if (errorOccurred) {
//           reject(`Flask process exited with code ${code}`);
//         }
//       });
//       return;
//     } else {
//       reject(`Unsupported file type: ${ext}`);
//       return;
//     }

//     // For non-Flask files, use exec
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(stderr || error.message);
//       } else {
//         resolve({ output: stdout });
//       }
//     });
//   });
// };

// // POST endpoint to handle multiple files and execute main file
// app.post("/runFiles", async (req, res) => {
//   try {
//     const { files, mainFile } = req.body;

//     if (!files || !Array.isArray(files) || !mainFile) {
//       return res
//         .status(400)
//         .json({ error: "Files array and mainFile are required" });
//     }

//     // Extract folder name from the first file
//     const folderName = path.dirname(files[0].name);
//     const folderPath = path.join(__dirname, folderName);

//     // 1. Create the folder dynamically
//     if (!fs.existsSync(folderPath)) {
//       fs.mkdirSync(folderPath, { recursive: true });
//     }

//     // 2. Write all files into the folder
//     for (const file of files) {
//       const filePath = path.join(__dirname, file.name);
//       fs.writeFileSync(filePath, file.content, "utf8");
//     }

//     // Check if the main file is a Flask file
//     const mainFileContent = fs.readFileSync(
//       path.join(__dirname, mainFile),
//       "utf8"
//     );
//     const isFlask = isFlaskFile(mainFileContent);

//     // 3. Execute the main file
//     const mainFilePath = path.join(__dirname, mainFile);
//     const result =  executeMainFile(mainFilePath, folderPath, isFlask);

//     if (isFlask) {
//       // For Flask, send the URL
//       res.status(200).json({
//         message: "Flask server started successfully",
//         url: result.url,
//       });
//     } else {
//       // For normal Python/Node/C++ files, send the output
//       res.status(200).json({
//         message: "Execution successful",
//         output: result.output,
//       });
//     }

//     // 4. Cleanup: Delete the folder and its contents after 5 seconds
//     setTimeout(() => {
//       fs.rmSync(folderPath, { recursive: true, force: true });
//       console.log("Temporary folder deleted:", folderPath);
//     }, 5000);
//   } catch (error) {
//     console.error("Execution Error:", error);
//     res.status(500).json({ error: error.toString() });
//   }
// });




// const isReactFile = (fileContent) => {
//   return fileContent.includes("import React") && fileContent.includes("ReactDOM.render");
// };

// const executeMainFile = (mainFilePath, folderPath, isFlask = false, isReact = false) => {
//   return new Promise((resolve, reject) => {
//     const ext = path.extname(mainFilePath);
//     let command;

//     if (ext === ".js" && isReact) {
//       // Serve React app using a simple development server
//       const reactProcess = spawn("npx", ["vite", "--host"], {
//         cwd: folderPath, // Set React app folder as working directory
//         shell: true,
//       });

//       let reactUrl = "http://127.0.0.1:5173"; // Default Vite dev server URL
//       let errorOccurred = false;

//       // Monitor the output
//       reactProcess.stdout.on("data", (data) => {
//         const output = data.toString();
//         console.log(`React Output: ${output}`);

//         if (output.includes("localhost:5173")) {
//           resolve({ url: reactUrl, process: reactProcess });
    //     }
    //   });

    //   reactProcess.stderr.on("data", (data) => {
    //     errorOccurred = true;
    //     console.error(`React Error: ${data.toString()}`);
    //   });

    //   reactProcess.on("close", (code) => {
    //     if (errorOccurred) {
    //       reject(`React process exited with code ${code}`);
    //     }
    //   });
    //   return;
    // } else if (ext === ".js") {
    //   // Node.js Execution
    //   command = `node ${mainFilePath}`;
    // } else if (ext === ".cpp") {
    //   // C++ Compilation and Execution
    //   const executable = path.join(folderPath, "main_executable");
    //   command = `g++ ${mainFilePath} -o ${executable} && ${executable}`;
    // } else if (ext === ".py" && !isFlask) {
    //   // Normal Python Execution
    //   command = `python ${mainFilePath}`;
    // } else if (ext === ".py" && isFlask) {
    //   // Start Flask server
    //   const flaskProcess = spawn("python", [mainFilePath], {
    //     cwd: folderPath,
    //     shell: true,
      // });

      // let flaskUrl = "http://127.0.0.1:5000";
      // let errorOccurred = false;

      // flaskProcess.stdout.on("data", (data) => {
      //   const output = data.toString();
      //   console.log(`Flask Output: ${output}`);

      //   if (output.includes("Running on")) {
      //     resolve({ url: flaskUrl, process: flaskProcess });
      //   }
      // });

      // flaskProcess.stderr.on("data", (data) => {
      //   errorOccurred = true;
      //   console.error(`Flask Error: ${data.toString()}`);
      // });

      // flaskProcess.on("close", (code) => {
    //     if (errorOccurred) {
    //       reject(`Flask process exited with code ${code}`);
    //     }
    //   });
    //   return;
    // } else {
    //   reject(`Unsupported file type: ${ext}`);
    //   return;
    // }

    // // For non-server files, use exec
    // exec(command, (error, stdout, stderr) => {
    //   if (error) {
    //     reject(stderr || error.message);
    //   } else {
    //     resolve({ output: stdout });
    //   }
//     });
//   });
// };

// app.post("/runFiles", async (req, res) => {
//   try {
//     const { files, mainFile } = req.body;

//     if (!files || !Array.isArray(files) || !mainFile) {
//       return res
//         .status(400)
//         .json({ error: "Files array and mainFile are required" });
//     }

//     const folderName = path.dirname(files[0].name);
//     const folderPath = path.join(__dirname, folderName);

//     if (!fs.existsSync(folderPath)) {
//       fs.mkdirSync(folderPath, { recursive: true });
//     }

    // for (const file of files) {
    //   const filePath = path.join(folderPath, file.name);
    //   fs.writeFileSync(filePath, file.content, "utf8");
    // }

    // const mainFilePath = path.join(folderPath, mainFile);
    // const mainFileContent = fs.readFileSync(mainFilePath, "utf8");
    // const isFlask = isFlaskFile(mainFileContent);
    // const isReact = isReactFile(mainFileContent);

    // const result = await executeMainFile(mainFilePath, folderPath, isFlask, isReact);

    // if (result.url) {
    //   res.status(200).json({
    //     message: "Server started successfully",
//         url: result.url,
//       });
//     } else {
//       res.status(200).json({
//         message: "Execution successful",
//         output: result.output,
//       });
//     }

//     setTimeout(() => {
//       fs.rmSync(folderPath, { recursive: true, force: true });
//       console.log("Temporary folder deleted:", folderPath);
//     }, 5000);
//   } catch (error) {
//     console.error("Execution Error:", error);
//     res.status(500).json({ error: error.toString() });
//   }
// });


// Utility function to detect if a file is React-based
const isReactFile = (fileContent) => {
  return fileContent.includes("import React") && fileContent.includes("ReactDOM.render");
};

// Utility function to detect if a file is Flask-based
const isFlaskFile = (fileContent) => {
  return fileContent.includes("from flask import Flask") || fileContent.includes("Flask(");
};

// Execute the main file
// const executeMainFile = (mainFilePath, folderPath, isFlask = false, isReact = false) => {
//   return new Promise((resolve, reject) => {
//     const ext = path.extname(mainFilePath);
//     let command;

//     if (ext === ".js" && isReact) {
//       // Serve React app using a simple development server
//       const reactProcess = spawn("npx", ["vite", "--host"], {
//         cwd: folderPath, // Set React app folder as the working directory
//         shell: true,
//       });

//       let reactUrl = "http://127.0.0.1:5173"; // Default Vite dev server URL
//       let errorOccurred = false;

//       reactProcess.stdout.on("data", (data) => {
//         const output = data.toString();
//         console.log(`React Output: ${output}`);

//         if (output.includes("localhost:5173")) {
      //     resolve({ url: reactUrl, process: reactProcess });
      //   }
      // });

      // reactProcess.stderr.on("data", (data) => {
      //   errorOccurred = true;
      //   console.error(`React Error: ${data.toString()}`);
      // });

      // reactProcess.on("close", (code) => {
      //   if (errorOccurred) {
      //     reject(`React process exited with code ${code}`);
      //   }
      // });
      // return;
    // } else if (ext === ".js") {
    //   // Node.js Execution
    //   command = `node ${mainFilePath}`;
    // } else if (ext === ".cpp") {
    //   // C++ Compilation and Execution
    //   const executable = path.join(folderPath, "main_executable");
    //   command = `g++ ${mainFilePath} -o ${executable} && ${executable}`;
    // } else if (ext === ".py" && !isFlask) {
    //   // Normal Python Execution
    //   command = `python ${mainFilePath}`;
    // } else if (ext === ".py" && isFlask) {
    //   // Start Flask server
    //   const flaskProcess = spawn("python", [mainFilePath], {
    //     cwd: folderPath,
    //     shell: true,
    //   });

      // let flaskUrl = "http://127.0.0.1:5000";
      // let errorOccurred = false;

      // flaskProcess.stdout.on("data", (data) => {
      //   const output = data.toString();
      //   console.log(`Flask Output: ${output}`);

      //   if (output.includes("Running on")) {
      //     resolve({ url: flaskUrl, process: flaskProcess });
      //   }
      // });

      // flaskProcess.stderr.on("data", (data) => {
      //   errorOccurred = true;
      //   console.error(`Flask Error: ${data.toString()}`);
      // });

//       flaskProcess.on("close", (code) => {
//         if (errorOccurred) {
//           reject(`Flask process exited with code ${code}`);
//         }
//       });
//       return;
//     } else {
//       reject(`Unsupported file type: ${ext}`);
//       return;
//     }

//     // Execute for non-server files
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(stderr || error.message);
//       } else {
//         resolve({ output: stdout });
//       }
//     });
//   });
// };

const executeMainFile = (mainFilePath, folderPath, isFlask = false, isReact = false) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(mainFilePath);

    if (ext === ".js" && isReact) {
      // Serve React app using a simple development server (e.g., Vite)
      const reactProcess = spawn("npx", ["vite", "--host"], {
        cwd: folderPath, // Set React app folder as the working directory
        shell: true,
      });

      let reactUrl = "http://127.0.0.1:5173"; // Default Vite dev server URL
      let errorOccurred = false;

      reactProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`React Output: ${output}`);

        // Detect when the Vite server starts
        if (output.includes("http://")) {
          const match = output.match(/http:\/\/[^\s]+/);
          if (match) reactUrl = match[0];
          resolve({ url: reactUrl, process: reactProcess });
        }
      });

      reactProcess.stderr.on("data", (data) => {
        errorOccurred = true;
        console.error(`React Error: ${data.toString()}`);
      });

      reactProcess.on("close", (code) => {
        if (errorOccurred) {
          reject(`React process exited with code ${code}`);
        }
      });
      return;
    }

    // Other file types (Node.js, Flask, etc.)
    reject("Unsupported operation for React");
  });
};


// POST endpoint
app.post("/runFiles", async (req, res) => {
  try {
    const { files, mainFile } = req.body;

    if (!files || !Array.isArray(files) || !mainFile) {
      return res.status(400).json({ error: "Files array and mainFile are required" });
    }

    // Dynamically create folder
    const folderName = `Code_${Date.now()}`;
    const folderPath = path.join(__dirname, folderName);
    fs.mkdirSync(folderPath, { recursive: true });

    // Write files to the folder
    for (const file of files) {
      const filePath = path.join(folderPath, file.name);
      const fileDir = path.dirname(filePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(filePath, file.content, "utf8");
    }

    // Read the main file content
    const mainFilePath = path.join(folderPath, mainFile);
    const mainFileContent = fs.readFileSync(mainFilePath, "utf8");
    const isFlask = isFlaskFile(mainFileContent);
    const isReact = isReactFile(mainFileContent);

    // Execute the main file
    const result = await executeMainFile(mainFilePath, folderPath, isFlask, isReact);

    if (result.url) {
      res.status(200).json({
        message: "Server started successfully",
        url: result.url,
      });
    } else {
      res.status(200).json({
        message: "Execution successful",
        output: result.output,
      });
    }

    // Cleanup after 10 seconds
    setTimeout(() => {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log("Temporary folder deleted:", folderPath);
    }, 10000);
  } catch (error) {
    console.error("Execution Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

// app.post("/createFolder", (req, res) => {
//   const { folderName, files } = req.body;

//   if (!folderName || !files || !Array.isArray(files)) {
//     return res.status(400).json({ error: "Invalid request data" });
//   }

//   // Define the folder path
//   const folderPath = path.join(__dirname, folderName);

//   // Create the folder if it doesn't exist
//   if (!fs.existsSync(folderPath)) {
//     fs.mkdirSync(folderPath, { recursive: true });
//   }

//   // Write each file in the specified folder
//   files.forEach((file) => {
//     const filePath = path.join(__dirname, file.key);
//     fs.writeFileSync(filePath, file.content || ""); // Use empty content if none provided
//   });

//   res.status(200).json({ message: "Folder and files created successfully" });
// });


app.post("/createFolderFromS3", async (req, res) => {
  const { folderName, files } = req.body; // `files` is an array of file keys

  if (!folderName || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "Folder name and files are required." });
  }

  const folderPath = path.join(__dirname, folderName);

  try {
    // Step 1: Create the folder dynamically
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    // Step 2: Fetch file contents from S3 and write them to the folder
    for (const fileKey of files) {
      try {
        const params = { Bucket: BUCKET_NAME, Key: fileKey };
        const data = await s3Client.getObject(params).promise();

        // Write the file to the folder
        const filePath = path.join(folderPath, path.basename(fileKey));
        fs.writeFileSync(filePath, data.Body.toString("utf-8"));

        console.log(`File created: ${filePath}`);
      } catch (error) {
        console.error(`Error fetching file '${fileKey}':`, error);
      }
    }

    res.status(200).json({
      message: `Folder '${folderName}' created with files from S3.`,
    });
  } catch (error) {
    console.error("Error creating folder or fetching files:", error);
    res.status(500).json({ error: "Failed to create folder or fetch files." });
  }
});



app.post("/output", (req, res) => {
  console.log("got this as output", req.body );
  res.send("got this output");
});

app.get("/", (req, res) => {
  res.send("Live Code Collaboration IDE!");
});

app.get("/frameworks", async (req, res) => {
  try {
    const data = await s3Client
      .listObjectsV2({
        Bucket: BUCKET_NAME,
        Prefix: BASE_FOLDER,
        Delimiter: "/",
      })
      .promise();
    const frameworks = data.CommonPrefixes.map(
      (prefix) => prefix.Prefix.split("/")[1]
    );
    res.status(200).json(frameworks);
  } catch (error) {
    console.error("Error fetching frameworks:", error);
    res.status(500).json({ error: "Failed to fetch frameworks." });
  }
});

app.get("/folder/:name", async (req, res) => {
  const foldername = req.params.name;

  try {
    const data = await s3Client
      .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: `${foldername}/` })
      .promise();
    if (!data.Contents.length) {
      return res.status(404).json({ error: "Folder not found." });
    }

    const files = data.Contents.map((file) => ({
      key: file.Key,
      size: file.Size,
    }));
    res.status(200).json(files);
  } catch (error) {
    console.error("Error retrieving folder files:", error);
    res.status(500).json({ error: "Failed to retrieve folder files." });
  }
});

app.get("/file", async (req, res) => {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ error: "File key is required." });
  }

  try {
    const params = { Bucket: BUCKET_NAME, Key: key };
    const data = await s3Client.getObject(params).promise();
    res.status(200).send(data.Body.toString("utf-8"));
  } catch (error) {
    console.error("Error retrieving file content:", error);
    res.status(500).json({ error: "Failed to retrieve file content." });
  }
});

// Creating a new folder
const getFileName = (filename) => {
  let file = filename.toString();
  let index = file.lastIndexOf("/");
  return file.slice(index + 1);
};
// NOTE : When the server restart then copyNumber will be again initialized to 0
let copyNumber = 0;
app.post("/newfolder/:frameworkname", async (req, res) => {
  const framework = req.params.frameworkname;
  try {
    const fileData = await s3Client
      .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: `base/${framework}/` })
      .promise();
    const fileContentPromises = fileData.Contents.map(async (file) => {
      const key = file.Key;
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };
      const data = await s3Client.getObject(params).promise();
      return {
        filename: key,
        content: data.Body.toString("utf-8"),
      };
    });
    const filesContent = await Promise.all(fileContentPromises);
    copyNumber++;

    filesContent.map(async (file) => {
      const filename = getFileName(file.filename);
      const fileparams = {
        Bucket: BUCKET_NAME,
        Key: `Code${copyNumber}/${filename}`,
        Body: file.content,
      };

      await s3Client.putObject(fileparams).promise();
    });
    res.status(200).send(`Code${copyNumber}`);
  } catch (error) {
    console.log("Error in creating folder", error);
    res.send(500, "Error in creating new folder");
  }
});

// Code Updation
// app.put("/codeUpdate", async (req, res) => {
//   const { fileKey, newCode } = req.body;
//   if (!fileKey) {
//     return res.status(400).json({ error: "File key is required." });
//   }
//   try {
//     const newParams = {
//       Bucket: BUCKET_NAME,
//       Key: fileKey,
//       Body: newCode,
//     };

//     const response = await s3Client.putObject(newParams).promise();
//     res.send(200, response);
//   } catch (error) {
//     console.error("Error in pushing code to file", error);
//     res.send(500, "Error in pushing code to file");
//   }
// });

app.put("/codeUpdate", async (req, res) => {
  const { fileKey, newCode } = req.body;

  if (!fileKey || !newCode) {
    return res.status(400).json({ error: "File key and new code are required." });
  }

  try {
    // Update the file in the cloud storage
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: newCode,
    };
    const s3Response = await s3Client.putObject(s3Params).promise();

    // Update the local file system
    const localFilePath = path.join(__dirname, "Code1", path.basename(fileKey));
    fs.writeFileSync(localFilePath, newCode, "utf-8");

    res.status(200).json({ message: "File updated successfully", s3Response });
  } catch (error) {
    console.error("Error in updating code:", error);
    res.status(500).send("Error in updating code");
  }
});


// Add new file
// app.post("/addFile/:framework/:folder/:filename", async (req, res) => {
//   const newFileName = req.params.filename;
//   const frameworkname = req.params.framework;
//   const foldername = req.params.folder;

//   if (newFileName) {
//     const dotIndex = newFileName.lastIndexOf(".");
//     const extension = newFileName.slice(dotIndex + 1);

//     if (dotIndex < newFileName.length && dotIndex > 0) {
//       try {
//         const fileData = await s3Client
//           .listObjectsV2({
//             Bucket: BUCKET_NAME,
//             Prefix: `base/${frameworkname}/`,
        //   })
        //   .promise();
        // let copyFileContent;

        // for (let file of fileData.Contents) {
        //   const key = file.Key;
        //   const ext = key.slice(key.lastIndexOf(".") + 1);

        //   if (ext == extension) {
        //     const params = {
        //       Bucket: BUCKET_NAME,
        //       Key: key,
        //     };
        //     const data = await s3Client.getObject(params).promise();
        //     copyFileContent = data.Body.toString("utf-8");
        //     break;
        //   }
        // }
        // if (copyFileContent) {
        //   const newParams = {
        //     Bucket: BUCKET_NAME,
        //     Key: `${foldername}/${newFileName}`,
        //     Body: copyFileContent,
        //   };

        //   await s3Client.putObject(newParams).promise();
        //   res.send(200, "File added Successfully");
        // } else {
        //   res.send("Invalid");
//         }
//       } catch (error) {
//         console.error("Error in adding file to the folder : ", error);
//         res.send(500, "Error in adding new file ");
//       }
//     } else {
//       res.send("Invalid");
//     }
//   } else {
//     console.log("Filename is not defined");
//   }
// });



app.post("/addFile/:framework/:folder/:filename", async (req, res) => {
  const newFileName = req.params.filename;
  const frameworkname = req.params.framework;
  const foldername = req.params.folder;

  if (newFileName) {
    const dotIndex = newFileName.lastIndexOf(".");
    const extension = newFileName.slice(dotIndex + 1);

    if (dotIndex < newFileName.length && dotIndex > 0) {
      try {
        // Fetch content from cloud storage
        const fileData = await s3Client
          .listObjectsV2({
            Bucket: BUCKET_NAME,
            Prefix: `base/${frameworkname}/`,
          })
          .promise();

        let copyFileContent;

        for (let file of fileData.Contents) {
          const key = file.Key;
          const ext = key.slice(key.lastIndexOf(".") + 1);

          if (ext === extension) {
            const params = {
              Bucket: BUCKET_NAME,
              Key: key,
            };
            const data = await s3Client.getObject(params).promise();
            copyFileContent = data.Body.toString("utf-8");
            break;
          }
        }

        if (!copyFileContent) {
          console.error("No content found for the file.");
          return res.status(400).send("Content not found for the file.");
        }

        // Upload the file to cloud storage
        const newParams = {
          Bucket: BUCKET_NAME,
          Key: `${foldername}/${newFileName}`,
          Body: copyFileContent,
        };
        await s3Client.putObject(newParams).promise();

        // Save the file locally in the backend's Code1 folder
        const localDirectory = path.join(__dirname, "Code1");
        console.log(`Local directory path: ${localDirectory}`);

        if (!fs.existsSync(localDirectory)) {
          console.log("Code1 directory does not exist. Creating it...");
          fs.mkdirSync(localDirectory, { recursive: true });
        } else {
          console.log("Code1 directory already exists.");
        }

        const localFilePath = path.join(localDirectory, newFileName);
        console.log(`Writing file to: ${localFilePath}`);

        try {
          fs.writeFileSync(localFilePath, copyFileContent, "utf-8");
          console.log(`File ${newFileName} successfully written to Code1 folder.`);
        } catch (err) {
          console.error(`Failed to write file ${newFileName}:`, err);
          return res.status(500).send("Failed to write file locally.");
        }

        res.status(200).send("File added successfully");
      } catch (error) {
        console.error("Error in adding file to the folder:", error);
        res.status(500).send("Error in adding new file");
      }
    } else {
      res.status(400).send("Invalid filename");
    }
  } else {
    console.log("Filename is not defined");
    res.status(400).send("Filename is not defined");
  }
});


// Delete File
app.delete("/deleteFile", async (req, res) => {
  const key = req.query.fileKey;
  if (!key) {
    return res.send(400, "File key is requires");
  }

  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3Client.deleteObject(params).promise();
    res.send(200, "File deleted successfully");
  } catch (error) {
    console.error("Error in deleting file : ", error);
    res.send(500, "Error in deleting file");
  }
});

app.get("/extensions/:framework", async (req, res) => {
  const frameworkname = req.params.framework;
  try {
    const fileData = await s3Client
      .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: `base/${frameworkname}/` })
      .promise();
    const extensions = fileData.Contents.map((file) => {
      const key = file.Key;
      const ext = key.slice(key.lastIndexOf("."));
      return ext;
    });

    res.send(200, extensions);
  } catch (error) {
    console.error("Error in fetching extensions", error);
    res.send(500, "Error in fetching extensions");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost : ${PORT}`);
});
