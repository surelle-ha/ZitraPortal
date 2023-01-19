// << # Keep MySQL Connection Alive >>
try{
    setInterval(function () {
        sql_connection.query('SELECT 1');
    }, 5000);
}catch(err){}