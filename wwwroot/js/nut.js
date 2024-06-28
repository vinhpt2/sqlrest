var c$ = {
	user: null,
	winid: null,
	extent: null,
	layer: null,
	app: null,
	workflow: null,
	now: function () {
		return (new Date()).toISOString().substr(0, 10);
	},
	nowDay: function () {
		return (new Date()).getDate();
	},
	nowMonth: function () {
		return (new Date()).getMonth() + 1;
	},
	nowYear: function () {
		return (new Date()).getFullYear();
	}
}
var NUT = {
	URL:"https://localhost:7006/rest/nut/nut/data/",
	ds: null,
	apps: {},
	wins: {},
	domains: {},
	isMobile : (window.orientation !== undefined),
	ERD:{
		window:["windowid","windowname","windowtype","appid","execname","isopensearch"],
		tab: ["tabid", "parenttabid", "tabname", "tablevel", "seqno", "layoutcols", "linkchildfield", "linkparentfield", "linktable", "whereclause", "orderbyclause", "tableid", "windowid", "midchildfield", "midparentfield", "midtable", "tablename", "viewname", "columnkey", "columncode", "columndisplay", "columnlock", "columnorg", "url", "servicetype", "midtable_prikey", "geotableid", "filterfield", "filterdefault", "beforechange", "afterchange", "isnotinsert", "isnotupdate", "isnotdelete", "isnotarchive", "isnotlock","archivetype"],
		field: ["fieldid", "fieldname", "alias", "isdisplaygrid", "isdisplay", "issearch", "displaylength", "seqno", "isreadonly", "fieldlength", "vformat", "defaultvalue", "isrequire", "isfrozen", "fieldgroup", "tabid", "columnid", "fieldtype", "foreigntable_url", "columnkey", "columndisplay", "domainid", "issearchtonghop", "foreigntableid", "columncode", "parentfieldid", "wherefieldname", "displaylogic", "placeholder", "calculation", "columntype", "colspan", "rowspan", "isprikey", "columndohoa", "foreignwindowid"],
		menu:["menuid","menuname","parentid","seqno","description","issummary","appid","windowid","clientid","tabid","menutype","execname","icon"]
	},
	I_USER:btoa("_USER"),
	I_PASS:btoa("_PASS"),
	LAYOUT_COLS : 3,
	GRID_LIMIT : 100,
	z: function (config) {// tag, attribute, childrens
		var ele = (config[0] ? document.createElement(config[0]) : this);
		if (config[1]) for (var key in config[1]) ele[key] = config[1][key];
		var children = config[2];
		if (Array.isArray(children)) {
			for (var i = 0; i < children.length; i++)ele.z(children[i]);
		}
		if (this instanceof HTMLElement) {
			if (config[0]) this.appendChild(ele);
		}
		return ele;
	},
	configDomain: function (caches){
		var domain={};
		for(var i=0;i<caches.length;i++){
			var cache=caches[i];
			domain[cache.domainid]={items:[],lookup:{},lookdown:{}};
			var item=JSON.parse(cache.domain);
			for(var j=0;j<item.length;j++){
				domain[cache.domainid].items.push({id:item[j][0],text:item[j][1]});
				domain[cache.domainid].lookup[item[j][0]]=item[j][1];
				domain[cache.domainid].lookdown[item[j][1]]=item[j][0];
			}
		}
		return domain;
	},
	configWindow: function (conf,layout){
		var lookupTab={},lookupField={},lookupFieldName={},layoutFields={};
		var winconf={tabs:[],needCache:{}};
		for(var i=0;i<NUT.ERD.window.length;i++)
			winconf[NUT.ERD.window[i]]=conf.window[i];
		if(conf.tabs){
			for(var i=0;i<conf.tabs.length;i++){
				var tab={fields:[],tabs:[],menus:[],children:[],maxLevel:0};
				for(var j=0;j<NUT.ERD.tab.length;j++)
					tab[NUT.ERD.tab[j]]=conf.tabs[i][j];
				if(layout){
					tab.layout=document.createElement("div");
					tab.layout.innerHTML=layout[tab.tabid];
					var tables=tab.layout.querySelectorAll("table");
					for(var t=0;t<tables.length;t++){
						var table=tables[t];
						for(var r=0;r<table.rows.length;r++)for(var c=0;c<table.rows[r].cells.length;c++){
							var cell=table.rows[r].cells[c];
							if(cell.firstChild){
								layoutFields[cell.firstChild.id]=cell.firstChild;
								cell.firstChild.draggable=false;
								cell.firstChild.firstChild.contentEditable=false;
								cell.firstChild.lastChild.className="";
								cell.firstChild.lastChild.firstChild.style.width=cell.firstChild.lastChild.style.width?cell.firstChild.lastChild.style.width:"";
							}
						}
					}
				}
				if(tab.tablevel==0)winconf.tabs.push(tab);
				lookupTab[tab.tabid]=tab;
				if(tab.parenttabid){
					var parentTab=lookupTab[tab.parenttabid];
					parentTab.children.push(tab);
					//tab.parentTab=parentTab;
					if(tab.tablevel>0){
						if(tab.tablevel>parentTab.tablevel){
							parentTab.tabs.push(tab);
							if(tab.tablevel>parentTab.maxLevel)parentTab.maxLevel=tab.tablevel;
						}else{
							lookupTab[parentTab.parenttabid].tabs.push(tab);
						}
					}
				}
			}
			for(var i=0;i<conf.fields.length;i++){
				if(!layout||layoutFields[conf.fields[i][0]]){
					var field={windowid:winconf.windowid,children:[]};
					for(var j=0;j<NUT.ERD.field.length;j++)
						field[NUT.ERD.field[j]]=conf.fields[i][j];
					var tab=lookupTab[field.tabid];
					tab.fields.push(field);
					lookupField[field.fieldid]=field;
					lookupFieldName[tab.tabname+"."+field.fieldname]=field;
					if(field.fieldtype=="select"&&!(field.domainid||field.parentfieldid||winconf.needCache[field.foreigntable_url]))
						winconf.needCache[field.foreigntable_url]=field;
				}
			}
			
			for(var key in lookupField)if(lookupField.hasOwnProperty(key)){
				var field=lookupField[key];
				/*if(field.calculation){
					field.calculationInfos=[];
					var tab=lookupTab[field.tabid];
					var names=field.calculation.match(/(?<=\[).*?(?=\])/g); //get string between [ & ]
					var funcs=field.calculation.match(/sum|count|avg|min|max/g);
					var f=0;
					for(var i=0;i<names.length;i++){
						var info=null;
						var name=names[i];
						var isFullName=name.includes(".");
						lookupFieldName[isFullName?name:tab.tabname+"."+name].children.push(field);
						if(isFullName){
							var tokens=name.split(".");
							var tabName=tokens[0];
							for(var j=0;j<tab.children.length;j++)if(tabName==tab.children[j].tabname){
								info={
									func:funcs[f++],
									tab:tab.children[j].tabid,
									field:tokens[1]
								};break;
							}
							if(tab.parenttabid&&tabName==lookupTab[tab.parenttabid].tabname)
								info={
									tab:tab.parenttabid,
									field:tokens[1]
								};
						}else info={field:name};

						field.calculation=field.calculation.replace(info.func?info.func+"["+name+"]":"["+name+"]","_v["+i+"]");
						field.calculationInfos.push(info);
					}
				}
				if(field.displaylogic){
					var fldnames=field.displaylogic.match(/(?<=\[).*?(?=\])/g);
					for(var i=0;i<fldnames.length;i++)lookupFieldName[tab.tabname+"."+fldnames[i]].children.push(field);
					field.displaylogic=field.displaylogic.replaceAll('[','form.record["');
					field.displaylogic=field.displaylogic.replaceAll(']','"]');
				}*/
				if(field.parentfieldid){
					var parentField=lookupField[field.parentfieldid];
					parentField.children.push(field);
					if(parentField.fieldtype=="search"){
						field.calculation="record."+field.wherefieldname;
						field.calculationInfos=[];
					}
				}
			}
			
			if(conf.menus){
				for(var i=0;i<conf.menus.length;i++){
					var menu={};
					for(var j=0;j<NUT.ERD.menu.length;j++)
						menu[NUT.ERD.menu[j]]=conf.menus[i][j];
					lookupTab[menu.tabid].menus.push(menu);
				}
			}
			winconf.lookupFieldName=lookupFieldName;
		}
		return winconf;
	},
	calcWhere: function (rec){
		var where="";
		for(var key in rec)if(rec.hasOwnProperty(key)){
			where=where?where+"&"+key+"=like."+rec[key]:key+"=like."+rec[key];
		}
		return where;
	},
	isObjectEmpty: function (obj){
		for(var key in obj)if(obj.hasOwnProperty(key))return false;
		return true;
	},
	openDialog: function (content,title){
		divDlgTitle.innerHTML=title;
		divDlgContent.innerHTML="";
		divDlgContent.appendChild(content);
		divDlg.style.display="";
	},
	closeDialog: function (){
		divDlg.style.display="none";
	},
	clone: function (obj){
		var objC={};
		for(var key in obj)if(obj.hasOwnProperty(key)){
			objC[key]=obj[key];
		}
		return objC;
	},
	alert: function (msg) {
		NUT.w2alert(msg, 'ℹ️ <i class="nut-link">Information</i>');
	},
	confirm: function (msg, callback) {
		NUT.w2confirm(msg, '❓ <i class="nut-link">Confirm</i>', callback);
	},
	notify: function (msg, color) {
		var opt = (color=="red" ? { error: true } : { timeout: 10000 });
		NUT.utils.notify("<span style='color:"+(opt.error?"white":color)+"'>" + msg +"</span>", opt);
	},
	loading: function (div) {
		if (div) {
			NUT.divLoading = div;
			NUT.utils.lock(div, undefined, true);
		} else NUT.utils.unlock(NUT.divLoading);
	},
	runComponent(com, data) {
		//data:records,parent,config,gsmap

		if (window[com]) {
			window[com].run(data);
		} else {//load component
			var script = document.createElement("script");
			script.src = "site/" + (com.startsWith("Com_Sys") ? "0/0/" : c$.user.siteid + "/" + c$.app.appid +"/") + com + ".js";
			document.head.appendChild(script);
			script.onload = function () {
				window[com].run(data);
			}
		}
	}
}

HTMLElement.prototype.z = NUT.z;
