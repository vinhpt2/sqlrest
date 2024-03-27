var Com_SysWfGetJob={
	run:function(p){
		if(p.records.length){
			NUT_DS.update({url:NUT_URL+"wfjob",where:["jobid","=",p.records[0].jobid],data:{assignstatusid:1}},function(res){
				NUT.tagMsg("Job getted.","lime");
			});
		}else NUT.tagMsg("No Job selected!","yellow");
	}
}