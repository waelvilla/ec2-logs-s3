const AWS = require('aws-sdk');
const fs = require('fs');
const dotenv = require('dotenv');
const { exec } = require("child_process");
const schedule = require('node-schedule');

dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET, BUCKET_NAME, REGION, folderName, fileTemplateName, fileType } = process.env;

const s3 = new AWS.S3({
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET,
	region: REGION,
});


const uploadFile = (fileName) => {
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);
    const date = new Date().toISOString();
    const params = {
        Bucket: BUCKET_NAME,
        Key: `${folderName}/${date}-${fileTemplateName}.${fileType}`,
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`${date} Log uploaded successfully. ${data.Location}`);
    });
};

async function getLogs(){
    return new Promise((resolve, reject) => {
        // 
        exec("journalctl --since yesterday > journal.txt", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject('Cannot generate logs')
                return;
            }
            resolve('done');
        });
        
    })
}

async function run(){
    await getLogs();
    uploadFile('journal.txt')
}


(async () => {
    
    var rule = new schedule.RecurrenceRule();
    rule.hour = 0;
    rule.minute= 0;
    rule.second =0;    
    console.log('scheduled for ', rule.nextInvocationDate())
    schedule.scheduleJob(rule, async ()=>{
        await run();
        console.log('ran at', new Date())
    });
})()


function setDate(date){
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} 00:00:00`
}

function getWeeks(){
    const date = new Date('2020-09-20')
    const endDate = new Date('2019-07-20')
    let dateString = date.toISOString()
    let weeks= []
    while(endDate <= date){
        let tmpDate = new Date(dateString)
        tmpDate.setDate(date.getDate()-7)
        var obj = {
            start: tmpDate,
            end: dateString
        }
        weeks.push(obj)
        date.setDate(date.getDate()-7)
        dateString= date.toISOString()
    }
    return weeks
}

function runner(){
    let weeks = getWeeks()
    for(const week of weeks){
       const name = new Date()
       fs.unlink(`./file-${name.getFullYear()}-${name.getMonth()}-${name.getDate()}--${name.getFullYear()}-${name.getMonth()}-${name.getDate()}.txt`, (err) => {
            console.log('err', err);
       });
        week.start
        week.end
    }
}
