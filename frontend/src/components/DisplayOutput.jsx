// import React from "react";

// const DisplayOutput = ({ output }) => {
//     console.log(output);
//   return (
//     <div>
//       <h2>Code Execution Output</h2>
//       <pre>{output || "No output available yet. Run the code first!"}</pre>
//     </div>
//   );
// };

// export default DisplayOutput;

// import React from "react";
// import { useLocation } from 'react-router-dom'; // Import useLocation hook

// const DisplayOutput = () => {
//     const location = useLocation(); // Get the location object
//     const output = location.state?.output || "No output available"; // Access the output from the state

//     return (
//         <div>
//             <h2>Code Execution Output</h2>
//             <pre>{output}</pre>
//         </div>
//     );
// };

// export default DisplayOutput;


import { useLocation } from 'react-router-dom';

const DisplayOutput = () => {
    const location = useLocation(); // Get the location object
    const queryParams = new URLSearchParams(location.search);
    const output = queryParams.get('output') || "No output available"; // Access the output from the query params

    return (
        <div>
            <h2>Code Execution Output</h2>
            <pre>{output}</pre>
        </div>
    );
};

export default DisplayOutput;
