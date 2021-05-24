var express = require("express");
var zipcodes = require("zipcodes-nearby");
var sizeof = require("object-sizeof");
var request = require("request");
var bodyparser = require('body-parser');
var path = require('path');
const fetch = require("node-fetch");
var mongoose = require('mongoose');
var uuid = require('uuid');
var CronJob = require("node-cron");
const User = require('./models/user.js');

if(process.env.NODE_ENV!=="production"){
  require("dotenv").config();
}

var uri = process.env.MONGODB_URI;
var api = process.env.GIT_API;
var state = process.env.STATE;
var secretKey = process.env.secret;
var mak = process.env.MAIL_API_KEY;
var mid = process.env.MAIL_ID;

var app = express();

mongoose.connect(uri,{
  useNewUrlParser:true,
  useCreateIndex:true,
  useUnifiedTopology:true,
  useFindAndModify:false
});

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error"));
db.once("open",()=>{
  console.log("Database Connected")
});


app.use(express.static(path.join(__dirname, "public")));
app.use(bodyparser.urlencoded({
  extended: true,
  limit: "50mb"
}));
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");



// cron sleeps from 2-9 am
var task = CronJob.schedule('* * * * *', () => {
  var options = {
    method: "GET",
    url: "https://covisealback.azurewebsites.net/cronapp",
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);

            var index = 0;
            var mailobj = [];
            var tempd_id;
            var temp_dobj= {};
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, "0");
            var mm = String(today.getMonth() + 1).padStart(2, "0");
            var yyyy = today.getFullYear();
            today = dd + "-" + mm + "-" + yyyy;

            var check  = setInterval(async() => {
              if (index < 800) {
                console.log("index : " + Number(index + 0) + ' to index : ' + Number(index + 100));
                await User.find({
                  $and: [
                    { district: { $gt: 0 + index } },
                    { district: { $lte: 100 + index } },
                  ],
                })
                  .sort({ district: 1 })
                  .exec(function (err, result) {
                    if (err) console.log(err);
                    else { // main logic begins here
                        result.forEach(x =>{
                              var request = require("request");
                              var options = {
                                method: "GET",
                                url: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${x.district}&date=${today.toString()}`,
                                headers: {
                                  "Accept-Language": "en_US",
                                  'x-api-key': '3sjOr2rmM52GzhpMHjDEE1kpQeRxwFDr4YcBEimi'
                                },
                              };
                              request(options, function (error, response) {
                                if (error) throw new Error(error);
                                var data1 = response.body;
                                mailobj = [];
                                data1=JSON.parse(data1);
                                console.log(data1);
                                  data1.sessions.forEach(k =>{
                                    if (k.vaccine == x.vname) {
                                      // mail code
                                      // console.log("district_id : " + x.district);
                                      // console.log(k);
                                      if(k.available_capacity!=0){
                                        mailobj.push({
                                          name: k.name,
                                          add: k.address,
                                          cap: k.available_capacity,
                                          vaccine: k.vaccine,
                                        });
                                      }
                                    } else if (x.vname == "any vac") {
                                      // mail code
                                      // console.log("district_id : " + x.district);
                                      // console.log(k);
                                      if(k.available_capacity!=0){
                                        mailobj.push({
                                          name: k.name,
                                          add: k.address,
                                          cap: k.available_capacity,
                                          vaccine: k.vaccine,
                                        });
                                      }
                                    } else {
                                      console.log(
                                        x.vname +" not available for district_id : " + x.district);
                                    }

                                    
                                  });


                                  if(mailobj.length>0){
                                      var API_KEY = mak;
                                      var string = '';
                                      mailobj.forEach(l =>{
                                          string += `<tr>
                                                    <td style="border: 2px solid rgb(223,193,193);background:rgba(239, 239, 239, 1);">${l.name}</td>
                                                    <td style="border: 2px solid rgb(223,193,193);background:rgba(239, 239, 239, 1);">${l.add}</td>
                                                    <td style="border: 2px solid rgb(223,193,193);background:rgba(239, 239, 239, 1);">${l.cap}</td>
                                                    <td style="border: 2px solid rgb(223,193,193);background:rgba(239, 239, 239, 1);">${l.vaccine}</td>
                                                    </tr>`;
                                      });


                                      var DOMAIN = "mail.coviseal.codes";
                                      var mailgun = require("mailgun-js")({
                                        apiKey: API_KEY,
                                        domain: DOMAIN,
                                      });

                                      const data = {
                                        from: "Team-Coviseal <no-reply@coviseal.codes>",
                                        to: `${x.email}`,
                                        subject: "Vaccine Slot Alert!!",
                                        html: `            
                                          <!DOCTYPE html>
                                              <html lang="en">
                                              <head>
                                                  <meta charset="UTF-8">
                                                  <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                              </head>
                                              <body>
                                              <h3>Hey ${x.name},</h3>
                                              <p>Here are the updated slots for vaccinations as per your preference :  </p>
                                                  <table style="border-collapse: collapse; width: 100%; font-family: 'Poppins', sans-serif; border: 2px solid rgb(223,193,193);text-align:center;">
                                                          <tr>
                                                              <td id="heading" style="border-collapse: collapse; color: rgb(241, 236, 229); font-family: 'Poppins', sans-serif; width: 100px; padding: 1.5%; border: 2px solid rgb(223,193,193); background:rgba(16, 3, 33, 1);text-align:center;">Name</td>
                                                              <td id="heading" style="border-collapse: collapse; color: rgb(241, 236, 229); font-family: 'Poppins', sans-serif; width: 100px; padding: 1.5%; border: 2px solid rgb(223,193,193); background:rgba(16, 3, 33, 1);text-align:center;">Address</td>
                                                              <td id="heading" style="border-collapse: collapse; color: rgb(241, 236, 229); font-family: 'Poppins', sans-serif; width: 100px; padding: 1.5%; border: 2px solid rgb(223,193,193); background:rgba(16, 3, 33, 1);text-align:center;">Available Slots</td>
                                                              <td id="heading" style="border-collapse: collapse; color: rgb(241, 236, 229); font-family: 'Poppins', sans-serif; width: 100px; padding: 1.5%; border: 2px solid rgb(223,193,193); background:rgba(16, 3, 33, 1);text-align:center;">Vaccine Name</td>
                                                          </tr>
                                                          <tbody id="head">  
                                                          ${string}                 
                                                          </tbody>
                                                  </table>
                                                  <br>
                                                  <p>Wishing you good health and safety,</p><h3>Team Coviseal</h3>
                                                  
                                              </body>                                
                                          </html> 
                                        `,
                                      };

                                      mailgun.messages().send(data, (error, body) => {
                                        console.log("mail sent to : " + x.email);
                                      });
                                    //if ends here 
                                  }
                                  
                              });
                        });
                    }
                  });
                index += 100;
              }else{
                console.log('interval reset to 0');
                clearInterval(check);
              }
            }, 5000);

    
  });
});

task.start();

app.get("/cronapp", (req, res) => {
  res.status(200).send({ message: "Cron Success!!" });
});



var port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});

/*
var authorizationToken = "Bearer " + sessionStorage.getItem("userToken").match(/"([^"]+)"/)[1]; after getting token, set it to XMLHttpRequest xmlHttp.setRequestHeader("authorization", authorizationToken);
*/
