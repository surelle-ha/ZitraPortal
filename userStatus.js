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