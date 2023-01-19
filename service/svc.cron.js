/* 
 * Cron Guide - https://www.npmjs.com/package/node-cron
 */

cron.schedule('* * * * *', () => {
    eval(fs.readFileSync('cron-script/akashi.cron')+'');
});

cron.schedule('* * * * *', () => {
    eval(fs.readFileSync('cron-script/delta.cron')+'');
});

cron.schedule('* * * * *', () => {
    eval(fs.readFileSync('cron-script/casera.cron')+'');
});