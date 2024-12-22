const express = require("express");
const http = require("http");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync, exec, spawn } = require("child_process");
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
// app.use((req, res, next) => {
//   res.setHeader("X-Frame-Options", "ALLOW-FROM http://localhost:3000/editor/cpp/Code1");
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   next();
// });
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(bodyParser.json());
app.use(cors());


const BUCKET_NAME = "task2";
const BASE_FOLDER = "base/";

var shell = os.platform() === "win32" ? "powershell.exe" : "bash";
var ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 120,
  rows: 30,
  cwd: process.env.INIT_CWD,
  // cwd: path.join(__dirname, "Code1"),
  env: process.env,
  encoding: "utf8",
});
ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
  // Check if data contains the "http://" or "https://" URL
  const urlMatch = data.match(/(http:\/\/localhost:\d+|https:\/\/localhost:\d+)/);
  if (urlMatch) {
    const url = urlMatch[0];
    io.emit("dev-url", url);
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

    const touchCommandMatch = data.trim().match(/^touch\s+([^\s]+)/);
  if (touchCommandMatch) {
    const newFileName = touchCommandMatch[1];
    const fileExtension = newFileName.split(".").pop();
    const filePath = path.join(__dirname, "Code1", newFileName);

    console.log(`Detected "touch" command. Filename: ${newFileName}`);

    (async () => {
      try {
        const fileData = await s3Client
          .listObjectsV2({
            Bucket: BUCKET_NAME,
            Prefix: `base/${frameworkname}/`,
          })
          .promise();

        let copyFileContent = null;

        for (const file of fileData.Contents) {
          const key = file.Key;
          const ext = key.split(".").pop();

          if (ext === fileExtension) {
            console.log(`Matching default file found in cloud storage: ${key}`);
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
          console.error("No default content found for the file extension:", fileExtension);
          return;
        }

        console.log(`Writing file locally to: ${filePath}`);
        fs.writeFileSync(filePath, copyFileContent, "utf8");

        const uploadParams = {
          Bucket: BUCKET_NAME,
          Key: `Code1/${newFileName}`,
          Body: copyFileContent,
        };

        console.log("Uploading file to cloud storage...");
        await s3Client.putObject(uploadParams).promise();
        console.log("File successfully uploaded to cloud storage");

        io.emit("file-created", { name: newFileName, content: copyFileContent });
        console.log("Frontend notified about file creation");
      } catch (error) {
        console.error("Error processing touch command:", error);
      }
    })();
  }

  });
});

