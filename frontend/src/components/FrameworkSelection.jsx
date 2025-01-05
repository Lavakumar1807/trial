import React , { useState,useEffect,useRef } from "react";
import {useNavigate,useParams} from "react-router-dom";
import axios from 'axios';

function FrameworkSelection() {
    const { username } = useParams();
    const [frameworks, setFrameworks] = useState([]);
    const [folder,setFolder] = useState("");
    const [selectedFramework,setSelectedFramework] = useState("");
    const folderOpened = useRef(false);
    const [userFolders,setUserFolders] = useState([]);
    const [selectedFolder,setSelectedFolder] = useState("");
    const navigate = useNavigate();

    const openFolder = ()=>{
        try{
            const folderFramework = selectedFolder.slice(selectedFolder.indexOf(',')+1,);
            const folder = selectedFolder.slice(0,selectedFolder.indexOf(','));
            folderOpened.current = true;
            navigation(folderFramework,folder)
        }catch(error){
            console.log("Error in opening Folder",error);
        }
    }

    // Create a copy folder of the selected framework
    const createFolder = async ()=>{
        if(!folderOpened.current){
            try{
                const response = await axios.post(`http://localhost:5000/newfolder`,
                    {
                        username : username,
                        frameworkname : selectedFramework,
                        foldername : folder,
                    },
                );
                folderOpened.current = true;
                navigation(selectedFramework,folder);
            }catch(error){
                alert("Use another foldername , foldername already exist or Server error");
                console.log("Error in pushing data to backend : ",error);
           }
        }
        else{
            console.log("Not creating a new folder",folderOpened.current)
        }
    }

    const navigation = (framework,foldername)=>{
        if(folderOpened.current){
            navigate(`/${username}/editor/${framework}/${foldername}`);
        }
        else{
            console.log("No folder created");
        }
    }
    
    const fetchFrameworks = async()=>{
        try {
            const response = await axios.get('http://localhost:5000/frameworks');
            setFrameworks(response.data);
        }catch (error) {
            console.error('Error fetching frameworks:', error);
        }
    }

    const fetchUserFolders = async()=>{
        try{
            const response = await axios.get(`http://localhost:5000/userFolders/${username}`);
            setUserFolders(response.data);
        }catch(error){
            console.error("Error in fetching user folders",error);
        }
    }
    useEffect(() => {
        fetchFrameworks();
        fetchUserFolders();
    }, []);

    return (
        <div className="frameworkSelection">
          <div className="dashboard">
           <h1>Welcome {username}</h1>

           <div className="folderDisplay">
             <div className="userFolders">
               <select 
                   onChange={(e)=>setSelectedFolder(e.target.value)}
                   defaultValue=""
               >
                  <option value="" disabled>Select Your Folder</option>
                  {userFolders.map((folder)=>(
                     <option key={folder} value={folder}>{folder[0]}</option>
                  ))}
               </select>
               <button onClick={openFolder} id="openFolder">Open Folder</button>
             </div>
             <div className="foldercreation">
              <input type="text" placeholder="Foldername..." autoComplete="off" value={folder} onChange={(e)=>setFolder(e.target.value)}></input>
              <select 
                onChange={(e)=>setSelectedFramework(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select Framework</option>
                {frameworks.map((fw) => (
                    <option key={fw} value={fw}>{fw}</option>
                ))}
             </select>
             <button onClick={createFolder} id="createFolder">Create Folder</button>
            </div>
           </div>

          </div>
        </div>
    );
}

export default FrameworkSelection;