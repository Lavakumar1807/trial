import React , { useState,useEffect,useRef } from "react";
import {useNavigate} from "react-router-dom";
import axios from 'axios';

function FrameworkSelection() {
    const [frameworks, setFrameworks] = useState([]);
    const foldercreated = useRef(false);
    const folder = useRef('');
    const navigate = useNavigate();

    // Create a copy folder of the selected framework
    const createFolder = async (framework)=>{
        if(!foldercreated.current){
            try{
                const response = await axios.post(`http://localhost:5000/newfolder/${framework}`);
                folder.current = response.data;
                foldercreated.current = true;
                navigation(framework);
            }catch(error){
               console.log("Error in pushing data to backend : ",error);
           }
        }
        else{
            console.log("Not creating a new folder",foldercreated.current)
        }
    }

    const navigation = (framework)=>{
        if(foldercreated.current){
            navigate(`editor/${framework}/${folder.current}`);
        }
        else{
            console.log("No folder created");
        }
    }
    
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
        <div className="frameworkSelection">
            <h1>Live Code Collaboration</h1>
            <h2>Select a Framework :</h2>
            <select 
                onChange = {(e)=> createFolder(e.target.value)}
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

export default FrameworkSelection;