
import { SqlREST } from "./sqlrest.js";

export class NUT{
	static ctx = {
		user: null,
		client: null,
		apps: {},
		domain: null,
		winconfig: {},
		extent: null,
		layer: null,
		curApp: null,
		curWinid: null,
		workflow: null
	};
	
	static ds = new SqlREST("https://localhost:7006/api", "zero", "dbo");
	static username = null;
	static ERD={
		window:["windowid","windowname","windowtype","applicationid","componentname","isopensearch"],
		tab: ["tabid", "parenttabid", "tabname", "tablevel", "orderno", "layoutcolumn", "linkchildcolumn", "linkparentcolumn", "whereclause", "orderbyclause", "tableid", "windowid", "midchildcolumn", "midparentcolumn", "linktabletid","midtableid","tablename","columnkey","urledit","servicetype","columnparent","columnkeytrunggian","tabledohoaid","filterfield","filterdefaultvalue","onchange","isnotinsert","isnotupdate","isnotdelete","columncode","columndisplay","archive","beforechange","lock","isnotarchive","isnotlock"],
		field:["fieldid","fieldname","alias","isdisplaygrid","isdisplay","issearch","displaylength","orderno","isreadonly","fieldlength","vformat","defaultvalue","isrequire","isunique","fieldgroup","tabid","columnid","fieldtype","foreigntable","columnkey","columndisplay","isfromdomain","domainid","issearchtonghop","foreigntableid","columncode","parentfieldid","wherefieldname","displaylogic","placeholder","calculation","columntype","colspan","rowspan","isprikey","columndohoa","foreignwindowid"],
		menuitem:["menuitemid","menuitemname","parentid","orderno","description","issummary","applicationid","windowid","clientid","tabid","menuitemtype","execname","icon"]
	}
	static C_WARNING = "orange";
	static C_ERROR = "red";
	static I_USER=btoa("_USER");
	static I_PASS=btoa("_PASS");
	static LAYOUT_COLUMN = 3;
	static GRID_LIMIT = 100;
	
	static nowDay(){
		return (new Date()).getDate();
	}
	static nowMonth(){
		return (new Date()).getMonth()+1;
	}
	static nowYear(){
		return (new Date()).getFullYear();
	}
	static configDomain(caches){
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
	}
	static configWindow(conf,layout){
		var lookupTab={},lookupField={},lookupFieldName={},layoutFields={};
		var winconf={tabs:[],needCache:{}};
		for(var i=0;i<NUT.ERD.window.length;i++)
			winconf[NUT.ERD.window[i]]=conf.window[i];
		if(conf.tabs){
			for(var i=0;i<conf.tabs.length;i++){
				var tab={fields:[],tabs:[],menuitems:[],children:[],maxLevel:0};
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
					if(field.fieldtype=="select"&&!(field.isfromdomain||field.parentfieldid||winconf.needCache[field.foreigntable]))
						winconf.needCache[field.foreigntable]=field;
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
			
			if(conf.menuitems){
				for(var i=0;i<conf.menuitems.length;i++){
					var menuitem={};
					for(var j=0;j<NUT.ERD.menuitem.length;j++)
						menuitem[NUT.ERD.menuitem[j]]=conf.menuitems[i][j];
					lookupTab[menuitem.tabid].menuitems.push(menuitem);
				}
			}
			winconf.lookupFieldName=lookupFieldName;
		}
		return winconf;
	}
	static calcWhere(rec){
		var where="";
		for(var key in rec)if(rec.hasOwnProperty(key)){
			where=where?where+"&"+key+"=like."+rec[key]:key+"=like."+rec[key];
		}
		return where;
	}
	static isObjectEmpty(obj){
		for(var key in obj)if(obj.hasOwnProperty(key))return false;
		return true;
	};
	static openDialog(content,title){
		divDlgTitle.innerHTML=title;
		divDlgContent.innerHTML="";
		divDlgContent.appendChild(content);
		divDlg.style.display="";
	};
	static closeDialog(){
		divDlg.style.display="none";
	}
	static clone(obj){
		var objC={};
		for(var key in obj)if(obj.hasOwnProperty(key)){
			objC[key]=obj[key];
		}
		return objC;
	}
}
