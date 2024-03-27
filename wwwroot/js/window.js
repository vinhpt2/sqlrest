import { NUT } from "./global.js";
export class NWindow {
	constructor(id) {
		this.id = id;
	}
	
	buildWindow(div,conf,tabLevel,callback){
		var divTabs=document.createElement("div");
		divTabs.id = "divtabs_" + conf.tabid + "_" + tabLevel;
		divTabs.className = "nut-full";
		div.appendChild(divTabs);
		var tabs = []
		var windowsearch = (conf.windowtype == "search" || conf.windowtype == "filter" ? conf.windowtype : false);

		for (var i = 0; i < conf.tabs.length; i++) {
			var tabconf = conf.tabs[i];
			if (tabconf.tablevel == tabLevel) {
				var tab = { content: '<div id="divtab_' + tabconf.tabid +'"></div>', label: tabconf.tabname};
				tabs.push(tab);
			}
		}

		if (!windowsearch) {
			new Smart.Tabs("#" + divTabs.id, {
				dataSource: tabs
			});
		}

		for (var i = 0; i < conf.tabs.length; i++) {
			var tabconf = conf.tabs[i];
			//isMobile screen
			if (window.orientation !== undefined) tabconf.layoutcolumn = 1;
			else if (!tabconf.layoutcolumn) tabconf.layoutcolumn = NUT.LAYOUT_COLUMN;

			if (tabconf.tablevel == tabLevel) {
				var divTab = document.getElementById("divtab_" + tabconf.tabid);
				divTab.style.height = (tabconf.maxLevel ? "50%" : "100%");
				var tab = { id: tabconf.tabid, label: tabconf.tabname, tag: tabconf, windowsearch: windowsearch, callback: callback };
				this.buildForm(divTab, tab);
				if (tabconf.tabs.length) for (var l = tabLevel + 1; l <= tabconf.maxLevel; l++)
					this.buildWindow(divTab, tabconf, l, callback);
			}
		}
		
		
	}
	cacheDomainAndOpenWindow(div, conf, needCaches, index) {
		var fldconf = needCaches[index];
		if (fldconf) NUT.ds.select({ url: fldconf.foreigntable, select: [fldconf.columnkey, fldconf.columndisplay], where: (fldconf.wherefieldname ? JSON.parse(fldconf.wherefieldname) : null) }, function (res) {
			var domain = { items: [], lookup: {} };
			for (var i = 0; i < res.length; i++) {
				var item = { id: res[i][fldconf.columnkey], text: res[i][fldconf.columndisplay] };
				domain.items.push(item);
				domain.lookup[item.id] = item.text;
			}
			NUT.ctx.domain[fldconf.foreigntable] = domain;
			if (++index < needCaches.length) cacheDomainAndOpenWindow(conf, needCaches, index);
			else NWIN.buildWindow(div, conf, 0);
		});
		else NWIN.buildWindow(div, conf, 0);
	}
	tab_onClick(evt){
		if(!evt.tab.windowsearch){
			var id=evt.tab.id;
			for(var i=0;i<this.tabs.length;i++){
				var tab=this.tabs[i];
				var divTab=document.getElementById("divtab_"+tab.id);
				divTab.style.display=(tab.id==id)?"":"none";
				if(tab.id==id)NWIN.updateChildGrids(tab.tag);
			}
			w2ui["divgrid_"+id].resize();
			w2ui["divform_"+id].resize();
		}
	}
	buildForm(div,tab){
		var conf=tab.tag;
		conf.default={};
		var group=null,colGroup=null;
		var fields=[],columns=[],searches=[], index=0;
		for(var i=0;i<conf.fields.length;i++){
			var fldconf=conf.fields[i];
			if(!fldconf.isprikey){
				if(fldconf.fieldname=="siteid")conf.default.clientid=NUT.ctx.user.siteid;
				if(fldconf.fieldname=="appid")conf.default.applicationid=NUT.ctx.curApp.appid;
			}		
			var domain=null;
			if(fldconf.fieldtype=="dropdownlist"){
				var key=(fldconf.isfromdomain)?fldconf.domainid:fldconf.foreigntable;
				domain=NUT.ctx.domain[key];
			}
			if(fldconf.isdisplaygrid){
				var column={dataField:fldconf.fieldname,label:fldconf.alias,width:100};//, sortable:true,frozen:(fldconf.fieldname==conf.columncode),options:{conf:fldconf}};
				//if(fldconf.fieldtype=="int"||fldconf.fieldtype=="number"||fldconf.fieldtype=="currency"||fldconf.fieldtype=="date"||fldconf.fieldtype=="datetime"||fldconf.fieldtype=="percent")column.render=fldconf.fieldtype;
				/*if(fldconf.foreignwindowid){
					column.render=function(record,index,column_index){					
						var conf=this.columns[column_index].options.conf;
						return "<a class='nut-link' onclick='linkfield_onClick("+conf.foreignwindowid+",\""+record[conf.fieldname]+"\",\""+conf.wherefieldname+"\")'>"+record[conf.fieldname]+"</a>";
					}
				}
				if(!(fldconf.isreadonly||tab.windowsearch)){
					column.editable={type:fldconf.fieldtype};
					if(domain)column.editable.items=domain.items;
					if(domain&&fldconf.parentfieldid){
						column.editable.lookup=domain.lookup;
						column.render=function(record){
							var col=this.columns[column_index];
							var lookup=col.editable.lookup;
							return lookup[record[col.field]];
						}
					}
				}
				*/
				columns.push(column);
			}

			if(fldconf.isdisplay){
				var field={dataField: fldconf.fieldname, controlType:"input", required: fldconf.isrequire&&!fldconf.isprikey, label:fldconf.foreignwindowid?"<a class='nut-link' onclick='linkfield_onClick("+fldconf.foreignwindowid+","+fldconf.fieldname+".value,\""+fldconf.wherefieldname+"\")'>"+fldconf.alias+"</a>":fldconf.alias,column:index++%conf.layoutcolumn,attr:fldconf.isreadonly?"disabled":"tabindex=0",options:fldconf};
				if(domain){
					field.options=domain.items;
					field.options.showNone=true
				};
				if(fldconf.placeholder)field.placeholder=fldconf.placeholder;
				if(fldconf.displaylength)field.width+=fldconf.displaylength;
				if(fldconf.fieldlength)field.maxlength+=fldconf.fieldlength;
				if(fldconf.vformat)field.pattern=fldconf.vformat;
				if(fldconf.colspan)field.columnSpan=fldconf.colspan;
				if(fldconf.rowspan)field.rowSpan=fldconf.rowspan;
				/*if(fldconf.fieldgroup){
					if(fldconf.fieldgroup!=group){
						field.html.group=fldconf.fieldgroup;
						colGroup=field.html.column;
						group=fldconf.fieldgroup;
					}else{
						field.html.column=colGroup;
					}
				}*/
				if(fldconf.defaultvalue)conf.default[fldconf.fieldname]=fldconf.defaultvalue.startsWith("NUT.")?eval(fldconf.defaultvalue):fldconf.defaultvalue;
				if(fldconf.issearch)searches.push(field);
				
				fields.push(field);
			}
		}
		var divTool=document.createElement("div");
		divTool.id="divtool_"+conf.tabid;
		div.appendChild(divTool);
		var divContent=document.createElement("div");
		divContent.id="divcont_"+conf.tabid;
		divContent.className="nut-full";
		div.appendChild(divContent);
		//form
		var divForm=conf.layout?conf.layout:document.createElement("div");
		divForm.id="divform_"+conf.tabid;
		divForm.className = "nut-full";

		divContent.appendChild(divForm);
		var form=new Smart.Form("#"+divForm.id, {
			controls:tab.windowsearch?searches:fields,
			recid:conf.columnkey,
			tab:tab
		});
		form.element.style.overflow = "auto";
		form.onValueChanges=this.field_onChange;

		if(!tab.windowsearch)divForm.style.display="none";
		//grid
		var divGrid=document.createElement("div");
		divGrid.id="divgrid_"+conf.tabid;
		divGrid.className="nut-full";
		divGrid.style.height=divForm.style.height;
		//divGrid.style.display="none";
		divContent.appendChild(divGrid);
		var grid = new Smart.Grid("#" + divGrid.id, {
			name: divGrid.id,
			url: "https://localhost:7006/api/zero/dbo/data/" + conf.tablename,//(conf.parenttabid||tab.windowsearch)?"":conf.urledit,
			limit: NUT.GRID_LIMIT,
			//httpHeaders:{Prefer:"count=exact"},
			recid: conf.columnkey,
			multiSelect: false,
			columns: columns,
			searches: searches,
			onSelect: this.grid_onSelect,
			//onLoad: this.grid_onLoad,
			onRequest: this.grid_onRequest,
			onError: this.grid_onError,
			//onChange: this.field_onChange,
			onDblClick: this.grid_onDblClick,
			tab: tab
		});
		var isArchive=!conf.isnotarchive&&conf.archive;
		var items=tab.windowsearch?[{type:'button',value:"OK",label:'✔️',tooltip:"Ok"},
					{type:'break',label:"|"},
			{ type: 'button', value:"CLEAR",label:'🧹 Clear',tooltip:"Clear"},
			{ type: 'button', value:"SEARCH",label:'🔍 Search',tooltip:"Search"},
			{ type: 'break', label: "|" }]:
			[{ type: 'button', value: "GRID", label: '⧉', tooltip: "Form/Grid" },
				{ type: 'break', label: "|", disabled:true },
				{ type: 'button', value:"FIND",label:'🔎',hidden:searches.length==0,tooltip:"Find"},
				{ type: 'button', value:"NEW",label:'📄',hidden:conf.isnotinsert,tooltip:"Add New"},
				{ type: (isArchive ? "menu" : "button"), value:(isArchive?"save":"SAVE"),label:'💾',hidden:conf.isnotupdate,tooltip:"Save Edit",items:[{id:"SAVE",text:"Save"},{id:"SAVE_A",text:"Archive & Save"}]},
				{ type: (isArchive ? "menu" : "button"), value:(isArchive?"del":"DEL"),label:'❌',hidden:conf.isnotdelete,tooltip:"Delete",items:[{id:"DEL",text:"Delete"},{id:"DEL_A",text:"Archive & Delete"}]},
				{ type: 'break', label: "|" }];
		if(!tab.windowsearch){
			if(!conf.isnotlock&&conf.lock)items.push({type:'button',id:"LOCK",text:'🔒',tooltip:"Lock/Unlock"});
			if(isArchive)items.push({type:'button',id:"ARCH",text:'🕰️',tooltip:"Archive"});
			//if(conf.columnparent)items.push({type:'button',id:"TREE",text:'🎛️',tooltip:"Tree view"});
			if(conf.filterfield){
				var filterfields=JSON.parse(conf.filterfield);
				if(conf.filterdefaultvalue){//where filter
					var filterdefaults=JSON.parse(conf.filterdefaultvalue);
					for(var i=0;i<filterfields.length;i++){
						items.push({type:'radio',value:"FLT_"+i,label:filterdefaults[i],group:0,tag:filterfields[i]});
					}
				}else{
					var lookupfilter={},lookupdefault={};
					for(var i=0;i<filterfields.length;i++){
						var filter=filterfields[i];
						lookupfilter[filter[0]]=true;
						var value=filter[1];
						if(value!=null)
							lookupdefault[filter[0]]=(typeof(value)=="string"&&value.startsWith("NUT.")?eval(value):value);
					}
					
					var field=null;
					for(var i=0;i<conf.fields.length;i++){
						field=conf.fields[i];
						var key=field.fieldname;
						if(lookupfilter[key]){
							var values=[{id:"FILTER",text:"-All-",tag:[key,"ALL"]}];
							if(field.domainid){
								var dmItems=NUT.ctx.domain[field.domainid].items;
								for(var j=0;j<dmItems.length;j++)
									values.push({id:"FILTER",text:dmItems[j].text,tag:[key,dmItems[j].id]});
								items.push({type:'menu',id:"flt_"+key,text:(lookupdefault&&lookupdefault[key])?NUT.ctx.domain[field.domainid].lookup[lookupdefault[key]]:field.alias,items: values});
								items.push({type:'break'});
							}
						}
					}
				}
			}
			items.push({type:'spacer',id:"SPACE"});
			var lookup={};
			for(var i=0;i<conf.menuitems.length;i++){
				var menuitem=conf.menuitems[i];
				var isSummary=(menuitem.issummary);
				var item={type:(isSummary?'menu':'button'),id:menuitem.execname?menuitem.execname:menuitem.menuitemid,label:menuitem.menuitemname,tooltip:menuitem.description,tag:menuitem};
				if(isSummary)item.items=[];
				if(menuitem.parentid){
					lookup[menuitem.parentid].items.push(item);
				}else{
					items.push(item);
				}
				lookup[menuitem.menuitemid]=item;
			}
		}
		var items2 = [{ type: 'button', value:"XLS_IMP",label:'📥',tooltip:"Import .xls"},
			{ type: 'button', value:"XLS_EXP",label:'📤',tooltip:"Export .xls"},
			{ type: 'break', label: "|" },
			{ type: 'button', value:"PREV",label:'<',tooltip:"Previous",tag:-1},
			{ type: 'button', ivalued: "NEXT", label:'>',tooltip:"Next",tag:+1},
			{ type: 'html', value: "STUT", label:"<u style='color:blue' id='divrec_"+conf.tabid+"' onclick='$(this).w2tag(this.tag)'></u>/<span id='divtotal_"+conf.tabid+"'></span>"},
			{ type: 'break', label: "|" },
			{ type: 'check', value: "EXPD", label:"«",tooltip:"Collapse"}];
		//toolbar
		var tbr = new Smart.ButtonGroup("#" + divTool.id, {
			dataSource: items
			//onclick:this.tool_onClick,
			//tab:tab
		});
		tbr.form=form;
		tbr.grid=grid;
		tbr.tab=tab;
		tbr.addEventListener('click', this.tool_onClick);
	}
	tool_onClick=function(evt){
		var selItem = this.selectedValues[0];
		var tab=this.tab;
		var conf=tab.tag;
		var timeArchive=null;
		switch (selItem){
			case "OK":
				if(tab.windowsearch=="search"&&tab.callback)tab.callback(item.id,grid.get(grid.getSelection()));
				break;
			case "EXPD":
				document.getElementById("divcont_"+tab.id).style.height=item.checked?"45vh":"80vh";
				if(grid.tab.isForm)form.resize();else grid.resize();
				break;
			case "GRID":
				this.isForm=!this.isForm;
				this.form.element.style.display=this.isForm?"":"none";
				this.grid.style.display=this.isForm?"none":"";
				break;
			case "PREV":
			case "NEXT":
				var index=grid.getSelection(true)[0]+item.tag;
				if(grid.records[index])
					grid.select(grid.records[index][grid.recid]);
				break;
			case "FIND":
				//grid.searchOpen(evt.originalEvent.target);
				var id="divfind_"+tab.id;
				w2popup.open({
					title:"🔎 <i>Find</i> - "+conf.tabname,
					modal:true,
					width: 920,
					body: '<div id="'+id+'" class="nut-full"></div>',
					onClose(evt){NUT.ctx.idFormPopup=null},
					onOpen(evt){
						evt.onComplete=function(){
							var div=document.getElementById(id);
							(w2ui[id]||new w2form({ 
								name: id,
								fields: grid.searches,
								onChange:this.field_onChange,
								tab:tab,
								actions: {
									"⛌ Close": function () {
										w2popup.close();
									},
									"⭯ Reset"(){
										this.clear();
									},
									"✔️ Find": function (evt) {
										var changes=this.getChanges();
										if(NUT.isObjectEmpty(changes))
											grid.searchData=grid.originSearch?[grid.originSearch]:[];
										else for(var key in changes)if(changes.hasOwnProperty(key)){
											var search=grid.getSearchData(key);
											if(search)search.value=changes[key];
											else grid.searchData.push({field:key,operator:"=",value:changes[key]});
										}
										grid.load(conf.urledit);
									}
								}
							})).render(div);
							NUT.ctx.idFormPopup=id;
						}
					}
				});
				break;
			//case "Com_NEW":
			case "NEW":
				//var newfields=[];
				//for(var i=0;i<form.fields.length;i++)if(!form.fields[i].options.conf.isprikey)newfields.push(form.fields[i]);
				if(conf.parenttabid&&!conf.bangtrunggian)conf.default[conf.truonglienketcon]=grid.parentRecord[conf.truonglienketcha];
				var id="divnew_"+tab.id;
				w2popup.open({
					title:"📄 <i>New</i> - "+conf.tabname,
					modal:true,
					width: 920,
					height: 610,
					body: '<div id="'+id+'" class="nut-full"></div>',
					onClose(evt){NUT.ctx.idFormPopup=null},
					onOpen(evt){
						evt.onComplete=function(){
							var div=document.getElementById(id);
							(w2ui[id]||new w2form({
								name: id,
								fields: form.fields,
								onChange:this.field_onChange,
								record:conf.default,
								actions: {
									"⛌ Close": function () {
										w2popup.close();
									},
									"✔️ Add New": function (evt) {
										if(this.validate(true).length)return;
										var recTrungGian=null;
										if(conf.parenttabid){
											var parentKey=grid.parentRecord[conf.truonglienketcha];
											if(conf.bangtrunggian){//lien ket n-n
												recTrungGian={};
												recTrungGian[conf.truongtrunggiancha]=parentKey;
											}else{
												this.record[conf.truonglienketcon]=parentKey;
											}
										}
										var self=this;
										var data={};//remove "" value
										for(var key in this.record)if(this.record.hasOwnProperty(key)&&this.record[key]!=="")
											data[key]=this.record[key];
										if(conf.beforechange){
											if(conf.onchange)NWIN.runComponent(conf.onchange,{action:item.id,data:data,config:conf});
										}else
											NUTNUT.ds.insert({url:conf.urledit,data:data},function(res){
											if(res.length){
												NUT.tagMsg("Record inserted.","lime");
												grid.add(res[0],true);
												grid.select(res[0][grid.recid]);
												if(recTrungGian){
													recTrungGian[conf.truongtrunggiancon]=res[0][conf.truonglienketcon];
													NUTNUT.ds.insert({url:conf.bangtrunggian,data:recTrungGian},function(res2){
														if(res2.length)NUT.tagMsg("Record inserted.","lime");
													});
												}
												if(conf.onchange)NWIN.runComponent(conf.onchange,{action:item.id,data:res[0],config:conf});
											}
										});
									}
								}
							})).render(div);
							NUT.ctx.idFormPopup=id;
						}
					}
				});
				break;
			case "SAVE_A":
				timeArchive=w2prompt({label:"Archive time",value:new Date()});
				if(!timeArchive)break;
			case "SAVE":
				if(conf.lock&&(grid.tab.isForm?form.record[conf.lock]:grid.get(grid.getSelection()[0])[conf.lock]))
					w2alert("<span style='color:orange'>Can not update locked record!</span>");
				else {
					if(grid.tab.isForm&form.validate(true).length)return;
					
					var changes=grid.tab.isForm?[form.getChanges()]:grid.getChanges();
					var tagNode="#tb_divtool_"+tab.id+"_item_SPACE";
					var hasChanged=false;
					var columnkey=conf.columnkey;
					for(var i=0;i<changes.length;i++){
						var change=changes[i];
						if(!NUT.isObjectEmpty(change)){
							var data={};//remove "" value
							for(var key in change)if(change.hasOwnProperty(key)&&key!=columnkey)
								data[key]=(change[key]==""?null:change[key]);
							var recid=(grid.tab.isForm?form.record[columnkey]:change[columnkey]);
							if(conf.beforechange){
								if(conf.onchange)NWIN.runComponent(conf.onchange,{action:item.id,recid:recid,data:data,config:conf});
							}else{
								var p={url:conf.urledit,where:[columnkey,"=",recid],data:data};
								NUTNUT.ds.update(p,function(res){
									if(timeArchive)archiveRecord(conf.urledit.substr(0,conf.urledit.lastIndexOf("/")),item.id,data,recid,conf.tableid,timeArchive);
									if(grid.tab.isForm)grid.set(recid,data);
									NUT.tagMsg("Record updated.","lime",tagNode);
									
									if(conf.onchange)NWIN.runComponent(conf.onchange,{action:item.id,recid:recid,data:data,config:conf});
								});
							}
							hasChanged=true;
						}
					}
					if(hasChanged)grid.tab.isForm?form.applyChanges():grid.applyChanges();
					else NUT.tagMsg("No change!","yellow",tagNode);
				}
				break;
			case "DEL_A":
				timeArchive=w2prompt({label:"Archive time",value:new Date()});
				if(!timeArchive)break;
			case "DEL":
				 w2confirm('<span style="color:red">Delete selected record?</span>').yes(function(){
					var recid=grid.tab.isForm?form.record[conf.columnkey]:grid.getSelection()[0];
					if(conf.beforechange){
						if(conf.onchange)NWIN.runComponent(conf.onchange,{action:item.id,recid:recid,config:conf});
					}else{
						var tagNode="#tb_divtool_"+tab.id+"_item_SPACE";
						if(recid)NUTNUT.ds.delete({url:conf.urledit,where:[conf.columnkey,"=",recid]},function(res){
							if(timeArchive)archiveRecord(conf.urledit.substr(0,conf.urledit.lastIndexOf("/")),item.id,grid.tab.isForm?form.record:grid.get(recid),recid,conf.tableid,timeArchive);
							grid.remove(recid);
							NUT.tagMsg("1 record deleted.","lime",tagNode);
							
							if(conf.onchange)NWIN.runComponent(conf.onchange,{action:item.id,recid:recid,config:conf});
						});else NUT.tagMsg("No selection!","yellow",tagNode);
					}
				 });
				break;
			case "SEARCH":
				var changes=form.getChanges();
				if(NUT.isObjectEmpty(changes))
					grid.searchData=grid.originSearch?[grid.originSearch]:[];
				else for(var key in changes)if(changes.hasOwnProperty(key)){
					var search=grid.getSearchData(key);
					if(search)search.value=changes[key];
					else grid.searchData.push({field:key,operator:"=",value:changes[key]});
				}
				grid.load(conf.urledit);
				break;
			case "XLS_IMP":
				var fieldnames=[];
				for(var i=0;i<conf.fields.length;i++)
					fieldnames.push(conf.fields[i].fieldname);
				var header=fieldnames.join('\t')+"\n";
				var id="txtimpxls_"+tab.id;
				NUT.ctx.tabconf=conf;
				w2popup.open({
					title:"📥 <i>Import excel</i> - "+conf.tabname,
					modal:true,
					width: 1000,
					height: 700,
					body: '<textarea cols='+(header.length+8*fieldnames.length)+' id="'+id+'" style="height:100%">'+header+'</textarea>',
					buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="xlsInsert_onClick(NUT.ctx.tabconf,'+id+'.value)">➕ Insert data</button><button class="w2ui-btn" onclick="xlsUpdate_onClick(NUT.ctx.tabconf,'+id+'.value)">✔️ Update data</button>'
				});
				break;
			case "XLS_EXP":
				var win = window.open();
							
				var table=win.document.createElement("table");
				table.border=1;
				table.style.borderCollapse="collapse";
				
				var caption=table.createCaption();
				caption.innerHTML=conf.tabname;
				
				var row=table.insertRow();
				for(var i=0;i<grid.columns.length;i++){
					var cell=document.createElement("th");
					cell.innerHTML=grid.columns[i].text;
					row.appendChild(cell);
				}
				
				for(var i=0;i<grid.records.length;i++){
					var row=table.insertRow();
					for(var j=0;j<grid.columns.length;j++){
						var cell=row.insertCell();
						cell.innerHTML=grid.records[i][grid.columns[j].field];
					}
				}
				
				var a=win.document.createElement("a");
				a.style.cssFloat="right";
				a.download=conf.tablename+".xls";
				a.href='data:application/vnd.ms-excel,'+table.outerHTML.replace(/ /g, '%20');
				a.innerHTML="<img src='"+document.location.href+"/client/0/img/excel.png'>&nbsp;Kết xuất Excel";
				
				caption.appendChild(a);
				win.document.body.appendChild(table);
				
				break;
			case "FILTER":
				if(item.tag[1]=="ALL")
					grid.searchData=grid.originSearch?[grid.originSearch]:[];
				else {
					var search=grid.getSearchData(item.tag[0]);
					if(search)search.value=item.tag[1];
					else grid.searchData.push({field:item.tag[0],operator:"=",value:item.tag[1]});
				}
				grid.load(conf.urledit);
				break;
			case "LOCK":
				var record=grid.tab.isForm?form.record:grid.record;
				var label=record[conf.lock]?"🔓 Unlock":"🔒 Lock";
				w2confirm(label+' selected record?').yes(function(){
					var data={};
					data[conf.lock]=record[conf.lock]?false:true;
					NUTNUT.ds.update({url:conf.urledit,data:data,where:[conf.columnkey,"=",record[conf.columnkey]]},function(){
						record[conf.lock]=data[conf.lock];
						grid.tab.isForm?form.refresh():grid.refresh();
					});
				});
				break;
			case "ARCH":
				var recid=grid.tab.isForm?form.record[conf.columnkey]:grid.getSelection();
				NUTNUT.ds.select({url:conf.urledit.substr(0,conf.urledit.lastIndexOf("/"))+"/sysarchive",where:[["tableid","=",conf.tableid],["recordid","=",recid]]},function(res){
					var id="divarch_"+tab.id;
					w2popup.open({
						title:"🕰️ <i>Archive</i> - "+conf.tabname,
						modal:true,
						width: 920,
						height: 700,
						body: '<div id="'+id+'" class="nut-full"></div>',
						onOpen(evt){
							evt.onComplete=function(){
								var div=document.getElementById(id);
								(w2ui[id]||new w2grid({
									name: id,
									columns:[
										{ field: 'archiveid', text: 'ID', sortable:true},
										{ field: 'archivetype', text: 'Type', sortable:true},
										{ field: 'archivetime', text: 'Time', sortable:true},
										{ field: 'tableid', text: 'Table ID', sortable:true},
										{ field: 'recordid', text: 'Record ID', sortable:true},
										{ field: 'archive', text: 'Archive', sortable:true,info:{render: function(rec, idx, col){
											var obj=JSON.parse(rec.archive);
											var str="<table border='1px'><caption><b style='color:yellow'>"+(rec.archivetype=="DEL_A"?"Deleted":"Changed")+"!</b></caption>"
											for(var key in obj)if(obj.hasOwnProperty(key))
												str+="<tr><td align='right'><i>"+key+"</i></td><td>"+obj[key]+"</td></tr>";
											return str+"</table>";
										}}},
										{ field: 'clientid', text: 'Client ID', sortable:true}
									],
									records:res,
									recid:"archiveid"
								})).render(div);
							}
						}
					});	
				});
				break;
			default:
				if(Number.isInteger(item.id)){
					//open window
				}else{
					if(item.id.startsWith("FLT_")){//filter
						grid.searchData=[];
						for(var i=0;i<item.tag.length;i++){
							var where=item.tag[i];
							var value=where[2];
							var value=(typeof(value)=="string"&&value.startsWith("NUT.")?eval(value):value);
							grid.searchData.push({field:where[0],operator:where[1],value:value});
						}
						grid.load(conf.urledit);
					}else if(item.id.startsWith("Com_")){//component
						NWIN.runComponent(item.id,{
							records:grid.get(grid.getSelection()),
							parent:grid.parentRecord,
							config:conf,
							gsmap:GSMap
						});
					}else{
						NUT.tagMsg(item.id+" not starts with 'Com_'","yellow","#tb_divtool_"+tab.id+"_item_"+item.id);
					}
				}
		}
	}
	field_onChange(evt){
		return;
		var conf=(evt.column===undefined)?this.get(evt.target).options.conf:this.columns[evt.column].options.conf;
		if(conf.fieldtype=="search"||conf.fieldtype=="image"){
			this.get(evt.target).el.onchange(evt.value_new);
		//if(evt.value_new===true)evt.value_new="Y";
		//if(evt.value_new===false)evt.value_new="";
		//this.record[conf.fieldname]=evt.value_new;
		} else if(!NUT.isObjectEmpty(this.record)){
			this.record[conf.fieldname]=evt.value_new;
			NWIN.updateChildFields(conf,this.record,this.parentRecord);
			
			if(conf.fieldtype=="select"&&conf.columndohoa&&this.tab.windowsearch=="filter"){//bind with map
				var lyrconf=GSMap.getLayerConfig(this.tab.tag.tabledohoaid);
				GSMap.applyFilter(lyrconf.maporder,lyrconf.orderno,[conf.columndohoa,"=",evt.value_new]);

				var where=[conf.columnkey,"=",evt.value_new];
				var ext=NUT.ctx.extent[where.toString()];
				if(ext)
					GSMap.zoomToExtent(ext);
				else NUTNUT.ds.select({url:conf.foreigntable,select:"minx,miny,maxx,maxy",where:where},function(res){
					var ext=[res[0].minx,res[0].miny,res[0].maxx,res[0].maxy];
					if(res.length)GSMap.zoomToExtent(ext);
					NUT.ctx.extent[where.toString()]=ext;
				});
			}
		}
	}
	grid_onError(evt){
		NUT.tagMsg(evt.detail.response,"red","#tb_divtool_"+this.tab.id+"_item_SPACE");
	}
	grid_onRequest(evt){
		var tabconf = this.tab.tag;
		var postData = evt.detail.postData;
		var data={
			resultRecordCount:postData.limit,
			resultOffset:postData.offset,
			orderByFields:(postData.sort?postData.sort[0].field+" "+postData.sort[0].direction:(tabconf.orderbyclause?tabconf.orderbyclause:tabconf.columnkey+" desc"))
		}
		//if(evt.url.includes("/sys")||evt.url.includes("/sv_"))data.where="clientid="+NUT.ctx.user.clientid;
		
		// still bug
		if(tabconf.whereclause)
			data.where=NUTNUT.ds.decodeSql({where:[JSON.parse(tabconf.whereclause)]},true);
		if(tabconf.tempWhere)
			data.where=NUTNUT.ds.decodeSql({where:[tabconf.tempWhere]},true);
		if(postData.search){
			var where=[];
			for(var i=0;i<postData.search.length;i++){
				var search=postData.search[i];
				where.push(search.operator=="begins"?[search.field,"like",search.value+"*"]:[search.field,search.operator,search.value]);
			}

			data.where=NUTNUT.ds.decodeSql({where:where},true);
		}
		if(postData.select){
			data.where=NUTNUT.ds.decodeSql({where:postData.select},true);
		}
		postData=data;
	}
	grid_onLoad(evt){
		var tab=this.tab;
		//var header=evt.xhr.getResponseHeader("Content-Range");
		//var total=header.split("/")[1];
		var records=evt.detail.data.results;
		var total=records.length;
		evt.detail.data={
			status:"success",
			total:total,
			records:records
		}
		tab.isForm=(total=="1");
		evt.onComplete=function(){
			if(total==0){
				if(!tab.windowsearch){
					NWIN.switchFormGrid(tab.id,tab.isForm);
					if(records.length){
						this.noZoomTo=true;
						this.select(records[0][this.recid])
					};
				}
				document.getElementById("divrec_"+tab.id).innerHTML=(total=="0")?"0":"1";
			}
			document.getElementById("divtotal_"+tab.id).innerHTML=total;
		}
	}
	grid_onSelect(evt){
		var recid=evt.recid;
		if(recid!="-none-"){
			var conf=this.tab.tag;
			this.record=this.get(recid);
			var lab=document.getElementById("divrec_"+conf.tabid);
			lab.innerHTML=this.get(recid,true)+1;
			lab.tag=conf.columnkey+"="+recid;
			
			if(this.tab.tag.tabledohoaid&&this.tab.windowsearch!="search"){
				if(this.noZoomTo)
					this.noZoomTo=false;
				else {
					var where="";
					for(var i=0;i<this.tab.tag.fields.length;i++){
						var field=this.tab.tag.fields[i];
						if(field.columndohoa&&this.record[field.columndohoa]){
							var clause=field.columndohoa+"="+this.record[field.columndohoa];
							where+=where?" and "+clause:clause;
						}
					}
					var lyrconf=GSMap.getLayerConfig(this.tab.tag.tabledohoaid);
					if(where)GSMap.zoomToFeature(lyrconf.maporder,lyrconf.layername,where);
				}
			}
			if(!this.tab.windowsearch&&this.record){
				NWIN.updateFormRecord(conf,this.record,this.parentRecord);
				for(var i=0;i<conf.children.length;i++)NWIN.updateChildGrids(conf.children[i],this.record);
			}
		}
	}
	updateFormRecord(conf,record,parentRecord){
		var form=w2ui["divform_"+conf.tabid];
		
		//fire onchange
		/*for(var i=0;i<form.fields.length;i++){
			var key=form.fields[i].field;
			if(record[key]!=form.record[key])
				form.onChange({target:key,value_old:form.record[key],value_new:record[key]});
		}*/
		
		form.clear();
		form.record=record;
		form.parentRecord=parentRecord;
		form.refresh();
	}
	updateChildFields(conf,record,parentRecord){
		if(conf.children.length){	
			for(var i=0;i<conf.children.length;i++){
				fldconf=conf.children[i];
				var form=w2ui[NUT.ctx.idFormPopup?NUT.ctx.idFormPopup:"divform_"+fldconf.tabid];
				if(fldconf.fieldtype=="select")
					this.loadChildSelect(fldconf,record[conf.fieldname]);
				if(fldconf.calculation){
					var _v=[];
					for(var v=0;v<fldconf.calculationInfos.length;v++){
						var info=fldconf.calculationInfos[v];
						if(info.func)//childs
							_v[v]=this.calculateChilds(info);
						else if(info.tab)//parent
							_v[v]=parentRecord[info.field];
						else _v[v]=record[info.field];
					}
					var	value=eval(fldconf.calculation);
					form.record[fldconf.fieldname]=value;
					form.refresh(fldconf.fieldname);
					//w2ui["divgrid_"+fldconf.tabid].grid.refresh();
					this.updateChildFields(fldconf,form.record,form.parentRecord);
				}
				if(fldconf.displaylogic){
					var value=eval(fldconf.displaylogic);
					//if(panel.fields){//is form
						var el=form.get(fldconf.fieldname).el;
						el.style.display=value?"":"none";
						el.parentNode.previousElementSibling.style.display=el.style.display;
					//}else value?panel.showColumn(fldconf.fieldname):panel.hideColumn(fldconf.fieldname);
				}
			}
		}
	}
	calculateChilds(info){
		var records=w2ui["divgrid_"+info.tab].records;
		var result=(info.func=="min"?Number.MAX_VALUE:(info.func=="max"?Number.MIN_VALUE:0));
		for(var i=0;i<records.length;i++){
			value=records[i][info.field];
			switch (info.func){
				case "avg":
				case "sum":result+=value;break;
				case "count":result++;break;
				case "min":if(value<result)result=value;break;
				case "max":if(value>result)result=value;break;
			}
		}
		if(info.func=="avg")result/=res.length;
		return result;
	}
	updateChildGrids (conf,record){
		var divTab=document.getElementById("divtab_"+conf.tabid);
		if(divTab){
			var grid=w2ui["divgrid_"+conf.tabid];
			if(record){
				divTab.needUpdate=true;
				grid.parentRecord=record;
			}
			if(divTab.needUpdate&&divTab.style.display.length==0){
				var search=grid.getSearchData(conf.truonglienketcon);
				if(conf.bangtrunggian){//lien ket n-n
					NUTNUT.ds.select({url:conf.bangtrunggian,select:conf.truongtrunggiancon,where:[conf.truongtrunggiancha,"=",grid.parentRecord[conf.truonglienketcha]]},function(res){
						var ids=[];
						for(var i=0;i<res.length;i++)
							ids.push(res[i][conf.truongtrunggiancon]);
						grid.originSearch={field:conf.truonglienketcon,operator:"in",value:ids};
						if(search)search.value=ids;
						else grid.searchData.push(grid.originSearch);
						grid.load(conf.urledit);
					});
				}else{
					grid.originSearch={field:conf.truonglienketcon,operator:"=",value:grid.parentRecord[conf.truonglienketcha]};
					if(search)search.value=grid.parentRecord[conf.truonglienketcha];
					else grid.searchData.push(grid.originSearch);
					grid.load(conf.urledit);
				}
				divTab.needUpdate=false;
			}
		}
	}
	grid_onDblClick (evt){
		if(!(this.columns[evt.column].editable||this.tab.windowsearch=="filter")){
			this.tab.isForm=!this.tab.isForm;
			NWIN.switchFormGrid(this.tab.id,true);
		}
	}
	switchFormGrid(tabid,isForm){
		var form=document.getElementById("divform_"+tabid);
		var grid=document.getElementById("divgrid_"+tabid);
		form.style.display=isForm?"":"none";
		grid.style.display=isForm?"none":"";
		//if(isForm)form.resize();else grid.resize();
	}
	xlsInsert_onClick(conf,csv){
		if(csv.includes(","))
			w2alert('Data contains invalid , character!');
		else NUTNUT.ds.insertCsv({url:conf.urledit,data:csv.replaceAll('\t',',')},function(res){
			if(res.length)NUT.tagMsg("Data imported.","lime");
		});
	}
	xlsUpdate_onClick(conf,csv){
		if(csv.includes(",")){
			w2alert('Data contains invalid , character!');
			return;
		}
		var lines=csv.split('\n');
		if(lines.length<2){
			NUT.tagMsg("Empty data","yellow");
		}else{
			var domain={},prikey=null,privalue=null;
			for(var i=0;i<conf.fields.length;i++){
				var fld=conf.fields[i];
				if(fld.domainid)domain[fld.fieldname]=NUT.ctx.domain[fld.domainid].lookdown;
				if(fld.isprikey)prikey=fld.fieldname;
			}

			var header=lines[0].split('\t');
			
			for(var i=1;i<lines.length;i++){
				var values=lines[i].split('\t');
				var json={};
				for(var j=0;j<values.length;j++){
					var key=header[j];
					var value=(values[j]===""?null:values[j]);
					if(key==prikey)privalue=value;
					else json[key]=domain[key]?domain[key][value]:value;
				}
				NUTNUT.ds.update({url:conf.urledit,where:[prikey,"=",privalue],data:json},function(res){
					NUT.tagMsg("Record updated.","lime");
				});
			}

		}
	}
	archiveRecord(url,type,archive,recid,tableid,time){
		var data={
			archivetype:type,
			archivetime:time?time:new Date(),
			archive:JSON.stringify(archive),
			recordid:recid,
			tableid:tableid,
			clientid:NUT.ctx.user.clientid
		};
		NUTNUT.ds.insert({url:url+"/sysarchive",data:data},function(res){
			if(res.length)NUT.tagMsg("Record archived.","lime");
		});
	}
	runComponent(com,data){
		//data:records,parent,config,gsmap
		
		if(window[com]){
			window[com].run(data);
		}else{//load component
			var script=document.createElement("script");
			script.src="client/"+(com.startsWith("Com_Sys")?"0":NUT.ctx.user.clientid)+"/com/"+com+".js";
			document.head.appendChild(script);
			script.onload=function(){
				window[com].run(data);
			}				
		}
	}
	loadChildSelect(fldconf,value){
		var form=w2ui[NUT.ctx.idFormPopup?NUT.ctx.idFormPopup:"divform_"+fldconf.tabid];
		var field=form.get(fldconf.fieldname);
		var grid=w2ui["divgrid_"+fldconf.tabid];
		var column=grid.getColumn(fldconf.fieldname);
		var key=fldconf.foreigntableid+"-"+value;
		var domain=NUT.ctx.domain[key];
		if(domain){
			field.options.items=domain.options;
			form.refresh();
			if(column.editable){
				column.editable.items=domain.options;
				column.editable.lookup=domain.lookup;
				grid.refresh();
			}
		}else NUTNUT.ds.select({url:fldconf.foreigntable,select:[fldconf.columnkey,fldconf.columndisplay],where:[fldconf.wherefieldname,"=",value]},function(res){
			domain={options:[],lookup:{}};
			for(var i=0;i<res.length;i++){
				var item={id:res[i][fldconf.columnkey],text:res[i][fldconf.columndisplay]};
				domain.options.push(item);
				domain.lookup[item.id]=item.text;
			}
			NUT.ctx.domain[fldconf.foreigntableid+"-"+value]=domain;
			field.options.items=domain.options;
			form.refresh();
			if(column.editable){
				column.editable.items=domain.options;
				column.editable.lookup=domain.lookup;
				grid.refresh();
			}
		});
	}
}