app.post(`/:frameworkname/:selectedFile/:foldername`, async (req, res) => {
  const framework = req.params.frameworkname;
  const filename = req.params.selectedFile;
  const foldername = req.params.foldername;
  const { hostPort } = req.body;
  if(framework == "nodejs"){
    try {
      const uniqueTag = `node-app-image:${Date.now()}`;
  
      console.log("Building Docker image...");
      execSync(`docker build -t ${uniqueTag} .`, {
        cwd: path.join(__dirname, foldername),
        stdio: "inherit",
      });
  
      console.log("Stopping existing container (if any)...");
      execSync(`docker rm -f node-container || true`, { stdio: "inherit" });
  
      console.log("Starting new container...");
      execSync(
        `docker run -d -p ${hostPort}:3000 --name node-container ${uniqueTag}`,
        { stdio: "inherit" }
      );
  
      const appUrl = `http://localhost:${hostPort}`;
      console.log(`Node.js app deployed at ${appUrl}`);
      res.json({ url: appUrl });
    } catch (error) {
      console.error("Deployment error:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
  else if(framework == "python"){
    try {
      const uniqueTag = `flask-app-image:${Date.now()}`;
      const appFolder = path.join(__dirname, foldername);
  
      console.log("Building Docker image...");
      execSync(`docker build -t ${uniqueTag} .`, {
        cwd: appFolder,
        stdio: "inherit",
      });
  
      console.log("Stopping existing container (if any)...");
      execSync(`docker rm -f flask-container || true`, { stdio: "inherit" });
  
      console.log("Starting new container...");
      execSync(
        `docker run -d -p ${hostPort}:5000 --name flask-container ${uniqueTag}`,
        { stdio: "inherit" }
      );
  
      const appUrl = `http://localhost:${hostPort}`;
      console.log(`Flask app deployed at ${appUrl}`);
      res.json({ url: appUrl });
    } catch (error) {
      console.error("Deployment error:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
  else if(framework == "reactjs"){
    try {
      const uniqueTag = `react-app-image:${Date.now()}`;
  
      console.log("Building Docker image...");
      execSync(`docker build -t ${uniqueTag} .`, {
        cwd: path.join(__dirname, foldername),
        stdio: "inherit",
      });
  
      console.log("Stopping existing container (if any)...");
      execSync(`docker rm -f react-container || true`, { stdio: "inherit" });
  
      console.log("Starting new container...");
      execSync(
        `docker run -d -p ${hostPort}:3000 --name react-container ${uniqueTag}`,
        { stdio: "inherit" }
      );
  
      const appUrl = `http://localhost:${hostPort}`;
      console.log(`React app deployed at ${appUrl}`);
      res.json({ url: appUrl });
    } catch (error) {
      console.error("Deployment error:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
  else{
    try {
      const folderAbsolutePath = path.join(__dirname, foldername);
      const filePath = path.join(folderAbsolutePath, filename);
  
      if (!filename.endsWith(".cpp")) {
        return res.status(400).json({ error: "Only .cpp files are allowed." });
      }
  
      const outputFilePath = filePath.replace(".cpp", "");
  
      exec(`g++ ${filePath} -o ${outputFilePath} -I${folderAbsolutePath}`, (compileError) => {
        if (compileError) {
          return res.status(400).json({ error: `Compilation Error: ${compileError.message}` });
        }
  
        console.log("Compilation successful, running the program...");
  
        exec(outputFilePath, { cwd: folderAbsolutePath }, (runError, stdout, stderr) => {
          if (runError) {
            return res.status(400).json({ error: `Runtime Error: ${runError.message}` });
          }
  
          res.json({ output: stdout || stderr });
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  }
  
});

app.post("/stop", async (req, res) => {
  const { hostPort, framework } = req.body;

  try {
    console.log(`Stopping container for framework ${framework} on port ${hostPort}...`);

    let containerName;
    switch (framework) {
      case "nodejs":
        containerName = "node-container";
        break;
      case "reactjs":
        containerName = "react-container";
        break;
      case "python":
        containerName = "flask-container";
        break;
      default:
        return res.status(400).json({ error: "Invalid framework specified." });
    }

    execSync(`docker rm -f ${containerName} || true`, { stdio: "inherit" });

    console.log(`Container for ${framework} stopped and port ${hostPort} freed.`);
    res.json({ message: `${framework} app stopped successfully.` });
  } catch (error) {
    console.error("Error stopping container:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/createFolderFromS3", async (req, res) => {
  const { folderName, files, framework } = req.body;

  if (!folderName || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "Folder name and files are required." });
  }

  const folderPath = path.join(__dirname, folderName);

  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    for (const fileKey of files) {
      try {
        const params = { Bucket: BUCKET_NAME, Key: fileKey };
        const data = await s3Client.getObject(params).promise();

        const filePath = path.join(folderPath, path.basename(fileKey));
        fs.writeFileSync(filePath, data.Body.toString("utf-8"));
      } catch (error) {
        console.error(`Error fetching file '${fileKey}':`, error);
      }
    }

    if (framework && framework.toLowerCase() !== "cpp") {
      const dockerfilePath = path.join(folderPath, "Dockerfile");
      let dockerfileContent = "";

      switch (framework.toLowerCase()) {
        case "nodejs":
          dockerfileContent = `
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the application code
COPY . .

# Command to run your Node.js application
CMD [\"node\", \"example.js\"]`;
          break;

        case "python":
          dockerfileContent = `
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose the port that Flask will run on
EXPOSE 5000

# Run the Flask app
CMD [\"python\", \"main.py\"]`;
          break;

        case "reactjs":
          dockerfileContent = `
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight HTTP server for serving the app
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD [\"serve\", \"-s\", \"build\"]`;
          break;

        default:
          console.warn("Unsupported framework specified, no Dockerfile created.");
          break;
      }

      if (dockerfileContent) {
        fs.writeFileSync(dockerfilePath, dockerfileContent);
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


app.put("/codeUpdate", async (req, res) => {
  const { fileKey, newCode, foldername } = req.body;

  if (!fileKey || !newCode) {
    return res.status(400).json({ error: "File key and new code are required." });
  }

  try {
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: newCode,
    };
    const s3Response = await s3Client.putObject(s3Params).promise();

    const localFilePath = path.join(__dirname, foldername, path.basename(fileKey));
    fs.writeFileSync(localFilePath, newCode, "utf-8");

    res.status(200).json({ message: "File updated successfully", s3Response });
  } catch (error) {
    console.error("Error in updating code:", error);
    res.status(500).send("Error in updating code");
  }
});


app.post("/addFile/:framework/:folder/:filename", async (req, res) => {
  const newFileName = req.params.filename;
  const frameworkname = req.params.framework;
  const foldername = req.params.folder;

  if (newFileName) {
    const dotIndex = newFileName.lastIndexOf(".");
    const extension = newFileName.slice(dotIndex + 1);

    if (dotIndex < newFileName.length && dotIndex > 0) {
      try {
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

        const newParams = {
          Bucket: BUCKET_NAME,
          Key: `${foldername}/${newFileName}`,
          Body: copyFileContent,
        };
        await s3Client.putObject(newParams).promise();

        const localDirectory = path.join(__dirname, foldername);
        console.log(`Local directory path: ${localDirectory}`);

        if (!fs.existsSync(localDirectory)) {
          console.log(`${foldername} directory does not exist. Creating it...`);
          fs.mkdirSync(localDirectory, { recursive: true });
        } else {
          console.log(`${foldername} directory already exists.`);
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
  const { fileKey, foldername } = req.query;

  if (!fileKey || !foldername) {
    return res.status(400).send("File key and folder name are required");
  }

  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
    };

    await s3Client.deleteObject(params).promise();
    console.log(`File ${fileKey} successfully deleted from cloud storage.`);

    const localFilePath = path.join(__dirname, foldername, path.basename(fileKey));
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log(`File ${localFilePath} successfully deleted from local folder.`);
    } else {
      console.log(`File ${localFilePath} does not exist locally.`);
    }

    res.status(200).send("File deleted successfully");
  } catch (error) {
    console.error("Error in deleting file:", error);
    res.status(500).send("Error in deleting file");
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
