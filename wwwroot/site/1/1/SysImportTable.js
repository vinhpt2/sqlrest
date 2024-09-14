var SysImportTable={
	run:function(p){
		if(p.records.length){
			var serviceid=p.records[0].serviceid;
			NUT.ds.select({ url: NUT.URL + "n_table",select:"tablename", where: ["serviceid", "=", serviceid] }, function (res) {
				if (res.success) {
					var lookup = {};
					for (var i = 0; i < res.result.length; i++)
						lookup[res.result[i].tablename] = true;

					NUT.ds.call({ url: NUT.URL_DB + "table" }, function (res2) {
						if (res2.success) {
							NUT.ds.call({ url: NUT.URL_DB + "view" }, function (res3) {
								if (res3.success) {
									SysImportTable.showDlgImport(res2.result, res3.result, lookup,serviceid);
								} else NUT.notify("⛔ ERROR: " + res3.result, "red");
							});
						} else NUT.notify("⛔ ERROR: " + res2.result, "red");
					});
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		} else NUT.notify("⚠️ No Data Service selected!","yellow");
	},
	
	showDlgImport: function (tables, views, lookup,serviceid) {
		var fields = [], lookupType = {};
		for (var i = 0; i < tables.length; i++) {
			var name = tables[i].name;
			lookupType[name] = "table";
			fields.push({ field: name, type: 'checkbox', html: { column: i % 2, attr: lookup[name] ? "disabled" : "tabindex=0" } });
		}
		for (var i = 0; i < views.length; i++) {
			var name = views[i].name;
			lookupType[name] = "view";
			fields.push({ field: name, type: 'checkbox', html: { column: i % 2, attr: lookup[name] ? "disabled" : "tabindex=0" } });
		}
		var id="div_SysImportTable";
		NUT.w2popup.open({
			title: '_Import',
			modal:true,
			width: 700,
			height: 600,
			body: '<div id="'+id+'" class="nut-full"></div>',
			onOpen:function(evt){
				evt.onComplete=function(){
					var div=document.getElementById(id);
					(NUT.w2ui[id]||new NUT.w2form({ 
						name: id,
						fields: fields,
						record:lookup,
						actions: {
							"_Close":function(){
								NUT.w2popup.close();
							},
							"_Import":function(){
								var change=this.getChanges();
								for(key in change)if(change.hasOwnProperty(key)){
									if (change[key]) SysImportTable.insertTable(key,lookupType[key],serviceid);
								}
							}
						}
					})).render(div);
				}
			}
		});
	},
	insertTable: function (name,type,serviceid) {
		NUT.ds.call({ url: NUT.URL_DB + "table/"+name+"?detail=true" }, function (res) {
			if (res.success) {
				var table = res.result;
				var cols = [];
				for (var i = 0; i < table.columns.length; i++) {
					var info=table.columns[i];
					var col={
						columnname: info.name,
						alias: info.alias,
						seqno: i,
						datatype: info.dataType,
						length: info.length,
						isnotnull: !info.nullable,
						defaultvalue: info.defaultValue,
						siteid: n$.user.siteid
					};
					if (info.inPrimaryKey) col.columntype ="key";
					cols.push(col);
				}
				var tbl={
					tablename:table.name,
					alias:table.alias||table.name,
					tabletype:type,
					serviceid:serviceid,
					siteid:n$.user.siteid
				};
				NUT.ds.insert({ url: NUT.URL + "n_table", data: tbl, returnid:true},function(res2){
					if (res2.success) {
						NUT.notify("Table inserted.", "lime");
						var id = res2.result[0];
						for (var i = 0; i < cols.length; i++) cols[i].tableid = id;
						if (cols.length) {//insert cols
							NUT.ds.insert({ url: NUT.URL + "n_column", data: cols }, function (res3) {
								if (res3.sucess) NUT.notify(cols.length + " columns inserted.", "lime");
								else NUT.notify("⛔ ERROR: " + res3.result, "red");
							});
						}
					} else NUT.notify("⛔ ERROR: " + res2.result, "red");
				});
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}