
/*
 * Copyright (c) Harold Eustaquio. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const mysql = require('mysql2');
const fs = require("fs");
const express = require('express');
const sessions = require('express-session');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const uuid = require('node-uuid');
const weather = require('openweather-apis');
const cron = require('node-cron');
const { Configuration, OpenAIApi } = require("openai");
const MemoryStore = require('memorystore')(sessions)
const colors = require('colors');
const path = require("path")
const multer = require("multer")

/*
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function DavinciAI(query) {
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: query,
        temperature: 0,
        max_tokens: 4000,
    });
    fs.writeFile('one.txt', completion.data.choices[0].text, err => {
        if (err) { console.error(err); }
    });
    return fs.readFileSync('one.txt', 'utf8');
};  
*/

// << # Simulate SSL Cert >>
const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
};

// << # Configuration for SQL >>
var sql_connection = mysql.createConnection({
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    database: process.env.SQL_DB,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS
});

// << # Configuration for express-session >>
const oneDay = 1000 * 60 * 60 * 24;
const sessionConfig = {
    genid:function(req){ return uuid.v1(); },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
        maxAge: oneDay, 
        secure: false
    }
}

// << # Test connection for SQL >>
sql_connection.connect(function (err) {
    if(err){ console.log('[' + 'CRTL'.red + '] SQL Status: ' + err);
    }else{ console.log('[' + 'SUCC'.green + '] SQL Status: Connected'); }
});

// << # Configure express module >>
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + process.env.WEB_DEFAULT_PATH, {index: process.env.WEB_DEFAULT_HOME}));
app.use(sessions(sessionConfig));
app.use(bodyParser.urlencoded({ extended:true}));
app.use(cookieParser());
app.set('trust proxy', true);

// << ## MAIN >>
http.createServer(app).listen(process.env.SERVER_PORT, function (req, res) {
    console.clear();
    console.log('Zitra [Build ' + process.env.WEB_VERSION + '] (c) Harold Eustaquio. All rights reserved.');
    console.log(`[` + `INFO`.blue + `] ` + process.env.WEB_TITLE + ` is running on ` + ` and listening on Port ` + process.env.SERVER_PORT);
});

// << # Define Keyword >>
const userWorkStatus = {
    AVAIL: 'AVAILABLE',
    MEETING: 'MEETING',
    TRAINING: 'TRAINING',
    COACHING: 'COACHING',
    OTHER: 'OTHER',
    BREAK: 'BREAK',
    LUNCH: 'LUNCH',
    NOT_LOGIN: 'NOT LOGIN'
} 

// << # Weather Setup >>
weather.setLang(process.env.OPENWEATHER_DFLT_LANGUAGE);
weather.setCity(process.env.OPENWEATHER_DFLT_LOCATION);
weather.setUnits(process.env.OPENWEATHER_DFLT_UNIT);
weather.setAPPID(process.env.OPENWEATHER_API_KEY);

