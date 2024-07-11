import { w2ui, w2grid, w2toolbar, w2form, w2tabs, w2alert, w2popup, w2menu } from "../lib/w2ui.es6.min.js";
export class NWin {
	constructor(id) {
		this.id = id;
	}
	buildWindow(div,conf,tabLevel,callback){
		var divTabs=document.createElement("div");
		divTabs.id="tabs_"+conf.tabid+"_"+tabLevel;
		div.appendChild(divTabs);
		var tabs=[];
		for(var i=0;i<conf.tabs.length;i++){
			var tabconf=conf.tabs[i];
			//isMobile screen
			if(NUT.isMobile)tabconf.layoutcols=1;
			else if(!tabconf.layoutcols)tabconf.layoutcols=NUT.LAYOUT_COLS;
			
			if(tabconf.tablevel==tabLevel){
				var divTab=document.createElement("div");
				divTab.id="tab_"+tabconf.tabid;
				divTab.style.height=(tabconf.maxLevel?"50%":"100%");
				div.appendChild(divTab);
				var tab = { id: tabconf.tabid, text: NUT.translate(tabconf.translate)||tabconf.tabname,tag:tabconf,callback:callback};
				this.buildContent(divTab,tab);
				if(tabconf.tabs.length)for(var l=tabLevel+1;l<=tabconf.maxLevel;l++)
					this.buildWindow(divTab,tabconf,l,callback);
				if(tabs.length)divTab.style.display="none";
				tabs.push(tab);
			}
		}

		(w2ui[divTabs.id]||new w2tabs({
			name: divTabs.id,
			active: tabs[0].id,
			tabs: tabs,
			onClick: this.tab_onClick
		})).render(divTabs);
	}
	cacheDomainAndOpenWindow(div, conf, needCaches, index) {
		var fldconf = needCaches[index];
		if (fldconf) NUT.ds.select({ url: conf.url+fldconf.foreigntable, select: [fldconf.columnkey, fldconf.columndisplay], where: JSON.parse(fldconf.whereclause) }, function (res) {
			if (res.success) {
				var domain = { items: [], lookup: {} };
				for (var i = 0; i < res.length; i++) {
					var item = { id: res[i][fldconf.columnkey], text: res[i][fldconf.columndisplay] };
					domain.items.push(item);
					domain.lookup[item.id] = item.text;
				}
				NUT.domains[fldconf.foreigntable_url] = domain;
				if (++index < needCaches.length) cacheDomainAndOpenWindow(conf, needCaches, index);
				else buildWindow(div, conf, 0);
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		else buildWindow(div, conf, 0);
	}
	tab_onClick(evt){
		var id=evt.detail.tab.id;
		for(var i=0;i<this.tabs.length;i++){
			var tab=this.tabs[i];
			var divTab=document.getElementById("tab_"+tab.id);
			divTab.style.display=(tab.id==id)?"":"none";
			if(tab.id==id)NWin.updateChildGrids(tab.tag);
		}
		//w2ui["grid_"+id].resize();
		//w2ui["form_"+id].resize();
	}
	buildContent(div,tab){
		var conf=tab.tag;
		conf.default={};
		var group=null,colGroup=null;
		var fields=[],columns=[],searches=[], index=0;
		for(var i=0;i<conf.fields.length;i++){
			var fldconf = conf.fields[i];
			var alias = NUT.translate(fldconf.translate) || fldconf.fieldname;
			if(!fldconf.isprimarykey){
				if(fldconf.columnname=="siteid")conf.default.siteid=n$.user.siteid;
				if (fldconf.columnname =="appid")conf.default.appid=n$.app.appid;
			}		
			var domain=null;
			if(fldconf.fieldtype=="select"){
				var key=fldconf.domainid||fldconf.foreigntable_url;
				domain=NUT.domains[key];
			}
			if(fldconf.isdisplaygrid){
				var column = { field: fldconf.columnname, text: alias,size:"100px", sortable:true,frozen:fldconf.isfrozen,options:{conf:fldconf}};
				if(fldconf.fieldtype=="int"||fldconf.fieldtype=="number"||fldconf.fieldtype=="currency"||fldconf.fieldtype=="date"||fldconf.fieldtype=="datetime"||fldconf.fieldtype=="percent")column.render=fldconf.fieldtype;
				if(fldconf.foreigNWindowid){
					column.render=function(record,index,column_index){					
						var conf=this.columns[column_index].options.conf;
						return "<a class='nut-link' onclick=`linkfield_onClick(" + conf.foreigNWindowid + ",'" + record[conf.columnname] + "','" + conf.whereclause + "')`>" + record[conf.columnname]+"</a>";
					}
				}
				if(!fldconf.isreadonly){
					column.editable = { type: fldconf.fieldtype };
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
				columns.push(column);
			}

			if(fldconf.isdisplay){
				var field = { field: fldconf.columnname, type: fldconf.fieldtype, required: fldconf.isrequire, disabled: fldconf.isreadonly, html: { label: fldconf.foreigNWindowid ? "<a class='nut-link' onclick=`linkfield_onClick(" + fldconf.foreigNWindowid + "," + fldconf.columnname +".value,'"+fldconf.whereclause+"')`>"+alias+"</a>":alias,column:index++%conf.layoutcols,attr:"tabindex=0"},options:{conf:fldconf}};
				if(domain){field.options.items=domain.items;field.options.showNone=true};
				if(fldconf.placeholder)field.html.attr+=" placeholder='"+fldconf.placeholder+"'";
				if(fldconf.displaylength)field.html.attr+=" style='width:"+fldconf.displaylength+"px'";
				if(fldconf.fieldlength)field.html.attr+=" maxlength='"+fldconf.fieldlength+"'";
				if(fldconf.vformat)field.html.attr+=" pattern='"+fldconf.vformat+"'";
				if(fldconf.colspan)field.html.column=fldconf.colspan;
				if(fldconf.rowspan)field.html.column=fldconf.rowspan>0?"after":"before";
				if(fldconf.fieldgroup){
					if(fldconf.fieldgroup!=group){
						field.html.group=fldconf.fieldgroup;
						colGroup=field.html.column;
						group=fldconf.fieldgroup;
					}else{
						field.html.column=colGroup;
					}
				}
				if (fldconf.defaultvalue) conf.default[fldconf.columnname]=fldconf.defaultvalue.startsWith("NUT.")?eval(fldconf.defaultvalue):fldconf.defaultvalue;
				if(fldconf.issearch)searches.push(field);
				
				fields.push(field);
			}
		}
		var divTool=document.createElement("div");
		divTool.id="tool_"+conf.tabid;
		div.appendChild(divTool);
		var divContent=document.createElement("div");
		divContent.id="cont_"+conf.tabid;
		divContent.className="nut-full";
		div.appendChild(divContent);
		var divForm=conf.layout||document.createElement("div");
		divForm.id="form_"+conf.tabid;
		divForm.className = "nut-full";
		divContent.appendChild(divForm);
		var divGrid=document.createElement("div");
		divGrid.id="grid_"+conf.tabid;
		divGrid.className = "nut-full";
		divContent.appendChild(divGrid);

		var isArchive=!conf.isnotarchive&&conf.archive;
		var items = [{ type: 'button', id: "SWIT", text: '⧉', tooltip: "_Form/Grid" },
			{ type: 'button', id: "RELOAD", text: '↻', tooltip: "_Reload" },
			{type:'break'},
			{type:'button',id:"FIND",text:'🔎',hidden:searches.length==0,tooltip:"_Find"},
			{type:'button',id:"NEW",text:'📄',hidden:conf.isnotinsert,tooltip:"_Add New"},
			{type:(isArchive?"menu":"button"),id:(isArchive?"save":"SAVE"),text:'💾',hidden:conf.isnotupdate,tooltip:"_Save Edit",items:[{id:"SAVE",text:"_Save"},{id:"SAVE_A",text:"_Archive & Save"}]},
			{type:(isArchive?"menu":"button"),id:(isArchive?"del":"DEL"),text:'❌',hidden:conf.isnotdelete,tooltip:"_Delete",items:[{id:"DEL",text:"_Delete"},{id:"DEL_A",text:"_Archive & Delete"}]},
			{type:'break'}];

		if(!conf.isnotlock&&conf.lock)items.push({type:'button',id:"LOCK",text:'🔒',tooltip:"_Lock/Unlock"});
		if(isArchive)items.push({type:'button',id:"ARCH",text:'🕰️',tooltip:"_Archive"});
		//if(conf.columnparent)items.push({type:'button',id:"TREE",text:'🎛️',tooltip:"Tree view"});
		if(conf.filterfield){
			var filterfields=JSON.parse(conf.filterfield);
			if(conf.filterdefaultvalue){//where filter
				var filterdefaults=JSON.parse(conf.filterdefaultvalue);
				for(var i=0;i<filterfields.length;i++){
					items.push({type:'radio',id:"FLT_"+i,text:filterdefaults[i],group:0,tag:filterfields[i]});
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
					var key = field.columnname;
					if(lookupfilter[key]){
						var values=[{id:"FILTER",text:"-All-",tag:[key,"ALL"]}];
						if(field.domainid){
							var dmItems=NUT.domains[field.domainid].items;
							for(var j=0;j<dmItems.length;j++)
								values.push({id:"FILTER",text:dmItems[j].text,tag:[key,dmItems[j].id]});
							items.push({type:'menu',id:"flt_"+key,text:(lookupdefault&&lookupdefault[key])?NUT.domains[field.domainid].lookup[lookupdefault[key]]:field.alias,items: values});
							items.push({type:'break'});
						}
					}
				}
			}
		}
		items.push({type:'spacer',id:"SPACE"});
		var lookup={};
		for(var i=0;i<conf.menus.length;i++){
			var menu=conf.menus[i];
			var isSummary=(menu.issummary);
			var item={type:(isSummary?'menu':'button'),id:menu.execname||menu.menuid,text:menu.menuname,tooltip:menu.description,tag:menu};
			if(isSummary)item.items=[];
			if(menu.parentid){
				lookup[menu.parentid].items.push(item);
			}else{
				items.push(item);
			}
			lookup[menu.menuid]=item;
		}

		var items2=[{type:'button',id:"XLS_IM",text:'📥',tooltip:"_Import .xls"},
					{type:'button',id:"XLS_EX",text:'📤',tooltip:"_Export .xls"},
					{type:'break'},
			{ type: 'button', id: "PREV", text:'🡄',tooltip:"_Previous",tag:-1},
			{ type: 'button', id: "NEXT", text:'🡆',tooltip:"_Next",tag:+1},
			{ type: 'html', id: "STUT", html: "<div style='padding:6px'><span id='rec_" + conf.tabid +"'></span>/<span id='total_"+conf.tabid+"'></span></div>"},
					{ type: 'break' },
			{ type: 'check', id: "EXPD", text: "»", tooltip: "_Expand/Collapse" },
			{ type: 'check', id: "CONF", text: "⋮", tooltip: "_Config Columns" }];
		//toolbar
		(w2ui[divTool.id]||new w2toolbar({
			name: divTool.id,
			items: items.concat(items2),
			onClick:this.tool_onClick,
			tab:tab
		})).render(divTool);
		//form
		(w2ui[divForm.id]||new w2form({
			name: divForm.id,
			autosize: false,
			fields: fields,
			recid: conf.columnkey,
			onChange: this.field_onChange,
			tab: tab
		})).render(divForm);
		divForm.style.display = "none";
		//grid
		var grid = (w2ui[divGrid.id] || new w2grid({
			name: divGrid.id,
			dataType: "RESTFULL",
			httpHeaders: {Authorization:"Bearer "+n$.user.token},
			limit: NUT.GRID_LIMIT,
			reorderColumns: true,
			recid: conf.columnkey,
			multiSelect: true,
			columns: columns,
			searches: searches,
			onSelect: this.grid_onSelect,
			onLoad: this.grid_onLoad,
			onRequest: this.grid_onRequest,
			onError: this.grid_onError,
			onChange: this.field_onChange,
			onDblClick: this.grid_onDblClick,
			tab: tab
		}));
		grid.render(divGrid);
		grid.url = conf.url + (conf.viewname || conf.tablename);
		if (!conf.parenttabid) grid.reload();
	}
	tool_onClick(evt){
		var item=evt.detail.subItem||evt.detail.item;
		var tab=this.tab;
		var conf=tab.tag;
		var grid=w2ui["grid_"+tab.id];
		var form=w2ui["form_"+tab.id];
		var timeArchive=null;
		switch (item.id) {
			case "CONF":
				grid.initColumnOnOff();
				break;
			case "EXPD":
				document.getElementById("cont_" + tab.id).style.height = item.checked ? "45vh" : "80vh";
				if (tab.isForm) form.resize(); else grid.resize();
				break;
			case "SWIT":
				NWin.switchFormGrid(tab);
				break;
			case "RELOAD":
				grid.reload();
				break;
			case "PREV":
			case "NEXT":
				var index=grid.getSelection(true)[0]+item.tag;
				if(grid.records[index])
					grid.select(grid.records[index][grid.recid]);
				break;
			case "FIND":
				//grid.searchOpen(evt.originalEvent.target);
				var id="find_"+tab.id;
				w2popup.open({
					title:"_Find",
					modal:true,
					width: 920,
					body: '<div id="'+id+'" class="nut-full"></div>',
					onClose(evt){n$.idFormPopup=null},
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
										grid.reload();
									}
								}
							})).render(div);
							n$.idFormPopup=id;
						}
					}
				});
				break;
			//case "Com_NEW":
			case "NEW":
				//var newfields=[];
				//for(var i=0;i<form.fields.length;i++)if(!form.fields[i].options.conf.isprimarykey)newfields.push(form.fields[i]);
				if(conf.parenttabid&&!conf.bangtrunggian)conf.default[conf.truonglienketcon]=grid.parentRecord[conf.truonglienketcha];
				var id="new_"+tab.id;
				w2popup.open({
					title:"_New",
					modal:true,
					width: 920,
					height: 610,
					body: '<div id="'+id+'" class="nut-full"></div>',
					onClose(evt){n$.idFormPopup=null},
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
										var data={};//remove null value
										for(var key in this.record)if(this.record.hasOwnProperty(key)&&this.record[key]!==null)
											data[key]=this.record[key];
										if(conf.beforechange){
											if(conf.onchange)NUT.runComponent(conf.onchange,{action:item.id,data:data,config:conf});
										}else NUT.ds.insert({url:conf.url+conf.tablename,data:data,returnid:true},function(res){
											if(res.success){
												NUT.notify("ℹ️ Record inserted.","lime");
												var newid=res.result[0];
												data[conf.columnkey]=newid;
												grid.add(data,true);
												//grid.select(newid);
												if(recTrungGian){
													recTrungGian[conf.midchildfiled]=data[conf.linkchildfield];
													NUT.ds.insert({url:conf.url+conf.midtable,data:recTrungGian},function(res2){
														if (res2.success)
															NUT.notify("ℹ️ Record inserted.","lime");
														else
															NUT.notify("⛔ ERROR: " + res2.result, "red");
													});
												}
												if(conf.onchange)NUT.runComponent(conf.onchange,{action:item.id,data:data,config:conf});
											} else NUT.notify("⛔ ERROR: " + res.result, "red");
										});
									}
								}
							})).render(div);
							n$.idFormPopup=id;
						}
					}
				});
				break;
			case "SAVE_A":
				timeArchive=w2prompt({label:"Archive time",value:new Date()});
				if(!timeArchive)break;
			case "SAVE":
				if(conf.lock&&(tab.isForm?form.record[conf.lock]:grid.get(grid.getSelection()[0])[conf.lock]))
					NUT.alert("⚠️ Can not update locked record","yellow");
				else {
					if(tab.isForm&form.validate(true).length)return;
					
					var changes=tab.isForm?[form.getChanges()]:grid.getChanges();
					var tagNode="#tb_divtool_"+tab.id+"_item_SPACE";
					var hasChanged=false;
					var columnkey=conf.columnkey;
					for(var i=0;i<changes.length;i++){
						var change=changes[i];
						if(!NUT.isObjectEmpty(change)){
							var data={};//remove "" value
							for(var key in change)if(change.hasOwnProperty(key)&&key!=columnkey)
								data[key]=(change[key]==""?null:change[key]);
							var recid=(tab.isForm?form.record[columnkey]:change[columnkey]);
							if(conf.beforechange){
								if(conf.onchange)NUT.runComponent(conf.onchange,{action:item.id,recid:recid,data:data,config:conf});
							}else{
								var p = {url:conf.url+conf.tablename,where:[columnkey,"=",recid],data:data};
								NUT.ds.update(p, function (res) {
									if (res.success) {
										if (timeArchive) archiveRecord(conf.url, item.id, data, recid, conf.tableid, timeArchive);
										if (tab.isForm) grid.set(recid, data);
										NUT.notify("ℹ️ Record updated.","lime");

										if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, data: data, config: conf });
									} else NUT.notify("⛔ ERROR: " + res.result, "red");
								});
							}
							hasChanged=true;
						}
					}
					if (hasChanged) tab.isForm ? form.mergeChanges() : grid.mergeChanges();
					else NUT.notify("⚠️ No change!","yellow");
				}
				break;
			case "DEL_A":
				timeArchive=w2prompt({label:"Archive time",value:new Date()});
				if(!timeArchive)break;
			case "DEL":
				 NUT.confirm('<span style="color:red">DELETE selected record?</span>',function(awnser){
					 if (awnser == "yes") {
						 var recid = tab.isForm ? form.record[conf.columnkey] : grid.getSelection()[0];
						 if (conf.beforechange) {
							 if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, config: conf });
						 } else {
							 if (recid) NUT.ds.delete({ url: conf.url + conf.tablename, where: [conf.columnkey, "=", recid] }, function (res) {
								 if (res.success) {
									 if (timeArchive) archiveRecord(conf.url, item.id, tab.isForm ? form.record : grid.get(recid), recid, conf.tableid, timeArchive);
									 grid.remove(recid);
									 NUT.notify("ℹ️ 1 record deleted.", "lime");

									 if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, config: conf });
								 } else NUT.notify("⛔ ERROR: " + res.result, "red");
							 }); else NUT.notify("⚠️ No selection!", "yellow");
						 }
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
				grid.reload();
				break;
			case "XLS_IM":
				var fieldnames=[];
				for(var i=0;i<conf.fields.length;i++)
					fieldnames.push(conf.fields[i].fieldname);
				var header=fieldnames.join('\t')+"\n";
				var id="txtimpxls_"+tab.id;
				n$.tabconf=conf;
				w2popup.open({
					title:"📥 <i>Import excel</i> - "+conf.tabname,
					modal:true,
					width: 1000,
					height: 700,
					body: '<textarea cols='+(header.length+8*fieldnames.length)+' id="'+id+'" style="height:100%">'+header+'</textarea>',
					buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="xlsInsert_onClick(n$.tabconf,'+id+'.value)">➕ Insert data</button><button class="w2ui-btn" onclick="xlsUpdate_onClick(n$.tabconf,'+id+'.value)">✔️ Update data</button>'
				});
				break;
			case "XLS_EX":
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
				grid.reload();
				break;
			case "LOCK":
				var record=tab.isForm?form.record:grid.record;
				var label=record[conf.lock]?"🔓 Unlock":"🔒 Lock";
				w2confirm(label+' selected record?').yes(function(){
					var data={};
					data[conf.lock]=record[conf.lock]?false:true;
					NUT.ds.update({url:conf.url+conf.tablename,data:data,where:[conf.columnkey,"=",record[conf.columnkey]]},function(res){
						if (res.success) {
							record[conf.lock] = data[conf.lock];
							tab.isForm ? form.refresh() : grid.refresh();
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
					});
				});
				break;
			case "ARCH":
				var recid=grid.tab.isForm?form.record[conf.columnkey]:grid.getSelection();
				NUT.ds.select({url:conf.url+"n_archive",where:[["tableid","=",conf.tableid],["recordid","=",recid]]},function(res){
					if (res.success) {
						var id = "arch_" + tab.id;
						w2popup.open({
							title: "🕰️ <i>Archive</i> - " + conf.tabname,
							modal: true,
							width: 920,
							height: 700,
							body: '<div id="' + id + '" class="nut-full"></div>',
							onOpen(evt) {
								evt.onComplete = function () {
									var div = document.getElementById(id);
									(w2ui[id] || new w2grid({
										name: id,
										columns: [
											{ field: 'archiveid', text: 'ID', sortable: true },
											{ field: 'archivetype', text: 'Type', sortable: true },
											{ field: 'archivetime', text: 'Time', sortable: true },
											{ field: 'tableid', text: 'Table ID', sortable: true },
											{ field: 'recordid', text: 'Record ID', sortable: true },
											{
												field: 'archive', text: 'Archive', sortable: true, info: {
													render: function (rec, idx, col) {
														var obj = JSON.parse(rec.archive);
														var str = "<table border='1px'><caption><b style='color:yellow'>" + (rec.archivetype == "DEL_A" ? "Deleted" : "Changed") + "!</b></caption>"
														for (var key in obj) if (obj.hasOwnProperty(key))
															str += "<tr><td align='right'><i>" + key + "</i></td><td>" + obj[key] + "</td></tr>";
														return str + "</table>";
													}
												}
											},
											{ field: 'siteid', text: 'Client ID', sortable: true }
										],
										records: res,
										recid: "archiveid"
									})).render(div);
								}
							}
						});
					} else NUT.notify("⛔ ERROR: " + res.result, "red");
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
						grid.reload();
					}else{//component
						NUT.runComponent(item.id,{
							records:grid.get(grid.getSelection()),
							parent:grid.parentRecord,
							config:conf,
							gsmap:null
						});
					}
				}
		}
	}
	field_onChange(evt) {
		return;
		var conf=(evt.detail.column===undefined)?this.get(evt.target).options.conf:this.columns[evt.detail.column].options.conf;
		if(conf.fieldtype=="search"||conf.fieldtype=="image"){
			this.get(evt.target).el.onchange(evt.value_new);
		//if(evt.value_new===true)evt.value_new="Y";
		//if(evt.value_new===false)evt.value_new="";
		//this.record[conf.fieldname]=evt.value_new;
		} else if(!NUT.isObjectEmpty(this.record)){
			this.record[conf.columnname]=evt.value_new;
			updateChildFields(conf,this.record,this.parentRecord);
			
			if(conf.fieldtype=="select"&&conf.columndohoa){//bind with map
				var lyrconf=GSMap.getLayerConfig(this.tab.tag.geotableid);
				GSMap.applyFilter(lyrconf.maporder,lyrconf.seqno,[conf.columndohoa,"=",evt.value_new]);

				var where=[conf.columnkey,"=",evt.value_new];
				var ext=n$.extent[where.toString()];
				if(ext)
					GSMap.zoomToExtent(ext);
				else NUT.ds.select({url:conf.url+conf.foreigntable,select:"minx,miny,maxx,maxy",where:where},function(res){
					if (res.success) {
						var ext = [res[0].minx, res[0].miny, res[0].maxx, res[0].maxy];
						if (res.length) GSMap.zoomToExtent(ext);
						n$.extent[where.toString()] = ext;
					} else NUT.notify("⛔ ERROR: " + res.result, "red");
				});
			}
		}
	}
	grid_onError(evt) {
		NUT.notify(evt.detail.response.message, "red");
	}
	grid_onRequest(evt) {
		var tabconf = this.tab.tag;
		var postData = evt.detail.postData;
		var reqData={
			limit: postData.limit,
			offset: postData.offset,
			orderby: (postData.sort ? postData.sort[0].field + " " + postData.sort[0].direction : (tabconf.orderbyclause || tabconf.columnkey + " desc"))
		}
		
		//if(evt.url.includes("/sys")||evt.url.includes("/nv_"))data.where="siteid="+n$.user.siteid;

		// still bug
		if (tabconf.whereclause)
			reqData.where = NUT.ds.decodeSql({ where: [JSON.parse(tabconf.whereclause)] }, true);
		if (tabconf.tempWhere)
			reqData.where = NUT.ds.decodeSql({ where: [tabconf.tempWhere] }, true);
		if (postData.search) {
			var where = [];
			for (var i = 0; i < postData.search.length; i++) {
				var search = postData.search[i];
				where.push(search.operator == "begins" ? [search.field, "like", search.value + "*"] : [search.field, search.operator, search.value]);
			}

			reqData.where = NUT.ds.decodeSql({ where: where }, true);
		}
		if (postData.select) {
			reqData.where = NUT.ds.decodeSql({ where: postData.select }, true);
		}
		evt.detail.postData = reqData;
	}
	grid_onLoad(evt) {
		var tab = this.tab;
		var records = evt.detail.data.result;
		var total = evt.detail.data.total;
		evt.detail.data.status = evt.detail.data.success ? "success" : "error";
		evt.detail.data.records = records;
		evt.onComplete = function () {			
			if (total) {
				this.noZoomTo = true;
				this.select(records[0][this.recid]);
			}
			NWin.switchFormGrid(tab,total==1);
			document.getElementById("rec_" + tab.id).innerHTML = total?1:0;
			document.getElementById("total_" + tab.id).innerHTML = total;
		}
	}
	grid_onSelect(evt) {
		var recid = (evt.detail.clicked ? evt.detail.clicked.recid : evt.detail.recid);

		var conf = this.tab.tag;
		this.record = this.get(recid);
		var lab = document.getElementById("rec_" + conf.tabid);
		lab.innerHTML = this.get(recid, true) + 1;
		lab.tag = conf.columnkey + "=" + recid;

		if (this.tab.tag.geotableid) {
			if (this.noZoomTo)
				this.noZoomTo = false;
			else {
				var where = "";
				for (var i = 0; i < this.tab.tag.fields.length; i++) {
					var field = this.tab.tag.fields[i];
					if (field.columndohoa && this.record[field.columndohoa]) {
						var clause = field.columndohoa + "=" + this.record[field.columndohoa];
						where += where ? " and " + clause : clause;
					}
				}
				var lyrconf = GSMap.getLayerConfig(this.tab.tag.geotableid);
				if (where) GSMap.zoomToFeature(lyrconf.maporder, lyrconf.layername, where);
			}
		}
		if (this.record) {
			NWin.updateFormRecord(conf, this.record, this.parentRecord);
			for (var i = 0; i < conf.children.length; i++)
				NWin.updateChildGrids(conf.children[i], this.record);
		}
	}
	static updateFormRecord(conf,record,parentRecord){
		var form=w2ui["form_"+conf.tabid];
		
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
	static updateChildGrids(conf, record) {
		var divTab = document.getElementById("tab_" + conf.tabid);
		if (divTab) {
			var grid = w2ui["grid_" + conf.tabid];
			if (record) {
				divTab.needUpdate = true;
				grid.parentRecord = record;
			}
			if (divTab.needUpdate && divTab.style.display.length == 0) {
				var search = grid.getSearchData(conf.linkchildfield);
				if (conf.midtable) {//lien ket n-n
					NUT.ds.select({ url: conf.url+conf.midtable, select: conf.midchildfield, where: [conf.midparentfield, "=", grid.parentRecord[conf.linkparentfield]] }, function (res) {
						if (res.success) {
							var ids = [];
							for (var i = 0; i < res.result.length; i++) {
								ids.push(res.result[i][conf.midchildfield]);
							}
							grid.originSearch = { field: conf.linkchildfield, operator: "in", value: ids };
							if (search) search.value = ids;
							else grid.searchData.push(grid.originSearch);
							grid.reload();
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
					});
				} else {
					grid.originSearch = { field: conf.linkchildfield, operator: "=", value: grid.parentRecord[conf.linkparentfield] };
					if (search) search.value = grid.parentRecord[conf.linkparentfield];
					else grid.searchData.push(grid.originSearch);
					grid.reload();
				}
				divTab.needUpdate = false;
			}
		}
	}
	updateChildFields(conf,record,parentRecord){
		if(conf.children.length){	
			for(var i=0;i<conf.children.length;i++){
				fldconf=conf.children[i];
				var form=w2ui[n$.idFormPopup||"form_"+fldconf.tabid];
				if(fldconf.fieldtype=="select")
					this.loadChildSelect(fldconf, record[conf.columnname]);
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
					form.record[fldconf.columnname]=value;
					form.refresh(fldconf.columnname);
					//w2ui["grid_"+fldconf.tabid].grid.refresh();
					this.updateChildFields(fldconf,form.record,form.parentRecord);
				}
				if(fldconf.displaylogic){
					var value=eval(fldconf.displaylogic);
					//if(panel.fields){//is form
					var el = form.get(fldconf.columnname).el;
						el.style.display=value?"":"none";
						el.parentNode.previousElementSibling.style.display=el.style.display;
					//}else value?panel.showColumn(fldconf.columnname):panel.hideColumn(fldconf.columnname);
				}
			}
		}
	}
	calculateChilds(info){
		var records=w2ui["grid_"+info.tab].records;
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
	
	grid_onDblClick (evt){
		if(!this.columns[evt.detail.column].editable)NWin.switchFormGrid(this.tab);
	}
	static switchFormGrid(tab, showForm) {
		tab.isForm = (showForm === undefined?!tab.isForm:showForm);
		var form=w2ui["form_"+tab.id];
		var grid=w2ui["grid_"+tab.id];
		form.box.style.display = tab.isForm ?"":"none";
		grid.box.style.display = tab.isForm ?"none":"";
		tab.isForm?form.resize():grid.resize();
	}
	xlsInsert_onClick(conf,csv){
		if(csv.includes(","))
			w2alert('Data contains invalid , character!');
		else NUT.ds.insertCsv({ url: conf.url+conf.tablename, data: csv.replaceAll('\t', ',') }, function (res) {
			if (res.success)
				NUT.notify("ℹ️ Data imported.","lime");
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
	xlsUpdate_onClick(conf,csv){
		if(csv.includes(",")){
			w2alert('Data contains invalid , character!');
			return;
		}
		var lines=csv.split('\n');
		if(lines.length<2){
			NUT.notify("⚠️ Empty data!","yellow");
		}else{
			var domain={},prikey=null,privalue=null;
			for(var i=0;i<conf.fields.length;i++){
				var fld=conf.fields[i];
				if (fld.domainid) domain[fld.columnname]=NUT.domains[fld.domainid].lookdown;
				if (fld.isprimarykey) prikey = fld.columnname;
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
				NUT.ds.update({url:conf.url+conf.tablename,where:[prikey,"=",privalue],data:json},function(res){
					if(res.success)
						NUT.notify("ℹ️ Record updated.","lime");
					else
						NUT.notify("⛔ ERROR: " + res.result, "red");
				});
			}

		}
	}
	archiveRecord(url,type,archive,recid,tableid,time){
		var data={
			archivetype:type,
			archivetime:time||new Date(),
			archive:JSON.stringify(archive),
			recordid:recid,
			tableid:tableid,
			siteid:n$.user.siteid
		};
		NUT.ds.insert({url:url+"n_archive",data:data},function(res){
			if (res.sucess)
				NUT.notify("ℹ️ Record archived.","lime");
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
	loadChildSelect(fldconf,value){
		var form=w2ui[n$.idFormPopup||"form_"+fldconf.tabid];
		var field = form.get(fldconf.columnname);
		var grid=w2ui["grid_"+fldconf.tabid];
		var column = grid.getColumn(fldconf.columnname);
		var key=fldconf.foreigntableid+"-"+value;
		var domain=NUT.domains[key];
		if(domain){
			field.options.items=domain.options;
			form.refresh();
			if(column.editable){
				column.editable.items=domain.options;
				column.editable.lookup=domain.lookup;
				grid.refresh();
			}
		}else NUT.ds.select({url:conf.url+fldconf.foreigntable,select:[fldconf.columnkey,fldconf.columndisplay],where:[fldconf.whereclause,"=",value]},function(res){
			if (res.success) {
				domain = { options: [], lookup: {} };
				for (var i = 0; i < res.length; i++) {
					var item = { id: res[i][fldconf.columnkey], text: res[i][fldconf.columndisplay] };
					domain.options.push(item);
					domain.lookup[item.id] = item.text;
				}
				NUT.domains[fldconf.foreigntableid + "-" + value] = domain;
				field.options.items = domain.options;
				form.refresh();
				if (column.editable) {
					column.editable.items = domain.options;
					column.editable.lookup = domain.lookup;
					grid.refresh();
				}
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}