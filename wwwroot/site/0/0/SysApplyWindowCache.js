var SysApplyWindowCache = {
	run: function (p) {
		if(p.records.length){
			this.window=p.records[0];
			this.cache={};
			var self=this;
			NUT.confirm('Apply change to Window cache?',function(evt){
				if(evt=="yes"){
					self.cache.window=[];
					for(var i=0;i<NUT.ERD.window.length;i++)
						self.cache.window.push(self.window[NUT.ERD.window[i]]);
					if(self.window.execname)self.updateWindowCache();
					else NUT.ds.select({ url: NUT.URL + "nv_appservice_table", where: ["appid", "=", self.window.appid] }, function (res) {
						if (res.success) {
							var lookupTable = {};
							var tables = res.result;
							for (var i = 0; i < tables.length; i++)
								lookupTable[tables[i].tableid] = tables[i];
							self.cacheTabs(lookupTable);
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
					});
				}
			});
		} else NUT.notify("⚠️ No Window selected!","yellow");
	},
	cacheTabs:function(lookupTable){
		var self=this;
		NUT.ds.select({ url: NUT.URL + "n_tab", orderby: "tablevel,seqno", where: ["windowid", "=", self.window.windowid] }, function (res) {
			if (res.success) {
				var tabs = res.result;
				self.cache.tabs=[];
				for(var i=0;i<tabs.length;i++){
					self.cache.tabs[i]=[];
					var table=null;
					for(var j=0;j<NUT.ERD.tab.length;j++){
						var key=NUT.ERD.tab[j];
						if(key=="linktable"||key=="midtable"){
							table=lookupTable[tabs[i][key+"id"]];
							self.cache.tabs[i].push(table?table.viewname||table.tablename:null);
						} else if (table && key =="midtable_prikey")
							self.cache.tabs[i].push(table["columnkey"]);
						else self.cache.tabs[i].push(tabs[i].hasOwnProperty(key)?tabs[i][key]:lookupTable[tabs[i].tableid][key]);
					}
				}
				self.cacheFields(lookupTable);
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	},
	cacheFields:function(lookupTable){
		var self=this;
		NUT.ds.select({url:NUT.URL+"nv_field_column",orderby:"tabid,fieldgroup,seqno",where:["windowid","=",self.window.windowid]},function(res){
			if (res.success) {
				var fields = res.result;
				self.cache.fields=[];
				for(var i=0;i<fields.length;i++){
					self.cache.fields[i]=[];
					var table=null;
					for(var j=0;j<NUT.ERD.field.length;j++){
						var key=NUT.ERD.field[j];
						if(key=="foreigntable"){
							table=lookupTable[fields[i][key+"id"]];
							self.cache.fields[i].push(table ? table.viewname || table.tablename :null);
						} else if (table && (key == "keycolumn" || key == "searchcolumn" || key =="displaycolumn"))
							self.cache.fields[i].push(table[key]);
						else self.cache.fields[i].push(fields[i][NUT.ERD.field[j]]);
					}
				}
				self.cacheMenus();
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	},
	cacheMenus:function(){
		var self=this;
		NUT.ds.select({ url: NUT.URL + "n_menu", orderby: "seqno", where: [["windowid", "=", self.window.windowid], ["menutype", "=", "tool"]] }, function (res) {
			if (res.success) {
				var menus = res.result;
				self.cache.menus =[];
				for (var i = 0; i < menus.length;i++){
					self.cache.menus[i]=[];
					for(var j=0;j<NUT.ERD.menu.length;j++)
						self.cache.menus[i].push(menus[i][NUT.ERD.menu[j]]);
				}
				self.updateWindowCache();
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	},
	updateWindowCache:function(){
		NUT.ds.update({url:NUT.URL+"n_cache",where:["windowid","=",this.window.windowid],data:{configjson:zipson.stringify(this.cache)}},function(res){
			if (res.success)
				NUT.notify("ℹ️ Window's cache updated.","lime");
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}