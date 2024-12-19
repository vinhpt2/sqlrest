var SysLayoutWindow = {
	run: function (p) {
		if (p.records.length) {
			var cache = { layouts: {}, lookupField: {}, win: p.records[0], divField: document.createElement("div") };
			NUT.ds.select({ url: NUT.URL + "n_cache", select: "layoutjson", where: ["windowid", "=", cache.win.windowid] }, function (res) {
				if (res.success) {
					var layout = res.result[0];
					if (layout && layout.layoutjson) {
						cache.layouts = zipson.parse(layout.layoutjson);
					}
					NUT.ds.select({ url: NUT.URL + "n_tab", orderby: ["tablevel", "seqno"], where: ["windowid", "=", cache.win.windowid] }, function (res2) {
						if (res2.success) {
							tabs = res2.result;
							if (tabs.length) {
								var lookupTab = {}, lookupDiv = {}, winconf = { tabs: [], tabid: cache.win.windowid, windowname: cache.win.windowname }, ids = [];
								for (var i = 0; i < tabs.length; i++) {
									var tab = tabs[i];
									if (cache.layouts[tab.tabid]) {
										tab.layout = document.createElement("div");
										tab.layout.innerHTML = cache.layouts[tab.tabid];
										cache.layouts[tab.tabid] = tab.layout;
										var tables = tab.layout.querySelectorAll("table");
										for (var t = 0; t < tables.length; t++) {
											var table = tables[t];
											for (var r = 0; r < table.rows.length; r++)for (var c = 0; c < table.rows[r].cells.length; c++) {
												var cell = table.rows[r].cells[c];
												SysLayoutWindow.makeupCell(cell);
												if (cell.firstChild) {
													cell.firstChild.ondragstart = SysLayoutWindow.drag;
													cache.lookupField[cell.firstChild.id] = cell.firstChild;
												}
											}
										}
									}
									tab.fields = [];
									tab.tabs = [];
									tab.maxLevel = 0;

									if (tab.tablevel == 0) winconf.tabs.push(tab);
									lookupTab[tab.tabid] = tab;
									ids.push(tab.tabid);
									if (tab.parenttabid) {
										var parentTab = lookupTab[tab.parenttabid];
										if (tab.tablevel > 0) {
											if (tab.tablevel > parentTab.tablevel) {
												parentTab.tabs.push(tab);
												if (tab.tablevel > parentTab.maxLevel) parentTab.maxLevel = tab.tablevel;
											} else {
												lookupTab[parentTab.parenttabid].tabs.push(tab);
											}
										}
									}
									lookupDiv[tab.tabid]=cache.divField.z(["table", { id: "tableDz_" + tab.tabid, style: "width:100%;table-layout:fixed;display:" + (i ? "none" : ""), innerHTML: "<caption><b>Drag & drop to layout</b></caption>" }]);
								}
								NUT.ds.select({ url: NUT.URL + "nv_field_column", orderby: "tabid,seqno", where: ["tabid", "in", ids] }, function (res3) {
									if (res3.success) {
										var fields = res3.result;
										if (fields.length) {
											for (var i = 0; i < fields.length; i++) {
												var field = fields[i];
												field.windowid = cache.win.windowid;
												var tab = lookupTab[field.tabid];
												tab.fields.push(field);
												var row = lookupDiv[field.tabid].insertRow();
												var cell = row.insertCell();
												cell.height = 35;
												cell.ondrop = SysLayoutWindow.drop;
												cell.ondragover = SysLayoutWindow.allowDrop;
												if (!cache.lookupField[field.fieldid]) {
													var div= cell.z(["div", { id: field.fieldid, className: "w2ui-field", draggable: true, ondragstart: SysLayoutWindow.drag }, [
														["label", { innerHTML: (NUT.translate(field.translate) || field.fieldname) }],
														["div", { className: "nut-fld-resize" }, [
															[field.fieldtype == "select" || field.fieldtype == "textarea" ? field.fieldtype : "input", { style: "width:100%", className:"w2ui-input", name: field.columnname, type: (field.fieldtype == "date" || field.fieldtype == "datetime" ? "" : field.fieldtype) }]
														]]
													]]);
													if (field.fieldtype == "search") {
														div.lastChild.firstChild.style = "width:40%";
														var span = div.lastChild.z(["span", { className: "nut-fld-helper" }]);
														span.innerHTML = "<button class='nut-but-helper' onclick='NUT.NWin.helper_onClick(this.parentNode.previousSibling," + field.linktableid + ",\"" + (field.linkcolumn || "") + "\",\"" + (field.whereclause || "") + "\")'>&nbsp;...&nbsp;</button><label>-/-</label>";
													}
												}
											}

											SysLayoutWindow.showDlgLayout(cache, winconf);

										};
									} else NUT.notify("⛔ ERROR: " + res3.result, "red");
								});
							}
						} else NUT.notify("⛔ ERROR: " + res2.result, "red");
					});
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			})
		} else NUT.notify("⚠️ No Window selected!", "yellow");
	},
	showDlgLayout: function (cache, winconf) {
		var id = "div_SysLayoutWindow";
		NUT.openDialog({
			title: "_Design",
			resizable: true,
			showMax: true,
			width: 1220,
			height: 700,
			div: '<div id="' + id + '" class="nut-full"></div>',
			onOpen: function (evt) {
				evt.onComplete = function () {
					var div = document.getElementById(id);
					(NUT.w2ui[id] || new NUT.w2layout({
						name: id,
						panels: [
							{ type: 'top', size: 38, html: '<div id="top_SysLayoutWindow" class="nut-full"></div>' },
							{ type: 'left', size: 910, resizable: true, html: '<div id="main_SysLayoutWindow" class="nut-full"></div>' },
							{ type: 'main', html: '<div id="right_SysLayoutWindow" class="nut-full" style="background:white"></div>' }
						]
					})).render(div);
					var divTool = document.getElementById("top_SysLayoutWindow");
					(NUT.w2ui[divTool.id] || new NUT.w2toolbar({
						name: divTool.id,
						items: [{ type: 'button', id: "CLOSE", text: '✖️', tooltip: "Close" },
						{ type: 'break' },
						{ type: 'button', id: "bold", text: '<b>B</b>', tooltip: "Bold font [Ctrl+B]" },
						{ type: 'button', id: "italic", text: '<i><b>I</b></i>', tooltip: "Italic font [Ctrl+I]" },
						{ type: 'button', id: "underline", text: '<i><b>U</b></i>', tooltip: "Underline font [Ctrl+U]" },
						{ type: 'button', id: "strikeThrough", text: '<s><b>S</b></s>', tooltip: "Strike font" },
						{ type: 'button', id: "increaseFontSize", text: '🗚', tooltip: "Increase size (firefox)" },
						{ type: 'button', id: "decreaseFontSize", text: '🗛', tooltip: "Decrease size (firefox)" },
						{ type: 'button', id: "justifyLeft", text: '├', tooltip: "Left text" },
						{ type: 'button', id: "justifyCenter", text: '┼', tooltip: "Center text" },
						{ type: 'button', id: "justifyRight", text: '┤', tooltip: "Right text" },
						{ type: 'button', id: "justifyFull", text: '≡', tooltip: "Justify text" },
						{ type: 'button', id: "indent", text: '»', tooltip: "Indent in" },
						{ type: 'button', id: "outdent", text: '«', tooltip: "Indent out" },
						{ type: 'button', id: "undo", text: '↶', tooltip: "Undo [Ctrl+Z]" },
						{ type: 'button', id: "redo", text: '↷', tooltip: "Redo [Ctrl+Y]" },
						{ type: 'break' },
							{ type: 'button', id: "RESET", text: '❌ Reset', tooltip: "Reset layout" },
						{ type: 'button', id: "SAVE", text: '_Save', tooltip: "Save layout" }],
						onClick: function (evt) {
							var item = evt.detail.subItem || evt.detail.item;
							switch (item.id) {
								case "SAVE":
									SysLayoutWindow.updateLayoutCache(cache);
									break;
								case "RESET":
									NUT.confirm('Reset layout will delete all layouts. Auto layout will be used. Continue?', function btn(answer) {
										if (answer == 'Yes') NUT.ds.update({ url: NUT.URL + "n_cache", where: ["windowid", "=", cache.win.windowid], data: { layoutjson: null } }, function (res) {
											if (res.success) {
												NUT.notify("Reset Layout updated.", "lime");
												NUT.closeDialog();
											} else NUT.notify("⛔ ERROR: " + res.result, "red");
										})
									})
									break;
								case "CLOSE":
									NUT.closeDialog();
									break;
								default:
									document.execCommand(item.id);
									break;
							}
						}
					})).render(divTool);
					SysLayoutWindow.buildWindow(main_SysLayoutWindow, winconf, 0, cache);
					right_SysLayoutWindow.appendChild(cache.divField);
				}
			}
		});
	},
	buildWindow: function (div, winconf, tabLevel, cache) {
		var divTabs = div.z(["div", { id: "tabsDz_" + winconf.tabid + "_" + tabLevel }]);
		var tabs = [];
		for (var i = 0; i < winconf.tabs.length; i++) {
			var tabconf = winconf.tabs[i];
			if (!tabconf.layoutcols) tabconf.layoutcols = NUT.LAYOUT_COLS;
			if (tabconf.tablevel == tabLevel) {
				var tab = { id: tabconf.tabid, text: tabconf.tabname, tag: tabconf };
				if (!tabconf.layout) {
					tabconf.layout = document.createElement("div");
					SysLayoutWindow.createLayout(tabconf, 3, 3);
					cache.layouts[tabconf.tabid] = tabconf.layout;
				}
				var divTab = div.z(["div", { id: "tabDz_" + tabconf.tabid }]);
				var divContent = divTab.z(["div", { id: "contDz_" + winconf.tabid, style:"height:320px" }]);
				var button = divContent.z(["button", { innerHTML: "_RecreateLayout", style: "float:right", className: "w2ui-btn" }]);
				button.onclick = function () {
					NUT.openDialog({
						width: 400,
						height: 200,
						div: '<table style="margin:auto;width:100%"><caption><b>Layout - ' + tabconf.tabname + '</b></caption><tr><td align="right">Rows</td><td><input id="num_rowCount" type="number" class="w2ui-input" value="3"/></td></tr><tr><td align="right">Columns</td><td><input id="num_colCount" type="number" class="w2ui-input" value="3"/></td></tr></table><br/><i style="color:orange">&nbsp;&nbsp;Recreate layout will remove all the fields!</i>',
						actions: {
							"_Close": function () { NUT.closeDialog() },
							"_Ok": function () {
								SysLayoutWindow.createLayout(tabconf, num_rowCount.value, num_colCount.value);
								NUT.closeDialog();
							}
						}
					});
				}
				
				divContent.appendChild(tabconf.layout);
				divTab.appendChild(divContent);
				
				if (tabconf.tabs.length) for (var l = tabLevel + 1; l <= tabconf.maxLevel; l++)
					SysLayoutWindow.buildWindow(divTab, tabconf, l, cache);
				if (tabs.length) divTab.style.display = "none";
				tabs.push(tab);
			}
		}

		(NUT.w2ui[divTabs.id] || new NUT.w2tabs({
			name: divTabs.id,
			active: tabs[0].id,
			tabs: tabs,
			onClick: function (evt) {
				var id = evt.tab.id;
				for (var i = 0; i < this.tabs.length; i++) {
					var tab = this.tabs[i];
					var divTab = document.getElementById("divtabDz_" + tab.id);
					divTab.style.display = (tab.id == id) ? "" : "none";
				}
				var nodes = divRight_SysLayoutWindow.firstChild.childNodes;
				for (var i = 0; i < nodes.length; i++)nodes[i].style.display = (nodes[i].id == "tableDz_" + id) ? "" : "none";
			}
		})).render(divTabs);

	},
	createLayout: function (tabconf, rowCount, colCount) {
		if (tabconf.layout.innerHTML) {
			var table = document.getElementById("tableDz_" + tabconf.tabid);
			var emptyCells = [];
			for (var r = 0; r < table.rows.length; r++)for (var c = 0; c < table.rows[r].cells.length; c++) {
				var cell = table.rows[r].cells[c];
				if (!cell.innerHTML) emptyCells.push(cell);
			}
			var i = 0;
			for (var r = 0; r < tabconf.layout.firstChild.rows.length; r++)for (var c = 0; c < tabconf.layout.firstChild.rows[r].cells.length; c++) {
				var cell = tabconf.layout.firstChild.rows[r].cells[c];
				if (cell.innerHTML) {
					cell.firstChild.lastChild.style.width = "";
					emptyCells[i++].prepend(cell.firstChild);
				}
			}
		}
		tabconf.layout.innerHTML = "";
		var table = document.createElement("table");
		table.style.tableLayout = "fixed";
		table.border = 1;
		table.style.borderCollapse = "collapse";
		table.width = "100%";
		for (var r = 0; r < rowCount; r++) {
			var row = table.insertRow();
			row.style.height = "35px";
			for (var c = 0; c < colCount; c++)
				SysLayoutWindow.makeupCell(row.insertCell());
		}
		tabconf.layout.appendChild(table);
	},
	makeupCell: function (cell) {
		cell.onclick = SysLayoutWindow.cell_onClick;
		cell.oncontextmenu = SysLayoutWindow.cell_onContextMenu;
		cell.ondrop = SysLayoutWindow.drop;
		cell.ondragover = SysLayoutWindow.allowDrop;
	},
	cell_onContextMenu: function (evt) {
		var that = this;
		NUT.w2menu.show({
			contextMenu: true,
			originalEvent: evt,
			items: [
				{ id: "MERGE", text: 'Merge' },
				{ id: "UN_MER", text: 'Un-merge' },
				{ text: '--' },
				{ id: "INS_ROW", text: 'Insert row' },
				{ id: "DEL_ROW", text: 'Delete row' },
				{ text: '--' },
				{ id: "INS_COL", text: 'Insert column' },
				{ id: "DEL_COL", text: 'Delete column' },
				{ text: '--' },
				{ id: "INS_GRP", text: 'Insert group' },
			],
			onSelect: function (evt) {
				var table = that.parentNode.parentNode.parentNode;
				switch (evt.detail.item.id) {
					case "MERGE":
						var cell0 = null;
						for (var i = 0; i < table.rows.length; i++)
							for (var j = 0; j < table.rows[i].cells.length; j++) {
								var row = table.rows[i];
								var cell = row.cells[j];
								if (cell.style.backgroundColor) {
									if (cell0 == null)
										cell0 = cell;
									else {
										if (cell.innerHTML) return;
										row.deleteCell(cell.cellIndex);
										cell0.colSpan += cell.colSpan;
										j--;
									}
								}
							}
						break;
					case "UN_MER":
						if (that.colSpan > 1) {
							var row = that.parentNode;
							var cellIndex = that.cellIndex + 1;
							for (var i = 1; i < that.colSpan; i++)
								SysLayoutWindow.makeupCell(row.insertCell(cellIndex));
							that.colSpan = 1;
						}
						break;
					case "INS_ROW":
						var colCount = table.rows[0].cells.length;
						var row = table.insertRow(that.parentNode.rowIndex + 1);
						for (var i = 0; i < colCount; i++)
							SysLayoutWindow.makeupCell(row.insertCell());
						break;
					case "DEL_ROW":
						var row = that.parentNode;
						var canDel = true;
						for (var i = 0; i < row.cells.length; i++)
							if (row.cells[i].innerHTML) { canDel = false; break }
						if (canDel) {
							table.deleteRow(that.parentNode.rowIndex);
						}
						break;
					case "INS_COL":
						var cellIndex = that.cellIndex + 1;
						for (var i = 0; i < table.rows.length; i++)
							SysLayoutWindow.makeupCell(table.rows[i].insertCell(cellIndex));
						break;
					case "DEL_COL":
						var cellIndex = that.cellIndex;
						var canDel = true;
						for (var i = 0; i < table.rows.length; i++)
							if (table.rows[i].cells[cellIndex].innerHTML) { canDel = false; break }
						if (canDel) {
							for (var i = 0; i < table.rows.length; i++)
								table.rows[i].deleteCell(cellIndex);
						}
						break;
					case "INS_GRP":
						NUT.openDialog({
							width: 400,
							height: 200,
							body: '<table style="margin:auto"><caption><i>Group layout</i></caption><tr><td align="right">Group name</td><td><input id="grp_LayoutName"/></td></tr><tr><td align="right">Rows</td><td><input id="grp_LayoutRow" type="number" value="2"/></td></tr><tr><td align="right">Columns</td><td><input id="grp_LayoutCol" type="number" value="1"/></td></tr></table><br/><i style="color:orange">&nbsp;&nbsp;Leave group name empty to create ghost group</i>',
							actions: {
								"_Close": function () { NUT.closeDialog() },
								"_Ok": function () {
									var grpRow = grp_LayoutRow.value;
									var grpCol = grp_LayoutCol.value;
									var group = document.createElement("fieldset");
									if (grp_LayoutName.value)
										group.innerHTML = "<legend>" + grp_LayoutName.value + "</legend>";
									else
										group.style.border = "none";
									var table=group.z(["table", { style:"table-layout:fixed;border-collapse:collapse",border:1,width:"100%"}]);
									for (var r = 0; r < grpRow; r++) {
										var row = table.insertRow();
										for (var c = 0; c < grpCol; c++)
											SysLayoutWindow.makeupCell(row.insertCell());
									}
									cell.appendChild(group);
									NUT.closeDialog();
								},
							}
						});
						break;
				}
			}
		});
	},
	updateLayoutCache: function (cache) {
		var layout = {};
		for (var key in cache.layouts) if (cache.layouts.hasOwnProperty(key)) {
			var table = cache.layouts[key].firstChild;
			for (var i = 0; i < table.rows.length; i++)
				for (var j = 0; j < table.rows[i].cells.length; j++)
					table.rows[i].cells[j].style.backgroundColor = "";
			layout[key] = table.outerHTML;
		}

		NUT.ds.update({ url: NUT.URL + "n_cache", where: ["windowid", "=", cache.win.windowid], data: { layoutjson: zipson.stringify(layout) } }, function (res) {
			if (res.success) NUT.notify("Layout's cache updated.", "lime");
			else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	},
	cell_onClick: function () {
		if (!this.innerHTML) {
			if (this.style.backgroundColor) {
				if (!(this.nextElementSibling && this.nextElementSibling.style.backgroundColor && this.previousElementSibling && this.previousElementSibling.style.backgroundColor))
					this.style.backgroundColor = "";
			} else {
				if (!(this.nextElementSibling && this.nextElementSibling.style.backgroundColor || this.previousElementSibling && this.previousElementSibling.style.backgroundColor)) {
					var table = this.parentNode.parentNode;
					for (var i = 0; i < table.rows.length; i++)
						for (var j = 0; j < table.rows[i].cells.length; j++)
							table.rows[i].cells[j].style.backgroundColor = "";
				}
				this.style.backgroundColor = "#87CEFA";
			}
		}
	},
	field_onResize: function () {
		this.firstChild.style.width = this.style.width;
	},
	drag: function (evt) {
		evt.dataTransfer.setData("node", evt.target.id);
	},
	allowDrop: function (evt) {
		evt.preventDefault();
	},
	drop: function (evt) {
		evt.preventDefault();
		if (!this.innerHTML) {
			var node = document.getElementById(evt.dataTransfer.getData("node"));
			var td = node.parentNode;
			node.lastChild.style.width = "";
			this.prepend(node);
			if(td.height==35)td.style.background = "whitesmoke";
			this.style.background ="";
		}
	}
}
