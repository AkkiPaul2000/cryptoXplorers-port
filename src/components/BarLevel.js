import React from 'react'
import { makeStyles } from '@material-ui/core';
import { Line } from 'rc-progress';
// import TrendingDownIcon from '@material-ui/icons/TrendingDown';
// import TrendingUpIcon from '@material-ui/icons/TrendingUp';


function BarLevel() {
    const useStyles=makeStyles(()=>({
      container:{
        
          width:"100%",
          display: "flex",
          justifyContent: "space-around",
          alignItems:"center",
          marginBottom:20,

      },
        rangeText:{
          fontFamily: "Montserrat",
          color:"gold",
          opacity:0.3 ,
          fontWeight:500,
        },
        rangeValue:{
          fontFamily: "Montserrat",
          color:"gold",
          fontWeight:"bolder",
          fontSize:30,
          // fontSize:50,
        },

        bar:{
            width:"60%",
            padding: 10,
            borderRadius: 25,
            borderRight:"2px solid grey",
            border:"2px solid grey",

          }
    })
        );
    const classes=useStyles();
  return (
    // <div
    // className={classes.bar}
    // >
<div
className={classes.container}
>


      <p>
      <span className={classes.rangeText}>24 LOW</span><br></br> 
        <span className={classes.rangeValue}>155</span>
      </p>
  


     <Line className={classes.bar} percent={10} strokeWidth={4} trailWidth={4} trailColor="transparent" strokeColor=" #FFD700" />
     <p>
      <span className={classes.rangeText}>24 HIGH</span><br></br> 
        <span className={classes.rangeValue}>155</span>
      </p>  </div>
    // </div>
  )
}

export default BarLevel

/////
 


