import React from "react";
import {Link} from "react-router-dom";

const Home = ()=>{
    return(
        <div className="home">
            <h1>Live code collaboration IDE</h1>
            <Link id="getstarted" to="/login">Get started</Link>
        </div>
    );
}

export default Home; 