var Com_SysApplyWindowCache={
	run:function(p){
		if(p.records.length){
			this.window=p.records[0];
			this.cache={};
			var self=this;
			w2confirm('Apply change to Window cache?','❓ Confirm',function(evt){
				if(evt=="Yes"){
					self.cache.window=[];
					for(var i=0;i<NUT_ERD.window.length;i++)
						self.cache.window.push(self.window[NUT_ERD.window[i]]);
					if(self.window.componentname)self.updateWindowCache();
					else NUT_DS.select({url:NUT_URL+"sv_appservice_table",where:["applicationid","=",self.window.applicationid]},function(tables){
						if(tables.length){
							var lookupTable={};
								for(var i=0;i<tables.length;i++)lookupTable[tables[i].tableid]=tables[i];
							self.cacheTabs(lookupTable);
						}
					});
				}
			});
		}else NUT.tagMsg("No Window selected!","yellow");
	},
	cacheTabs:function(lookupTable){
		var self=this;
		NUT_DS.select({url:NUT_URL+"systab",order:["tablevel","orderno"],where:["windowid","=",self.window.windowid]},function(tabs){
			if(tabs.length){
				self.cache.tabs=[];
				for(var i=0;i<tabs.length;i++){
					self.cache.tabs[i]=[];
					var table=null;
					for(var j=0;j<NUT_ERD.tab.length;j++){
						var key=NUT_ERD.tab[j];
						if(key=="banglienket"||key=="bangtrunggian"){
							table=lookupTable[tabs[i][key+"id"]];
							self.cache.tabs[i].push(table?table.urledit:null);
						}else if(table&&key=="columnkeytrunggian")
							self.cache.tabs[i].push(table["columnkey"]);
						else self.cache.tabs[i].push(tabs[i].hasOwnProperty(key)?tabs[i][key]:lookupTable[tabs[i].tableid][key]);
					}
				}
				self.cacheFields(lookupTable);
			}
		});
	},
	cacheFields:function(lookupTable){
		var self=this;
		NUT_DS.select({url:NUT_URL+"sv_field_column",order:"tabid,fieldgroup,orderno",where:["windowid","=",self.window.windowid]},function(fields){
			if(fields.length){
				self.cache.fields=[];
				for(var i=0;i<fields.length;i++){
					self.cache.fields[i]=[];
					var table=null;
					for(var j=0;j<NUT_ERD.field.length;j++){
						var key=NUT_ERD.field[j];
						if(key=="foreigntable"){
							table=lookupTable[fields[i][key+"id"]];
							self.cache.fields[i].push(table?table.urledit:null);
						}else if(table&&(key=="columnkey"||key=="columncode"||key=="columndisplay"))
							self.cache.fields[i].push(table[key]);
						else self.cache.fields[i].push(fields[i][NUT_ERD.field[j]]);
					}
				}
				self.cacheMenuitems();
			};
		});
	},
	cacheMenuitems:function(){
		var self=this;
		NUT_DS.select({url:NUT_URL+"sysmenuitem",order:"orderno",where:[["windowid","=",self.window.windowid],["menuitemtype","=","tool"]]},function(menuitems){
			if(menuitems.length){
				self.cache.menuitems=[];
				for(var i=0;i<menuitems.length;i++){
					self.cache.menuitems[i]=[];
					for(var j=0;j<NUT_ERD.menuitem.length;j++)
						self.cache.menuitems[i].push(menuitems[i][NUT_ERD.menuitem[j]]);
				}
			};
			self.updateWindowCache();
		});
	},
	updateWindowCache:function(){
		NUT_DS.update({url:NUT_URL+"syscache",where:["windowid","=",this.window.windowid],data:{config:zipson.stringify(this.cache)}},function(res){
			w2alert("Window's cache updated.","ℹ️ Inform");
		});
	}
}