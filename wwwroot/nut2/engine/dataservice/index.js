var DATA_URL="https://localhost:5001/api/databases/auto/";
var DATA_COLS=[
	{fieldid:"id" ,fieldname:"id", alias:"ID", fieldtype:"int", isreadonly:true, isdisplay:true, isdisplaygrid:true, isprikey:true, isrequire:true, issearch:true, children:[]},
	{fieldid:"name" ,fieldname:"name", alias:"Column Name", fieldtype:"text", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:true, issearch:true, children:[]},
	{fieldid:"description" ,fieldname:"description", alias:"Alias", fieldtype:"text", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"dataType" ,fieldname:"dataType", alias:"Data Type", fieldtype:"select", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:true, issearch:true, children:[], isfromdomain:true, domainid:"dm_datatype"},
	{fieldid:"maximumLength" ,fieldname:"maximumLength", alias:"Max Length", fieldtype:"int", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"numericScale" ,fieldname:"numericScale", alias:"Numeric Scale", fieldtype:"int", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"numericPrecision" ,fieldname:"numericPrecision", alias:"Numeric Precision", fieldtype:"int", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"defaultValue" ,fieldname:"defaultValue", alias:"Default Value", fieldtype:"text", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"isForeignKey" ,fieldname:"isForeignKey", alias:"Foreign Key", fieldtype:"checkbox", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"inPrimaryKey" ,fieldname:"inPrimaryKey", alias:"Primary Key", fieldtype:"checkbox", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"identify" ,fieldname:"identify", alias:"Auto Increment", fieldtype:"checkbox", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]},
	{fieldid:"nullable" ,fieldname:"nullable", alias:"Allow Null", fieldtype:"checkbox", isreadonly:false, isdisplay:true, isdisplaygrid:true, isprikey:false, isrequire:false, issearch:true, children:[]}
]
var DATA_TYPE=[{
	domainid:"dm_datatype",
	domain:'[["BigInt","BigInt"],["Binary","Binary"],["Bit","Bit"],["Char","Char"],["Date","Date"],["DateTime","DateTime"],["DateTime2","DateTime2"],["DateTimeOffset","DateTimeOffset"],["Decimal","Decimal"],["Float","Float"],["Geography","Geography"],["Geometry","Geometry"],["HierarchyId","HierarchyId"],["Image","Image"],["Int","Int"],["Money","Money"],["NChar","NChar"],["NText","NText"],["Numeric","Numeric"],["NVarChar","NVarChar"],["NVarCharMax","NVarCharMax"],["Real","Real"],["SmallDateTime","SmallDateTime"],["SmallInt","SmallInt"],["SmallMoney","SmallMoney"],["SysName","SysName"],["Text","Text"],["Time","Time"],["Timestamp","Timestamp"],["TinyInt","TinyInt"],["UniqueIdentifier","UniqueIdentifier"],["VarBinary","VarBinary"],["VarBinaryMax","VarBinaryMax"],["VarChar","VarChar"],["VarCharMax","VarCharMax"],["Variant","Variant"]]'
}];
var _context={user:{},domain:NUT.configDomain(DATA_TYPE)};
var _lookupGroup={};
var _info={};
function body_onLoad(){
	var params=(window.location.search.substr(1)).split("&");
	for(var i=0;i<params.length;i++){
		var param=params[i].split("=");
		_context.user[param[0]]=param[1];
	}
	
	_context.code=_context.user.username.split(".")[1];
	if(_context.code){		
		var id="divApp";
		var div=document.getElementById(id);
		w2ui[id]?w2ui[id].render(div):
		$(div).w2layout({
			name: id,
			panels: [
				{ type: 'top', size: '28px', content: '<i style="float:right" class="nut-link"><img id="imgLogo" width="20" height="20" src="favicon.ico"/> Data service 1.0 > '+_context.user.username+'</i>' },
				{ type: 'left', size: '310px', resizable: true, content: '<div id="divLeft" class="full"><img src="../../img/wait.gif"><i class="nut-link">Connecting...</i></div>' },
				{ type: 'main', content: "<div id='divMain' class='full'><div id='divTitle' style='padding:10px'><img width='64' height='64' src='database.ico'><br/><h2 style='color:brown'>Data Service</h2><hr/><h3><i id='labDatabase'></i><h3/></div></div>"}
			]
		});
		
		NUT_DS.call({method:"GET",url:DATA_URL+"tables/"+_context.code},function(tables){
			NUT_DS.call({method:"GET",url:DATA_URL+"views/"+_context.code},function(views){
				var nodes=[];
				//Tables
				for(var i=0;i<tables.length;i++){
					var table=tables[i];
					var node={id:table.name,img:'icon-folder',text:table.description?table.description:table.name,tag:table.id};
					if(table.group){
						if(!_lookupGroup[table.group])_lookupGroup[table.group]={id:table.group,text:table.group,group:true,expanded:table.group,nodes:[]};
						_lookupGroup[table.group].nodes.push(node);
					}else nodes.push(node);
				}
				
				//Views
				for(var i=0;i<views.length;i++){
					var view=views[i];
					var node={id:view.name,img:'icon-page',text:view.description?view.description:view.name,tag:view.id};
					if(view.group){
						if(!_lookupGroup[view.group])_lookupGroup[view.group]={id:view.group,text:view.group,group:true,expanded:view.group,nodes:[]};
						_lookupGroup[view.group].nodes.push(node);
					}else nodes.push(node);
				}
				
				for(key in _lookupGroup)if(_lookupGroup.hasOwnProperty(key))
					nodes.push(_lookupGroup[key]);
				
				labDatabase.innerHTML="Tables count: " + tables.length+"<br/>Views count: " + views.length;
				$(divLeft).w2sidebar({name:'menuleft',nodes:nodes,menu:[{id:"TABLE_INFO",text:"ℹ️  Infor/Rename"},{text:"--"},{id:"TABLE_NEW",text:"📄 New table"},{id:"TABLE_DEL",text:"❌ Delete table"}],topHTML:" 🗄️ <i class='nut-link'>DATA SERVICE</i> - " +_context.code,onClick:menu_onClick, onMenuClick:popup_onClick});
			});
		});
	}
}
function popup_onClick(evt){
	var list=document.createElement("datalist");
	list.id="listGroup";
	for(key in _lookupGroup)if(_lookupGroup.hasOwnProperty(key)){
		var opt=document.createElement("option");
		opt.value=key;
		opt.innerHTML=key;
		list.appendChild(opt);
	}
	switch(evt.menuItem.id){
		case "TABLE_INFO":
			NUT_DS.call({method:"GET",url:DATA_URL+"tables/"+_context.code+"/"+evt.target+"/info"},function(info){
				_info=info;
				w2popup.open({
					title:"ℹ️ <i>Infor/Rename</i> - " + info.name,
					modal:true,
					width: 320,
					height: 260,
					body: '<table style="margin:auto"><caption><h3 class="nut-link"><i>Data service - </i>'+_context.code+'</h3></caption><tr><td align="right"><i>Name*</i></td><td><input id="txtTableName" value="'+info.name+'"/></td></tr><tr><td align="right"><i>Alias</i></td><td><input id="txtTableAlias" value="'+info.description+'"/></td></tr><tr><td align="right"><i>Group</i></td><td><input list="listGroup" id="txtTableGroup" value="'+info.group+'"/>'+list.outerHTML+'</td></tr><tr><td align="right"><i>Count</i></td><td>'+info.rowCount+'</td></tr><tr><td align="right"><i>Created</i></td><td>'+(new Date(info.createDate)).toLocaleString()+'</td></tr></table>',
					buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Cancel</button><button class="w2ui-btn" onclick="changeTable_onClick(\''+evt.target+'\')">✔️ Change</button>'
				});
			});
			break;
		case "TABLE_NEW":
			w2popup.open({
				title:"📄 <i>New</i> - table",
				modal:true,
				width: 320,
				height: 260,
				body: '<table style="margin:auto"><caption><h3 class="nut-link"><i>Data service - </i>'+_context.code+'</h3></caption><tr><td align="right"><i>Name*</i></td><td><input id="txtNewName"/></td></tr><tr><td align="right"><i>Alias</i></td><td><input id="txtNewAlias"/></td></tr><tr><td align="right"><i>Group</i></td><td><input list="listGroup" id="txtNewGroup"/>'+list.outerHTML+'</td></tr></table>',
				buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Cancel</button><button class="w2ui-btn" onclick="createTable_onClick()">✔️ Create</button>'
			});
			break;
		case "TABLE_DEL":
			 w2confirm('<span style="color:red">Delete table ['+evt.target+']?</span>').yes(function(){
				var data={name:evt.target};
				NUT_DS.call({method:"DELETE",url:DATA_URL+"tables/"+_context.code,data:data},function(){
					NUT.tagMsg("Table delete!","lime");
				});
			 });
			break;
	}
}
function changeTable_onClick(tableName){
	if(_info.name==txtTableName.value&&_info.description==txtTableAlias.value&&_info.group==txtTableGroup.value){
		NUT.tagMsg("No change!","yellow");
	}else{
		var data={};
		if(_info.name!=txtTableName.value)data.name=txtTableName.value;
		if(_info.description!=txtTableAlias.value)data.description=txtTableAlias.value;
		if(_info.group!=txtTableGroup.value)data.group=txtTableGroup.value;
		NUT_DS.call({method:"POST",url:DATA_URL+"tables/"+_context.code+"/"+tableName+"/edit",data:data},function(){
			NUT.tagMsg("Table changed!","lime");
		});
	}
}
function createTable_onClick(){
	if(txtNewName.value){
		var data={name:txtNewName.value,columns:[
			{name:"ID",dataType:"Int",}
		]};
		if(txtNewAlias.value)data.description=txtNewAlias.value;
		if(txtNewGroup.value)data.group=txtNewGroup.value;
		NUT_DS.call({method:"POST",url:DATA_URL+"tables/"+_context.code,data:data},function(){
			NUT.tagMsg("Table changed!","lime");
		});
	}else{
		NUT.tagMsg("No Table name!","yellow");
	}
}
function menu_onClick(evt){
	var node=evt.node;
	var a=NWIN.createWindowTitle(node.id,divTitle);
	var url=DATA_URL+(node.img=="icon-folder"?"tables/":"views/")+_context.code+"/"+node.id;
	if(a)NUT_DS.call({method:"GET",url:url+"/columns"},function(columns){
		var columnkey=null;
		var fields=[];
		for(var i=0;i<columns.length;i++){
			var col=columns[i];
			if(col.inPrimaryKey)columnkey=col.name;
			var fld={fieldid:col.id ,fieldname:col.name, alias:(col.description?col.description:col.name), fieldtype:(col.dataType=="Bit"?"checkbox":col.dataType.toLowerCase()), isreadonly:col.identify, isdisplay:true, isdisplaygrid:true, isprikey:col.inPrimaryKey, isrequire:!col.nullable, issearch:true,orderno:i, children:[]};
			if(col.defaultValue)fld.defaultvalue=col.col.defaultValue;
			fields.push(fld);
		}
		var tabData={columnkey:(columnkey?columnkey:columns[0].name), fields:fields, maxLevel:0, orderno:0, tabname:node.id, urledit:url, tabid:node.tag, tablevel:0,menuitems:[], tabs:[], children:[]};
		var tabDesign={columnkey:"id", fields: DATA_COLS, maxLevel:0, orderno:1, tabname:"Design", urledit:url+"/columns", tabid:"d_"+node.tag, tablevel:0,menuitems:[], tabs:[], children:[],beforechange:true,onchange:"Com_SysDesignOnChange"};
		var conf={tabid:node.tag,tabs:[tabData,tabDesign]}
		NWIN.buildWindow(a.div,conf,0);
		a.innerHTML=node.text;
	});
	_context.curWinid=node.tag;
}