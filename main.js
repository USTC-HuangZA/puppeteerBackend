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
const dataSourceId = 78;

async function uploadImg(id){
    try {
        let fileLoc = await new Promise(resolve=>{
            let formData = {
                dataSourceId:dataSourceId,
                multipartFile:fs.createReadStream(imageSaveDir+id+'.jpg')
            }
            let headers= {
                token:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnY2giLCJleHAiOjE2MTI3NDU1MzYsImlhdCI6MTYxMjE0MDczNiwidXNlcklkIjoxMDAzNn0.PNkYTwJiqrpUyZKxOeVKlw-Gkk3BELteRicMOQPZDyE'
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
    const browser = await puppeteer.launch();
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
                value:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnY2giLCJleHAiOjE2MTI3NDU1MzYsImlhdCI6MTYxMjE0MDczNiwidXNlcklkIjoxMDAzNn0.PNkYTwJiqrpUyZKxOeVKlw-Gkk3BELteRicMOQPZDyE',
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
