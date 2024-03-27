var Com_SysAddMissField={
	run:function(p){
		if(p.records.length){
			this.tab=p.records[0];
			var self=this;
			w2confirm('Add missing fields for tab ['+this.tab.tabname+']?','❓ Confirm',function(evt){
				if(evt=="Yes"){
					self.addMissField(self.tab);
				}
			});
		}else NUT.tagMsg("No Window selected!","yellow");
	},
	
	addMissField:function(tab){
		var self=this;
		NUT_DS.select({url:NUT_URL+"sysfield",select:"columnid",where:["tabid","=",tab.tabid]},function(res){
			var columnids=[];
			for(var i=0;i<res.length;i++)columnids.push(res[i].columnid);
			NUT_DS.select({url:NUT_URL+"syscolumn",where:[["tableid","=",tab.tableid],["columnid","!in",columnids]]},function(columns){
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
							orderno:col.orderno,
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
	insertFields:function(fields){
		NUT_DS.insert({url:NUT_URL+"sysfield",data:fields},function(res){
			w2alert("Tab's missing field added.","ℹ️ Inform");
		});
	}
}