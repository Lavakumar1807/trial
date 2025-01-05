import React , {useState}from "react";
import axios from "axios";
import { useNavigate} from "react-router-dom"

const SignUp = ()=>{
    const [username,setUsername] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e)=>{
      e.preventDefault();
      try{
         await axios.post('http://localhost:5000/user/signup', { username ,email, password });
         navigate('/login');
      }catch(error){
        alert("User already exist (Unique username and email)!!!");
      }
    }
    return(
        <div className="signup">
          <div className="signupForm">
             <h1>Signup</h1>
             <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="username..." required value={username} onChange={(e)=>setUsername(e.target.value)} autoComplete="off"></input>
                <input type="email" name="email" placeholder="email..." required value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="off"></input>
                <input type="password" name="password" placeholder="password..." required value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="off"></input>
                <button type="submit" id="signupBtn">Signup</button>
             </form>
             <p>Welcome to Live code collaboration IDE :)</p>
          </div>
        </div>
    );
}

export default SignUp