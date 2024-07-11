var SysBuildTab={
	MAIN_TAB:"Main Tab",
	run:function(p){
		if(p.records.length){
			this.window=p.records[0];
			var self=this;
			NUT.ds.select({url:NUT.URL+"nv_appservice_table",where:["appid","=",this.window.appid]},function(res){
				if (res.success) {
					var tables = res.result;
					if (tables.length)NUT.ds.select({ url: NUT.URL + "n_tab", where: ["windowid", "=", self.window.windowid] }, function (res2) {
							if (res2.success) {
								var existTabs = {};
								var tabs = res2.result;
								for (var i = 0; i < tabs.length; i++) existTabs[tabs[i].tabid] = tabs[i];
								self.showDlgBuild(tables, existTabs);
							} else NUT.notify("⛔ ERROR: " + res2.result, "red");
						});
					else NUT.notify("⚠️ No table in any data service!", "yellow");
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		} else NUT.notify("⚠️ No Window selected!","yellow");
	},
	showDlgBuild:function(tables, existTabs){
		var lookup={}, items=[], count=0;
		for(var key in existTabs)if(existTabs.hasOwnProperty(key)){
			var tab=existTabs[key];
			lookup[tab.tableid]=true;
			if(!tab.parenttabid){
				items.push({id:tab.tabid,text:tab.tabname});
				lookup[this.MAIN_TAB]=tab.tabid;
			}
			count++;
		}
		var isBlank=(items.length==0);
	
		var fields=[{field:this.MAIN_TAB,type:'select',required:true,html:{column:'before',attr:isBlank?"tabindex=0":"disabled"}}];
		var lookupTable={};
		for(var i=0;i<tables.length;i++){
			var table=tables[i];
			if(isBlank)items.push({id:table.tableid,text:table.tablename});
			lookupTable[table.tableid]=table;
			var fld={field:table.tableid,type:'checkbox',html:{label:table.tablename,column:i%2,attr:lookup[table.tableid]?"disabled":"tabindex=0"}};
			fields.push(fld);
		}
		fields[0].options={items:items};
		var id="div_SysBuildTab";
		var self=this;
		NUT.w2popup.open({
			title: '⛏️ Build tabs',
			modal:true,
			width: 700,
			height: 500,
			body: '<div id="'+id+'" class="nut-full"></div>',
			onOpen:function(evt){
				evt.onComplete=function(){
					var div=document.getElementById(id);
					(NUT.w2ui[id]||new NUT.w2form({ 
						name: id,
						fields: fields,
						record:lookup,
						onChange:function(evt){
							if(evt.target==self.MAIN_TAB){
								var chk=document.getElementById(evt.value_new);
								chk.checked=chk.disabled=true;
								if(evt.value_previous){
									chk=document.getElementById(evt.value_previous);
									chk.checked=chk.disabled=false;
								}
								
							}
						},
						actions: {
							"⛌ Close":function(){
								NUT.w2popup.close();
							},
							"✔️ Build":function(){
								if(this.validate(true).length==0){
									var change=this.getChanges();
									if(isBlank)self.insertTab(lookupTable[this.record[self.MAIN_TAB]],0,null,function(mainTab){
										for(key in change)if(change.hasOwnProperty(key)){
											if(key!=self.MAIN_TAB&&change[key])self.insertTab(lookupTable[key],++count,mainTab);
										}
									});else{
										for(key in change)if(change.hasOwnProperty(key)){
											if(key!=self.MAIN_TAB&&change[key])self.insertTab(lookupTable[key],++count,existTabs[this.record[self.MAIN_TAB]]);
										}
									}									
								}
							}
						}
					})).render(div);
				}
			}
		});
	},
	insertTab:function(table,seqno,parenttab,callback){
		var tab={
			parenttabid:parenttab?parenttab.tabid:null,
			tabname: table.alias||table.tablename,
			tablevel:parenttab?1:0,
			seqno:seqno,
			description:table.description,
			tableid:table.tableid,
			windowid:this.window.windowid,
			siteid:_context.user.siteid
		};
		var self=this;
		NUT.ds.select({url:NUT.URL+"n_column",orderby:"columnid",where:["tableid","=",table.tableid]},function(res){
			if (res.success) {
				var columns = res.result;
				if (columns.length) {
					var fields = [];
					for (var i = 0; i < columns.length; i++) {
						var col = columns[i];
						if (col.columnname == "seqno") tab.orderbyclause = "seqno";
						if (parenttab && !col.domainid) {
							if (parenttab.tableid == col.foreigntableid) {
								tab.truonglienketcon = tab.truonglienketcha = col.columnname;
								tab.banglienketid = parenttab.tableid;
							}
						}
						var fld = {
							fieldname: col.alias||col.columnname,
							fieldtype: col.foreigntableid || col.domainid ? "select" : col.columntype,
							isdisplaygrid: true,
							isdisplay: true,
							issearch: true,
							seqno: col.seqno,
							fieldlength: col.length,
							isrequire: col.isnotnull,
							isreadonly: col.isprikey,
							domainid: col.domainid,
							columnid: col.columnid,
							siteid: n$.user.siteid
						};
						fields.push(fld);
					}
					NUT.ds.insert({ url: NUT.URL + "n_tab", data: tab }, function (res) {
						if (res.success) {
							if (callback) callback(res[0]);
							for (var i = 0; i < fields.length; i++)fields[i].tabid = res.result[0].tabid;
							self.insertFields(fields);
							NUT.notify("ℹ️ Record inserted.", "lime");
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
					});
				}
			}
		})
	},
	insertFields:function(fields){
		NUT.ds.insert({url:NUT.URL+"n_field",data:fields},function(res){
			if (res.result) NUT.notify("ℹ️ Records inserted.", "lime");
			else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}