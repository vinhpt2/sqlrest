var SysAssignUserRole={
	run:function(p){
		if(p.records.length){
			this.app=p.records[0];
			this.user=p.parent;
			var self=this;
			NUT.ds.select({url:NUT.URL+"sysaccess",select:"accessid,roleid",where:["userid","=",self.user.userid]},function(res){
				var existRoles={};
				for(var i=0;i<res.length;i++)existRoles[res[i].roleid]=res[i].accessid;
				NUT.ds.select({url:NUT.URL+"sysrole",where:["appid","=",self.app.appid]},function(roles){
					if(roles.length)self.showDlgAssignUserRole(roles,existRoles);
				});
			});
		}else NUT.tagMsg("No Application selected!","yellow");
	},
	showDlgAssignUserRole:function(roles,existRoles){
		var fields=[];
		for(var i=0;i<roles.length;i++)
			fields.push({field:roles[i].roleid,type:'checkbox',html:{column:i%2,label:roles[i].rolename}});
		var self=this;
		var id="divCom_SysAssignUserRole";
		w2popup.open({
			title: '📥 <i>Assign role for user</i> - '+this.user.username,
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
						record:existRoles,
						actions: {
							"⛌ Close":function(){
								w2popup.close();
							},
							"✔️ Assign":function(){
								var change=this.getChanges();
								for(key in change)if(change.hasOwnProperty(key)){
									self.assignRole(key,change[key],existRoles[key]);
								}
							}
						}
					});
				}
			}
		});
	},
	assignRole:function(roleid,isAssign,accessid){
		if(isAssign){
			var data={
				appid:this.app.appid,
				roleid:roleid,
				userid:this.user.userid,
				siteid:_context.user.siteid
			};
			NUT.ds.insert({url:NUT.URL+"sysaccess",data:data},function(res){
				if(res.length)NUT.tagMsg("Record inserted.","lime");
			});
		}else{
			NUT.ds.delete({url:NUT.URL+"sysaccess",where:["accessid","=",accessid]},function(res){
				NUT.tagMsg("1 record deleted.","lime");
			});
		}
	}
}