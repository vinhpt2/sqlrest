import { w2ui, w2grid, w2toolbar, w2form, w2tabs, w2alert, w2popup } from "../lib/w2ui.es6.min.js";
export class NWin {
	constructor(id) {
		this.id = id;
	}
	buildWindow(div, conf, tabLevel, callback) {
		var divTabs = div.z(["div", { id: "tabs_" + conf.tabid + "_" + tabLevel }]);
		var tabs = [];
		for (var i = 0; i < conf.tabs.length; i++) {
			var tabconf = conf.tabs[i];
			//isMobile screen
			if (NUT.isMobile) tabconf.layoutcols = 1;
			else if (!tabconf.layoutcols) tabconf.layoutcols = NUT.LAYOUT_COLS;
			if (tabconf.tablevel == tabLevel) {
				var divTab = div.z(["div", { id: "tab_" + tabconf.tabid, style: "height:" + (tabconf.maxLevel ? "50%" : "100%")}]);
				var tab = { id: tabconf.tabid, text: NUT.translate(tabconf.translate) || tabconf.tabname, tag: tabconf, callback: callback };
				this.buildContent(divTab, tab);
				if (tabconf.tabs.length) for (var l = tabLevel + 1; l <= tabconf.maxLevel; l++)
					this.buildWindow(divTab, tabconf, l, callback);
				if (tabs.length) divTab.style.display = "none";
				tabs.push(tab);
			}
		}

		(w2ui[divTabs.id] || new w2tabs({
			name: divTabs.id,
			active: tabs[0].id,
			tabs: tabs,
			onClick: this.tab_onClick
		})).render(divTabs);
	}
	
