import React,{useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import axios from "axios"

const Login = ()=>{
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e)=>{
    e.preventDefault();
    try{
       const response = await axios.post('http://localhost:5000/user/login', { email, password });
       navigate(`/${response.data}`);
    }catch(error){
      alert("Invalid credentials or  Server error");
    }
  }
    return(
        <div className="login">
          <div className="loginForm">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
             <input type="email" name="email" placeholder="email..." required value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="off"></input>
             <input type="password" name="password" placeholder="password..." required value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="off"></input>
             <button type="submit">Login</button>
          </form>
          <p>Don't have an account? <Link id="createAccount" to='/signup'>create account</Link></p>
          </div>
        </div>
    );
}

export default Login;