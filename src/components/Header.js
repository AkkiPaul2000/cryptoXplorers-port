import { AppBar, Container, MenuItem, Select, Toolbar, Typography } from '@material-ui/core'
import React from 'react'
import { makeStyles } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { CryptoState } from '../CryptoContext';



const useStyle=makeStyles(()=>({
  title:{
    flex:1,
    color:"gold",
    fontFamily:"Montserrat",
    fontWeight:"bold",
    cursor:"pointer",
  }
  
}))


function Header() {
  //console.log(CryptoState());
  const classes=useStyle();
  //const history=useHistory();
  const history = useNavigate();
  
  const {currency,setCurrency}=CryptoState();

  const darktheme = createTheme({
    palette: {
      primary: {
        main: '#fff',
        
      },
      type:"dark",
    },
  });

  return (
    <ThemeProvider theme={darktheme}>
    <AppBar color='transparent' position='static'>
      <Container>
        <Toolbar>
          <Typography onClick={()=>history('/')} variant="h6" className={classes.title} >CryptoXplorers</Typography>
          <Select 
          variant='outlined' 
          style={{
            width:100,
            height:40,
            marginright:15,
          }}
          value={currency}
          onChange={(e)=>setCurrency(e.target.value)}
          >
            <MenuItem value={"USD"}>USD</MenuItem>
            <MenuItem value={"INR"}>INR</MenuItem>
          </Select>
        </Toolbar>
      </Container>
    </AppBar>
    </ThemeProvider>
  )
}

export default Header