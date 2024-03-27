var GEOServer={
	XMLParser:new DOMParser(),
	queryMetadata:function(url,onok){
		var self=this;
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(self.XMLParser.parseFromString(this.response,"text/xml"));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror=this.onerror;
		xhr.open("GET",url+"?service=wms&version=1.1.1&request=GetCapabilities",true);
		xhr.send();
	},
	onerror:function(err){
		alert(err?"Network connection error!":err);
	}
}