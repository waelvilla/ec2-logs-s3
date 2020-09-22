const AWS = require('aws-sdk');
const fs = require('fs');
const dotenv = require('dotenv');
const { exec } = require("child_process");

dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET, BUCKET_NAME, REGION, folderName, fileTemplateName, fileType } = process.env;

const s3 = new AWS.S3({
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET,
	region: REGION,
});


const uploadFile = async (fileName) => {
    return new Promise((resolve, reject) => {
        // Read content from the file
        const fileContent = fs.readFileSync(fileName);
        const params = {
            Bucket: BUCKET_NAME,
            Key: `${folderName}/${fileName}`,
            Body: fileContent
        };

        // Uploading files to the bucket
        s3.upload(params, function(err, data) {
            if (err) {
                reject(err)
            }
            resolve('done')
            console.log(`${fileName} Log uploaded successfully. ${data.Location}`);
        });
    })
};

function setDate(date){
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} 00:00:00`
}

function setDateText(date){
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
}

async function getLogs(firstDate, secondDate){
    return new Promise((resolve, reject) => {
        const firstText = setDateText(firstDate)
        const secondText = setDateText(secondDate)
        // const fileFirstText = setDateText(firstDate)
        const fileFirstText = firstDate.toISOString()
        // const fileSecondText = setDateText(secondDate)
        const fileSecondText = secondDate.toISOString()
        const fileName = `${fileTemplateName}-${fileFirstText}--${fileSecondText}.txt`
        // const fileName = `journal-${fileFirstText}--${fileSecondText}.txt`
        exec(`journalctl --since ${firstText} --until ${secondText} > ${fileName}`, (error, stdout, stderr) => {
        // exec(`type nul > ${fileName}`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject('Cannot generate logs')
                return;
            }
            resolve(fileName);
        });
        
    })
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

async function runner(){
    let weeks = getWeeks()
    for(const week of weeks){
        var fileName= await getLogs(new Date(week.start), new Date(week.end));
        await uploadFile(fileName);
    
        fs.unlink(`./${fileName}`, (err) => {
            console.log('err', err);
       });
    }
}

async function run(){
    const fileName = await getLogs();
    uploadFile(fileName)
}


(async () => {
    runner()
})()
