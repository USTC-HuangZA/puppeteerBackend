const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const request = require('request');
const app = express();
const baseUrl = 'http://ai.fieldsconsult.cn';
const domain = 'ai.fieldsconsult.cn';
const imageSaveDir = './images/';
const port = 11000;
const uploadUrl = 'http://backend.fieldsinvest.com/api/collect/file/uploadFile';
const loginUrl =  'http://106.14.122.214:8081/login'
const dataSourceId = 78;
let token = null

async function getToken(){
    try {
        let result = await new Promise(resolve=>{
            let formData = {
				username:'wjs',
				password:'wjs123'
            }

            request.post({url:loginUrl, json: formData}, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    throw Error(err)
                }
                console.log('login Success', body);
                resolve(body.data.token)
            });
        })
        return result
    }catch (e) {
        console.log('login error')
        console.log(e)
        console.log(e.stack)
        return null
    }
}

async function uploadImg(id){
    try {
        let fileLoc = await new Promise(resolve=>{
            let formData = {
                dataSourceId:dataSourceId,
                multipartFile:fs.createReadStream(imageSaveDir+id+'.jpg')
            }
            let headers= {
                token:token
            }
            request.post({url:uploadUrl, formData: formData,headers:headers}, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    throw Error(err)
                }
                console.log('Upload successful!  Server responded with:', body);
                resolve(JSON.parse(body).data.processFileMap.fileLoc)
            });
        })
        return fileLoc
    }catch (e) {
        console.log('upload error')
        console.log(e)
        console.log(e.stack)
        return null
    }
}

(async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	token = await getToken();
	let timeout = setTimeout(async function myfunc(){console.log('token updated');token = await getToken();clearTimeout(timeout); timeout = setTimeout(myfunc,1000*60*60*24)},1000*60*60*24)
    app.get('/getScreenShot', function(req, res){
        if(req.query.id){
            getModulePage(req.query.id).then(value => {
                if(value){
                    res.status(200).send(value)
                }else {
                    res.status(500).send('error')
                }
            })
        }
    });
    const getModulePage = async (id)=>{
        try{
            const page = await browser.newPage();
            await page.setCookie({
                name:'UserToken',
                value:token,
                domain:domain,
                path:'/'
            })
            await page.setCookie({
                name:'solutionID',
                value:'10001',
                domain:domain,
                path:'/'
            })
            await page.setViewport({width: 1200, height: 900});
            console.log('loading '+baseUrl+'/#/singleModulePage/'+id);
            await page.goto(baseUrl+'/#/singleModulePage/'+id);
            await page.waitForSelector('.loaded',{timeout:7000})
            await new Promise(resolve => {
                let t = setTimeout(()=>{
                    clearTimeout(t)
                    resolve()
                },1000)
            },)
            await page.screenshot({path: imageSaveDir +id+ '.jpg'});
            await page.close()
            console.log('image generate done '+baseUrl+'/#/singleModulePage/'+id)
            let fileLoc = await uploadImg(id)
            return fileLoc
        }catch (e) {
            console.log(e)
            console.log(e.stack)
            return null
        }
    }
    app.listen(port);
})();
