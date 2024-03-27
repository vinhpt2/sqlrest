$().w2field("addType","search",function(options){
	var self=this;
	this.form=w2ui["divform_"+options.conf.tabid];
	this.el.style.width="50px";
	this.buttonSearch=document.createElement("button");
	this.buttonSearch.innerHTML=" ... ";
	this.labelSearch=document.createElement("label");
	this.el.parentNode.appendChild(this.buttonSearch);
	this.el.parentNode.appendChild(this.labelSearch);
	this.buttonSearch.onclick=function(evt){
		var fldconf=self.options.conf;
		_context.ctrlSearch=self;
		NUT_DS.select({url:NUT_URL+"sv_window_tab",where:[["windowtype","=","search"],["tableid","=",fldconf.foreigntableid]]},function(res){
			if(res.length){
				NUT_DS.select({url:NUT_URL+"syscache",where:["windowid","=",res[0].windowid]},function(caches){
					if(caches.length){
						conf=NUT.configWindow(JSON.parse(caches[0].config));
						conf.tabid=conf.windowid;
						_context.winconfig[conf.windowid]=conf;
						var div=document.createElement("div");
						div.id="divsearch_"+conf.windowid;
						NUT.openDialog(div,conf.windowname);
						
						buildWindow(div,conf,0,function(code,records){
							if(code=="OK"&&records.length){
								var record=records[0];
								if(_context.ctrlSearch.el.value!==record[fldconf.columnkey]){
									_context.ctrlSearch.el.value=record[fldconf.columnkey];
									_context.ctrlSearch.labelSearch.innerHTML=(fldconf.columncode==fldconf.columndisplay||fldconf.columncode==fldconf.columnkey)?record[fldconf.columndisplay]:record[fldconf.columncode]+"-"+record[fldconf.columndisplay];
									updateChildFields(fldconf,record);
								}
							}
							NUT.closeDialog();
						});
					}
				});
			}
		});
	};
	this.el.onchange=function(evt){
		//evt.stopImmediatePropagation();
		var value=(evt instanceof Event)?this.value:evt;
		var fldconf=self.options.conf;
		_context.ctrlSearch=self;
		var p={url:fldconf.foreigntable};
		if(isNaN(parseInt(value)))
			p.where=[fldconf.columncode,"like","*"+value+"*"];
		else{
			p.where=["or",[fldconf.columncode,"like",value],[fldconf.columnkey,"=",value]];
		}
		if(fldconf.fieldtype=="search")NUT_DS.select(p,function(res){
			if(res.length){	
				if(res.length==1){
					_context.ctrlSearch.el.value=res[0][fldconf.columnkey];
					_context.ctrlSearch.labelSearch.innerHTML=(fldconf.columncode==fldconf.columndisplay||fldconf.columncode==fldconf.columnkey)?res[0][fldconf.columndisplay]:res[0][fldconf.columncode]+"-"+res[0][fldconf.columndisplay];
					updateChildFields(fldconf,res[0]);
				}else {
					var items=[];
					for(var i=0;i<res.length;i++)
						items.push({id:i,text:(fldconf.columncode==fldconf.columndisplay||fldconf.columncode==fldconf.columnkey?res[i][fldconf.columndisplay]:res[i][fldconf.columncode]+"-"+res[i][fldconf.columndisplay]),tag:res[i]});
					$(labelSearch).w2menu({
						items:items,
						onSelect:function(evt){
							_context.ctrlSearch.el.value=res[evt.item.id][fldconf.columnkey];
							_context.ctrlSearch.labelSearch.innerHTML=evt.item.text;
							updateChildFields(fldconf,res[evt.item.id]);
						}
					});
				}
			}else{
				_context.ctrlSearch.el.value="";
				_context.ctrlSearch.labelSearch.innerHTML="-/-";
				updateChildFields(fldconf,{});
			}
		});
	};
});
