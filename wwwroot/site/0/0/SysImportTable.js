var SysImportTable={
	run:function(p){
		if(p.records.length){
			this.service=p.records[0];
			var self = this;
			NUT.ds.select({ url: NUT.URL + "n_table", where: ["serviceid", "=", self.service.serviceid] }, function (res3) {
				if (res3.success) {
					var tables = res3.result,lookup = {};
					for (var i = 0; i < tables.length; i++)lookup[tables[i].tablename] = tables[i];
				
					switch (self.service.servicetype) {
						case "sqlrest":
							NUT.ds.call({ url: self.service.url + "table?isDetail=true" }, function (res) {
								if (res.success) {
									var tables = res.result;
									var definitions = {};
									for (var i = 0; i < tables.length; i++) {
										var table = tables[i];
										definitions[table.name] = table;
									}
									NUT.ds.call({ url: self.service.url + "view?isDetail=true" }, function (res2) {
										if (res2.success) {
											var views = res2.result;
											for (var i = 0; i < views.length; i++) {
												var view = views[i];
												definitions[view.name] = view;
											}
											self.showDlgImport(definitions, lookup);
										} else NUT.notify("⛔ ERROR: " + res2.result, "red");
									});
								} else NUT.notify("⛔ ERROR: " + res.result, "red");
							});
							break;
						case "postgrest":
							NUT.ds.call({ url: self.service.url },function(metadata){
								var definitions=metadata.definitions;
								if(definitions){
									for(var key in definitions)if(definitions.hasOwnProperty(key)){
										var definition=definitions[key];
										definition.type=definition.required?"table":"view";
										if(definition.required)for(var i=0;i<definition.required.length;i++)
											definition.properties[definition.required[i]].isnotnull=true;
										for(var k in definition.properties)if(definition.properties.hasOwnProperty(k)){
											var prop=definition.properties[k];
											if(prop.description){
												if(prop.description.includes("Primary Key")){
													prop.isprikey=true;
													prop.description=k;
												}else if(prop.description.includes("Foreign Key")){
													prop.isforeignkey=true;
													prop.description=k;
												}
											}
										}
									}
									self.showDlgImport(definitions, lookup);
								} else NUT.notify("⚠️ No table in any data service!","yellow");
							});
							break;
						case "geoserver":
							NUT.ds.call({ url: self.service.urledit + "/wfs?request=DescribeFeatureType&outputFormat=application/json" },function(metadata){
								var featureTypes=metadata.featureTypes;
								if(featureTypes.length){
									var definitions={};
									for(var i=0;i<featureTypes.length;i++){
										var featType=featureTypes[i];
										var definition={type:"gis",properties:{fid:{type:"long",isnotnull:true,isprikey:true}}};
										for(var j=0;j<featType.properties.length;j++){
											var prop=featType.properties[j];
											definition.properties[prop.name]={type:prop.localType,isnotnull:!prop.nillable};
										}
										definitions[featType.typeName]=definition;
									}
									self.showDlgImport(definitions, lookup);
								} else NUT.notify("⚠️ No layer in any data service!","yellow");
							});
							break;
						default: NUT.notify("⚠️ Service type = " + this.service.servicetype +" is not supported!", "yellow");
					}
				} else NUT.notify("⛔ ERROR: " + res3.result, "red");
			});
		} else NUT.notify("⚠️ No Data Service selected!","yellow");
	},
	
	showDlgImport:function(definitions,lookup){
		var fields=[],i=0;
		for(key in definitions)if(definitions.hasOwnProperty(key)){
			var fld={field:key,type:'checkbox',html:{column:i++%2,attr:lookup[key]?"disabled":"tabindex=0"}};
			fields.push(fld);
		}
		var id="div_SysImportTable";
		var self=this;
		NUT.w2popup.open({
			title: '📥 Import tables',
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
						actions: {
							"⛌ Close":function(){
								w2popup.close();
							},
							"➕ Add miss-columns":function(){
								for(key in lookup)if(lookup.hasOwnProperty(key)){
									self.addMissColumn(lookup[key],definitions[key]);
								}
							},
							"✔️ Import":function(){
								var change=this.getChanges();
								for(key in change)if(change.hasOwnProperty(key)){
									if(change[key])self.insertTable(key,definitions[key]);
								}
							}
						}
					})).render(div);
				}
			}
		});
	},
	insertTable:function(name,definition){
		var columnkey=null, columns=[];
		var order=0;
		for(var key in definition.properties)if(definition.properties.hasOwnProperty(key)){
			var prop=definition.properties[key];
			var col={
				columnname: key,
				alias: prop.description || key,
				seqno: ++order,
				columntype: prop.format,
				siteid: n$.user.siteid,
				isprikey: prop.isprikey,
				//foreignkey:prop.foreignkey?prop.foreignkey:null,
				length: prop.maxLength,
				isnotnull: prop.isnotnull
			};
			if(prop.isprikey)columnkey=key;
			columns.push(col);
		}
		var table={
			tablename:name,
			alias:definition.description||name,
			tabletype:definition.type,
			columnkey:columnkey||columns[0].columnname,
			//urledit:this.service.urledit+name,
			serviceid:this.service.serviceid,
			siteid:n$.user.siteid
		};
		var self=this;
		NUT.ds.insert({url:NUT.URL+"n_table",data:table},function(res){
			if(res.success){
				for(var i=0;i<columns.length;i++)columns[i].tableid=res.result[0];
				self.insertColumns(columns);
				NUT.notify("ℹ️ Data inserted.","lime");
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	},
	insertColumns:function(columns){
		if(columns.length)NUT.ds.insert({url:NUT.URL+"n_column",data:columns},function(res){
			if (res.sucess) NUT.notify("ℹ️ Data inserted.", "lime");
			else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}