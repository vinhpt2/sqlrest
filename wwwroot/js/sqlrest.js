export class SqlREST{
	static OPERATOR={
		"is":" is ",
		"!is":" not is ",
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
	constructor(url,database,schema){
		this.url=url+"/"+database+"/"+schema+"/data/";
	}
	decodeSql(p, notReturnLogic) {
		var decode = "?select="+(p.select||"*");
		if(p.where){
			var i0=(p.where[0]=="and"||p.where[0]=="or"?1:0);
			var logic=i0?p.where[0]:"and";
			if(!notReturnLogic)decode+="&where=";
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
						if(typeof(value)=="string"&&value.startsWith("NUT."))value=eval(value);
						if(typeof(value)=="string")value="'"+value+"'";
						var clause=where[j0]+SqlREST.OPERATOR[where[j0+1]]+value;
						if(where[j0+1]=="in"||where[j0+1]=="!in")clause+=")";
						decode+=clause;
					}
				}
				if(needOpen)decode+=")";
			}else{//array
				var value=p.where[i0+2];
				if(typeof(value)=="string"&&value.startsWith("NUT."))value=eval(value);
				if(typeof(value)=="string")value="'"+value+"'";
				decode+=p.where[i0]+SqlREST.OPERATOR[p.where[i0+1]]+value;
				if(p.where[i0+1]=="in"||p.where[i0+1]=="!in")decode+=")";
				if(notReturnLogic)decode="("+decode+")";
			}
		}

		
		//if(_context.user.clientid&&p.url&&(p.url.includes("/sys")||p.url.includes("/sv_")))decode+=" and clientid="+(p.clientid!=undefined?p.clientid:_context.user.clientid);
		if(p.order)decode+="&orderby="+p.order;
		return decode;
	}
	select(p,onok){
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
		xhr.open("GET",this.url+p.from+(p.id?"/"+p.id:this.decodeSql(p)),true);
		xhr.send();
	}
	toCsv(data){
		if(data.length){
			var keys=Object.keys(data[0]);
			var csv=keys.toString();
			
			for(var i=0;i<data.length;i++){
				var line=[];
				for(var j=0;j<keys.length;j++){
					var value=data[i][keys[j]];
					(value==null)?line.push("NULL"):line.push(value);
				}
				csv+="\n"+line;
			}
			return csv;
		}
	}
	insert(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(p.data.length?this.response:JSON.parse(this.response));
				else
					this.onerror(this.response);
			}
		};
		xhr.onerror=this.onerror;
		xhr.open("POST",p.url,true);
		xhr.setRequestHeader("Content-Type","application/json;charset=UTF-8");
		xhr.send(JSON.stringify({datas:[p.data]}));
	}
	insertCsv(p,onok){
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
	update(p,onok){
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
		xhr.open("PATCH",p.url+"?"+this.decodeSql(p),true);
		xhr.setRequestHeader("Content-Type","application/json;charset=UTF-8");
		xhr.send(JSON.stringify({datas:[p.data]}));
	}
	upsert(p,onok){
		var xhr=new XMLHttpRequest();
		xhr.onreadystatechange=function(){
			if(this.readyState==XMLHttpRequest.DONE){
				if(this.status==0||(this.status>=200&&this.status<400))
					onok(p.data.length?this.response:JSON.parse(this.response));
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
	delete(p,onok){
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
		xhr.open("DELETE",p.url,true);
		xhr.setRequestHeader("Content-Type","application/json;charset=UTF-8");
		xhr.send(JSON.stringify({where:this.decodeSql(p,true)}));
	}
	call(p,onok){
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
		xhr.open(p.method,p.url,true);

		xhr.setRequestHeader("Content-Type","application/json;charset=UTF-8");
		xhr.send(JSON.stringify(p.data));
	}
	queryMetadata(url,onok){
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
		xhr.open("GET",url,true);
		xhr.send();
	}
	onerror(err){
		alert(err);
	}
}