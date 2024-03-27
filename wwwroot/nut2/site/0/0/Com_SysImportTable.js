var Com_SysImportTable={
	run:function(p){
		if(p.records.length){
			this.service=p.records[0];
			var self=this;
			switch(this.service.servicetype){
				case "postgrest":
					NUT_DS.queryMetadata(this.service.urledit,function(metadata){
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
							NUT_DS.select({url:NUT_URL+"systable",where:["serviceid","=",self.service.serviceid]},function(res){
								var lookup={};
								for(var i=0;i<res.length;i++)lookup[res[i].tablename]=res[i];
								self.showDlgImport(definitions,lookup);
							});
						}else  NUT.tagMsg("No table in any data service!","yellow");
					});
					break;
				case "geoserver":
					NUT_DS.queryMetadata(self.service.urledit+"/wfs?request=DescribeFeatureType&outputFormat=application/json",function(metadata){
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
							NUT_DS.select({url:NUT_URL+"systable",where:["serviceid","=",self.service.serviceid]},function(res){
								var lookup={};
								for(var i=0;i<res.length;i++)lookup[res[i].tablename]=res[i];
								self.showDlgImport(definitions,lookup);
							});
						} else  NUT.tagMsg("No layer in any data service!","yellow");
					});
					break;
			}
			
		}else NUT.tagMsg("No Data Service selected!","yellow");
	},
	
	showDlgImport:function(definitions,lookup){
		var fields=[],i=0;
		for(key in definitions)if(definitions.hasOwnProperty(key)){
			var fld={field:key,type:'checkbox',html:{column:i++%2,attr:lookup[key]?"disabled":"tabindex=0"}};
			fields.push(fld);
		}
		var id="divCom_SysImportTable";
		var self=this;
		w2popup.open({
			title: '📥 <i>Import tables</i>',
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
					});
				}
			}
		});
	},
	addMissColumn:function(table,definition){
		var self=this;
		NUT_DS.select({url:NUT_URL+"syscolumn",select:"columnname",where:["tableid","=",table.tableid]},function(res){
			var lookup={};
			for(var i=0;i<res.length;i++)lookup[res[i].columnname]=true;
			var columns=[];
			var order=0;
			for(var key in definition.properties)if(definition.properties.hasOwnProperty(key)&&!lookup[key]){
				var prop=definition.properties[key];
				var col={
					tableid:table.tableid,
					columnname:key,
					alias:prop.description?prop.description:key,
					orderno:++order,
					columntype:prop.format,
					clientid:_context.user.clientid,
					isprikey:prop.isprikey,
					//foreignkey:prop.foreignkey?prop.foreignkey:null,
					length:prop.maxLength?prop.maxLength:null,
					isnotnull:prop.isnotnull
				};
				columns.push(col);
			}
			if(columns.length)self.insertColumns(columns);
			else NUT.tagMsg("No missing columns","yellow");
		});
	},
	insertTable:function(name,definition){
		var columnkey=null, columns=[];
		var order=0;
		for(var key in definition.properties)if(definition.properties.hasOwnProperty(key)){
			var prop=definition.properties[key];
			var col={
				columnname:key,
				alias:prop.description?prop.description:key,
				orderno:++order,
				columntype:prop.format,
				clientid:_context.user.clientid,
				isprikey:prop.isprikey,
				//foreignkey:prop.foreignkey?prop.foreignkey:null,
				length:prop.maxLength?prop.maxLength:null,
				isnotnull:prop.isnotnull
			};
			if(prop.isprikey)columnkey=key;
			columns.push(col);
		}
		var table={
			tablename:name,
			alias:definition.description?definition.description:name,
			tabletype:definition.type?definition.type:null,
			columnkey:columnkey?columnkey:columns[0].columnname,
			urledit:this.service.urledit+name,
			serviceid:this.service.serviceid,
			clientid:_context.user.clientid
		};
		var self=this;
		NUT_DS.insert({url:NUT_URL+"systable",data:table},function(res){
			if(res.length){
				for(var i=0;i<columns.length;i++)columns[i].tableid=res[0].tableid;
				self.insertColumns(columns);
				NUT.tagMsg("Record inserted.","lime");
			}
		});
	},
	insertColumns:function(columns){
		NUT_DS.insert({url:NUT_URL+"syscolumn",data:columns},function(res){
			if(res.length)NUT.tagMsg("Record inserted.","lime");
		});
	}
}