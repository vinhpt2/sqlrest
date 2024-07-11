var SysLayoutWindow={
	run:function(p){
		if(p.records.length){
			this.layouts={};
			this.lookupField={};
			this.win=p.records[0];
			this.divField=document.createElement("div");
			var self=this;
			NUT.ds.select({url:NUT.URL+"n_cache",select:"layoutjson",where:["windowid","=",self.win.windowid]},function(res){
				if (res.success) {
					var cache = res.result[0];
					if (cache && cache.layoutjson) {
						self.layouts = JSON.parse(cache.layoutjson);
					}
					NUT.ds.select({ url: NUT.URL + "n_tab", orderby: ["tablevel", "seqno"], where: ["windowid", "=", self.win.windowid] }, function (res2) {
						if (res2.success) {
							tabs = res2.result;
							if (tabs.length) {
								var lookupTab = {}, lookupDiv = {}, winconf = { tabs: [], tabid: self.win.windowid, windowname: self.win.windowname }, ids = [];
								for (var i = 0; i < tabs.length; i++) {
									var tab = tabs[i];
									if (self.layouts[tab.tabid]) {
										tab.layout = document.createElement("div");
										tab.layout.innerHTML = self.layouts[tab.tabid];
										self.layouts[tab.tabid] = tab.layout;
										var tables = tab.layout.querySelectorAll("table");
										for (var t = 0; t < tables.length; t++) {
											var table = tables[t];
											for (var r = 0; r < table.rows.length; r++)for (var c = 0; c < table.rows[r].cells.length; c++) {
												var cell = table.rows[r].cells[c];
												self.makeupCell(cell);
												if (cell.firstChild) {
													cell.firstChild.ondragstart = self.drag;
													self.lookupField[cell.firstChild.id] = cell.firstChild;
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
									var table = document.createElement("table");
									table.id = "tableDz_" + tab.tabid;
									table.style.borderCollapse = "collapse";
									table.style.tableLayout = "fixed";
									table.width = "100%";
									table.style.display = (i == 0 ? "" : "none");
									table.innerHTML = "<caption><b><i>" + tab.tabname + "</i></b></caption>";
									self.divField.appendChild(table);
									lookupDiv[tab.tabid] = table;
								}
								NUT.ds.select({ url: NUT.URL + "n_field", orderby: "tabid,seqno", where: ["tabid", "in", ids] }, function (res3) {
									if (res3.success) {
										var fields = res3.result;
										if (fields.length) {
											for (var i = 0; i < fields.length; i++) {
												var field = fields[i];
												field.windowid = self.win.windowid;
												var tab = lookupTab[field.tabid];
												tab.fields.push(field);
												var cell = lookupDiv[field.tabid].insertRow().insertCell();
												cell.title = field.fieldname + " (" + field.fieldtype + ")";
												cell.height = "35px";
												cell.ondrop = self.drop;
												cell.ondragover = self.allowDrop;

												if (!self.lookupField[field.fieldid]) {
													var div = document.createElement("div");
													div.id = field.fieldid;
													div.className = "w2ui-field";
													div.draggable = true;
													div.ondragstart = self.drag;
													div.innerHTML = "<label contentEditable='true'>" + (NUT.translate(field.translate)||field.fieldname) + "</label><div class='nut-fld-resize'><input style='width:100%' name='" + field.fieldname + "' type='" + field.fieldtype + "'/></div>";
													cell.appendChild(div);
												}
											}

											self.showDlgLayout(winconf);

										};
									} else NUT.notify("⛔ ERROR: " + res3.result, "red");
								});
							}
						} else NUT.notify("⛔ ERROR: " + res2.result, "red");
					});
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			})
		} else NUT.tagMsg("⚠️ No Window selected!","yellow");
	},
	showDlgLayout:function(winconf){
		var self=this;
		var id="div_SysLayoutWindow";
		NUT.w2popup.open({
			title: '📐 Layout',
			width: 1280,
			height: 810,
			modal:true,
			body: '<div id="'+id+'" class="nut-full"></div>',
			onOpen:function(evt){
				evt.onComplete=function(){
					var div=document.getElementById(id);
					(NUT.w2ui[id]||new NUT.w2layout({
						name: id,
						panels: [
							{ type: 'top', size: 38, html: '<div id="top_SysLayoutWindow" class="nut-full"></div>' },
							{ type: 'left', size:910, resizable: true, html: '<div id="main_SysLayoutWindow" class="nut-full"></div>' },
							{ type: 'main', html: '<div id="right_SysLayoutWindow" class="nut-full"></div>' }
						]
					})).render(div);
					var divTool=document.getElementById("top_SysLayoutWindow");
					(NUT.w2ui[divTool.id]||new NUT.w2toolbar({
						name: divTool.id,
						items: [{type:'button',id:"CLOSE",text:'⛌',tooltip:"Close"},
							{type:'break'},
							{type:'button',id:"bold",text:'<b>B</b>',tooltip:"Bold font [Ctrl+B]"},
							{type:'button',id:"italic",text:'<i><b>I</b></i>',tooltip:"Italic font [Ctrl+I]"},
							{type:'button',id:"underline",text:'<i><b>U</b></i>',tooltip:"Underline font [Ctrl+U]"},
							{type:'button',id:"strikeThrough",text:'<s><b>S</b></s>',tooltip:"Strike font"},
							{type:'button',id:"increaseFontSize",text:'🗚',tooltip:"Increase size (firefox)"},
							{type:'button',id:"decreaseFontSize",text:'🗛',tooltip:"Decrease size (firefox)"},
							{type:'button',id:"justifyLeft",text:'├',tooltip:"Left text"},
							{type:'button',id:"justifyCenter",text:'┼',tooltip:"Center text"},
							{type:'button',id:"justifyRight",text:'┤',tooltip:"Right text"},
							{type:'button',id:"justifyFull",text:'≡',tooltip:"Justify text"},
							{type:'button',id:"indent",text:'»',tooltip:"Indent in"},
							{type:'button',id:"outdent",text:'«',tooltip:"Indent out"},
							{type:'button',id:"undo",text:'⭯',tooltip:"Undo [Ctrl+Z]"},
							{type:'button',id:"redo",text:'⭮',tooltip:"Redo [Ctrl+Y]"},
							{type:'break'},
							{type:'button',id:"RESET",text:'🧹 Reset',tooltip:"Reset layout"},
							{type:'button',id:"SAVE",text:'💾 Save',tooltip:"Save layout"}],
						onClick:function(evt){
							var item = evt.detail.subItem || evt.detail.item;
							switch(item.id){
								case "SAVE":
									self.updateLayoutCache();
									break;
								case "RESET":
									NUT.confirm('Reset layout will delete all layouts. Auto layout will be used. Continue?', function btn(answer) {
										if (answer == 'yes') NUT.ds.update({ url: NUT.URL + "n_cache", where: ["windowid", "=", self.win.windowid], data: { layout: null } }, function (res) {
											if (res.success) {
												for (var key in self.layouts) if (self.layouts.hasOwnProperty(key)) {
													var layout = self.layouts[key];
													if (layout.innerHTML) {
														var table = document.getElementById("tableDz_" + key);
														var emptyCells = [];
														for (var r = 0; r < table.rows.length; r++)for (var c = 0; c < table.rows[r].cells.length; c++) {
															var cell = table.rows[r].cells[c];
															if (!cell.innerHTML) emptyCells.push(cell);
														}
														var i = 0;
														for (var r = 0; r < layout.firstChild.rows.length; r++)for (var c = 0; c < layout.firstChild.rows[r].cells.length; c++) {
															var cell = layout.firstChild.rows[r].cells[c];
															if (cell.innerHTML) {
																cell.firstChild.lastChild.style.width = "";
																emptyCells[i++].prepend(cell.firstChild);
															}
														}
														layout.innerHTML = "";
													}
												}
											} else NUT.notify("⛔ ERROR: " + res.result, "red");
										})
									})
									break;
								case "CLOSE":
									NUT.w2popup.close();
									break;
								default:
									document.execCommand(item.id);
									break;
							}
						}
					})).render(divTool);
					self.buildWindow(main_SysLayoutWindow,winconf,0);
					right_SysLayoutWindow.appendChild(self.divField);
				}
			}
		});
	},
	buildWindow:function(div,conf,tabLevel,callback){
		var divTabs=document.createElement("div");
		divTabs.id="tabsDz_"+conf.tabid+"_"+tabLevel;
		div.appendChild(divTabs);
		var tabs=[],windowsearch=(conf.windowtype=="search"||conf.windowtype=="filter"?conf.windowtype:false);
		var nodes=[];
		for(var i=0;i<conf.tabs.length;i++){
			var tabconf=conf.tabs[i];
			if(!tabconf.layoutcols)tabconf.layoutcols=NUT.LAYOUT_COLS;
			if(tabconf.tablevel==tabLevel){
				var divTab=document.createElement("div");
				divTab.id="tabDz_"+tabconf.tabid;
				div.appendChild(divTab);
				var tab={id:tabconf.tabid,text:tabconf.tabname,tag:tabconf,windowsearch:windowsearch,callback:callback};
				
				var divContent=document.createElement("div");
				divContent.id="contDz_"+conf.tabid;
				divContent.style.height="320px";
				var but=document.createElement("input");
				but.type="button";
				but.style.float="right";
				but.value="Clear layout";
				but.tag=tabconf;
				but.onclick=function(){
					SysLayoutWindow.tag=this.tag;
					NUT.w2popup.message({
						speed:0,
						width:400,
						height:200,
						body: '<table style="margin:auto;width:100%"><caption style="background:lightgray"><i>Layout</i> - '+tabconf.tabname+'</caption><tr><td align="right">Rows</td><td><input id="numLayout_Rows" type="number" value="3"/></td></tr><tr><td align="right">Columns</td><td><input id="numLayout_Cols" type="number" value="3"/></td></tr></table><br/><i style="color:orange">&nbsp;&nbsp;Clear layout will remove all the fields. Continue?</i>',
						buttons: '<button class="w2ui-btn" onclick="NUT.w2popup.message()">Cancel</button><button class="w2ui-btn" onclick="SysLayoutWindow.createLayout(SysLayoutWindow.tag,numLayout_Rows.value,numLayout_Cols.value)">Ok</button>'
					});
				}
				divContent.appendChild(but);

				if(!tabconf.layout){
					tabconf.layout=document.createElement("div");
					this.createLayout(tabconf,3,3);
					this.layouts[tabconf.tabid]=tabconf.layout;
				}
				divContent.appendChild(tabconf.layout);
				divTab.appendChild(divContent);
				if(tabconf.tabs.length)for(var l=tabLevel+1;l<=tabconf.maxLevel;l++)
					this.buildWindow(divTab,tabconf,l,callback);
				if(tabs.length)divTab.style.display="none";
				tabs.push(tab);
			}
		}

		(NUT.w2ui[divTabs.id]||new NUT.w2tabs({
			name: divTabs.id,
			active: tabs[0].id,
			tabs: tabs,
			onClick: function(evt){
				if(!evt.tab.windowsearch){
					var id=evt.tab.id;
					for(var i=0;i<this.tabs.length;i++){
						var tab=this.tabs[i];
						var divTab=document.getElementById("divtabDz_"+tab.id);
						divTab.style.display=(tab.id==id)?"":"none";
					}
					var nodes=divRight_SysLayoutWindow.firstChild.childNodes;
					for(var i=0;i<nodes.length;i++)
						nodes[i].style.display=(nodes[i].id=="tableDz_"+id)?"":"none";
				}
			}
		})).render(divTabs);
		
	},
	createGroup:function(cell,grpName,grpRow,grpCol){
		var group=document.createElement("fieldset");
		if(grpName)
			group.innerHTML="<legend contenteditable='true'>"+grpName+"</legend>";
		else
			group.style.border="none";
		var table = document.createElement("table");
		table.style.tableLayout="fixed";
		table.border=1;
		table.style.borderCollapse="collapse";
		table.width="100%";
		for(var r=0;r<grpRow;r++){
			var row=table.insertRow();
			for(var c=0;c<grpCol;c++)
				this.makeupCell(row.insertCell());
		}
		group.appendChild(table);
		cell.appendChild(group);
		w2popup.message();
	},
	createLayout:function(tabconf,rowCount,colCount){
		if(tabconf.layout.innerHTML){
			var table=document.getElementById("tableDz_"+tabconf.tabid);
			var emptyCells=[];
			for(var r=0;r<table.rows.length;r++)for(var c=0;c<table.rows[r].cells.length;c++){
				var cell=table.rows[r].cells[c];
				if(!cell.innerHTML)emptyCells.push(cell);
			}
			var i=0;
			for(var r=0;r<tabconf.layout.firstChild.rows.length;r++)for(var c=0;c<tabconf.layout.firstChild.rows[r].cells.length;c++){
				var cell=tabconf.layout.firstChild.rows[r].cells[c];
				if(cell.innerHTML){
					cell.firstChild.lastChild.style.width="";
					emptyCells[i++].prepend(cell.firstChild);
				}
			}
		}
		tabconf.layout.innerHTML="";
		var table = document.createElement("table");
		table.style.tableLayout="fixed";
		table.border=1;
		table.style.borderCollapse="collapse";
		table.width="100%";
		for(var r=0;r<rowCount;r++){
			var row=table.insertRow();
			for(var c=0;c<colCount;c++)
				this.makeupCell(row.insertCell());
		}
		tabconf.layout.appendChild(table);
		NUT.w2popup.message();
	},
	makeupCell:function(cell){
		cell.height="35px";
		cell.onclick=this.cell_onClick;
		cell.oncontextmenu=this.cell_onContextMenu;
		cell.ondrop=this.drop;
		cell.ondragover=this.allowDrop;
	},
	cell_onContextMenu:function(evt){
			var self=this;
			$(this).w2menu({
				contextMenu: true,
				originalEvent: evt,
				items: [
					{ id: "MERGE", text: 'Merge'},
					{ id: "UN_MER", text: 'Un-merge'},
					{ text: '--'},
					{ id: "INS_ROW", text: 'Insert row'},
					{ id: "DEL_ROW", text: 'Delete row'},
					{ id: "INS_COL", text: 'Insert column'},
					{ id: "DEL_COL", text: 'Delete column'},
					{ text: '--'},
					{ id: "INS_GRP", text: 'Insert group'},
				],
				onSelect:function(evt){
					var table=self.parentNode.parentNode.parentNode;
					switch(evt.item.id){
						case "MERGE":
							var cell0=null;
							for(var i=0;i<table.rows.length;i++)
								for(var j=0;j<table.rows[i].cells.length;j++){
									var row=table.rows[i];
									var cell=row.cells[j];
									if(cell.style.backgroundColor){
										if(cell0==null)
											cell0=cell;
										else{
											if(cell.innerHTML)return;
											row.deleteCell(cell.cellIndex);
											cell0.colSpan+=cell.colSpan;
											j--;
										}
									}
								}
							break;
						case "UN_MER":
							if(self.colSpan>1){
								var row=self.parentNode;
								var cellIndex=self.cellIndex+1;
								for(var i=1;i<self.colSpan;i++)
									Com_SysLayoutWindow.makeupCell(row.insertCell(cellIndex));
								self.colSpan=1;
							}
							break;
						case "INS_ROW":
							var colCount=table.rows[0].cells.length;
							var row=table.insertRow(self.parentNode.rowIndex+1);
							for(var i=0;i<colCount;i++)
								Com_SysLayoutWindow.makeupCell(row.insertCell());
							break;
						case "DEL_ROW":
							var row=self.parentNode;
							var canDel=true;
							for(var i=0;i<row.cells.length;i++)
								if(row.cells[i].innerHTML){canDel=false;break}
							if(canDel){
								table.deleteRow(self.parentNode.rowIndex);
							}
							break;
						case "INS_COL":
							var cellIndex=self.cellIndex+1;
							for(var i=0;i<table.rows.length;i++)
								Com_SysLayoutWindow.makeupCell(table.rows[i].insertCell(cellIndex));
							break;
						case "DEL_COL":
							var cellIndex=self.cellIndex;
							var canDel=true;
							for(var i=0;i<table.rows.length;i++)
								if(table.rows[i].cells[cellIndex].innerHTML){canDel=false;break}
							if(canDel){
								for(var i=0;i<table.rows.length;i++)
									table.rows[i].deleteCell(cellIndex);
							}
							break;
						case "INS_GRP":
							SysLayoutWindow.tag=self;
							NUT.w2popup.message({
								width:400,
								height:200,
								body: '<table style="margin:auto"><caption><i>Group layout</i></caption><tr><td align="right">Group name</td><td><input id="grpLayout_Name"/></td></tr><tr><td align="right">Rows</td><td><input id="grpLayout_Rows" type="number" value="2"/></td></tr><tr><td align="right">Columns</td><td><input id="grpLayout_Cols" type="number" value="1"/></td></tr></table><br/><i style="color:orange">&nbsp;&nbsp;Leave group name empty to create ghost group</i>',
								buttons: '<button class="w2ui-btn" onclick="Com_SysLayoutWindow.createGroup(Com_SysLayoutWindow.tag,grpLayout_Name.value,grpLayout_Rows.value,grpLayout_Cols.value)">Ok</button><button class="w2ui-btn" onclick="NUT.w2popup.message()">Cancel</button>'
							});
							break;
					}
				}
			});
		
	},
	updateLayoutCache:function(){
		var layout={};
		for(var key in this.layouts)if(this.layouts.hasOwnProperty(key)){
			var div=this.layouts[key];
			for(var i=0;i<div.firstChild.rows.length;i++)
				for(var j=0;j<div.firstChild.rows[i].cells.length;j++)
					div.firstChild.rows[i].cells[j].style.backgroundColor="";
			layout[key]=div.innerHTML;
		}
		
		NUT.ds.update({url:NUT.URL+"syscache",where:["windowid","=",this.win.windowid],data:{layoutjson:JSON.stringify(layout)}},function(res){
			NUT.alert("ℹ️ Layout's cache updated.");
		});
	},
	cell_onClick:function(){
		if(!this.innerHTML){
			if(this.style.backgroundColor){
				if(!(this.nextElementSibling&&this.nextElementSibling.style.backgroundColor&&this.previousElementSibling&&this.previousElementSibling.style.backgroundColor))
					this.style.backgroundColor="";
			} else {
				if(!(this.nextElementSibling&&this.nextElementSibling.style.backgroundColor||this.previousElementSibling&&this.previousElementSibling.style.backgroundColor)){
					var table=this.parentNode.parentNode;
					for(var i=0;i<table.rows.length;i++)
						for(var j=0;j<table.rows[i].cells.length;j++)
							table.rows[i].cells[j].style.backgroundColor="";
				}
				this.style.backgroundColor="#87CEFA";
			}
		}
	},
	field_onResize:function(){
		this.firstChild.style.width=this.style.width;
	},
	drag:function(evt){
		evt.dataTransfer.setData("node", evt.target.id);
	},
	allowDrop:function(evt) {
		evt.preventDefault();
	},
	drop:function(evt) {
		evt.preventDefault();
		if(!this.innerHTML){
			var node=document.getElementById(evt.dataTransfer.getData("node"));
			node.lastChild.style.width="";
			this.prepend(node);
		}
	}
}