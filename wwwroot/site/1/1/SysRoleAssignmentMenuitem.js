var SysRoleAssignmentMenuitem={
	run:function(p){
		if(p.records.length){
			this.app=p.parent;
			this.role=p.records[0];
			var self=this;
			NUT.ds.select({url:NUT.URL+"sysrolemenu",select:"rolemenuid,menuitemid",where:["roleid","=",self.role.roleid]},function(res){
				var existMenuitems={};
				for(var i=0;i<res.length;i++)existMenuitems[res[i].menuitemid]=res[i].rolemenuid;
				NUT.ds.select({url:NUT.URL+"sysmenuitem",where:["appid","=",self.app.appid]},function(menuitems){
					if(menuitems.length)self.showDlgRoleAssignmentUser(menuitems,existMenuitems);
				});
			});
		}else NUT.tagMsg("No Role selected!","yellow");
	},
	showDlgRoleAssignmentUser:function(menuitems,existMenuitems){
		var fields=[];
		for(var i=0;i<menuitems.length;i++)
			fields.push({field:menuitems[i].menuitemid,type:'checkbox',html:{column:i%2,label:menuitems[i].menuitemname}});
		var self=this;
		var id="divCom_SysRoleAssignmentMenuitem";
		w2popup.open({
			title: '📥 <i>Assign menuitem for role</i> - '+this.role.rolename,
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
						record:existMenuitems,
						actions: {
							"⛌ Close":function(){
								w2popup.close();
							},
							"✔️ Assign":function(){
								var change=this.getChanges();
								for(key in change)if(change.hasOwnProperty(key)){
									self.assignMenuitem(key,change[key],existMenuitems[key]);
								}
							}
						}
					});
				}
			}
		});
	},
	assignMenuitem:function(menuitemid,isAssign,rolemenuid){
		if(isAssign){
			var data={
				roleid:this.role.roleid,
				menuitemid:menuitemid,
				siteid:_context.user.siteid
			};
			NUT.ds.insert({url:NUT.URL+"sysrolemenu",data:data},function(res){
				if(res.length)NUT.tagMsg("Record inserted.","lime");
			});
		}else{
			NUT.ds.delete({url:NUT.URL+"sysrolemenu",where:["rolemenuid","=",rolemenuid]},function(res){
				NUT.tagMsg("1 record deleted.","lime");
			});
		}
	}
}