import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Editor } from '@monaco-editor/react';

function FrameworkSelection() {
    const [frameworks, setFrameworks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchFrameworks() {
            try {
                const response = await axios.get('http://localhost:5000/frameworks');
                setFrameworks(response.data);
            } catch (error) {
                console.error('Error fetching frameworks:', error);
            }
        }
        fetchFrameworks();
    }, []);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Live Code Collaboration</h1>
            <h2>Select a Framework:</h2>
            <select
                style={{
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    marginTop: '10px',
                }}
                onChange={(e) => navigate(`/editor/${e.target.value}`)}
                defaultValue=""
            >
                <option value="" disabled>Select Framework</option>
                {frameworks.map((fw) => (
                    <option key={fw} value={fw}>{fw}</option>
                ))}
            </select>
        </div>
    );
}

function FrameworkEditor() {
    const { framework } = useParams();
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [code, setCode] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('plaintext');

    useEffect(() => {
        async function fetchFiles() {
            try {
                const response = await axios.get(`http://localhost:5000/framework/${framework}`);
                setFiles(response.data);
            } catch (error) {
                console.error('Error fetching framework files:', error);
            }
        }
        fetchFiles();

        const languageMap = {
            nodejs: 'javascript',
            python: 'python',
            cpp: 'cpp',
        };
        setEditorLanguage(languageMap[framework] || 'plaintext');
    }, [framework]);

    const handleFileSelect = async (fileKey) => {
        setSelectedFile(fileKey);
        try {
            const response = await axios.get('http://localhost:5000/file', {
                params: { key: fileKey },
            });

            setCode(response.data);
        } catch (error) {
            console.error('Error fetching file content:', error);
        }
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1e81b0' }}>
            
            <div
                style={{
                    width: '25vw',
                    backgroundColor: '#063970',
                    padding: '10px',
                    overflowY: 'auto',
                }}
            >
                <h3 style={{ color: 'white' }}>Files in {framework}:</h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {files.map((file) => (
                        <li key={file.key}>
                            <button
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px',
                                    border: 'none',
                                    color: 'white',
                                    backgroundColor: selectedFile === file.key ? '#0d6096' : 'transparent',
                                    cursor: 'pointer',
                                    borderRadius: '5px',
                                }}
                                onClick={() => handleFileSelect(file.key)}
                            >
                                {file.key}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

         
            <div style={{ flexGrow: 1, padding: '10px' }}>
                <Editor
                    height="90vh"
                    language={editorLanguage}
                    theme="vs-dark"
                    value={code}
                    onChange={handleCodeChange}
                />
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<FrameworkSelection />} />
                <Route path="/editor/:framework" element={<FrameworkEditor />} />
            </Routes>
        </Router>
    );
}

export default App;
