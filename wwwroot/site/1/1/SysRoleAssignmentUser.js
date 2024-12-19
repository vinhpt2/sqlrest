var SysRoleAssignmentUser={
	run:function(p){
		if(p.records.length){
			this.app=p.parent;
			this.role=p.records[0];
			var self=this;
			NUT.ds.select({url:NUT.URL+"sysaccess",select:"accessid,userid",where:["roleid","=",self.role.roleid]},function(res){
				var existUsers={};
				for(var i=0;i<res.length;i++)existUsers[res[i].userid]=res[i].accessid;
				NUT.ds.select({url:NUT.URL+"sysuser",where:["siteid","=",_context.user.siteid]},function(users){
					if(users.length)self.showDlgRoleAssignmentUser(users,existUsers);
				});
			});
		}else NUT.tagMsg("No Role selected!","yellow");
	},
	showDlgRoleAssignmentUser:function(users,existUsers){
		var fields=[];
		for(var i=0;i<users.length;i++)
			fields.push({field:users[i].userid,type:'checkbox',html:{column:i%2,label:users[i].username}});
		var self=this;
		var id="divCom_SysRoleAssignmentUser";
		w2popup.open({
			title: '📥 <i>Assign user for role</i> - '+this.role.rolename,
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
						record:existUsers,
						actions: {
							"⛌ Close":function(){
								w2popup.close();
							},
							"✔️ Assign":function(){
								var change=this.getChanges();
								for(key in change)if(change.hasOwnProperty(key)){
									self.assignUser(key,change[key],existUsers[key]);
								}
							}
						}
					});
				}
			}
		});
	},
	assignUser:function(userid,isAssign,accessid){
		if(isAssign){
			var data={
				appid:this.app.appid,
				roleid:this.role.roleid,
				userid:userid,
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