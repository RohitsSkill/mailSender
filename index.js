//welcome here
const {Base64} = require('js-base64');    //this is required for encoding purpore because gmail messages are endoded in base64
const fs = require('fs');                 //this is required for reading & writing token file
const {google} = require('googleapis');   //this is google api which is important in this program
const express = require('express');       //this is used to host our application
const app = express();

// we are using 2 scope here 1.readonly and 2. send
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly',
'https://www.googleapis.com/auth/gmail.send'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time.
const TOKEN_PATH = 'token.json';    //set path of token to store
let oAuth2Client = null;            //to access in get method at 'sendmail' path this is required
let info = {                        //initialized that info object to use next
  to: null,
  subject: null,
  message: null,
};

//this is actual path to send mail
app.get('/:to/:subject/:message',(req,res)=>{
  if(req.params.to==="null" || req.params.subject==="null" || req.params.message==="null"){//checking that fields are not null
    console.log("information are null");
    res.send("All /to/subject/message are compulsory..!");
    return    //if null then return after sending proper message.
  }
  else{                 //else set the mail information into info object to send it next
    info = {
      to: req.params.to,
      subject: req.params.subject,
      message: req.params.message,
    }
  }
  //if you are downloaded your credentials.json then it will check else you 
  //need to download it from https://console.developers.google.com/apis/credentials?project='YOUR PROJECT NAME'
  //for more information check readme file
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), res,);
  });
});

/**
 * Create an OAuth2 client with the given credentials
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials, res) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;  //if you dowloaded credentials.json then change key name from 'web' to 'installed' or change installed to web in this line
  oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);      //set id,secret,and redirect_uri for move later 

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, res); //if not then get new tocken
    oAuth2Client.setCredentials(JSON.parse(token));
    const message =  sendmessage(oAuth2Client);
    console.log(message);
    res.send(message);
  });
}

/**
 * Get new token.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
function getNewToken(oAuth2Client, res) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',   //this is used to get both access and refresh token
    scope: SCOPES,            //set the scope
  });
  
  console.log("Authorizing user........................");
  res.redirect(authUrl);      //move to login or sign-in page of google to get token.
}

// When user will sign in by google it will rediect to here for storing token sended by google
app.get('/sendmail',(req,res)=>{
  if(oAuth2Client!=null){         //check user is sign-in
    if(req.query.code){           //check proper token return by google
      oAuth2Client.getToken(req.query.code, (err, token) => {
        if (err){                                             //check for proper token
          console.error('Error retrieving access token', err);
          return res.send("Error: please retry");
        }
        oAuth2Client.setCredentials(token);     //set token to oAuth2Client object to proceed next
        // Store the token to disk for next program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        res.redirect(`http://localhost:3000/${info.to}/${info.subject}/${info.message}`);//move for sending mail
      });
    }
    else{
          console.log("token not found");
          res.redirect(`http://localhost:3000/${info.to}/${info.subject}/${info.message}`);//move to get token
    }
  }
  else{
    console.log("client not verified");
    res.redirect(`http://localhost:3000/${info.to}/${info.subject}/${info.message}`);//move to sign in
  }
});

/**
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
* now send the mail if proper link with proper parameter are passed by user
*/
async function sendmessage(oAuth2Client) {
  let msg = null;
  if(oAuth2Client){
    const gmail = google.gmail({version: 'v1', oAuth2Client});  //get gmail object using verified oAuth2Client object 

    //check that proper paramers are passed with link
    if(info.to==="null" || info.subject==="null" || info.message==="null"){
      console.log("null");
      res.send("All /to/subject/message are compulsory..!");
      return
    }
    else{  
      //if paramers are proper then encode with base64
      msg = makeRaw(info.to,info.subject,info.message);
    }

    let message = null; //create a null message to show next a proper message to user
    await gmail.users.messages.send({
      auth: oAuth2Client,               //set verified user's credentials
      userId:'me',                      //set he's user-ID
      'resource': {
        'raw': msg                      //set encoded message
      }
    },(err,res)=>{
      if(err){
        message = err.message;  //if error in sending message then know to user
      }else{
        message = "Successfully sended";      //send success message
        info = {                        //initialized that info object to use next
          to: null,
          subject: null,
          message: null,
        };
      }
    });
    return message;
  }
  else{
    //if user is not verified then move to sign in
    'client not authenticated..!';
  }
    
}

//this function will encode the 'info' object into base64 string which will acceptable by gmail server
function makeRaw(to,subject,message){
  //at the end of every field '\n' is appended for new line between this field.
   let str = ["Content-Type: text/plain; charset=\"UTF-8\"\r\n",  //standard format 
      "MIME-Version: 1.0\r\n",                                    //standard format
      "Content-Transfer-Encode:7bit\r\n",                         //standard format
      //"From: ",from,"\n",       This is not required it will automatically access authenticated user mail for this field.
      "To: ",to,"\n",             //receiver address
      "Subject: ",subject,"\n",   //subject of mail
      "message: ",message,        //message
  ].join('');
encodeMsg = Base64.encodeURI(str);    //encode using standard library base64
return encodeMsg                       //return encoded message
  
}

app.listen(3000,()=>console.log('App is running at localhost:3000'));//this is express listen method where our apllication is running.

/////__IF YOU UNDERSTAND THAT PROGRAM THEN WELL IF NOT THEN CONTACT AT MAIL SHOWN IN README FILE___/////