// << # Functions >>
const userSignin = (userID, userName) => console.log('[' + 'INFO'.blue + '] [ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' LOGGED IN');
const userSignout = (userID, userName) => console.log('[' + 'INFO'.blue + '] [ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' LOGGED OUT');
const auxChange = (userID, userName, auxTo) => console.log('[' + 'INFO'.blue + '] [ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' CHANGED STATUS TO ' + auxTo);
const auxJump = (userID, userName, auxTo) => console.log('[' + 'WRNG'.yellow + '] [ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' POSSIBLE AUX JUMP ATTEMPT TO ' + auxTo); 
const auxAlready = (userID, userName, auxTo) => console.log('[' + 'INFO'.blue + '] [ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' ALREADY IN AUX ' + auxTo); 
weather.getTemperature(function(err, temp){ console.log('[' + 'SUCC'.green + '] OpenWeather API check - Return Value(TEMP): ' + ($weatherTemp = temp)); });
weather.getDescription(function(err, desc){ console.log('[' + 'SUCC'.green + '] OpenWeather API check - Return Value(DETAILS): ' + ($weatherDetails = desc)); });
// ## Add revalidate for index $ if there's a changes on numerical value for the dashboard - function revalidate() //

// << # End Points >>
/* Whitelisting Feature - DB Table Name: WhitelistTB
app.all('*', function(req, res, next) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    console.log(ip)
    sql_connection.connect(function(err) {
        if(err){ } else {
            sql_connection.query("SELECT * FROM WhitelistTB WHERE IP = '" + ip + "'", function (err, result, fields) {
                if(err){ } else {
                    if(result.length > 0){
                        next();
                    }else{
                        const err = new Error("Bad IP: " + ip);
                        res.status(err.status || 500);
                        res.send("FORBIDDEN");
                    }
                }
            });
        }
    });
})
*/

app.get('/', (req, res) => {
    var session;
    res.redirect('/signin');
});

app.get('/signin', (req, res) => {
    var session;
    res.render('signin');
});

app.post('/auth-form', (req, res) => {
    session = req.session;
    sql_connection.connect(function (err) {
        if(err){ } else {
            var query = "SELECT * FROM EmployeeTB WHERE Email = '" + req.body.email + "'";
            sql_connection.query(query, function (err, result, fields) {
                if (err) { } else {
                    try {
                        if(result[0].Password == req.body.password){
                            if(req.session.status === null){ 
                                var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + userWorkStatus.NOT_LOGIN + "' WHERE ID = " + result[0].ID;
                                sql_connection.query(query, function (err, result){});
                            }else{
                                req.session.status = result[0].CurrentWorkStatus;
                                req.session.statuslastchange = result[0].WorkStatusChangedTime;
                            }
                            req.session.username = result[0].FirstName + ' ' + result[0].LastName; 
                            req.session.fname = result[0].FirstName; 
                            req.session.lname = result[0].LastName; 
                            req.session.email = result[0].Email;
                            req.session.password = result[0].Password;
                            req.session.userid = result[0].ID;
                            req.session.department = result[0].Department;
                            req.session.position = result[0].Role;
                            req.session.notes = result[0].Notes;
                            req.session.photo = result[0].Photo;
                            req.session.worksetup = result[0].CurrentWorkSetup;
                            req.session.manager = result[0].ReportsTo;
                            userSignin(req.session.userid, req.session.username);
                            res.redirect('/index');
                        }else{ res.redirect('/signin?err=403'); } // Add Frontend Design
                    } catch(e) { res.redirect('/signin?err=403'); } // Add Frontend Design
                }
            });
        }
    });
});

app.get('/forgot-password', function(req, res) {
    res.render('forgot-password', {webTitle: process.env.WEB_TITLE});
});

app.get('/index', (req, res) => {
    try {
        if(req.session.username == null){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {

                    // # LOAD WORK TIME EVERY CHANGES MADE // Only for Index; cuz all change status end point default route is index 
                    var query = "SELECT * FROM EmployeeTB WHERE ID = '" + req.session.userid + "'";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { } else { req.session.statuslastchange = result[0].WorkStatusChangedTime; }
                    });

                    var query = "SELECT * FROM SwitchGlobalTB";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            if(result[0].status != 0 || req.session.position == 'Developer'){
                                res.render('index', { 
                                    id: req.session.userid,
                                    locWeather: $weatherTemp,
                                    locWeatherLong: $weatherDetails,
                                    webTitle: process.env.WEB_TITLE, 
                                    webAuthor: process.env.WEB_AUTHOR, 
                                    status: req.session.status, 
                                    statuslastchange: req.session.statuslastchange,
                                    username: req.session.username,
                                    department: req.session.department,
                                    position: req.session.position,
                                    worksetup: req.session.worksetup,

                                    employee_scores: result[1].status
                                });
                            }else{userSignout(
                                req.session.userid, req.session.username);
                                req.session.destroy();
                                res.redirect('/signin?maintenance=true');
                            }
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.get('/account', function(req, res) {
    try {
        if(req.session.username == null){
            res.redirect('/');
        }else{
            res.render('account', { 
                locWeather: $weatherTemp,
                locWeatherLong: $weatherDetails,
                webTitle: process.env.WEB_TITLE, 
                webAuthor: process.env.WEB_AUTHOR, 
                status: req.session.status, 
                statuslastchange: req.session.statuslastchange,
                id: req.session.userid,
                username: req.session.username,
                fname: req.session.fname,
                lname: req.session.lname,
                email: req.session.email,
                password: req.session.password,
                notes: req.session.notes,
                photo: req.session.photo,
                department: req.session.department,
                position: req.session.position,
                worksetup: req.session.worksetup
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.get('/security', function(req, res) {
    try {
        if(req.session.username == null){
            res.redirect('/');
        }else{
            res.render('security', { 
                locWeather: $weatherTemp,
                locWeatherLong: $weatherDetails,
                webTitle: process.env.WEB_TITLE, 
                webAuthor: process.env.WEB_AUTHOR, 
                status: req.session.status, 
                statuslastchange: req.session.statuslastchange,
                id: req.session.userid,
                username: req.session.username,
                fname: req.session.fname,
                lname: req.session.lname,
                email: req.session.email,
                password: req.session.password,
                notes: req.session.notes,
                photo: req.session.photo,
                department: req.session.department,
                position: req.session.position,
                worksetup: req.session.worksetup
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.post('/account/changedisplay', function(req, res, next){
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "views/u/" + req.session.userid)
        },
        filename: function (req, file, cb) {
            cb(null, "DP-" + req.session.userid+".png")
        }
    })
    const maxSize = 1 * 10000 * 10000;
    var upload = multer({ 
        storage: storage,
        limits: { fileSize: maxSize },
        fileFilter: function (req, file, cb){
        
            // Set the filetypes, it is optional
            var filetypes = /jpeg|jpg|png/;
            var mimetype = filetypes.test(file.mimetype);
      
            var extname = filetypes.test(path.extname(
                        file.originalname).toLowerCase());
            
            if (mimetype && extname) {
                return cb(null, true);
            }
          
            cb("Error: File upload only supports the "
                    + "following filetypes - " + filetypes);
          } 
    }).single("dp_path");
    upload(req,res,function(err) {
        if(err) {
            // ERROR occurred (here it can be occurred due
            // to uploading image of size greater than
            // 1MB or uploading different file type)
            res.send(err)
        } else {
            // SUCCESS, image successfully uploaded
            res.send("Success, Image uploaded!")
        }
    })
});

app.post('/account/changepassword', function(req, res) { 
    try{
        if(req.body.password == req.body.repassword) {
            if(req.session.password == req.body.curpassword) {
                sql_connection.connect(function (err) {
                    if(err){ } else {
                        var query = "UPDATE EmployeeTB SET Password = '" + req.body.password + "' WHERE ID = '" + req.session.userid + "'";
                        sql_connection.query(query, function (err, result, fields) {
                            if (err) { console.log(err); } else {
                                res.redirect('/security?cpsuccess');
                            }
                        });
                    }
                });
             } else {
                res.redirect('/security?invalidpass')
             }
        } else {
            res.redirect('/security?notmatch')
        }
    } catch (e) {
        res.redirect('/');
    }
});

// ## TEAM FUNCTIONS ## ********************************************************** //

app.get('/team', function(req,res) {
    try {
        if(req.session.username == null){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "SELECT * FROM EmployeeTB WHERE ReportsTo = '" + req.session.manager + "' OR ID = '" + req.session.manager + "'";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.render('team', { 
                                webTitle: process.env.WEB_TITLE, 
                                webAuthor: process.env.WEB_AUTHOR, 
                                status: req.session.status, 
                                statuslastchange: req.session.statuslastchange,
                                id: req.session.userid,
                                username: req.session.username,
                                position: req.session.position,
                                manager: req.session.manager,
                                all_user: result
                            });
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

// ## TIME TRACK FUNCTIONS ## ********************************************************** //

app.get('/timetrack', function(req, res) {
    try {
        if(req.session.username == null){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "SELECT * FROM WorkTrackTB WHERE User_ID = '" + req.session.userid + "' ORDER BY Update_ID DESC";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.render('timetrack', { 
                                webTitle: process.env.WEB_TITLE, 
                                webAuthor: process.env.WEB_AUTHOR, 
                                status: req.session.status, 
                                statuslastchange: req.session.statuslastchange,
                                id: req.session.userid,
                                username: req.session.username,
                                position: req.session.position,
                                manager: req.session.manager,
                                timetracks: result
                            });
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

// ## SWITCH FUNCTIONS ## ********************************************************** //

app.get('/switch', function(req, res) { // For admin only
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "SELECT * FROM SwitchGlobalTB";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.render('switch', { 
                                webTitle: process.env.WEB_TITLE, 
                                webAuthor: process.env.WEB_AUTHOR, 
                                status: req.session.status, 
                                statuslastchange: req.session.statuslastchange,
                                id: req.session.userid,
                                username: req.session.username,
                                position: req.session.position,
                                switch_server: result[0].status,
                                employee_scores: result[1].status
                            });
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.get('/start-maintenance', function(req, res) { // For admin only
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "UPDATE SwitchGlobalTB SET status = 0 WHERE event_id = 1";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.redirect('/switch');
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.get('/stop-maintenance', function(req, res) { // For admin only
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "UPDATE SwitchGlobalTB SET status = 1 WHERE event_id = 1";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.redirect('/switch');
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.get('/hide-score', function(req, res) {
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "UPDATE SwitchGlobalTB SET status = 0 WHERE event_id = 2";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.redirect('/switch');
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.get('/show-score', function(req, res) {
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "UPDATE SwitchGlobalTB SET status = 1 WHERE event_id = 2";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.redirect('/switch');
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

// ## USERMAN FUNCTIONS ## ********************************************************** //

app.get('/user-manager', function(req, res){
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "SELECT * FROM EmployeeTB";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            res.render('user-manager', { 
                                webTitle: process.env.WEB_TITLE, 
                                webAuthor: process.env.WEB_AUTHOR, 
                                status: req.session.status, 
                                statuslastchange: req.session.statuslastchange,
                                id: req.session.userid,
                                username: req.session.username,
                                position: req.session.position,
                                all_user: result
                            });
                        }
                    });
                }
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

// ## AI HELPER FUNCTIONS ## ********************************************************** //

/* NOT WORKING
app.get('/aihelp', function(req, res) {
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            sql_connection.connect(function (err) {
                if(err){ } else {
                    var query = "SELECT * FROM EmployeeTB";
                    sql_connection.query(query, function (err, result, fields) {
                        if (err) { console.log(err); } else {
                            if(req.query.q != null){
                                var aiRes = req.query.q;
                                DavinciAI(aiRes);
                            }
                            res.render('aihelp', { 
                                webTitle: process.env.WEB_TITLE, 
                                webAuthor: process.env.WEB_AUTHOR, 
                                status: req.session.status, 
                                statuslastchange: req.session.statuslastchange,
                                    id: req.session.userid,
                                username: req.session.username,
                                position: req.session.position
                            });
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.log(e);
        res.redirect('/');
    }
});
*/

// ## USERMAN FUNCTIONS ## ********************************************************** //

app.get('/dbmyadmin', function(req, res) {
    try {
        if(req.session.username == null || req.session.position != 'Developer'){
            res.redirect('/');
        }else{
            res.render('dbmyadmin', { 
                webTitle: process.env.WEB_TITLE, 
                webAuthor: process.env.WEB_AUTHOR, 
                status: req.session.status, 
                statuslastchange: req.session.statuslastchange,
                id: req.session.userid,
                username: req.session.username,
                position: req.session.position
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});

app.get('/signout', function(req, res) {
    userSignout(req.session.userid, req.session.username);
    req.session.destroy();
    res.redirect('/');
});

// << # userStatus.js - functions when changing user state >> 
console.log('[INFO] userStatus.js Linked');

app.get('/avail', function(req, res) {
    try {
        sql_connection.connect(function (err) {
            var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
        });
        req.session.status = userWorkStatus.AVAIL;
        var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
        sql_connection.query(query, function (err, result){});
        var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
        sql_connection.query(query, function (err, result){});
        auxChange(req.session.userid, req.session.username, req.session.status);
        res.redirect('/index');
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('/meeting', function(req, res) {
    try {
        if(req.session.status == userWorkStatus.AVAIL) { 
            sql_connection.connect(function (err) {
                var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
                sql_connection.query(query, function (err, result){});
            });
            req.session.status = userWorkStatus.MEETING; 
            var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
            var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
        sql_connection.query(query, function (err, result){});
            auxChange(req.session.userid, req.session.username, req.session.status);
            res.redirect('/index');
        } else if(req.session.status == userWorkStatus.MEETING){ 
            auxAlready(req.session.userid, req.session.username, userWorkStatus.MEETING);
            res.redirect('/index');
        } else {
            auxJump(req.session.userid, req.session.username, userWorkStatus.MEETING);
            res.redirect('/index');
        }
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('/training', function(req, res) {
    try {
        if(req.session.status == userWorkStatus.AVAIL) { 
            sql_connection.connect(function (err) {
                var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
                sql_connection.query(query, function (err, result){});
            });
            req.session.status = userWorkStatus.TRAINING; 
            var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
            var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
            sql_connection.query(query, function (err, result){});
            auxChange(req.session.userid, req.session.username, req.session.status);
            res.redirect('/index');
        } else if(req.session.status == userWorkStatus.TRAINING){ 
            auxAlready(req.session.userid, req.session.username, userWorkStatus.TRAINING);
            res.redirect('/index');
        } else {
            auxJump(req.session.userid, req.session.username, userWorkStatus.TRAINING);
            res.redirect('/index');
        }
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('/coaching', function(req, res) {
    try {
        if(req.session.status == userWorkStatus.AVAIL) { 
            sql_connection.connect(function (err) {
                var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
                sql_connection.query(query, function (err, result){});
            });
            req.session.status = userWorkStatus.COACHING; 
            var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
            var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
            sql_connection.query(query, function (err, result){});
            auxChange(req.session.userid, req.session.username, req.session.status);
            res.redirect('/index');
        } else if(req.session.status == userWorkStatus.COACHING){ 
            auxAlready(req.session.userid, req.session.username, userWorkStatus.COACHING);
            res.redirect('/index');
        } else {
            auxJump(req.session.userid, req.session.username, userWorkStatus.COACHING);
            res.redirect('/index');
        }
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('/other', function(req, res) {
    try {
        if(req.session.status == userWorkStatus.AVAIL) { 
            sql_connection.connect(function (err) {
                var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
                sql_connection.query(query, function (err, result){});
            });
            req.session.status = userWorkStatus.OTHER; 
            var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
            var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
            sql_connection.query(query, function (err, result){});
            auxChange(req.session.userid, req.session.username, req.session.status);
            res.redirect('/index');
        } else if(req.session.status == userWorkStatus.OTHER){ 
            auxAlready(req.session.userid, req.session.username, userWorkStatus.OTHER);
            res.redirect('/index');
        } else {
            auxJump(req.session.userid, req.session.username, userWorkStatus.OTHER);
            res.redirect('/index');
        }
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('/break', function(req, res) {
    try {
        if(req.session.status == userWorkStatus.AVAIL) { 
            sql_connection.connect(function (err) {
                var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
                sql_connection.query(query, function (err, result){});
            });
            req.session.status = userWorkStatus.BREAK; 
            var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
            var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
            sql_connection.query(query, function (err, result){});
            auxChange(req.session.userid, req.session.username, req.session.status);
            res.redirect('/index');
        } else if(req.session.status == userWorkStatus.BREAK){ 
            auxAlready(req.session.userid, req.session.username, userWorkStatus.BREAK);
            res.redirect('/index');
        } else {
            auxJump(req.session.userid, req.session.username, userWorkStatus.BREAK);
            res.redirect('/index');
        }
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('/lunch', function(req, res) {
    try {
        if(req.session.status == userWorkStatus.AVAIL) { 
            sql_connection.connect(function (err) {
                var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
                sql_connection.query(query, function (err, result){});
            });
            req.session.status = userWorkStatus.LUNCH; 
            var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
            var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
            sql_connection.query(query, function (err, result){});
            auxChange(req.session.userid, req.session.username, req.session.status);
            res.redirect('/index');
        } else if(req.session.status == userWorkStatus.LUNCH){ 
            auxAlready(req.session.userid, req.session.username, userWorkStatus.LUNCH);
            res.redirect('/index');
        } else {
            auxJump(req.session.userid, req.session.username, userWorkStatus.LUNCH);
            res.redirect('/index');
        }
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('/logout', function(req, res) {
    try {
        if(req.session.status == userWorkStatus.AVAIL) { 
            sql_connection.connect(function (err) {
                var query = "UPDATE EmployeeTB SET WorkStatusChangedTime = '" + new Date().toLocaleString() + "' WHERE ID = " + req.session.userid;
                sql_connection.query(query, function (err, result){});
            });
            req.session.status = userWorkStatus.NOT_LOGIN; 
            var query = "UPDATE EmployeeTB SET CurrentWorkStatus = '" + req.session.status + "' WHERE ID = " + req.session.userid;
            sql_connection.query(query, function (err, result){});
            var query = "INSERT INTO WorkTrackTB(User_ID, EvDate, EvTime, EvStatus) VALUES(" + req.session.userid + ", '" + new Date().toLocaleDateString() + "', '" + new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) + "', '" + req.session.status + "')";
            sql_connection.query(query, function (err, result){});
            auxChange(req.session.userid, req.session.username, req.session.status);
            res.redirect('/index');
        } else if(req.session.status == userWorkStatus.NOT_LOGIN){ 
            auxAlready(req.session.userid, req.session.username, userWorkStatus.NOT_LOGIN);
            res.redirect('/index');
        } else {
            auxJump(req.session.userid, req.session.username, userWorkStatus.NOT_LOGIN);
            res.redirect('/index');
        }
    } catch (e) {
        if (e instanceof ReferenceError) { res.redirect('/'); }
    }
});

app.get('*', function(req, res){
    try {
        if(req.session.username == null){
            res.redirect('/');
        }else{
            res.status(404).render('404', { 
                webTitle: process.env.WEB_TITLE, 
                webAuthor: process.env.WEB_AUTHOR, 
                status: req.session.status, 
                statuslastchange: req.session.statuslastchange,
                id: req.session.userid,
                username: req.session.username,
                department: req.session.department,
                position: req.session.position
            });
        }
    } catch (e) {
        res.redirect('/');
    }
});    

// << # svc.cron.js - task scheduler >> 
eval(fs.readFileSync('service/svc.cron.js')+'');

// << # svc.dbalive.js - keep db alive if provider is asshole >> 
eval(fs.readFileSync('service/svc.dbalive.js')+'');