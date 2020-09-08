"use strict";
require("dotenv").config();
const request = require("request");
const val = require("validator");
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
var shortUrl = require("node-url-shortener");
const path = require("path");

const express = require("express");
const app = express();
app.use(express.json());

let PORT = process.env.PORT || 1337;
app.listen(PORT, () => console.log(`Server running at port ${PORT}`));

//POST
// Creates the endpoint for our webhook
app.post("/webhook", (req, res) => {
  let body = req.body;
  //console.log(body);

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      //console.log("webhook event obj: " + webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      
      //console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        console.log("handling a message: " + webhook_event.message.text);
        typing(sender_psid);
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        console.log("handling a postback");
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

//GET
// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "foobar";

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
  // console.log(val.isURL(received_message.text) + "url")
  // Check if the message contains text
  
  try {
    if (received_message.text && val.isURL(received_message.text)) {
      greet(sender_psid).then( () => {
        //console.log("Message was: " + received_message.text);
      let response;
      
      shortUrl.short(received_message.text, function (err, url) {
        response = {
          text: url,
        };
        console.log("Shortened URL is: "+url);
        callSendAPI(sender_psid, response);
      });
      })
      

      // Sends the response message
    } else {
      //console.log("no url or no text in message");
      nourl(sender_psid);
    }
  } catch (error) {
    console.log("error catched");
    console.log(error);
    nourl(sender_psid);
  }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("URL Shortened Successfully! ~~");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

async function greet(sender_psid) {
  let greetings = {
    recipient: {
      id: sender_psid,
    },
    message: {
      text: "Don't forget to Like and Share! Here is your shortened URL: ",
    },
  };

  //some greetings
  var tt = request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: greetings,
    },
    (err, res, body) => {
      if (!err) {
        console.log("Greetings Sent!");
      } else {
        console.error("Unable to send greetings:" + err);
      }
    }
  )
  console.log("yow: "+JSON.stringify(tt))
}

async function nourl(sender_psid) {
  let greetings = {
    recipient: {
      id: sender_psid,
    },
    message: {
      text: "Please enter a valid URL.",
    },
  };

  //SEND API 'Please enter a valid URL.'
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: greetings,
    },
    (err, res, body) => {
      if (!err) {
        console.log("\'Please enter a valid URL.\' message sent.");
      } else {
        console.error("Unable to send error message:" + err);
      }
    }
  );
}

function typing(sender_psid) {
  let typing = {
    recipient: {
      id: sender_psid,
    },
    sender_action: "typing_on",
  };
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: typing,
    },
    (err, res, body) => {
      if (!err) {
        console.log("typing..");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

app.use("/", (req, res) => {
  // res.sendFile('./index.html')
  res.sendFile(path.join(__dirname + "/public/index.html"));
  //__dirname : It will resolve to your project folder.
});
