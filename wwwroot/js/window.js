import { w2ui, w2grid, w2toolbar, w2form, w2tabs, w2popup } from "../lib/w2ui.es6.min.js";

export class NWin {
	constructor(id) {
		this.id = id;
	}
	buildWindow(div, conf, tabLevel, callback) {
		var divTabs = div.z(["div", { id: "tabs_" + conf.tabid + "_" + tabLevel }]);
		var tabs = [];
		for (var i = 0; i < conf.tabs.length; i++) {
			var tabconf = conf.tabs[i];
			if (tabconf.tablevel == tabLevel) {
				var divTab = div.z(["div", { id: "tab_" + tabconf.tabid, style: "height:" + (tabconf.maxLevel ? "50%" : "100%")}]);
				var tab = { id: tabconf.tabid, text: NUT.translate(tabconf.translate) || tabconf.tabname };
				this.buildContent(divTab,tabconf,callback);
				if (tabconf.tabs.length) {
					for (var l = tabLevel + 1; l <= tabconf.maxLevel; l++)
						this.buildWindow(divTab, tabconf, l, callback);
				}
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
	cacheDmAndOpenWin(div, conf, needCaches, index) {
		var fldconf = needCaches[index];
		if (fldconf && fldconf.linktable) {
			if (!fldconf.parentfieldid) {
				var that = this;
				var columnkey = fldconf.bindfieldname || fldconf.linktable.columnkey;
				var columndisplay = fldconf.linktable.columndisplay || columnkey;
				NUT.ds.select({ url: fldconf.linktable.urlview, select: [columnkey, columndisplay], where: (fldconf.whereclause ? JSON.parse(fldconf.whereclause) : null) }, function (res) {
					if (res.success) {
						var dm = { items: [NUT.DM_NIL], lookup: {}, lookdown: {} };
						for (var i = 0; i < res.result.length; i++) {
							var data = res.result[i];
							var item = { id: data[columnkey], text: data[columndisplay] };
							dm.items.push(item);
							dm.lookup[item.id] = item.text;
							dm.lookdown[item.text] = item.id;
						}
						NUT.dmlinks[fldconf.linktableid + (fldconf.whereclause || "")] = dm;
						if (++index < needCaches.length) that.cacheDmAndOpenWin(div, conf, needCaches, index);
						else that.buildWindow(div, conf, 0);
					} else NUT.notify("⛔ ERROR: " + res.result, "red");
				});
			}
		} else this.buildWindow(div, conf, 0);
	}
	tab_onClick(evt){
		var id=evt.detail.tab.id;
		for(var i=0;i<this.tabs.length;i++){
			var tab=this.tabs[i];
			var divTab=document.getElementById("tab_"+tab.id);
			divTab.style.display=(tab.id==id)?"":"none";
			if(tab.id==id)NWin.updateChildGrids(divTab.tag);
		}
	}

	buildContent(div, conf, callback) {
		div.tag = conf;
		conf.default = {};
		var group = null, colGroup = null, lookupField = {};
		var fields = [], columns = [], searches=[], index = 0;
		for (var i = 0; i < conf.fields.length; i++) {
			var fldconf = conf.fields[i];
			lookupField[fldconf.columnname] = fldconf;
			var alias = NUT.translate(fldconf.translate) || fldconf.fieldname;
			if (n$.app.appid && fldconf.columntype != "key") {
				if (fldconf.columnname == "siteid") conf.default.siteid = n$.user.siteid;
				if (fldconf.columnname == "appid") conf.default.appid = n$.app.appid;
				if (fldconf.columnname == "orgid") conf.default.orgid = n$.orgid;
			}
			var domain = null;
			if (fldconf.fieldtype == "select" || fldconf.fieldtype == "list" || fldconf.fieldtype == "radio") {
				domain = fldconf.domainid ? NUT.domains[fldconf.domainid]: NUT.dmlinks[fldconf.linktableid + (fldconf.whereclause||"")];
			}
			if (fldconf.isdisplaygrid) {
				var column = { field: fldconf.columnname, text: alias, size: (fldconf.displaylength||100)+"px", sortable: true, frozen: fldconf.isfrozen, resizable: true, searchable: fldconf.issearch, options: { conf: fldconf } };
				if (fldconf.fieldtype == "int" || fldconf.fieldtype == "number" || fldconf.fieldtype == "currency" || fldconf.fieldtype == "date" || fldconf.fieldtype == "datetime" || fldconf.fieldtype == "percent") column.render = fldconf.fieldtype;
				else if (fldconf.fieldtype == "file") column.render = function (record,extra) {
					if (extra.value) {
						var files = JSON.parse(extra.value);
						for (var j = 0; j < files.length; j++) {
							files[j] = "<a class='nut-link' target='_blank' href='" + files[j] + "'>[ " + (j+1) + " ]</a>";
						}
						return files.toString();
					} else return extra.value;
				}
				if (domain) {
					column.domain = domain;
					column.render = function (record, obj) {
						var col = this.columns[obj.colIndex];
						return col.domain.lookup[obj.value];
					}
				}
				if (!fldconf.isreadonly) {
					var type = fldconf.fieldtype;
					if (fldconf.fieldtype == "textarea") type = "text";
					if (fldconf.fieldtype == "radio") type = "select";
					column.editable = { type: type };
					if (domain)	column.editable.items = domain.items;
				}
				columns.push(column);
			}

			if (fldconf.isdisplayform) {
				var field = { field: fldconf.columnname, type: fldconf.fieldtype, required: fldconf.isrequire, disabled: fldconf.isreadonly, label: alias, html: { label: alias, column: (NUT.isMobile ? 0 : (fldconf.colspan ? fldconf.colspan - 1 : index++ % (conf.layoutcols || NUT.LAYOUT_COLS))), attr: "tabindex=0" }, options: { conf: fldconf } };
				if (domain && !fldconf.parentfieldid)
					field.options.items = domain.items;
				if (fldconf.displaylength) field.html.attr += " style='width:" + fldconf.displaylength + "px'";
				if (fldconf.fieldtype == "search") {
					field.html.text = "<span class='nut-fld-helper'><button class='nut-but-helper' onclick='NUT.NWin.helper_onClick(this.parentNode.previousSibling,"+ conf.tabid +","+ fldconf.linktableid+",\""+(fldconf.linkcolumn||"")+"\",\""+(fldconf.whereclause||"")+"\")'>&nbsp;...&nbsp;</button><label>-/-</label></span>";
					if (!fldconf.displaylength) field.html.attr += " style='width:40%'";
				} else if (fldconf.fieldtype == "file") {
					if (!fldconf.displaylength) field.html.attr += " style='width:100%'";
				}
				
				if (fldconf.placeholder) field.html.attr += " placeholder='" + fldconf.placeholder + "'";
				if (fldconf.fieldlength) field.html.attr += " maxlength='" + fldconf.fieldlength + "'";
				if (fldconf.vformat) field.html.attr += " pattern='" + fldconf.vformat + "'";

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
				if (fldconf.issearch) searches.push(NUT.clone(field));
				fields.push(field);
			}
		}

		for (var i = 0; i < searches.length; i++) {
			var fld = searches[i];
			fld.required = false;
			fld.disabled = false;
			fld.html.column = (NUT.isMobile ? 0 : (fld.colspan ? fld.colspan - 1 : i++ % (conf.layoutcols || NUT.LAYOUT_COLS)));
		}

		var divTool = div.z(["div", { id: "tool_" + conf.tabid }]);
		var divContent = div.z(["div", { id: "cont_" + conf.tabid, className: "nut-full" }]);
		var divGrid = divContent.z(["div", { id: "grid_" + conf.tabid, className: "nut-full" }]);
		var divForm = divContent.z(["div",{ id: "form_" + conf.tabid, className: "nut-full" }]);
		var recid = conf.table ? conf.table.columnkey : null;
		var opt = {
			name: divForm.id,
			autosize: false,
			fields: fields,
			recid: recid,
			onChange: this.field_onChange
		}
		var form = (w2ui[divForm.id] || new w2form(opt));
		if (conf.layout) form.formHTML = conf.layout.outerHTML;
		form.render(divForm);
		opt = {
			name: divGrid.id,
			dataType: "RESTFULL",
			httpHeaders: { Authorization: "Bearer " + n$.user.token },
			limit: NUT.GRID_LIMIT,
			reorderColumns: true,
			recid: recid,
			multiSelect: true,
			markSearch: false,
			columns: columns,
			onSelect: this.grid_onSelect,
			onLoad: this.grid_onLoad,
			onRequest: this.grid_onRequest,
			onError: this.grid_onError,
			onChange: this.field_onChange,
			onDblClick: this.grid_onDblClick,
		}
		if (conf.check) opt.show = { selectColumn: true };
		var grid = (w2ui[divGrid.id] || new w2grid(opt));
		grid.searches=searches;
		grid.render(divGrid);
		divGrid.style.display = "none";
		if(recid)grid.url = conf.table.urlview;
		var access = conf.table ? NUT.access[conf.table.tablename] || {} : {};
		var isArchive = access.isarchive && conf.archivetype;
		var items = [{ type: 'check', id: "SWIT", text: '⧉', tooltip: "_Form/Grid" },{ type: 'button', id: "RELOAD", text: '↻', title: "_Reload" },{ type: 'break' }];
		if (!access.noselect) items.push({ type: 'button', id: "FIND", text: '🔎', title: "_Find" });
		if (callback) items.push({ type: 'button', id: "OK", text: '_Choose', title: "_Choose",callback:callback });
		if (!conf.isviewonly && !access.noinsert) items.push({ type: 'button', id: "NEW", text: '📄', title: "_New" });
		if (!conf.isviewonly&&!access.noupdate) items.push({ type: (isArchive ? "menu" : "button"), id: (isArchive ? "save" : "SAVE"), text: '💾', title: "_Save", items: [{ id: "SAVE", text: "_Save" }, { id: "SAVE_A", text: "_SaveA" }] });
		if (!conf.isviewonly&&!access.nodelete) items.push({ type: (isArchive ? "menu" : "button"), id: (isArchive ? "del" : "DEL"), text: '❌', title: "_Delete", items: [{ id: "DEL", text: "_Delete" }, { id: "DEL_A", text: "_DeleteA" }] });
		items.push({ type: 'break' });
		if (!conf.isviewonly&&!access.noupdate && conf.relatetableid) items.push({ type: 'button', id: "LINK", text: '🔗', title: "_Link Data" });
		if (!conf.isviewonly&&access.islock && conf.columnlock) items.push({ type: 'button', id: "LOCK", text: '🔒', title: "_Lock/Unlock" });
		if (!conf.isviewonly&&isArchive) items.push({ type: 'button', id: "ARCH", text: '🕰️', title: "_Archive" });
		//if(conf.columnparent)items.push({type:'button',id:"TREE",text:'🎛️',title:"Tree view"});
		if(conf.filterfield){
			var filterfields=JSON.parse(conf.filterfield);
			if(conf.filterdefault){//where filter
				var filterdefaults=JSON.parse(conf.filterdefault);
				for(var i=0;i<filterfields.length;i++){
					items.push({type:'radio',id:"FLT_"+i,text:filterdefaults[i],group:0,tag:filterfields[i]});
				}
			}else{
				for(var i=0;i<filterfields.length;i++){
					var key = filterfields[i][0];
					var val = filterfields[i][1];
					if (typeof val == "string" && val.startsWith("n$.")) val = eval(val);
					
					var fld=lookupField[key]
					var values = [{ id: "", text: "-/-" }];
					var dm = fld.domainid ? NUT.domains[fld.domainid] : NUT.dmlinks[fld.linktableid + (fld.whereclause || "")];
					for (var j = 0; j < dm.items.length; j++) {
						var itm = dm.items[j];
						values.push({ id: itm.id, text: itm.text });
					}
					var item = {
						type: 'menu-radio', id: key, items: values, title:fld.filename, text(itm) {
							return itm.selected || itm.id;
						}
					}
					if (val) {
						item.selected = val;
						var search = grid.getSearchData(key);
						if (search) search.value = val;
						else grid.searchData.push({ field: key, operator: "=", value: val });
					}
					items.push(item);
					items.push({ type: 'break' });
				}
			}
		}
		
		items.push({ type: 'spacer', id: "SPACE" });
		var lookup = {};
		for (var i = 0; i < conf.menus.length; i++) {
			var menu = conf.menus[i];
			var item = { type: 'button', id: menu.menuid, text: menu.menuname, title: menu.description, tag: menu.execname };
			if (menu.parentid) {
				var parent = lookup[menu.parentid];
				if (parent) {
					parent.type = 'menu';
					if (!parent.items) parent.items = [];
					parent.items.push(item);
				} else NUT.notify("⚠️ No menu's parent found!", "yellow");
			} else {
				items.push(item);
			}
			lookup[menu.menuid] = item;
		}
		
		if (!conf.isviewonly&&!(access.noselect || access.noupdate)) items.push({ type: 'button', id: "XLS_IM", text: '📥', title: "_Import" });
		if (!access.noexport) items.push({ type: 'button', id: "XLS_EX", text: '📤', title: "_Export" });
		items.push({ type: 'break' });
		items.push({ type: 'button', id: "PREV", text: '⬅️', title: "_Previous", step: -1 });
		items.push({ type: 'button', id: "NEXT", text: '➡️', title: "_Next", step: +1 });
		items.push({ type: 'html', id: "STUT", html: "<div style='padding:6px'><span id='rec_" + conf.tabid + "'></span>/<span id='total_" + conf.tabid + "'></span></div>" });
		items.push({ type: 'break' });
		items.push({ type: 'check', id: "EXPD", text: "»", title: "_Expand" });

		//toolbar
		(w2ui[divTool.id] || new w2toolbar({
			name: divTool.id,
			items: items,
			onClick: this.tool_onClick,
		})).render(divTool);

		if (!conf.parenttabid&&recid) grid.reload();
	}
	tool_onClick(evt) {
		var item = evt.detail.item;
		var subitem = evt.detail.subItem;
		var conf = this.box.parentNode.tag;
		var grid = w2ui["grid_" + conf.tabid];
		var parentKey = grid.parentRecord ? grid.parentRecord[conf.linkparentfield]:null;
		if (subitem) {
			if (subitem.id === "") {//all
				for (var i = 0; i < grid.searchData.length; i++) {
					var search = grid.searchData[i];
					if (search.field == item.id) {
						grid.searchData.splice(i, 1);
						break;
					}
				}
			} else if (subitem.tag) {//menu
				NUT.runComponent(subitem.tag, {
					records: grid.get(grid.getSelection()),
					parent: grid.parentRecord,
					config: conf,
					gsmap: null
				});
			} else {//filter
				var search = grid.getSearchData(item.id);
				if (search) search.value = subitem.id;
				else grid.searchData.push({ field: item.id, operator: "=", value: subitem.id });
			}
			grid.reload();
		} else {
			if (item.tag) {//component
				NUT.runComponent(item.tag, {
					records: grid.get(grid.getSelection()),
					parent: grid.parentRecord,
					config: conf,
					gsmap: null
				});
			} else {
				var columnkey = conf.table ? conf.table.columnkey:null;
				var form = w2ui["form_" + conf.tabid];
				var timeArchive = null;
				switch (item.id) {
					case "EXPD":
						document.getElementById("cont_" + conf.tabid).style.height = item.checked ? "50vh" : "100vh";
						if (conf.isForm) form.resize(); else grid.resize();
						break;
					case "SWIT":
						NWin.switchFormGrid(conf, !item.checked);
						break;
					case "RELOAD":
						grid.reload();
						break;
					case "PREV":
					case "NEXT":
						var i = grid.getSelection(true)[0] + item.step;
						if (grid.records[i]) {
							grid.selectNone(true);
							grid.select(grid.records[i][grid.recid]);
						}
						break;
					case "OK":
						item.callback('hello');
						break;
					case "FIND":
						//grid.searchOpen(evt.originalEvent.target);
						var id = "find_" + conf.tabid;
						NUT.openDialog({
							title: "_Find",
							width: 960,
							height: 400,
							div:'<div id="'+id + '" class="nut-full"></div>',
							onOpen(evt) {
								evt.onComplete = function () {
									var div = document.getElementById(id);
									(w2ui[id] || new w2form({
										name: id,
										fields: grid.searches,
										onChange: this.field_onChange,
										actions: {
											"_Close": function () {
												NUT.closeDialog();
											},
											"_Find": function (evt) {
												var changes = this.getChanges();
												if (NUT.isObjectEmpty(changes))
													grid.searchData = grid.originSearch ? [grid.originSearch] : [];
												else for (var key in changes) if (changes.hasOwnProperty(key)) {
													var val = changes[key];
													var search = grid.getSearchData(key);
													if (search) search.value = val;
													else grid.searchData.push({ field: key, operator: "=", value: val });
												}
												grid.reload();
											},
											"%": function (evt) {
												NUT.closeDialog();
												grid.searchOpen();
											}
										}
									})).render(div);
								}
							}
						});
						break;
					case "NEW":
						if (conf.linktable) conf.default[conf.linkchildfield] = parentKey;
						var id = "new_" + conf.tabid;
						NUT.openDialog({
							title: "_New",
							width: 960,
							height: 600,
							div: '<div id="' + id + '" class="nut-full"></div>',
							onOpen(evt) {
								evt.onComplete = function () {
									var div = document.getElementById(id);
									var frmNew = (w2ui[id] || new w2form({
										name: id,
										fields: form.fields,
										onChange: this.field_onChange,
										record: conf.default,
										actions: {
											"_Close": function () {
												NUT.closeDialog();
											},
											"_New": function (evt) {
												if (this.validate(true).length) return;
												var recRelate = null;
												if (conf.parenttabid) {
													if (conf.relatetable) {//lien ket n-n
														recRelate = {};
														recRelate[conf.relateparentfield] = parentKey;
													} else {
														this.record[conf.linkchildfield] = parentKey;
													}
												}
												var data = {};//remove null value
												var files = [], filename = {};
												for (var key in this.record) if (this.record.hasOwnProperty(key) && this.record[key] !== null) {
													var val = this.record[key];
													if (val instanceof Object) {//file upload
														var names = [];
														for (var f in val) if (val.hasOwnProperty(f) && val[f]) {
															var file = val[f].file;
															file.guid = NUT.getGuid(file.name);
															files.push(file);
															names.push(file.guid);
														}
														filename[key] = names;
														delete data[key];//them moi khong co filename se update sau
													} else data[key] = (val === "" ? null : val);
												}
												if (conf.beforechange) {
													if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, data: data, config: conf });
												} else NUT.ds.insert({ url: conf.table.urledit, data: data, returnid: data[columnkey] === undefined }, function (res) {
													if (res.success) {
														var newid = data[columnkey] || res.result[0];
														if (files.length) {//upload file
															NUT.uploadFile(conf.tableid, newid, files);
															//update file name
															for (var key in filename) if (filename.hasOwnProperty(key)) {
																for (var i = 0; i < filename[key].length; i++) {
																	filename[key][i] = "media/" + n$.user.siteid + "/" + conf.tableid + "/" + newid + "/" + filename[key][i];
																}
																filename[key] = JSON.stringify(filename[key]);
																data[key] = filename[key];
															}
															NUT.ds.update({ url: conf.table.urledit, data: data, where: [conf.table.columnkey, "=", newid] });
														}
														NUT.notify("Record inserted.", "lime");
														data[columnkey] = newid;
														grid.add(data, true);
														//grid.select(newid);
														if (recRelate) {
															recRelate[conf.relatechildfiled] = data[conf.linkchildfield];
															NUT.ds.insert({ url: conf.relatetable.urledit, data: recRelate }, function (res2) {
																if (res2.success) {
																	NUT.notify("Record inserted.", "lime");
																} else NUT.notify("⛔ ERROR: " + res2.result, "red");
															});
														}
														if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, data: data, config: conf });
													} else NUT.notify("⛔ ERROR: " + res.result, "red");
												});
											}
										}
									}));
									if (conf.layout) frmNew.formHTML = conf.layout.outerHTML;
									frmNew.render(div);
								}
							}
						});
						break;
					case "SAVE_A":
						timeArchive = w2prompt({ label: "Archive time", value: new Date() });
						if (!timeArchive) break;
					case "SAVE":
						if (conf.lock && (conf.isForm ? form.record[conf.lock] : grid.get(grid.getSelection()[0])[conf.lock]))
							NUT.alert("⚠️ Can not update locked record", "yellow");
						else {
							if (conf.isForm & form.validate(true).length) return;
							var changes = conf.isForm ? [form.getChanges()] : grid.getChanges();
							var hasChanged = false;
							for (var i = 0; i < changes.length; i++) {
								var change = changes[i];
								if (!NUT.isObjectEmpty(change)) {
									var recid = (conf.isForm ? form.original.recid : change.recid);
									var data = {};//remove "" value
									var files = [];
									for (var key in change) if (change.hasOwnProperty(key) && key != "recid") {
										var val = change[key];
										if (val instanceof Object) {//file upload
											val = form.record[key];
											var names = [];
											for (var f in val) if (val.hasOwnProperty(f) && val[f]) {
												var file = val[f].file;
												file.guid = NUT.getGuid(file.name);
												files.push(file);
												names.push("media/" + n$.user.siteid + "/" + conf.tableid + "/" + recid + "/" + file.guid);
											}
											data[key] = JSON.stringify(names);
										} else data[key] = (val === "" ? null : val);
									}

									if (conf.beforechange) {
										if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, data: data, config: conf });
									} else {
										var p = { url: conf.table.urledit, where: [columnkey, "=", recid], data: data };
										NUT.ds.update(p, function (res) {
											if (res.success) {
												if (files.length) NUT.uploadFile(conf.tableid, recid, files);//upload file
												if (timeArchive) archiveRecord(conf.url, item.id, data, recid, conf.tableid, timeArchive);
												if (conf.isForm) grid.set(recid, data);
												NUT.notify("Record updated.", "lime");

												if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, data: data, config: conf });
											} else NUT.notify("⛔ ERROR: " + res.result, "red");
										});
									}
									hasChanged = true;
								}
							}
							if (hasChanged) {
								if (!conf.isForm) grid.mergeChanges();
							} else NUT.notify("⚠️ No change!", "yellow");
						}
						break;
					case "DEL_A":
						timeArchive = w2prompt({ label: "Archive Time", value: new Date() });
						if (!timeArchive) break;
					case "DEL":
						NUT.confirm('<span style="color:red">DELETE selected record?</span>', function (awnser) {
							if (awnser == "yes") {
								var recid = conf.isForm ? form.record[columnkey] : grid.getSelection()[0];
								if (conf.beforechange) {
									if (conf.onchange) NUT.runComponent(conf.onchange, { action: item.id, recid: recid, config: conf });
								} else {
									if (recid) NUT.ds.delete({ url: conf.table.urledit, where: [columnkey, "=", recid] }, function (res) {
										if (res.success) {
											if (timeArchive) archiveRecord(conf.url, item.id, conf.isForm ? form.record : grid.get(recid), recid, conf.tableid, timeArchive);
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
						var query = { url: conf.table.urlview, orderby: conf.orderbyclause || conf.table.columndisplay, limit: NUT.QUERY_LIMIT }
						if (conf.whereclause) query.where = JSON.parse(conf.whereclause);
						var p = {
							ids: grid.getSearchData(conf.table.columnkey).value,
							query: query,
							conf: conf,
							parentKey: parentKey,
							callback: function () { grid.reload() }
						}
						NUT.linkData(p);
						break;
					case "SEARCH":
						var changes = form.getChanges();
						if (NUT.isObjectEmpty(changes))
							grid.searchData = grid.originSearch ? [grid.originSearch] : [];
						else for (var key in changes) if (changes.hasOwnProperty(key)) {
							var search = grid.getSearchData(key);
							if (search) search.value = changes[key];
							else grid.searchData.push({ field: key, operator: "=", value: changes[key] });
						}
						grid.reload();
						break;
					case "XLS_IM":
						var columnnames = [];
						for (var i = 0; i < conf.fields.length; i++)
							columnnames.push(conf.fields[i].columnname);
						var header = columnnames.join('\t') + "\n";
						NUT.openDialog({
							title: "_Import",
							width: 1000,
							height: 700,
							div: '<textarea cols=' + (header.length + 8 * columnnames.length) + ' id="txt_Tsv" style="height:100%">' + header + '</textarea>',
							actions: {
								"_Close": function () { NUT.closeDialog() },
								"_Update": function () {
									if (!txt_Tsv.value.includes("'")) {
										var data = NUT.tsv2arr(txt_Tsv.value);
										if (data.length) {
											NUT.ds.update({ url: conf.table.urledit, data: data, key: conf.table.columnkey }, function (res) {
												if (res.success) {
													grid.reload();
													NUT.notify("Data updated.", "lime");
												} else NUT.notify("⛔ ERROR: " + res.result, "red");
											});
										} else NUT.notify("⚠️ Empty data!", "yellow");
									} else NUT.notify("⚠️ Data contains invalid ' character!", "yellow");
								},
								"_New": function () {
									if (!txt_Tsv.value.includes("'")) {
										var data = NUT.tsv2arr(txt_Tsv.value);
										if (data.length) {
											NUT.ds.insert({ url: conf.table.urledit, data: data }, function (res) {
												if (res.success) {
													grid.reload();
													NUT.notify("Data inserted.", "lime");
												} else NUT.notify("⛔ ERROR: " + res.result, "red");
											});
										} else NUT.notify("⚠️ Empty data!", "yellow");
									} else NUT.notify("⚠️ Data contains invalid ' character!", "yellow");
								}
							}
						});
						break;
					case "XLS_EX":
						NUT.openDialog({
							title: "_Export",
							width: 400,
							height: 210,
							div: "<table style='margin:auto'><tr><td>" + n$.phrases["_Offset"] + ": </b></td><td><input class='w2ui-input' type='number' id='numOffset' value='0'/></td></tr><tr><td>" + n$.phrases["_Limit"] +":</b></td><td><input class='w2ui-input' id='numLimit' type='number' value='"+NUT.QUERY_LIMIT+"'/></td></tr></table>",
							actions: {
								"_Cancel": function () { NUT.closeDialog() },
								"_Ok": function () {
									var win = window.open();
									var table = win.document.createElement("table");
									table.id = "tblMain";
									table.border = 1;
									table.style = "border-collapse:collapse";
									var caption = table.createCaption();
									caption.innerHTML = conf.tabname;
									var row = table.insertRow();
									for (var i = 0; i < grid.columns.length; i++) {
										var col = win.document.createElement("th");
										col.innerHTML = grid.columns[i].text;
										row.appendChild(col);
									}
									// define where
									var where = [];
									if (conf.tempWhere) where.push(conf.tempWhere);
									if (conf.whereclause) where.push(JSON.parse(conf.whereclause));
									for (var i = 0; i < grid.searchData.length; i++) {
										var search = grid.searchData[i];
										where.push(search.operator == "begins" ? [search.field, "like", search.value + "*"] : [search.field, search.operator, search.value]);
									}
									var para = { url: conf.table.urlview, offset: numOffset.value, limit: numLimit.value, where: where };
									if (grid.sortData.length) {
										var sorts = [];
										for (var i = 0; i < grid.sortData.length; i++)
											sorts.push(grid.sortData[i].field + " " + grid.sortData[i].direction);
										para.orderby = sorts.join(",");
									}
									NUT.ds.select(para, function (res) {
										if (res.success) {
											for (var i = 0; i < res.result.length; i++) {
												var rec = res.result[i];
												var row = table.insertRow();
												for (var j = 0; j < grid.columns.length; j++) {
													var cell = row.insertCell();
													cell.innerHTML = rec[grid.columns[j].field];
												}
											}
											var a = win.document.createElement("span");
											a.style.cssFloat = "right";
											a.innerHTML = "<button onclick='navigator.clipboard.writeText(tblMain.outerHTML)'>📋 Copy to Excel</button>";
											win.document.body.appendChild(a);
											win.document.body.appendChild(table);
										} else NUT.notify("⛔ ERROR: " + res.result, "red");
									});
								}
							}
						});
						break;
					case "LOCK":
						var record = conf.isForm ? form.record : grid.record;
						var label = record[conf.lock] ? "🔓 Unlock" : "🔒 Lock";
						w2confirm(label + ' selected record?').yes(function () {
							var data = {};
							data[conf.lock] = record[conf.lock] ? false : true;
							NUT.ds.update({ url: conf.table.urledit, data: data, where: [columnkey, "=", record[columnkey]] }, function (res) {
								if (res.success) {
									record[conf.lock] = data[conf.lock];
									conf.isForm ? form.refresh() : grid.refresh();
								} else NUT.notify("⛔ ERROR: " + res.result, "red");
							});
						});
						break;
					case "ARCH":
						var recid = conf.isForm ? form.record[columnkey] : grid.getSelection();
						NUT.ds.select({ url: conf.url + "n_archive", where: [["tableid", "=", conf.tableid], ["recordid", "=", recid]] }, function (res) {
							if (res.success) {
								var id = "arch_" + conf.tabid;
								NUT.openDialog({
									title: "🕰️ <i>Archive</i> - " + conf.tabname,
									width: 920,
									height: 700,
									div: '<div id="' + id + '" class="nut-full"></div>',
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
				}
			}
		}
	}
	field_onChange(evt) {
		var conf = null;
		if (evt.detail.field) {//form
			conf = this.get(evt.detail.field).options.conf;
			if (conf.fieldtype == "search") {
				var label = this.get(evt.detail.field).el.nextElementSibling.lastElementChild;
				if (label) NUT.ds.select({ url: conf.linktable.urlview, select: conf.linktable.columndisplay, where: [conf.linktable.columncode||conf.linktable.columnkey, "=", evt.detail.value.current] }, function(res) {
					label.innerHTML = res.success&&res.result.length? res.result[0][conf.linktable.columndisplay]:"-/-";
				});
			}
		} else {
			conf = this.columns[evt.detail.column].options.conf;
		}
		if (conf.children.length) {//
			NWin.updateChildFields(conf, this.record, this.parentRecord);
			/*if (conf.fieldtype == "select" && conf.geocolumn) {//bind with map
				var lyrconf = GSMap.getLayerConfig(conf.geotableid);
				GSMap.applyFilter(lyrconf.maporder, lyrconf.seqno, [conf.geocolumn, "=", evt.value_new]);

				var where = [conf.table.columnkey, "=", evt.value_new];
				var ext = n$.extent[where.toString()];
				if (ext) GSMap.zoomToExtent(ext);
				else NUT.ds.select({ url: conf.linktable.urlview, select: "minx,miny,maxx,maxy", where: where }, function (res) {
					if (res.success) {
						var ext = [res[0].minx, res[0].miny, res[0].maxx, res[0].maxy];
						if (res.length) GSMap.zoomToExtent(ext);
						n$.extent[where.toString()] = ext;
					} else NUT.notify("⛔ ERROR: " + res.result, "red");
				});
			}*/
		}
	}
	grid_onError(evt) {
		NUT.notify(evt.detail.response.message, "red");
	}
	grid_onRequest(evt) {
		var tabconf = this.box.parentNode.parentNode.tag;
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
			var clauses = [postData.searchLogic.toLowerCase()];
			for (var i = 0; i < postData.search.length; i++) {
				var search = postData.search[i];
				var val = search.value;
				var op = search.operator;
				if (op == "like") {
					if (!val.includes("%")) val = "%" + val + "%";
				} else if (op == "between") {
					val = (this.operatorsMap[search.type] == "date"? "'" + val.join("' and '") + "'":val.join(" and "));
				} else if (val && val.includes && val.includes("%")) op = "like";
				clauses.push([search.field, op,val]);
			}
			if (clauses.length) where.push(clauses);
		}
		if (postData.select) where.push(postData.select);

		if (where.length) reqData.where = NUT.ds.decodeSql({ where:where.length==1?where[0]:where },true);
		evt.detail.postData = reqData;
	}
	grid_onLoad(evt) {
		var conf = this.box.parentNode.parentNode.tag;
		var records = evt.detail.data.result;

		//chuan hoa time
		if(records.length)for (var i = 0; i < conf.fields.length; i++) {
			var fldconf = conf.fields[i];
			if (fldconf.fieldtype == "date" || fldconf.fieldtype == "time" || fldconf.fieldtype == "datetime") {
				var len = (fldconf.fieldtype == "date" ? 10 : (fldconf.fieldtype == "time"? 5:16));
				for (var j = 0; j < records.length; j++) {
					var val = records[j][fldconf.columnname];
					if (val) records[j][fldconf.columnname] = (len == 16 ? val.substring(0, len).replace("T"," ") :val.substring(0, len));
				}
			}
		}
		
		var total = evt.detail.data.total;
		evt.detail.data.status = evt.detail.data.success ? "success" : "error";
		evt.detail.data.records = records;
		var select = this.getSelection().length;
		evt.onComplete = function () {
			if (total) {
				this.noZoomTo = true;
				if(select==0&&!conf.check)this.select(records[0][this.recid]);
			}
			if (total == 1)w2ui["tool_" + conf.tabid].check("SWIT");
			NWin.switchFormGrid(conf, total == 1);
			document.getElementById("rec_" + conf.tabid).innerHTML = total?1:0;
			document.getElementById("total_" + conf.tabid).innerHTML = total;
		}
	}
	static helper_onClick(input, tabid, linktableid, linkcolumn, whereclause) {
		var table = NUT.tables[linktableid];
		var query = { url: table.urlview, orderby: table.columndisplay, limit: NUT.QUERY_LIMIT }
		if (whereclause) query.where = JSON.parse(whereclause);
		var p = {
			id: input.value,
			query: query,
			conf: {table:table,linkcolumn:linkcolumn},
			callback: function (rec) {
				if (rec) {
					var val = rec[linkcolumn || table.columnkey];
					var form = w2ui[(NUT.w2popup.status=="open"?"new_":"form_") + tabid];
					form.rememberOriginal();
					form.setValue(input.id, val);
					form.onChange({detail: {
						field: input.id,
						value: { current: val}
					}});
				}
			}
		}
		NUT.linkData(p);
	}
	grid_onSelect(evt) {
		var recid = (evt.detail.clicked ? evt.detail.clicked.recid : evt.detail.recid);

		var conf = this.box.parentNode.parentNode.tag;
		this.record = this.get(recid);
		var lab = document.getElementById("rec_" + conf.tabid);
		lab.innerHTML = this.get(recid, true) + 1;
		lab.tag = conf.table.columnkey + "=" + recid;

		if (conf.geotableid) {
			if (this.noZoomTo)
				this.noZoomTo = false;
			else {
				var where = "";
				for (var i = 0; i < conf.fields.length; i++) {
					var field = conf.fields[i];
					if (field.geocolumn && this.record[field.geocolumn]) {
						var clause = field.geocolumn + "=" + this.record[field.geocolumn];
						where += where ? " and " + clause : clause;
					}
				}
				var lyrconf = GSMap.getLayerConfig(conf.geotableid);
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
		var form = w2ui["form_" + conf.tabid];
		//form.clear();
		form.record = record;
		form.parentRecord = parentRecord;
		form.refresh();
		//fire onchange
		for(var i=0;i<form.fields.length;i++){
			var field = form.fields[i];
			var key = field.field;
			if (field.type == "file") {
				var ctrl = document.getElementById(key).previousElementSibling;
				if (ctrl && record[key]) {
					ctrl = ctrl.children[1].children[0];
					ctrl.childNodes[2].remove();
					var files = JSON.parse(record[key]);
					for (var j = 0; j < files.length; j++) {
						var a = document.createElement("a");
						a.className = "nut-link";
						a.target = "_blank";
						a.href = files[j];
						a.innerHTML = "[ " + (j+1) + " ]";
						ctrl.appendChild(a);
					}
				}
			}
			if (field.type=="search"||field.options.conf.children.length)form.onChange({ detail: { field: key, value: { current: record[key] } } });
		}
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
				var parentKey = grid.parentRecord[conf.linkparentfield];
				var search = grid.getSearchData(conf.linkchildfield);
				if (conf.relatetable) {//lien ket n-n
					NUT.ds.select({ url: conf.relatetable.urlview, select: conf.relatechildfield, where: [conf.relateparentfield, "=", parentKey], limit:NUT.QUERY_LIMIT }, function (res) {
						if (res.success) {
							var ids = [];
							for (var i = 0; i < res.result.length; i++) {
								ids.push(res.result[i][conf.relatechildfield]);
							}
							if (ids.length == 0) ids = [-0.101];
							grid.originSearch = { field: conf.linkchildfield, operator: "in", value: ids };
							if (search) search.value = ids;
							else grid.searchData.push(grid.originSearch);
							grid.reload();
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
					});
				} else {
					grid.originSearch = { field: conf.linkchildfield, operator: "=", value: parentKey };
					if (search) search.value = parentKey;
					else grid.searchData.push(grid.originSearch);
					grid.reload();
				}
				divTab.needUpdate = false;
			}
		}
	}
	static updateChildFields(conf, record, parentRecord) {
		for(var i=0;i<conf.children.length;i++){
			var fldconf=conf.children[i];
			var form = w2ui["form_" + fldconf.tabid];
			var grid = w2ui["grid_" + fldconf.tabid];
			if (fldconf.fieldtype == "select") {
				var field = form.get(fldconf.columnname);
				var column = grid.getColumn(fldconf.columnname);
				var where = [fldconf.wherefieldname || conf.columnname, "=", record[conf.columnname]];
				if (fldconf.whereclause) where = [where, JSON.parse(fldconf.whereclause)];
				var key = fldconf.linktableid + where;
				var domain = NUT.dmlinks[key];
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
					NUT.ds.select({ url: fldconf.linktable.urlview, select: [columnkey, columndisplay], where: where }, function (res) {
						if (res.success) {
							domain = {	items: [NUT.DM_NIL], lookup: {}, lookdown: {} };
							for (var i = 0; i < res.result.length; i++) {
								var data = res.result[i];
								var item = { id: data[columnkey], text: data[columndisplay] };
								domain.items.push(item);
								domain.lookup[item.id] = item.text;
								domain.lookdown[item.text] = item.id;
							}
							NUT.dmlinks[key] = domain;
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
			var conf = this.box.parentNode.parentNode.tag;
			w2ui["tool_" + conf.tabid].check("SWIT");
			NWin.switchFormGrid(conf, true);
		}
	}
	static switchFormGrid(conf, isForm) {
		var form=w2ui["form_"+conf.tabid];
		var grid=w2ui["grid_"+conf.tabid];
		form.box.style.display = isForm ?"":"none";
		grid.box.style.display = isForm ?"none":"";
		isForm ? form.resize() : grid.resize();
		conf.isForm = isForm;
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