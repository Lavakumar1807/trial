const express = require("express");
const http = require("http");
const os = require("os");
const pty = require("node-pty-prebuilt-multiarch");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const s3Client = require("./storjClient");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(bodyParser.json());
app.use(cors());

const BUCKET_NAME = "task2";
const BASE_FOLDER = "base/";

var shell = os.platform() === "win32" ? "powershell.exe" : "bash";
var ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: process.env.INIT_CWD,
  env: process.env,
});


ptyProcess.onData((data) => {
   io.emit("terminal:data", data);
console.log(data);
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
app.put("/codeUpdate", async (req, res) => {
  const { fileKey, newCode } = req.body;
  if (!fileKey) {
    return res.status(400).json({ error: "File key is required." });
  }
  try {
    const newParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: newCode,
    };

    const response = await s3Client.putObject(newParams).promise();
    res.send(200, response);
  } catch (error) {
    console.error("Error in pushing code to file", error);
    res.send(500, "Error in pushing code to file");
  }
});

// Add new file
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

          if (ext == extension) {
            const params = {
              Bucket: BUCKET_NAME,
              Key: key,
            };
            const data = await s3Client.getObject(params).promise();
            copyFileContent = data.Body.toString("utf-8");
            break;
          }
        }
        if (copyFileContent) {
          const newParams = {
            Bucket: BUCKET_NAME,
            Key: `${foldername}/${newFileName}`,
            Body: copyFileContent,
          };

          await s3Client.putObject(newParams).promise();
          res.send(200, "File added Successfully");
        } else {
          res.send("Invalid");
        }
      } catch (error) {
        console.error("Error in adding file to the folder : ", error);
        res.send(500, "Error in adding new file ");
      }
    } else {
      res.send("Invalid");
    }
  } else {
    console.log("Filename is not defined");
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
