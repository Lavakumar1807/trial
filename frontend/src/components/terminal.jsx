import { Terminal as XTerminal} from '@xterm/xterm';
import { useEffect , useRef } from 'react';
import '@xterm/xterm/css/xterm.css'
//import socket from '../socket'
import { io } from 'socket.io-client';
const socket = io("http://localhost:5000");
const Terminal = () => {

    const terminalRef = useRef();
    const isRendered = useRef(false);

    useEffect(() => {
        if(isRendered.current) return;
        isRendered.current = true;
        const term = new XTerminal({
            rows: 20,
            columns: 20,
        });
        term.open(terminalRef.current);

        term.onData(data => {
            socket.emit('terminal:write', data);
        })

        socket.on("terminal:data", (data) => {
            term.write(data);
        })

        socket.on("dev-url", (url) => {
            //setDevUrl(url);
            console.log("dev-url", url);
          });
      
    }, []);

    return <div width="100%" ref={terminalRef} id="terminal" />
}

export default Terminal;

// import { Terminal as XTerminal } from "@xterm/xterm";
// import { useEffect, useRef } from "react";
// import "@xterm/xterm/css/xterm.css";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:5000");

// const Terminal = ({ updateIframeSrc }) => {
//   const terminalRef = useRef();
//   const isRendered = useRef(false);

//   useEffect(() => {
//     if (isRendered.current) return;
//     isRendered.current = true;

//     const term = new XTerminal({
//       rows: 20,
//       columns: 20,
//     });
//     term.open(terminalRef.current);

//     term.onData((data) => {
//       socket.emit("terminal:write", data);
//     });

//     socket.on("terminal:data", (data) => {
//       term.write(data);
//     });

//     // Update the iframe src when the React app starts
//     socket.on("react-app-started", (url) => {
//       console.log("React app started at:", url);
//       updateIframeSrc(url);
//     });

//     return () => {
//       socket.off("terminal:data");
//       socket.off("react-app-started");
//     };
//   }, [updateIframeSrc]);

//   const handleRunReactApp = () => {
//     socket.emit("run-react-app");
//   };

//   return (
//     <div>
//       <h2>Terminal</h2>
//       <div
//         ref={terminalRef}
//         id="terminal"
//         style={{ width: "100%", height: "300px", border: "1px solid #ccc" }}
//       ></div>
//       <button onClick={handleRunReactApp} style={{ margin: "10px 0" }}>
//         Run React App
//       </button>
//     </div>
//   );
// };

// export default Terminal;


// import { Terminal as XTerminal } from "@xterm/xterm";
// import { useEffect, useRef } from "react";
// import "@xterm/xterm/css/xterm.css";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:5000");

// const Terminal = ({ updateIframeSrc }) => {
//   const terminalRef = useRef();
//   const isRendered = useRef(false);

//   useEffect(() => {
//     if (isRendered.current) return;
//     isRendered.current = true;

//     const term = new XTerminal({
//       rows: 20,
//       cols: 120,
//     });
//     term.open(terminalRef.current);

//     // Listen for terminal output and write to the Xterm instance
//     socket.on("terminal:data", (data) => {
//       term.write(data);
//     });

//     // Send terminal input to the backend
//     term.onData((data) => {
//       socket.emit("terminal:write", data);
//     });

//     // Update iframe when React app starts
//     socket.on("react-app-started", (url) => {
//       console.log("React app started at:", url);
//       updateIframeSrc(url);
//     });

//     socket.on("react-app-error", (errorMessage) => {
//       console.error(errorMessage);
//     });

//     return () => {
//       socket.off("terminal:data");
//       socket.off("react-app-started");
//       socket.off("react-app-error");
//     };
//   }, [updateIframeSrc]);

//   return <div ref={terminalRef} id="terminal" style={{ width: "100%", height: "300px" }} />;
// };

// export default Terminal;
