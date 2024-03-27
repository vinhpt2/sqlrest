const fs=require("fs");
const https=require("https");
const option={
	cert:fs.readFileSync("cacert.pem"),
	key:fs.readFileSync("cakey.pem")
};
const webserver=https.createServer(option,function(req,resp){
	resp.writeHead(302, {'Location': 'https://gishealth.huefmc.com:3344/webappbuilder/apps/2'});
	resp.end();
});
webserver.listen(443);