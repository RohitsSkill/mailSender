# mailSender
API in Node JS using express to send emails using the Gmail REST API. Without any client library

Here is the code for sending Email using gmail api
here is not created front-end code. It is just a back-end code writen in javascript

Step to run it

1.
First go to : https://console.developers.google.com/apis
then create new project add api then give name and continue steps........

2.
After creating project go to credential tab
create new creadentials select scopes as https://www.googleapis.com/auth/gmail.readonly and https://www.googleapis.com/auth/gmail.send
give redirect uri as 'http://localhost:3000/sendmail' this will help user to dont log-in next time
submit creadential
download credentials.json file which will shown by google to you after submiting the credential.

3.
Now go to terminal and create folder for project and move into it 
now run following commands
*******************
npm init
npm install express
*******************

4.
Copy that credentials.json file into this folder
and run final command on terminal
node .
go to localhost:3000/{email_receiver}/{subject_of_email}/{message_of_subject}

Now see your mail box.........
