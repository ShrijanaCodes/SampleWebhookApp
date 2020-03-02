// To-do: Add chatbot functionality
// Brainstorm with Tommy for additional features
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const rp = require('request-promise');
const config = require('./config');
const sgMail = require('@sendgrid/mail');
const path = require('path');
//access Sendgrid API key 
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// Generate a JWT token to authenticate and make Zoom API calls 
const payload = {
    iss: config.APIKey,
    exp: ((new Date()).getTime() + 5000)
};
const token = jwt.sign(payload, config.APISecret);
app.use(express.static('public'));

//Landing Page -- todo: Redesign the landing page based on what we want to add. 
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname+'/public/index.html'));

});

// Set up a webhook listener for Webinar Ended Event
app.post('/webinarEnded', bodyParser.raw({ type: 'application/json' }), (req, res) => {

    let event;

    try {
        event = JSON.parse(req.body);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Check to see if you received the event or not.
    console.log(event)
    if (req.headers.authorization === config.VerificationToken) {
        res.status(200);

        console.log("Webinar Ended Webhook Recieved.") 

        res.send();
        var uuid = event.payload.object.uuid;
        //Double encode the uuid for validation incase it contains slashes
        var euuid = encodeURIComponent(encodeURIComponent(uuid));

        var options = {
            uri: "https://api.zoom.us/v2/past_webinars/" + euuid + "/absentees",
            auth: {
                'bearer': token
            },
            headers: {
                'User-Agent': 'Zoom-api-Jwt-Request',
                'content-type': 'application/json'
            },
            json: true
        };



        rp(options)
            .then(function (response) {

                var myregistrantobj = response.registrants;
                //console.log("Registrants:", myregistrantobj)
                //fetch only the email addresses from the response and store the addresses in an array
                var emailList = []
                for (var i = 0; i < myregistrantobj.length; i++) {
                    //Store emails as an array of strings to match the request body for SendGrid API
                    emailobjs = myregistrantobj[i].email
                    emailList.push(emailobjs);
                    
                }
                // check if 
                console.log(emailList);
                
                // Call SendGrid Email API to send the email to participants 

                const msg = {

                    to: emailList,
                    from: 'shrijana.ghim@gmail.com',
                    subject: 'We are sorry that we missed you.',
                    text: 'Please, let us know if the timing of these webinars do not work for you. We hope you can join us next time.'

                };
                
                return msg;

            })
            .then(function(msg) {
                sgMail.sendMultiple(msg);
            })
            .then(function(){
                console.log("Email sent.")
            })
            
            .catch(function (err) {
                // API call failed...
                console.log('API call failed, reason ', err);
            });


    } else {

        response.status(403).end('Access forbidden');
        console.log("Invalid Post Request.")
    }
});



app.listen(3000, () => {
    console.log('Server is up and running on port 3005.')
})