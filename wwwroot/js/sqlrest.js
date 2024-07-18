export class SqlREST{
	static token = null;
	static OPERATOR = {
		"is":" is ",
		"!is":" is not ",
		"like":" like ",
		"!like":" not like ",
		"in":" in(",
		"!in":" not in(",
		"=":"=",
		"!=":"<>",
		">":">",
		">=":">=",
		"<":"<",
		"<=":"<="
	}
	static decodeSql(p, notReturnLogic) {
		var decode = "";
		if(p.where){
			var i0=(p.where[0]=="and"||p.where[0]=="or"?1:0);
			var logic=i0?p.where[0]:"and";
			//if(notReturnLogic!=0)logic+="=";
			var needOpen=(p.where.length>i0+1||notReturnLogic!=0);
			if(Array.isArray(p.where[i0])){//array-array
				if(needOpen)decode+="(";
				for(var i=i0;i<p.where.length;i++){
					var where=p.where[i];
					var j0=(where[0]=="and"||where[0]=="or"?1:0);
					if(i>i0)decode+=" "+logic+" ";
					if(Array.isArray(where[j0])){//array-array
						decode+=this.decodeSql({where:where},0);
					}else{//array
						var value=where[j0+2];
						if (typeof (value) == "string") value = value.startsWith("n$.") ? eval(value) : "'" + value + "'";
						if (typeof (value) == "boolean") value = value ? 1 : 0;
						var clause=where[j0]+SqlREST.OPERATOR[where[j0+1]]+value;
						if(where[j0+1]=="in"||where[j0+1]=="!in")clause+=")";
						decode+=clause;
					}
				}
				if(needOpen)decode+=")";
			}else{//array
				var value=p.where[i0+2];
				if (typeof(value)=="string") value = value.startsWith("n$.") ? eval(value) : "'" + value + "'";
				if (typeof(value)=="boolean") value = value ? 1 : 0;
				decode+=p.where[i0]+SqlREST.OPERATOR[p.where[i0+1]]+value;
				if(p.where[i0+1]=="in"||p.where[i0+1]=="!in")decode+=")";
				if(notReturnLogic)decode="("+decode+")";
			}
		}

		
		if (p.select) decode += "&select=" + p.select;
		if (p.orderby) decode += "&orderby=" + p.orderby;
		return decode;
	}

	static login(p, onok) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (this.readyState == XMLHttpRequest.DONE) {
				if (this.status == 0 || (this.status >= 200 && this.status < 400))
					onok(JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror = this.onerror;
		xhr.open("POST", p.url, true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(p.data));
	}

	static select(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror = this.onerror;
		xhr.open("GET", p.url + (p.id ? "/" + p.id : "?where=" + this.decodeSql(p)), true);
		if (this.token) xhr.setRequestHeader("Authorization", this.token);
		xhr.send();7
	}
	static toCsv(data){
		if(data.length){
			var keys=Object.keys(data[0]);
			var csv=keys.toString();
			
			for(var i=0;i<data.length;i++){
				var line=[];
				for(var j=0;j<keys.length;j++){
					var value=data[i][keys[j]];
					line.push(value||"NULL");
				}
				csv+="\n"+line;
			}
			return csv;
		}
	}
	static insert(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror=this.onerror;
		xhr.open("POST",p.returnid?p.url+"?returnid=true":p.url,true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		if (this.token) xhr.setRequestHeader("Authorization", this.token);
		xhr.send(JSON.stringify(Array.isArray(p.data)?p.data:[p.data]));
	}
	static insertCsv(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(this.response);
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror=this.onerror;
		xhr.open("POST",p.url,true);
		xhr.setRequestHeader("Content-Type","text/csv");
		xhr.send(p.data);
	}
	static update(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		if (p.where) p.url += "?where=" + this.decodeSql(p);
		xhr.onerror = this.onerror;
		xhr.open("PUT",p.url,true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		if (this.token) xhr.setRequestHeader("Authorization", this.token);
		xhr.send(JSON.stringify(p.where?p.data:[p.data]));
	}
	static upsert(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror=this.onerror;
		xhr.open("POST",p.url+"?on_conflict="+p.keys,true);
		xhr.setRequestHeader("Content-Type","application/json;charset=UTF-8");
		xhr.setRequestHeader("Prefer","return=representation");
		xhr.send(JSON.stringify(p.data));
	}
	static delete(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror=this.onerror;
		xhr.open("DELETE", p.url + "?where=" + this.decodeSql(p), true);
		if (this.token) xhr.setRequestHeader("Authorization", this.token);
		xhr.send();
	}
	static call(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror=this.onerror;
		xhr.open(p.method||"GET",p.url,true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		if (this.token) xhr.setRequestHeader("Authorization", this.token);
		p.data?xhr.send(JSON.stringify(p.data)):xhr.send();
	}

	static onerror(err){
		alert(err);
	}
}