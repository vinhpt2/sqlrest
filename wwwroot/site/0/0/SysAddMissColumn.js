var SysAddMissColumn={
	run:function(p){
		if(p.records.length){
			this.table=p.records[0];
			var self=this;
			w2confirm('Add missing columns for table ['+this.table.tablename+']?','❓ Confirm',function(evt){
				if(evt=="Yes"){
					self.addMissColumn(self.tab);
				}
			});
		}else NUT.tagMsg("No Window selected!","yellow");
	},
	
	addMissColumn: function (table, definition) {
		var self = this;
		NUT_DS.select({ srl: "syscolumn", select: "columnname", where: ["tableid", "=", table.tableid] }, function (res) {
			var lookup = {};
			for (var i = 0; i < res.length; i++)lookup[res[i].columnname] = true;
			var columns = [];
			var order = 0;
			for (var key in definition.properties) if (definition.properties.hasOwnProperty(key) && !lookup[key]) {
				var prop = definition.properties[key];
				var col = {
					tableid: table.tableid,
					columnname: key,
					alias: prop.description ? prop.description : key,
					orderno: ++order,
					columntype: prop.format,
					clientid: _context.user.clientid,
					isprikey: (prop.isprikey ? prop.isprikey : null),
					//foreignkey:prop.foreignkey?prop.foreignkey:null,
					length: (prop.maxLength ? prop.maxLength : null),
					isnotnull: (prop.isnotnull ? prop.isnotnull : null)
				};
				columns.push(col);
			}
			if (columns.length)
				self.insertColumns(columns);
			else
				NUT.tagMsg("No missing columns", "yellow", document.activeElement);
		});
	},
	insertColumns: function (columns) {
		if (columns.length) NUT.ds.insert({ url: NUT.URL + "n_column", data: columns }, function (res) {
			if (res.sucess) NUT.notify("ℹ️ Data inserted.", "lime");
			else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}