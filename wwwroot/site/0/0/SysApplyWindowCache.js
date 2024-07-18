var SysApplyWindowCache = {
	run: function (p) {
		//p = {records: [{ windowid: 3,windowname:"Application" }]}
		if(p.records.length){
			this.window=p.records[0];
			this.cache={};
			var self=this;
			NUT.confirm('Apply change to Window cache?',function(evt){
				if(evt=="yes"){
					self.cache.window=[];
					for(var i=0;i<NUT.ERD.window.length;i++)
						self.cache.window.push(self.window[NUT.ERD.window[i]]);
					if (self.window.execname) self.updateWindowCache();
					else self.cacheTabs();
				}
			});
		} else NUT.notify("⚠️ No Window selected!","yellow");
	},
	cacheTabs:function(){
		var self=this;
		NUT.ds.select({ url: NUT.URL + "n_tab", orderby: "tablevel,seqno", where: ["windowid", "=", self.window.windowid] }, function (res) {
			if (res.success) {
				var tabs = res.result;
				self.cache.tabs=[];
				for(var i=0;i<tabs.length;i++){
					self.cache.tabs[i]=[];
					for(var j=0;j<NUT.ERD.tab.length;j++){
						var key=NUT.ERD.tab[j];
						self.cache.tabs[i].push(tabs[i][key]);
					}
				}
				self.cacheFields();
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	},
	cacheFields:function(){
		var self=this;
		NUT.ds.select({url:NUT.URL+"nv_field_column",orderby:"tabid,fieldgroup,seqno",where:["windowid","=",self.window.windowid]},function(res){
			if (res.success) {
				var fields = res.result;
				self.cache.fields=[];
				for(var i=0;i<fields.length;i++){
					self.cache.fields[i] = [];
					for (var j = 0; j < NUT.ERD.field.length; j++){
						var key=NUT.ERD.field[j];
						self.cache.fields[i].push(fields[i][key]);
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
				self.cache.menus = [];
				var menus = res.result;
				for (var i = 0; i < menus.length; i++){
					var menu = menus[i];
					self.cache.menus[i]=[];
					for(var j=0;j<NUT.ERD.menu.length;j++)
						self.cache.menus[i].push(menu[NUT.ERD.menu[j]]);
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