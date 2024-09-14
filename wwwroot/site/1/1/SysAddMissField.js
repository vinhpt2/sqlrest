var SysAddMissField={
	run:function(p){
		if(p.records.length){
			this.tab=p.records[0];
			var self=this;
			NUT.confirm('Add missing fields for tab '+this.tab.tabname+'?',function(evt){
				if(evt=="yes"){
					self.addMissField(self.tab);
				}
			});
		} else NUT.notify("⚠️ No Tab selected!","yellow");
	},
	
	addMissField:function(tab){
		var self=this;
		NUT.ds.select({url:NUT.URL+"n_field",select:"columnid",where:["tabid","=",tab.tabid]},function(res){
			if (res.success) {
				var columnids = [];
				for (var i = 0; i < res.result.length; i++)
					columnids.push(res.result[i].columnid);
				NUT.ds.select({ url: NUT.URL + "n_column", where: (columnids.length ? [["tableid", "=", tab.tableid], ["columnid", "!in", columnids]] : ["tableid", "=", tab.tableid]) }, function (res2) {
					if (res2.success&&res2.result.length) {
						var fields = [];
						for (var i = 0; i < res2.result.length; i++) {
							var col = res2.result[i];
							var fld = {
								tabid: tab.tabid,
								fieldname: col.alias || col.columnname,
								fieldtype: (col.domainid || col.linktableid ? "select" : col.datatype),
								isdisplaygrid: true,
								isdisplayform: (col.columntype != "key"),
								issearch: true,
								seqno: col.seqno,
								fieldlength: col.length,
								isrequire: col.isnotnull,
								isreadonly: (col.columntype == "key"),
								isfrozen: (col.columntype == "code"),
								columnid: col.columnid,
								siteid: n$.user.siteid
							};
							fields.push(fld);
						}
						self.insertFields(fields);
					} else NUT.notify("⚠️ No missing field", "yellow");
				});
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	},
	insertFields:function(fields){
		NUT.ds.insert({url:NUT.URL+"n_field",data:fields},function(res){
			if (res.success) NUT.notify(fields.length + " fields added.", "lime");
			else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}