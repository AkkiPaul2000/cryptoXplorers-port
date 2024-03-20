import React from 'react'
import { makeStyles, Container, Typography } from '@material-ui/core';
import Carousel from './Carousel';


const useStyles=makeStyles(()=>({
    banner:{
        backgroundImage:"url(./cryptoWallpaper.webp)"
    },
    bannerContent:{
        height:400,
        display:"flex",
        flexDirection:"column",
        paddingTop:25,
        justifyContent:"space=around",
    },
    tagline:{
        display: "flex",
        height:100,
        flexDirection:"column",
        justifyContent:"center",
        textAlign:"center",
    }
}))

function Banner() {
    const classes=useStyles();
  return (
    <div className={classes.banner}>
        <Container className={classes.bannerContent} >
        <div className={classes.tagline}>
            <Typography variant="h2" style={{
                fontWeight:"bold",
                marginBottom:15,
                fontFamily:"Montserrat",

            }}>CryptoXplorers</Typography>

            <Typography variant="subtitle2"
            style={{
                color:"darkgrey",
                textTransform:"capitalize",
                fontFamily:"Montserrat",
            }}>MoneyControl copy for cryptos for enthusiastic crypto traders alive </Typography>
        </div>
        <Carousel/>
        </Container>
    </div>
  )
}

export default Banner