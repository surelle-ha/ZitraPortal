/*
 * Copyright (c) Harold Eustaquio. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config();
const https = require('https');
const mysql = require('mysql2');
const fs = require("fs");
const express = require('express');
const sessions = require('express-session');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const uuid = require('node-uuid');
const weather = require('openweather-apis');
var cron = require('node-cron');
const { exec } = require("child_process");

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
    cookie: {
        maxAge: oneDay, 
        secure: true,
    }
}

// << # Configure express module >>
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + process.env.WEB_DEFAULT_PATH, {index: process.env.WEB_DEFAULT_HOME}));
app.use(sessions(sessionConfig));
app.use(bodyParser.urlencoded({ extended:true}));
app.use(cookieParser());

// << # Test connection for SQL >>
sql_connection.connect(function (err) {
    if(err){ console.log('[CTRL] SQL Status: ' + err);
    }else{ console.log('[INFO] SQL Status: Connected'); }
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
const roleValidate = (userID, constPosition) => {
    
}
const userSignin = (userID, userName) => console.log('[ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' LOGGED IN');
const userSignout = (userID, userName) => console.log('[ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' LOGGED OUT');
const auxChange = (userID, userName, auxTo) => console.log('[ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' CHANGED STATUS TO ' + auxTo);
const auxJump = (userID, userName, auxTo) => console.log('[ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' POSSIBLE AUX JUMP ATTEMPT TO ' + auxTo); 
const auxAlready = (userID, userName, auxTo) => console.log('[ ' + new Date().toLocaleString() + ' ] [ ' + userID + ' ] ' + userName.toUpperCase() + ' ALREADY IN AUX ' + auxTo); 
weather.getTemperature(function(err, temp){ console.log('[INFO] OpenWeather API check - Return Value(TEMP): ' + ($weatherTemp = temp)); });
weather.getDescription(function(err, desc){ console.log('[INFO] OpenWeather API check - Return Value(DETAILS): ' + ($weatherDetails = desc)); });
// ## Add revalidate for index $ if there's a changes on numerical value for the dashboard - function revalidate() //

// << # End Points >>
app.get('/', (req, res) => {
    var session;
    res.redirect('/signin');
});

app.get('/signin', (req, res) => {
    var session;
    res.render('signin');
    //res.redirect('/auth');
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
                            req.session.userid = result[0].ID;
                            req.session.department = result[0].Department;
                            req.session.position = result[0].Role;
                            req.session.worksetup = result[0].CurrentWorkSetup;
                            userSignin(req.session.userid, req.session.username);
                            res.redirect('/index');
                        }else{ res.redirect('/signin?err=403'); } // Add Frontend Design
                    } catch(e) { res.redirect('/signin?err=403'); } // Add Frontend Design
                }
            });
        }
    });
});

app.get('/auth-ms', (req, res) => {
    session = req.session;
    if(req.session.status === null){ req.session.status = userWorkStatus.NOT_LOGIN; }
    req.session.username = 'Harold Eustaquio'; // Test Name Variable
    req.session.userid = 91000; // Test ID Variable
    req.session.department = 'Zitra Test Inc.';
    req.session.position = 'Developer';
    req.session.worksetup = 'Work From Office';
    userSignin(req.session.userid, req.session.username);
    res.redirect('/index');
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
        //if (e instanceof ReferenceError) { res.redirect('/'); }
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
                username: req.session.username,
                department: req.session.department,
                position: req.session.position,
                worksetup: req.session.worksetup
            });
        }
    } catch (e) {
        //if (e instanceof ReferenceError) { res.redirect('/'); }
        res.redirect('/');
    }
});

app.get('/team', function(req,res) {
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
                username: req.session.username,
                department: req.session.department,
                position: req.session.position,
                worksetup: req.session.worksetup
            });
        }
    } catch (e) {
        //if (e instanceof ReferenceError) { res.redirect('/'); }
        res.redirect('/');
    }
});

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
        //if (e instanceof ReferenceError) { res.redirect('/'); }
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
        //if (e instanceof ReferenceError) { res.redirect('/'); }
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
        //if (e instanceof ReferenceError) { res.redirect('/'); }
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
        //if (e instanceof ReferenceError) { res.redirect('/'); }
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
        //if (e instanceof ReferenceError) { res.redirect('/'); }
        res.redirect('/');
    }
});

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
        //if (e instanceof ReferenceError) { res.redirect('/'); }
        res.redirect('/');
    }
});

app.get('/signout', function(req, res) {
    userSignout(req.session.userid, req.session.username);
    req.session.destroy();
    res.redirect('/');
});

// << # userStatus.js - functions when changing user state >> 
eval(fs.readFileSync('userStatus.js')+'');

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
                username: req.session.username,
                department: req.session.department,
                position: req.session.position
            });
        }
    } catch (e) {
        //if (e instanceof ReferenceError) { res.redirect('/'); }
        res.redirect('/');
    }
});

// << ## MAIN >>
https.createServer(options, app).listen(process.env.SERVER_PORT, function (req, res) {
    console.clear();
    console.log('Zitra [Build ' + process.env.WEB_VERSION + '] (c) Harold Eustaquio. All rights reserved.');
    console.log(`[INFO] ` + process.env.WEB_TITLE + ` is Listening on Port ` + process.env.SERVER_PORT);
});    

// << # cron.js - task scheduler >> 
eval(fs.readFileSync('cron.js')+'');