	cacheDomainAndOpenWindow(div, conf, needCaches, index) {
		var fldconf = needCaches[index];
		var self = this;
		var columnkey = fldconf.bindfieldname || fldconf.linktable.columnkey;
		var columndisplay = fldconf.linktable.columndisplay || columnkey;
		if (fldconf) NUT.ds.select({ url: fldconf.linktable.urlview, select: [columnkey, columndisplay], where: (fldconf.whereclause ? JSON.parse(fldconf.whereclause):null) }, function (res) {
			if (res.success) {
				var domain = { items: [], lookup: {}, lookdown: {} };
				for (var i = 0; i < res.result.length; i++) {
					var data = res.result[i];
					var item = { id: data[columnkey], text: data[columndisplay] };
					domain.items.push(item);
					domain.lookup[item.id] = item.text;
					domain.lookdown[item.text] = item.id;
				}
				NUT.domains[fldconf.linktable.tablename+fldconf.whereclause] = domain;
				if (++index < needCaches.length) self.cacheDomainAndOpenWindow(div, conf, needCaches, index);
				else self.buildWindow(div, conf, 0);
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		else self.buildWindow(div, conf, 0);
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

	buildContent(div, tab) {
		var conf = tab.tag;
		conf.default = {};
		var group = null, colGroup = null;
		var fields = [], columns = [], searches = [], index = 0;
		for (var i = 0; i < conf.fields.length; i++) {
			var fldconf = conf.fields[i];
			var alias = NUT.translate(fldconf.translate) || fldconf.fieldname;
			if (n$.app.appid && fldconf.columntype != "key") {
				if (fldconf.columnname == "siteid") conf.default.siteid = n$.user.siteid;
				if (fldconf.columnname == "appid") conf.default.appid = n$.app.appid;
				if (fldconf.columnname == "windowid") conf.default.windowid = n$.windowid;
			}
			var domain = null;
			if (fldconf.fieldtype == "select") {
				var key = fldconf.linktable ? fldconf.linktable.tablename : fldconf.domainid;
				domain = NUT.domains[key+fldconf.whereclause];
			}
			if (fldconf.isdisplaygrid) {
				var column = { field: fldconf.columnname, text: alias, size: "100px", sortable: true, frozen: fldconf.isfrozen, resizable: true, searchable: fldconf.issearch, options: { conf: fldconf } };
				if(fldconf.fieldtype=="int"||fldconf.fieldtype=="number"||fldconf.fieldtype=="currency"||fldconf.fieldtype=="date"||fldconf.fieldtype=="datetime"||fldconf.fieldtype=="percent")column.render=fldconf.fieldtype;
				if (domain) {
					column.domain = domain;
					column.render = function (record, obj) {
						var col = this.columns[obj.colIndex];
						return col.domain.lookup[obj.value];
					}
				}
				if (!fldconf.isreadonly) {
					column.editable = { type: fldconf.fieldtype };
					if (domain)	column.editable.items = domain.items;
				}
				columns.push(column);
			}

			if (fldconf.isdisplayform) {
				var field = { field: fldconf.columnname, type: fldconf.fieldtype, required: fldconf.isrequire, disabled: fldconf.isreadonly, html: { label: fldconf.linkwindowid ? "<a class='nut-link' onclick=`linkfield_onClick(" + fldconf.linkwindowid + "," + fldconf.columnname + ".value,'" + fldconf.whereclause + "')`>" + alias + "</a>" : alias, column: index++ % conf.layoutcols, attr: "tabindex=0" }, options: { conf: fldconf } };
				if (domain && !fldconf.parentfieldid)
					field.options.items = domain.items;

				if (fldconf.placeholder) field.html.attr += " placeholder='" + fldconf.placeholder + "'";
				if (fldconf.displaylength) field.html.attr += " style='width:" + fldconf.displaylength + "px'";
				if (fldconf.fieldlength) field.html.attr += " maxlength='" + fldconf.fieldlength + "'";
				if (fldconf.vformat) field.html.attr += " pattern='" + fldconf.vformat + "'";
				if (fldconf.colspan) field.html.column = fldconf.colspan;
				if (fldconf.rowspan) field.html.column = fldconf.rowspan > 0 ? "after" : "before";
				if (fldconf.fieldgroup) {
					if (fldconf.fieldgroup != group) {
						field.html.group = fldconf.fieldgroup;
						colGroup = field.html.column;
						group = fldconf.fieldgroup;
					} else {
						field.html.column = colGroup;
					}
				}
				if (fldconf.defaultvalue) conf.default[fldconf.columnname] = fldconf.defaultvalue.startsWith("NUT.") ? eval(fldconf.defaultvalue) : fldconf.defaultvalue;
				if (fldconf.issearch) searches.push(field);

				fields.push(field);
			}
		}

		var divTool = div.z(["div", { id: "tool_" + conf.tabid }]);
		var divContent = div.z(["div", { id: "cont_" + conf.tabid, className: "nut-full" }]);
		var divForm = divContent.z(conf.layout || ["div", { id: "form_" + conf.tabid, className: "nut-full" }]);
		var divGrid = divContent.z(["div", { id: "grid_" + conf.tabid, className: "nut-full" }]);

		var isArchive = !conf.isnotarchive && conf.archive;
		var items = [{ type: 'check', id: "SWIT", text: '⧉', tooltip: "_Form/Grid" },
		{ type: 'button', id: "RELOAD", text: '↻', tooltip: "_Reload" },
		{ type: 'break' },
		{ type: 'button', id: "FIND", text: '🔎', hidden: searches.length == 0, tooltip: "_Find" },
		{ type: 'button', id: "NEW", text: '📄', hidden: conf.isnotinsert, tooltip: "_Add New" },
		{ type: (isArchive ? "menu" : "button"), id: (isArchive ? "save" : "SAVE"), text: '💾', hidden: conf.isnotupdate, tooltip: "_Save Edit", items: [{ id: "SAVE", text: "_Save" }, { id: "SAVE_A", text: "_Archive & Save" }] },
		{ type: (isArchive ? "menu" : "button"), id: (isArchive ? "del" : "DEL"), text: '❌', hidden: conf.isnotdelete, tooltip: "_Delete", items: [{ id: "DEL", text: "_Delete" }, { id: "DEL_A", text: "_Archive & Delete" }] },
		{ type: 'break' }];
		if (!conf.isnotupdate && conf.relatetableid) items.push({ type: 'button', id: "LINK", text: '🔗', tooltip: "_Link Data" });
		if (!conf.isnotlock && conf.lock) items.push({ type: 'button', id: "LOCK", text: '🔒', tooltip: "_Lock/Unlock" });
		if (isArchive) items.push({ type: 'button', id: "ARCH", text: '🕰️', tooltip: "_Archive" });
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
		items.push({ type: 'spacer', id: "SPACE" });
		var lookup = {};
		for (var i = 0; i < conf.menus.length; i++) {
			var menu = conf.menus[i];
			var isSummary = (menu.issummary);
			var item = { type: (isSummary ? 'menu' : 'button'), id: menu.execname || menu.menuid, text: menu.menuname, tooltip: menu.description, tag: menu };
			if (isSummary) item.items = [];
			if (menu.parentid) {
				lookup[menu.parentid].items.push(item);
			} else {
				items.push(item);
			}
			lookup[menu.menuid] = item;
		}

		var items2 = [{ type: 'button', id: "XLS_IM", text: '📥', tooltip: "_Import .xls" },
		{ type: 'button', id: "XLS_EX", text: '📤', tooltip: "_Export .xls" },
		{ type: 'break' },
		{ type: 'button', id: "PREV", text: '🡄', tooltip: "_Previous", tag: -1 },
		{ type: 'button', id: "NEXT", text: '🡆', tooltip: "_Next", tag: +1 },
		{ type: 'html', id: "STUT", html: "<div style='padding:6px'><span id='rec_" + conf.tabid + "'></span>/<span id='total_" + conf.tabid + "'></span></div>" },
		{ type: 'break' },
		{ type: 'check', id: "EXPD", text: "»", tooltip: "_Expand/Collapse" }];

		//toolbar
		(w2ui[divTool.id] || new w2toolbar({
			name: divTool.id,
			items: items.concat(items2),
			onClick: this.tool_onClick,
			tab: tab
		})).render(divTool);

		//form
		(w2ui[divForm.id] || new w2form({
			name: divForm.id,
			autosize: false,
			fields: fields,
			recid: conf.table.columnkey,
			onChange: this.field_onChange,
			tab: tab
		})).render(divForm);
		//divForm.style.display = "none";

		var grid = (w2ui[divGrid.id] || new w2grid({
			name: divGrid.id,
			dataType: "RESTFULL",
			httpHeaders: { Authorization: "Bearer " + n$.user.token },
			limit: NUT.GRID_LIMIT,
			reorderColumns: true,
			recid: conf.table.columnkey,
			multiSelect: true,
			markSearch: false,
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
		grid.url = conf.table.urlview;
		if (!conf.parenttabid) grid.reload();
	}
	tool_onClick(evt){
		var item=evt.detail.subItem||evt.detail.item;
		var tab=this.tab;
		var conf = tab.tag;
		var columnkey = conf.table.columnkey;
		var grid=w2ui["grid_"+tab.id];
		var form=w2ui["form_"+tab.id];
		var timeArchive=null;
		switch (item.id) {
			case "EXPD":
				document.getElementById("cont_" + tab.id).style.height = item.checked ? "45vh" : "80vh";
				if (tab.isForm) form.resize(); else grid.resize();
				break;
			case "SWIT":
				NWin.switchFormGrid(tab,!item.checked);
				break;
			case "RELOAD":
				grid.reload();
				break;
			case "PREV":
			case "NEXT":
				var index=grid.getSelection(true)[0]+item.tag;
				if (grid.records[index]) {
					grid.selectNone(true);
					grid.select(grid.records[index][grid.recid]);
				}
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
				if (conf.linktable) conf.default[conf.linkchildfield] = grid.parentRecord[conf.linkparentfield];
				var id="new_"+tab.id;
				w2popup.open({
					title:"_New",
					modal:true,
					width: 900,
					height: 600,
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
										var recRelate=null;
										if(conf.parenttabid){
											var parentKey=grid.parentRecord[conf.linkparentfield];
											if(conf.relatetable){//lien ket n-n
												recRelate ={};
												recRelate[conf.relateparentfield]=parentKey;
											}else{
												this.record[conf.linkchildfield]=parentKey;
											}
										}
										var data = {};//remove null value
										var files = [];
										for (var key in this.record) if (this.record.hasOwnProperty(key) && this.record[key] !== null) {
											var val = this.record[key];
											if (val && val[0] && val[0].file) {//file upload
												var names = [];
												for (var f in val) if (val.hasOwnProperty(f) && val[f]) {
													files.push(val[f].file);
													names.push(val[f].file.name);
												}
												data[key] = JSON.stringify(names);
											} else data[key] = val;
										}
										if(conf.beforechange){
											if(conf.onchange)NUT.runComponent(conf.onchange,{action:item.id,data:data,config:conf});
										}else NUT.ds.insert({url:conf.table.urledit,data:data,returnid:true},function(res){
											if (res.success) {
												var newid = res.result[0];
												if (files.length) NUT.upload(conf.tableid, newid, files);//upload file
												NUT.notify("Record inserted.","lime");
												
												data[columnkey]=newid;
												grid.add(data,true);
												//grid.select(newid);
												if(recRelate){
													recRelate[conf.relatechildfiled]=data[conf.linkchildfield];
													NUT.ds.insert({url:conf.relatetable.urledit,data:recRelate},function(res2){
														if (res2.success) {

															NUT.notify("Record inserted.", "lime");
														} else NUT.notify("⛔ ERROR: " + res2.result, "red");
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
					var hasChanged=false;
					for(var i=0;i<changes.length;i++){
						var change=changes[i];
						if (!NUT.isObjectEmpty(change)) {
							var recid = (tab.isForm ? form.record[columnkey] : change[columnkey]);

							var data = {};//remove "" value
							var files = [];
							for (var key in change) if (change.hasOwnProperty(key) && key != columnkey) {
								var val = form.record[key];//change[key];
								if (val && val[0] && val[0].file) {//file upload
									var names=[];
									for (var f in val) if (val.hasOwnProperty(f)&&val[f]) {
										files.push(val[f].file);
										names.push(val[f].file.name);
									}
									data[key] = JSON.stringify(names);
								} else data[key] = (val === ""?null:val);
							}
							
							if(conf.beforechange){
								if(conf.onchange)NUT.runComponent(conf.onchange,{action:item.id,recid:recid,data:data,config:conf});
							}else{
								var p = {url:conf.table.urledit,where:[columnkey,"=",recid],data:data};
								NUT.ds.update(p, function (res) {
									if (res.success) {
										if (files.length) NUT.upload(conf.tableid, recid, files);//upload file
										if (timeArchive) archiveRecord(conf.url, item.id, data, recid, conf.tableid, timeArchive);
										if (tab.isForm) grid.set(recid, data);
										NUT.notify("Record updated.","lime");

										if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, data: data, config: conf });
									} else NUT.notify("⛔ ERROR: " + res.result, "red");
								});
							}
							hasChanged=true;
						}
					}
					if (hasChanged&&!tab.isForm)grid.mergeChanges();
					else NUT.notify("⚠️ No change!","yellow");
				}
				break;
			case "DEL_A":
				timeArchive=w2prompt({label:"Archive time",value:new Date()});
				if(!timeArchive)break;
			case "DEL":
				 NUT.confirm('<span style="color:red">DELETE selected record?</span>',function(awnser){
					 if (awnser == "yes") {
						 var recid = tab.isForm ? form.record[columnkey] : grid.getSelection()[0];
						 if (conf.beforechange) {
							 if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, config: conf });
						 } else {
							 if (recid) NUT.ds.delete({ url: conf.table.urledit, where: [columnkey, "=", recid] }, function (res) {
								 if (res.success) {
									 if (timeArchive) archiveRecord(conf.url, item.id, tab.isForm ? form.record : grid.get(recid), recid, conf.tableid, timeArchive);
									 grid.remove(recid);
									 NUT.notify("Record deleted.", "lime");

									 if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, config: conf });
								 } else NUT.notify("⛔ ERROR: " + res.result, "red");
							 }); else NUT.notify("⚠️ No selection!", "yellow");
						 }
					 }
				 });
				break;
			case "LINK":
				var id = "link_" + tab.id;
				w2popup.open({
					title: "_Link",
					modal: true,
					width: 460,
					height: 610,
					body: '<div id="' + id + '" class="nut-full"></div>',
					onOpen: function (evt) {
						evt.onComplete = function () {
							var div = document.getElementById(id);
							NUT.ds.select({ url: NUT.URL+"nv_window_tab", siteid: n$.user.siteid, where: [["windowtype", "=", "search"], ["tableid", "=", conf.tableid]] }, function (res) {
								if (res.success && res.result.length) {
									NUT.ds.select({ url: NUT.URL + "n_cache", siteid: n$.user.siteid, where: ["windowid", "=", res.result[0].windowid] }, function (res2) {
										if (res2.success) {
											var winconf = NUT.configWindow(zipson.parse(res2.result[0].config));
											winconf.tabid = winconf.windowid;
											NUT.windows[winconf.windowid] = winconf;

											buildWindow(div, winconf, 0, function (code, records) {
												if (code == "OK" && records.length) {
													//do stm
												}
												w2popup.close();
											});
										} else NUT.notify("⛔ ERROR: " + res.result, "red");
									});
								} else {// simple link
									var p = { url: conf.table.urlview, order: (conf.table.columntree ? "seqno" : conf.table.columndisplay) };
									if (conf.whereclause) p.where=JSON.parse(conf.whereclause);
									NUT.ds.select(p, function (res) {
										if (res.success) {
											var lookupNode = {};
											for (var i = 0; i < grid.records.length; i++) {
												var rec = grid.records[i];
												lookupNode[rec[conf.table.columnkey]] = rec;
											}
											var nodes = [], lookup = {};
											for (var i = 0; i < res.result.length; i++) {
												var rec = res.result[i];
												var key = rec[conf.table.columnkey];
												var node = { id: key, text: "<input type='checkbox' class='w2ui-input' onclick='return false' id='linkchk_" + key + "' " + (lookupNode[key] ? "checked" : "") + "/> " + rec[conf.table.columndisplay], tag: { record: rec, config: conf }};
												if (rec.parentid) {
													var parent = lookup[rec.parentid];
													parent.group = true;
													if (parent.nodes) parent.nodes.push(node);
													else parent.nodes = [node];
												} else nodes.push(node);
												lookup[node.id] = node;
											}

											var tree = (w2ui[id] || new	NUT.w2sidebar({
												name: id,
												onClick: function (evt) {
													var node = evt.detail.node;
													var conf = node.tag.config;
													var rec = node.tag.record;
													var chk = document.getElementById("linkchk_" + node.id);
													chk.checked = !chk.checked;
													if (chk.checked) {//add
														var recRelate = {};
														recRelate[conf.relateparentfield] = grid.parentRecord[conf.linkparentfield];
														recRelate[conf.relatechildfield] = rec[conf.linkchildfield];
														if (rec.siteid !== undefined) recRelate.siteid = rec.siteid;
														NUT.ds.insert({ url: conf.relatetable.urlview, data: recRelate }, function (res2) {
															if (res2.success) NUT.notify("Link added.", "lime");
															else NUT.notify("⛔ ERROR: " + res2.result, "red");
														});
													} else {//delete
														NUT.ds.delete({ url: conf.relatetable.urlview, where: [[conf.relatechildfield, "=", rec[conf.linkchildfield]], [conf.relateparentfield, "=", grid.parentRecord[conf.linkparentfield]]] }, function (res2) {
															if (res2.success) NUT.notify("Link removed.", "lime");
															else NUT.notify("⛔ ERROR: " + res2.result, "red");
														});
													}
													grid.reload();
												}
											}));
											tree.nodes = nodes;
											tree.render(div);
										} else NUT.notify("⛔ ERROR: " + res.result, "red");
									});
								}
							});
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
				var table = win.document.createElement("table");
				table.border = 1;
				table.style = "border-collapse:collapse";
				var caption=table.createCaption();
				caption.innerHTML=conf.tabname;
				var row=table.insertRow();
				for (var i = 0; i < grid.columns.length; i++) {
					var col = win.document.createElement("th");
					col.innerHTML = grid.columns[i].text;
					row.appendChild(col);
				}
				for(var i=0;i<grid.records.length;i++){
					var row=table.insertRow();
					for(var j=0;j<grid.columns.length;j++){
						var cell=row.insertCell();
						cell.innerHTML=grid.records[i][grid.columns[j].field];
					}
				}
				var a = win.document.createElement("a");
				a.style.cssFloat="right"; a.download = conf.tabname + ".xls"; a.href= 'data:application/vnd.ms-excel,' + table.outerHTML.replace(/ /g, '%20'), a.innerHTML="<img src='" + document.location.href + "/img/excel.png'>&nbsp;Kết xuất Excel";
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
					NUT.ds.update({url:conf.table.urledit,data:data,where:[columnkey,"=",record[columnkey]]},function(res){
						if (res.success) {
							record[conf.lock] = data[conf.lock];
							tab.isForm ? form.refresh() : grid.refresh();
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
					});
				});
				break;
			case "ARCH":
				var recid=grid.tab.isForm?form.record[columnkey]:grid.getSelection();
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
		if (conf.fieldtype == "search" || conf.fieldtype == "image") {
			this.get(evt.target).el.onchange(value.current);
			//if(evt.value_new===true)evt.value_new="Y";
			//if(evt.value_new===false)evt.value_new="";
			//this.record[conf.fieldname]=evt.value_new;
		} else {
			NWin.updateChildFields(conf, this.record, this.parentRecord);
			
			if(conf.fieldtype=="select"&&conf.geocolumn){//bind with map
				var lyrconf=GSMap.getLayerConfig(this.tab.tag.geotableid);
				GSMap.applyFilter(lyrconf.maporder,lyrconf.seqno,[conf.geocolumn,"=",evt.value_new]);

				var where=[conf.table.columnkey,"=",evt.value_new];
				var ext=n$.extent[where.toString()];
				if(ext)
					GSMap.zoomToExtent(ext);
				else NUT.ds.select({url:conf.linktable.urlview,select:"minx,miny,maxx,maxy",where:where},function(res){
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
			offset: postData.offset
		}
		if (postData.sort || tabconf.orderbyclause) reqData.orderby = (postData.sort ? postData.sort[0].field + " " + postData.sort[0].direction : tabconf.orderbyclause);

		// define where
		var where = [];
		if (tabconf.tempWhere)where.push(tabconf.tempWhere);
		if (tabconf.whereclause)where.push(JSON.parse(tabconf.whereclause));
		

		if (postData.search) {
			for (var i = 0; i < postData.search.length; i++) {
				var search = postData.search[i];
				where.push(search.operator == "begins" ? [search.field, "like", search.value + "*"] : [search.field, search.operator, search.value]);
			}
		}
		if (postData.select) {
			where.push(postData.select);
		}

		if (where.length) reqData.where = NUT.ds.decodeSql({ where: where },true);
		evt.detail.postData = reqData;
	}
	grid_onLoad(evt) {
		var tab = this.tab;
		var records = evt.detail.data.result;
		var total = evt.detail.data.total;
		evt.detail.data.status = evt.detail.data.success ? "success" : "error";
		evt.detail.data.records = records;
		var select = this.getSelection().length;
		evt.onComplete = function () {			
			if (total) {
				this.noZoomTo = true;
				if(select==0)this.select(records[0][this.recid]);
			}
			if (total == 1)w2ui["tool_" + tab.id].check("SWIT");
			NWin.switchFormGrid(tab, total == 1);
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
		lab.tag = conf.table.columnkey + "=" + recid;

		if (this.tab.tag.geotableid) {
			if (this.noZoomTo)
				this.noZoomTo = false;
			else {
				var where = "";
				for (var i = 0; i < this.tab.tag.fields.length; i++) {
					var field = this.tab.tag.fields[i];
					if (field.geocolumn && this.record[field.geocolumn]) {
						var clause = field.geocolumn + "=" + this.record[field.geocolumn];
						where += where ? " and " + clause : clause;
					}
				}
				var lyrconf = GSMap.getLayerConfig(this.tab.tag.geotableid);
				if (where) GSMap.zoomToFeature(lyrconf.maporder, lyrconf.layername, where);
			}
		}
		if (this.record) {
			n$.record = this.record;
			n$.parent = this.parentRecord;
			NWin.updateFormRecord(conf, this.record, this.parentRecord);
			for (var i = 0; i < conf.children.length; i++)
				NWin.updateChildGrids(conf.children[i], this.record);
		}
	}
	static updateFormRecord(conf,record,parentRecord){
		var form=w2ui["form_"+conf.tabid];
		//fire onchange
		for(var i=0;i<form.fields.length;i++){
			var field = form.fields[i];
			if (field.type == 'file' && record[field.field]){
				var files=JSON.parse(record[field.field]);
				for(var j=0;j<files.length;j++){
					files[j] ="<a class='nut-link' target='_blank' href='file/"+n$.user.siteid+"/"+conf.tableid+"/"+record[conf.table.columnkey]+"/"+files[j]+"'>"+files[j]+"</a>";
				}
				record[field.field]=files;
			}
			/*var key = field.field;
			if (field.options.conf.children.length&&record[key]!=form.record[key])
				form.onChange({target:key,value_old:form.record[key],value_new:record[key]});*/
		}
		
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
				if (conf.relatetable) {//lien ket n-n
					NUT.ds.select({ url: conf.relatetable.urlview, select: conf.relatechildfield, where: [conf.relateparentfield, "=", grid.parentRecord[conf.linkparentfield]] }, function (res) {
						if (res.success) {
							var ids = [];
							for (var i = 0; i < res.result.length; i++) {
								ids.push(res.result[i][conf.relatechildfield]);
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
	static updateChildFields(conf, record, parentRecord) {
		for(var i=0;i<conf.children.length;i++){
			fldconf=conf.children[i];
			var form = w2ui[n$.idFormPopup || "form_" + fldconf.tabid];
			var grid = w2ui["grid_" + fldconf.tabid];
			if (fldconf.fieldtype == "select") {
				var field = form.get(fldconf.columnname);
				var column = grid.getColumn(fldconf.columnname);
				var key = fldconf.linktableid.tablename + "=" + value;
				var domain = NUT.domains[key];
				if (domain) {
					field.options.items = domain.items;
					form.refresh();
					if (column.editable) {
						column.editable.items = domain.items;
						grid.refresh();
					}
				} else {
					var columnkey = fldconf.bindfieldname || fldconf.linktable.columnkey;
					var columndisplay = fldconf.linktable.columndisplay || columnkey;
					NUT.ds.select({ url: fldconf.linktable.urlview, select: [columnkey, columndisplay], where: [fldconf.wherefieldname, "=", value] }, function (res) {
						if (res.success) {
							domain = { items: [], lookup: {} };
							for (var i = 0; i < res.result.length; i++) {
								var data = res.result[i];
								var item = { id: data[columnkey], text: data[columndisplay] };
								domain.items.push(item);
								domain.lookup[item.id] = item.text;
								domain.lookdown[item.text] = item.id;
							}
							NUT.domains[key] = domain;
							field.options.items = domain.items;
							form.refresh();
							if (column.editable) {
								column.editable.items = domain.items;
								grid.refresh();
							}
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
					});
				}
			}
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
	
	grid_onDblClick(evt) {
		if (NUT.isObjectEmpty(this.columns[evt.detail.column].editable)) {
			w2ui["tool_" + this.tab.id].check("SWIT");
			NWin.switchFormGrid(this.tab, true);
		}
	}
	static switchFormGrid(tab, isForm) {
		var form=w2ui["form_"+tab.id];
		var grid=w2ui["grid_"+tab.id];
		form.box.style.display = isForm ?"":"none";
		grid.box.style.display = isForm ?"none":"";
		isForm ? form.resize() : grid.resize();
		tab.isForm = isForm;
	}
	xlsInsert_onClick(conf,csv){
		if(csv.includes(","))
			w2alert('Data contains invalid , character!');
		else NUT.ds.insertCsv({ url: conf.tableid_edit, data: csv.replaceAll('\t', ',') }, function (res) {
			if (res.success)
				NUT.notify("Data imported.","lime");
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
				if (fld.columntype=="key") prikey = fld.columnname;
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
				NUT.ds.update({url:conf.tableid_edit,where:[prikey,"=",privalue],data:json},function(res){
					if(res.success)
						NUT.notify("Record updated.","lime");
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
				NUT.notify("Record archived.","lime");
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}