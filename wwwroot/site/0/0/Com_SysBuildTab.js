var Com_SysBuildTab={
	MAIN_TAB:"Main tab",
	run:function(p){
		if(p.records.length){
			this.window=p.records[0];
			var self=this;
			NUT.ds.select({url:NUT.URL+"nv_appservice_table",where:["appid","=",this.window.appid]},function(tables){
				if(tables.length)
					NUT.ds.select({url:NUT.URL+"systab",where:["windowid","=",self.window.windowid]},function(res){
						var existTabs={};
						for(var i=0;i<res.length;i++) existTabs[res[i].tabid]=res[i];
						self.showDlgBuild(tables, existTabs)
					});
				else NUT.tagMsg("No table in any data service!","yellow");
			});
		}else NUT.tagMsg("No Window selected!","yellow");
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
		var id="divCom_SysBuildTab";
		var self=this;
		w2popup.open({
			title: '⛏️ <i>Build tabs</i>',
			modal:true,
			width: 700,
			height: 500,
			body: '<div id="'+id+'" class="nut-full"></div>',
			onOpen:function(evt){
				evt.onComplete=function(){
					var div=document.getElementById(id);
					w2ui[id]?w2ui[id].render(div):
					$(div).w2form({ 
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
								w2popup.close();
							},
							"➕ Add miss-fields":function(){
								for(var key in existTabs)if(existTabs.hasOwnProperty(key)){
									self.addMissField(existTabs[key]);
								}
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
					});
				}
			}
		});
	},
	addMissField:function(tab){
		var self=this;
		NUT.ds.select({url:NUT.URL+"sysfield",select:"columnid",where:["tabid","=",tab.tabid]},function(res){
			var columnids=[];
			for(var i=0;i<res.length;i++)columnids.push(res[i].columnid);
			NUT.ds.select({url:NUT.URL+"syscolumn",where:[["tableid","=",tab.tableid],["columnid","!in",columnids]]},function(columns){
				if(columns.length){
					var fields=[];
					for(var i=0;i<columns.length;i++){
						var col=columns[i];
						var fld={
							tabid:tab.tabid,
							fieldname:col.columnname,
							alias:col.alias,
							fieldtype:null,
							isdisplaygrid:true,
							isdisplay:true,
							issearch:true,
							seqno:col.seqno,
							fieldlength:col.length?col.length:null,
							isrequire:col.isnotnull,
							isreadonly:col.isprikey,
							isunique:col.isprikey,
							columnid:col.columnid,
							clientid:_context.user.clientid
						};
						if(col.foreigntableid)fld.fieldtype=col.isfromdomain?"select":"search";
						else fld.fieldtype=col.columntype;
						fields.push(fld);
					}
					self.insertFields(fields);
				} else NUT.tagMsg("No missing fields","yellow");
			});
		});
	},
	insertTab:function(table,seqno,parenttab,callback){
		var tab={
			parenttabid:parenttab?parenttab.tabid:null,
			tabname:table.tablename,
			tablevel:parenttab?1:0,
			seqno:seqno,
			description:table.description,
			truonglienketcon:null,
			truonglienketcha:null,
			banglienketid:null,
			tableid:table.tableid,
			windowid:this.window.windowid,
			clientid:_context.user.clientid
		};
		var self=this;
		NUT.ds.select({url:NUT.URL+"syscolumn",orderby:"columnid",where:["tableid","=",table.tableid]},function(columns){
			if(columns.length){
				var fields=[];
				for(var i=0;i<columns.length;i++){
					var col=columns[i];
					if(col.columnname=="seqno")tab.orderbyclause="seqno";
					if(parenttab&&!col.isfromdomain){
						if(parenttab.tableid==col.foreigntableid){
							tab.truonglienketcon=tab.truonglienketcha=col.columnname;
							tab.banglienketid=parenttab.tableid;
						}
					}
					var fld={
						fieldname:col.columnname,
						alias:col.alias,
						fieldtype:null,
						isdisplaygrid:true,
						isdisplay:true,
						issearch:true,
						seqno:col.seqno,
						fieldlength:col.length?col.length:null,
						isrequire:col.isnotnull,
						isreadonly:col.isprikey,
						isunique:col.isprikey,
						columnid:col.columnid,
						clientid:_context.user.clientid
					};
					if(col.foreigntableid)fld.fieldtype=col.isfromdomain?"select":"search";
					else fld.fieldtype=col.columntype;
					fields.push(fld);
				}
				NUT.ds.insert({url:NUT.URL+"systab",data:tab},function(res){
					if(res.length){
						if(callback)callback(res[0]);
						for(var i=0;i<fields.length;i++)fields[i].tabid=res[0].tabid;
						self.insertFields(fields);
						NUT.tagMsg("Record inserted.","lime");
					}
				});
			}
		})
	},
	insertFields:function(fields){
		NUT.ds.insert({url:NUT.URL+"sysfield",data:fields},function(res){
			if(res.length)NUT.tagMsg("Records inserted.","lime");
		});
	}
}